// ============================================================
//  QuizController.js - Quiz Business Logic
// ============================================================

import { QuizModel } from "../models/QuizModel.js?v=9";
import { CourseModel } from "../models/CourseModel.js?v=9";
import { QuizView } from "../views/QuizView.js?v=9";

export class QuizController {
  constructor(app) {
    this.app = app;
    this.quizModel = new QuizModel();
    this.courseModel = new CourseModel();
    this.view = new QuizView();
    this.currentQuiz = null;
    this.currentCourseId = null;
    this.currentQuizId = null;
    this.answers = {};
    this.results = [];
    this.currentQuestionIndex = 0;
    this.timeLeft = 0;
    this.timer = null;
    this.isFinishing = false;
    this.audioContext = null;
  }

  async showQuiz(courseId, quizId) {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "quiz");
    const [course, quiz] = await Promise.all([
      this.courseModel.getCourseById(courseId),
      this.quizModel.getQuizById(courseId, quizId),
    ]);

    if (!quiz) {
      window.__toast.error("Quiz not found");
      this.app.navigate("course", courseId);
      return;
    }

    const lang = window.__i18n.current;
    const now = new Date();

    if (quiz.openTime && now < new Date(quiz.openTime)) {
      const msg = lang === "vi"
        ? `Bài kiểm tra này sẽ mở vào lúc ${new Date(quiz.openTime).toLocaleString("vi-VN")}.`
        : `This quiz will open at ${new Date(quiz.openTime).toLocaleString("en-US")}.`;
      window.__alert?.(lang === "vi" ? "Chưa mở!" : "Not Open Yet!", msg, "warning", () => this.app.navigate("course", courseId));
      return;
    }

    if (quiz.closeTime && now > new Date(quiz.closeTime)) {
      const msg = lang === "vi"
        ? `Bài kiểm tra này đã đóng lúc ${new Date(quiz.closeTime).toLocaleString("vi-VN")} và không còn nhận bài làm.`
        : `This quiz closed at ${new Date(quiz.closeTime).toLocaleString("en-US")} and is no longer accepting submissions.`;
      window.__alert?.(lang === "vi" ? "Đã đóng!" : "Quiz Closed!", msg, "error", () => this.app.navigate("course", courseId));
      return;
    }

    const renderActualQuiz = () => {
      if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        window.__toast.error(lang === "vi" ? "Quiz chưa có câu hỏi." : "This quiz has no questions.");
        this.app.navigate("course", courseId);
        return;
      }

      this.currentQuiz = quiz;
      this.currentCourseId = courseId;
      this.currentQuizId = quizId;
      this.answers = {};
      this.results = [];
      this.currentQuestionIndex = 0;
      this.isFinishing = false;

      this._renderPage(this.view.renderQuiz(course, quiz, lang), "quiz");
      this._renderCurrentQuestion();
      this._bindQuizShellEvents(courseId, quizId);

      if (quiz.timeLimitMinutes) {
        this._startTimer(quiz.timeLimitMinutes * 60, courseId, quizId);
      } else {
        this._startCloseTimeChecker(courseId, quizId);
      }
    };

    if (quiz.password) {
      window.__prompt(
        lang === "vi" ? "Bài kiểm tra này yêu cầu mật khẩu" : "This quiz requires a password",
        lang === "vi" ? "Nhập mật khẩu..." : "Enter password...",
        (val) => {
          if (val === quiz.password) {
            renderActualQuiz();
          } else {
            window.__toast.error(lang === "vi" ? "Mật khẩu không đúng!" : "Incorrect password!");
            this.app.navigate("course", courseId);
          }
        },
        true,
        () => this.app.navigate("course", courseId)
      );
    } else {
      renderActualQuiz();
    }
  }

  _bindQuizShellEvents(courseId, quizId) {
    document.getElementById("backToCourse")?.addEventListener("click", () => {
      clearInterval(this.timer);
      this.app.navigate("course", courseId);
    });

    document.getElementById("quizNextBtn")?.addEventListener("click", async () => {
      if (!this.results[this.currentQuestionIndex]) {
        window.__toast.info(window.__i18n.current === "vi" ? "Hãy chọn đáp án trước." : "Please answer first.");
        return;
      }

      if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
        this.currentQuestionIndex += 1;
        this._renderCurrentQuestion();
        return;
      }

      await this._finishInstantQuiz(courseId, quizId);
    });
  }

  _renderCurrentQuestion() {
    const host = document.getElementById("quizQuestionHost");
    if (!host || !this.currentQuiz) return;

    const lang = window.__i18n.current;
    const result = this.results[this.currentQuestionIndex] || null;
    host.innerHTML = this.view.renderQuizQuestion(this.currentQuiz, this.currentQuestionIndex, result, lang);
    this._bindCurrentQuestionEvents();
    this._updateQuizProgress();
    this._syncNextButton();
  }

  _bindCurrentQuestionEvents() {
    document.querySelectorAll(".quiz-play-option").forEach(option => {
      option.addEventListener("click", () => this._answerCurrentQuestion(option.dataset.answer));
    });

    const input = document.getElementById("quizShortAnswerInput");
    const check = document.getElementById("shortAnswerCheckBtn");
    check?.addEventListener("click", () => this._answerCurrentQuestion(input?.value || ""));
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        check?.click();
      }
    });

    document.querySelector(".quiz-ai-explain-current")?.addEventListener("click", () => {
      const result = this.results[this.currentQuestionIndex];
      if (result) this._askAIToExplain(result);
    });
  }

  _answerCurrentQuestion(value) {
    if (this.results[this.currentQuestionIndex]) return;

    const question = this.currentQuiz.questions[this.currentQuestionIndex];
    const lang = window.__i18n.current;
    const type = this._questionType(question);
    const answerValue = type === "short_answer" ? String(value || "").trim() : String(value);

    if (type === "short_answer" && !answerValue) {
      window.__toast.info(lang === "vi" ? "Nhập câu trả lời trước khi kiểm tra." : "Type an answer before checking.");
      return;
    }

    const result = this._evaluateQuestion(question, answerValue, lang);
    this.answers[this.currentQuestionIndex] = answerValue;
    this.results[this.currentQuestionIndex] = result;
    this._playAnswerSound(result.isCorrect);
    this._renderCurrentQuestion();
  }

  _evaluateQuestion(question, answerValue, lang) {
    const type = this._questionType(question);
    const options = this._questionOptions(question, lang);

    if (type === "short_answer") {
      const correctRaw = String(question.correctAnswer ?? question.answer ?? "").trim();
      const isCorrect = this._normalizeText(answerValue) === this._normalizeText(correctRaw);
      return {
        type,
        question: question.question || "",
        options,
        userAnswer: answerValue,
        userAnswerLabel: answerValue,
        correct: correctRaw,
        correctAnswerLabel: correctRaw,
        isCorrect,
        explanation: question.explanation || "",
      };
    }

    const correctIndex = this._correctIndex(question);
    const selectedIndex = parseInt(answerValue, 10);
    const isCorrect = selectedIndex === correctIndex;

    return {
      type,
      question: question.question || "",
      options,
      userAnswer: String(selectedIndex),
      userAnswerLabel: options[selectedIndex] || "",
      correct: String(correctIndex),
      correctAnswerLabel: options[correctIndex] || "",
      isCorrect,
      explanation: question.explanation || "",
    };
  }

  async _finishInstantQuiz(courseId, quizId) {
    if (this.isFinishing) return;
    this.isFinishing = true;
    clearInterval(this.timer);

    const lang = window.__i18n.current;
    const questions = this.currentQuiz.questions || [];
    const results = questions.map((question, index) => (
      this.results[index] || this._unansweredResult(question, lang)
    ));
    const score = results.filter(result => result.isCorrect).length;

    const uid = this.app.getUser().uid;
    await this.quizModel.saveQuizScore(uid, courseId, quizId, score, questions.length);

    this._renderPage(this.view.renderQuizResult(this.currentQuiz, results, score, lang), "quiz-result");
    document.getElementById("retakeQuiz")?.addEventListener("click", () => this.showQuiz(courseId, quizId));
    document.getElementById("backToCourse")?.addEventListener("click", () => this.app.navigate("course", courseId));
    this._bindResultAIButtons();
  }

  _unansweredResult(question, lang) {
    const type = this._questionType(question);
    const options = this._questionOptions(question, lang);
    const correctIndex = this._correctIndex(question);
    const correctRaw = type === "short_answer"
      ? String(question.correctAnswer ?? question.answer ?? "").trim()
      : String(correctIndex);

    return {
      type,
      question: question.question || "",
      options,
      userAnswer: null,
      userAnswerLabel: "",
      correct: correctRaw,
      correctAnswerLabel: type === "short_answer" ? correctRaw : (options[correctIndex] || ""),
      isCorrect: false,
      explanation: question.explanation || "",
    };
  }

  _bindResultAIButtons() {
    document.querySelectorAll(".btn-explain-ai").forEach(btn => {
      btn.addEventListener("click", () => {
        this._sendAIMessage(btn.dataset.question, btn.dataset.correct, btn.dataset.wrong);
      });
    });
  }

  _askAIToExplain(result) {
    this._sendAIMessage(result.question, result.correctAnswerLabel, result.userAnswerLabel, result.isCorrect);
  }

  _sendAIMessage(question, correct, chosen, wasCorrect = false) {
    const lang = window.__i18n.current;
    const msg = lang === "vi"
      ? `Giải thích dễ hiểu giúp tôi câu hỏi: "${question}". Đáp án đúng là "${correct}". ${wasCorrect ? "Tôi đã chọn đúng, hãy giải thích vì sao đáp án này đúng." : `Tôi đã chọn "${chosen || "chưa trả lời"}", hãy giải thích vì sao sai và cách hiểu đúng.`}`
      : `Explain this question clearly: "${question}". The correct answer is "${correct}". ${wasCorrect ? "I chose correctly; explain why this answer is right." : `I chose "${chosen || "not answered"}"; explain why it is wrong and how to understand it.`}`;

    const chatInput = document.getElementById("chatbotInput");
    const fab = document.getElementById("chatbotFab");
    const chatSend = document.getElementById("chatbotSend");

    if (!this.app.chatbotController.isOpen) {
      fab?.click();
    }

    if (chatInput && chatSend) {
      chatInput.value = msg;
      chatSend.click();
    }
  }

  _updateQuizProgress() {
    const total = this.currentQuiz.questions.length;
    const answered = this.results.filter(Boolean).length;
    const pct = Math.round((answered / total) * 100);
    const bar = document.getElementById("quizProgress");
    const text = document.getElementById("quizProgressText");
    if (bar) bar.style.width = pct + "%";
    if (text) text.textContent = `${answered}/${total}`;
  }

  _syncNextButton() {
    const btn = document.getElementById("quizNextBtn");
    if (!btn || !this.currentQuiz) return;
    const lang = window.__i18n.current;
    const answered = !!this.results[this.currentQuestionIndex];
    const isLast = this.currentQuestionIndex >= this.currentQuiz.questions.length - 1;
    btn.disabled = !answered;
    btn.innerHTML = isLast
      ? `<i class="fas fa-flag-checkered mr-2"></i>${lang === "vi" ? "Hoàn thành" : "Finish"}`
      : `${lang === "vi" ? "Tiếp" : "Next"}<i class="fas fa-arrow-right ml-2"></i>`;
  }

  _startTimer(totalSeconds, courseId, quizId) {
    this.timeLeft = totalSeconds;
    const timerEl = document.getElementById("quizTimer");

    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.currentQuiz.closeTime && new Date() >= new Date(this.currentQuiz.closeTime)) {
        clearInterval(this.timer);
        window.__toast.warning(window.__i18n.current === "vi" ? "Đã đến giờ đóng bài kiểm tra!" : "Quiz close time reached!");
        this._finishInstantQuiz(courseId, quizId);
        return;
      }

      this.timeLeft -= 1;
      if (timerEl) {
        const m = String(Math.floor(this.timeLeft / 60)).padStart(2, "0");
        const s = String(this.timeLeft % 60).padStart(2, "0");
        timerEl.textContent = `${m}:${s}`;
        if (this.timeLeft <= 60) timerEl.classList.add("timer--warning");
      }

      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        window.__toast.warning(window.__i18n.current === "vi" ? "Hết giờ!" : "Time's up!");
        this._finishInstantQuiz(courseId, quizId);
      }
    }, 1000);
  }

  _startCloseTimeChecker(courseId, quizId) {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.currentQuiz.closeTime && new Date() >= new Date(this.currentQuiz.closeTime)) {
        clearInterval(this.timer);
        window.__toast.warning(window.__i18n.current === "vi" ? "Đã đến giờ đóng bài kiểm tra!" : "Quiz close time reached!");
        this._finishInstantQuiz(courseId, quizId);
      }
    }, 1000);
  }

  _playAnswerSound(isCorrect) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext = this.audioContext || new AudioCtx();

      const ctx = this.audioContext;
      if (ctx.state === "suspended") ctx.resume();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(isCorrect ? 660 : 180, now);
      oscillator.frequency.exponentialRampToValueAtTime(isCorrect ? 880 : 120, now + 0.14);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.2);
    } catch (e) {
      // Sound is optional; browser autoplay/audio policies may block it.
    }
  }

  _questionType(question) {
    if (question.type) return question.type;
    if ((question.options || []).length === 2) return "true_false";
    return "multiple_choice";
  }

  _questionOptions(question, lang) {
    if (this._questionType(question) === "true_false" && (!question.options || question.options.length < 2)) {
      return lang === "vi" ? ["Đúng", "Sai"] : ["True", "False"];
    }
    return question.options || [];
  }

  _correctIndex(question) {
    if (typeof question.correctAnswer === "boolean") return question.correctAnswer ? 0 : 1;
    if (typeof question.correctAnswer === "number") return question.correctAnswer;
    const raw = String(question.correctAnswer ?? "0").trim().toLowerCase();
    if (raw === "true" || raw === "đúng" || raw === "dung") return 0;
    if (raw === "false" || raw === "sai") return 1;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  _normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }
}

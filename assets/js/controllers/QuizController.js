// ============================================================
//  QuizController.js — Quiz Business Logic
// ============================================================

import { QuizModel }  from "../models/QuizModel.js";
import { CourseModel } from "../models/CourseModel.js";
import { QuizView }   from "../views/QuizView.js";

export class QuizController {
  constructor(app) {
    this.app         = app;
    this.quizModel   = new QuizModel();
    this.courseModel = new CourseModel();
    this.view        = new QuizView();
    this.currentQuiz = null;
    this.answers     = {};
    this.timeLeft    = 0;
    this.timer       = null;
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
      window.__alert(
        lang === "vi" ? "Chưa mở!" : "Not Open Yet!",
        lang === "vi" ? `Bài kiểm tra này sẽ mở vào lúc ${new Date(quiz.openTime).toLocaleString('vi-VN')}.` : `This quiz will open at ${new Date(quiz.openTime).toLocaleString('en-US')}.`,
        "warning",
        () => this.app.navigate("course", courseId)
      );
      return;
    }
    if (quiz.closeTime && now > new Date(quiz.closeTime)) {
      window.__alert(
        lang === "vi" ? "Đã Đóng!" : "Quiz Closed!",
        lang === "vi" ? `Bài kiểm tra này đã đóng lúc ${new Date(quiz.closeTime).toLocaleString('vi-VN')} và không còn nhận bài làm.` : `This quiz closed at ${new Date(quiz.closeTime).toLocaleString('en-US')} and is no longer accepting submissions.`,
        "error",
        () => this.app.navigate("course", courseId)
      );
      return;
    }

    const renderActualQuiz = () => {
      this.currentQuiz = quiz;
      this.currentCourseId = courseId;
      this.answers = {};

      const html = this.view.renderQuiz(course, quiz, lang);
      this._renderPage(html, "quiz");

      this._bindAnswerOptions();
      this._bindSubmit(courseId, quizId);
      document.getElementById("backToCourse")?.addEventListener("click", () => {
        clearInterval(this.timer);
        this.app.navigate("course", courseId);
      });

      if (quiz.timeLimitMinutes) {
        this._startTimer(quiz.timeLimitMinutes * 60, courseId, quizId);
      } else {
        // If no time limit, we still need to check for closeTime
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
        true, // isPassword = true
        () => {
          this.app.navigate("course", courseId);
        }
      );
    } else {
      renderActualQuiz();
    }
  }

  _bindAnswerOptions() {
    document.querySelectorAll(".quiz-option").forEach(opt => {
      opt.addEventListener("click", () => {
        const qIdx = opt.dataset.question;
        const val  = opt.dataset.value;

        // Deselect siblings
        document.querySelectorAll(`.quiz-option[data-question="${qIdx}"]`)
          .forEach(o => o.classList.remove("selected"));

        opt.classList.add("selected");
        this.answers[qIdx] = val;

        // Update progress bar
        const total     = this.currentQuiz.questions.length;
        const answered  = Object.keys(this.answers).length;
        const pct       = Math.round((answered / total) * 100);
        const bar       = document.getElementById("quizProgress");
        const barText   = document.getElementById("quizProgressText");
        if (bar)     bar.style.width = pct + "%";
        if (barText) barText.textContent = `${answered}/${total}`;
      });
    });
  }

  _bindSubmit(courseId, quizId) {
    document.getElementById("submitQuizBtn")?.addEventListener("click", async () => {
      const total     = this.currentQuiz.questions.length;
      const answered  = Object.keys(this.answers).length;
      const lang      = window.__i18n.current;

      if (answered < total) {
        const msg = lang === "vi"
          ? `Bạn còn ${total - answered} câu chưa trả lời. Tiếp tục?`
          : `You have ${total - answered} unanswered questions. Continue?`;
        if (!confirm(msg)) return;
      }

      clearInterval(this.timer);
      await this._submitQuiz(courseId, quizId);
    });
  }

  async _submitQuiz(courseId, quizId) {
    const quiz  = this.currentQuiz;
    const lang  = window.__i18n.current;
    let score   = 0;
    const results = quiz.questions.map((q, i) => {
      const userAnswer    = this.answers[i] ?? null;
      const correct       = String(q.correctAnswer);
      const isCorrect     = userAnswer === correct;
      if (isCorrect) score++;
      return { question: q.question, options: q.options, userAnswer, correct, isCorrect };
    });

    const uid = this.app.getUser().uid;
    await this.quizModel.saveQuizScore(uid, courseId, quizId, score, quiz.questions.length);

    const html = this.view.renderQuizResult(quiz, results, score, lang);
    this._renderPage(html, "quiz-result");

    document.getElementById("retakeQuiz")?.addEventListener("click", () => this.showQuiz(courseId, quizId));
    document.getElementById("backToCourse")?.addEventListener("click", () => this.app.navigate("course", courseId));
    
    // Bind Ask AI buttons
    document.querySelectorAll(".btn-explain-ai").forEach(btn => {
      btn.addEventListener("click", () => {
        const question = btn.dataset.question;
        const correct = btn.dataset.correct;
        const wrong = btn.dataset.wrong;
        
        let msg = "";
        if (lang === "vi") {
          msg = `Giải thích giúp tôi tại sao câu hỏi "${question}" lại có đáp án đúng là "${correct}"`;
          if (wrong) msg += ` chứ không phải là "${wrong}"?`;
        } else {
          msg = `Explain to me why for the question "${question}", the correct answer is "${correct}"`;
          if (wrong) msg += ` instead of "${wrong}"?`;
        }
        
        // Open chatbot and put text in input
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
      });
    });
  }

  _startTimer(totalSeconds, courseId, quizId) {
    this.timeLeft = totalSeconds;
    const timerEl = document.getElementById("quizTimer");

    this.timer = setInterval(() => {
      // Check if closeTime reached
      if (this.currentQuiz.closeTime && new Date() >= new Date(this.currentQuiz.closeTime)) {
        clearInterval(this.timer);
        window.__toast.warning(
          window.__i18n.current === "vi" ? "Đã đến giờ đóng bài kiểm tra!" : "Quiz close time reached!"
        );
        this._submitQuiz(courseId, quizId);
        return;
      }

      this.timeLeft--;
      if (timerEl) {
        const m = String(Math.floor(this.timeLeft / 60)).padStart(2, "0");
        const s = String(this.timeLeft % 60).padStart(2, "0");
        timerEl.textContent = `${m}:${s}`;
        if (this.timeLeft <= 60) timerEl.classList.add("timer--warning");
      }

      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        window.__toast.warning(
          window.__i18n.current === "vi" ? "Hết giờ!" : "Time's up!"
        );
        this._submitQuiz(courseId, quizId);
      }
    }, 1000);
  }

  _startCloseTimeChecker(courseId, quizId) {
    this.timer = setInterval(() => {
      if (this.currentQuiz.closeTime && new Date() >= new Date(this.currentQuiz.closeTime)) {
        clearInterval(this.timer);
        window.__toast.warning(
          window.__i18n.current === "vi" ? "Đã đến giờ đóng bài kiểm tra!" : "Quiz close time reached!"
        );
        this._submitQuiz(courseId, quizId);
      }
    }, 1000);
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }
}

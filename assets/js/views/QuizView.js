// ============================================================
//  QuizView.js - Quiz Page Templates (Argon Style)
// ============================================================

export class QuizView {
  renderQuiz(course, quiz, lang) {
    const questions = quiz.questions || [];
    const t = lang === "vi" ? {
      back: "Thoát",
      timer: "Thời gian",
      answered: "đã trả lời",
    } : {
      back: "Exit",
      timer: "Time",
      answered: "answered",
    };

    return `
      <div class="header bg-gradient-default pb-6 quiz-play-header">
        <div class="container-fluid">
          <div class="quiz-play-topbar">
            <button class="btn btn-sm btn-neutral" id="backToCourse"><i class="fas fa-arrow-left mr-2"></i>${t.back}</button>
            <div class="text-center text-white">
              <h3 class="mb-0 text-white">${this._escape(quiz.title)}</h3>
              <small>${this._escape(course?.title || "")}</small>
            </div>
            ${quiz.timeLimitMinutes ? `
              <div class="quiz-timer-pill">
                <i class="fas fa-clock mr-2"></i><span id="quizTimer">${String(quiz.timeLimitMinutes).padStart(2, "0")}:00</span>
              </div>` : `<div></div>`
            }
          </div>
        </div>
      </div>
      <div class="container-fluid mt--6 quiz-play-wrap">
        <div class="quiz-progress-shell">
          <div class="quiz-progress-meta">
            <span id="quizProgressText">0/${questions.length}</span>
            <span>${t.answered}</span>
          </div>
          <div class="leaderboard-unlock-track quiz-progress-track">
            <span id="quizProgress" style="width:0%"></span>
          </div>
        </div>
        <div id="quizQuestionHost"></div>
        <div class="quiz-play-actions">
          <button class="btn btn-lg btn-primary" id="quizNextBtn" disabled></button>
        </div>
      </div>
    `;
  }

  renderQuizQuestion(quiz, index, result, lang) {
    const questions = quiz.questions || [];
    const question = questions[index] || {};
    const type = this._questionType(question);
    const options = this._questionOptions(question, lang);
    const answered = !!result;
    const t = lang === "vi" ? {
      question: "Câu",
      choose: "Chọn một đáp án",
      short: "Nhập câu trả lời",
      check: "Kiểm tra",
      correct: "Chính xác",
      wrong: "Chưa đúng",
      correctAnswer: "Đáp án đúng",
      explain: "AI giải thích",
      nextHint: "Bấm Tiếp để sang câu sau.",
    } : {
      question: "Question",
      choose: "Choose one answer",
      short: "Type your answer",
      check: "Check",
      correct: "Correct",
      wrong: "Not quite",
      correctAnswer: "Correct answer",
      explain: "AI Explain",
      nextHint: "Press Next to continue.",
    };

    return `
      <article class="quiz-play-card ${answered ? (result.isCorrect ? "answered-correct" : "answered-wrong") : ""}">
        <div class="quiz-play-card-head">
          <span class="quiz-question-badge">${t.question} ${index + 1}/${questions.length}</span>
          <span class="quiz-question-type">${this._typeLabel(type, lang)}</span>
        </div>
        <h2>${this._escape(question.question || "")}</h2>
        <p class="quiz-question-hint">${type === "short_answer" ? t.short : t.choose}</p>
        ${type === "short_answer"
          ? this._shortAnswerInput(result, t, lang)
          : `<div class="quiz-play-options">
              ${options.map((option, optionIndex) => this._optionButton(option, optionIndex, result)).join("")}
            </div>`
        }
        ${answered ? this._feedbackBlock(question, result, t, lang) : ""}
      </article>
    `;
  }

  _renderQuizResultLegacy(quiz, results, score, lang) {
    const total = results.length || 1;
    const pct = Math.round((score / total) * 100);
    const passing = quiz.passingScore || 60;
    const passed = pct >= passing;

    const t = lang === "vi" ? {
      title: passed ? "Chúc mừng! Bạn đã vượt qua!" : "Chưa đạt. Cố gắng hơn nhé!",
      score: "Điểm số",
      correct: "Đúng",
      wrong: "Sai",
      retake: "Làm lại",
      back: "Quay lại",
      review: "Xem đáp án",
      yourAnswer: "Bạn chọn",
      correctAnswer: "Đáp án đúng",
      unanswered: "Chưa trả lời",
      ask: "Hỏi AI giải thích",
    } : {
      title: passed ? "Congratulations! You passed!" : "Not passed. Keep trying!",
      score: "Score",
      correct: "Correct",
      wrong: "Wrong",
      retake: "Retake",
      back: "Back",
      review: "Review Answers",
      yourAnswer: "Your answer",
      correctAnswer: "Correct answer",
      unanswered: "Not answered",
      ask: "Ask AI to explain",
    };

    return `
      <div class="header ${passed ? "bg-gradient-success" : "bg-gradient-danger"} pb-8">
        <div class="container-fluid text-center">
          <div class="py-3">
            <h1 class="text-white display-2 font-weight-bold">${pct}%</h1>
            <p class="text-white h3">${t.title}</p>
            <div class="mt-3">
              <span class="badge badge-success badge-lg mr-2">${score} ${t.correct}</span>
              <span class="badge badge-danger badge-lg">${results.length - score} ${t.wrong}</span>
            </div>
            <div class="mt-4">
              <button class="btn btn-neutral mr-2" id="retakeQuiz">${t.retake}</button>
              <button class="btn btn-outline-white" id="backToCourse">${t.back}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="container-fluid mt--7">
        <div class="card shadow quiz-review-card">
          <div class="card-header border-0"><h3 class="mb-0">${t.review}</h3></div>
          <div class="card-body p-0">
            ${results.map((r, i) => `
              <div class="quiz-review-row ${r.isCorrect ? "is-correct" : "is-wrong"}">
                <div class="quiz-review-main">
                  <span class="badge badge-${r.isCorrect ? "success" : "danger"} mr-2">${i + 1}</span>
                  <strong>${this._escape(r.question)}</strong>
                </div>
                <div class="quiz-review-detail">
                  <small class="${r.isCorrect ? "text-success" : "text-danger"}">${t.yourAnswer}: ${this._escape(r.userAnswerLabel || t.unanswered)}</small>
                  <small class="text-success">${t.correctAnswer}: ${this._escape(r.correctAnswerLabel || "")}</small>
                  <button class="btn btn-sm btn-outline-primary mt-1 btn-explain-ai" data-question="${this._attr(r.question)}" data-correct="${this._attr(r.correctAnswerLabel || "")}" data-wrong="${this._attr(r.userAnswerLabel || "")}">
                    <i class="fas fa-robot mr-1"></i>${t.ask}
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  renderQuizResult(quiz, results, score, lang) {
    const total = results.length || 1;
    const pct = Math.round((score / total) * 100);
    const passing = quiz.passingScore || 60;
    const passed = pct >= passing;
    const wrong = results.length - score;
    const ringStyle = `--score:${pct}; --score-color:${passed ? "#2dce89" : "#fb6340"}`;

    const t = lang === "vi" ? {
      title: passed ? "Chúc mừng, bạn đã vượt qua!" : "Chưa đạt, thử lại một lượt nhé",
      sub: passed ? "Bạn đã nắm được phần chính của bài. Xem lại từng câu để nhớ lâu hơn." : "Mình đã gom lại các câu sai để bạn ôn đúng trọng tâm.",
      score: "Điểm số",
      correct: "Đúng",
      wrong: "Sai",
      passing: "Điểm qua môn",
      retake: "Làm lại",
      back: "Quay lại",
      review: "Xem lại câu trả lời",
      yourAnswer: "Bạn chọn",
      correctAnswer: "Đáp án đúng",
      unanswered: "Chưa trả lời",
      ask: "AI giải thích",
    } : {
      title: passed ? "Congratulations! You passed!" : "Not passed. Keep trying!",
      sub: passed ? "You have the main ideas. Review each answer to lock it in." : "The missed questions are grouped below so you can focus your review.",
      score: "Score",
      correct: "Correct",
      wrong: "Wrong",
      passing: "Passing score",
      retake: "Retake",
      back: "Back",
      review: "Review Answers",
      yourAnswer: "Your answer",
      correctAnswer: "Correct answer",
      unanswered: "Not answered",
      ask: "Ask AI to explain",
    };

    return `
      <div class="quiz-result-page ${passed ? "is-passed" : "is-failed"}">
        <section class="quiz-result-hero">
          <div class="quiz-result-copy">
            <span class="quiz-result-kicker">${this._escape(quiz.title || "")}</span>
            <h1>${t.title}</h1>
            <p>${t.sub}</p>
            <div class="quiz-result-actions">
              <button class="btn btn-neutral" id="retakeQuiz"><i class="fas fa-rotate-right mr-2"></i>${t.retake}</button>
              <button class="btn btn-outline-white" id="backToCourse"><i class="fas fa-arrow-left mr-2"></i>${t.back}</button>
            </div>
          </div>
          <div class="quiz-score-panel">
            <div class="quiz-score-ring" style="${ringStyle}">
              <span>${pct}%</span>
              <small>${t.score}</small>
            </div>
            <div class="quiz-result-stats">
              <span><strong>${score}</strong>${t.correct}</span>
              <span><strong>${wrong}</strong>${t.wrong}</span>
              <span><strong>${passing}%</strong>${t.passing}</span>
            </div>
          </div>
        </section>

        <section class="quiz-review-modern">
          <div class="quiz-review-modern-head">
            <div>
              <span>${t.review}</span>
              <h2>${score}/${results.length} ${t.correct}</h2>
            </div>
          </div>
          <div class="quiz-review-grid">
            ${results.map((r, i) => `
              <article class="quiz-review-card-modern ${r.isCorrect ? "is-correct" : "is-wrong"}">
                <div class="quiz-review-card-top">
                  <span class="quiz-review-number">${i + 1}</span>
                  <span class="quiz-review-status"><i class="fas ${r.isCorrect ? "fa-check" : "fa-xmark"}"></i>${r.isCorrect ? t.correct : t.wrong}</span>
                </div>
                <h3>${this._escape(r.question)}</h3>
                <div class="quiz-review-answer-stack">
                  <p class="quiz-user-answer ${r.isCorrect ? "is-correct" : "is-wrong"}"><span>${t.yourAnswer}</span>${this._escape(r.userAnswerLabel || t.unanswered)}</p>
                  <p class="quiz-correct-answer"><span>${t.correctAnswer}</span>${this._escape(r.correctAnswerLabel || "")}</p>
                </div>
                <button class="btn btn-sm btn-outline-primary btn-explain-ai" data-question="${this._attr(r.question)}" data-correct="${this._attr(r.correctAnswerLabel || "")}" data-wrong="${this._attr(r.userAnswerLabel || "")}">
                  <i class="fas fa-robot mr-1"></i>${t.ask}
                </button>
              </article>
            `).join("")}
          </div>
        </section>
      </div>
    `;
  }

  _optionButton(option, optionIndex, result) {
    const selected = result && String(result.userAnswer) === String(optionIndex);
    const correct = result && String(result.correct) === String(optionIndex);
    const wrongSelected = selected && !result.isCorrect;
    const cls = [
      "quiz-play-option",
      selected ? "is-selected" : "",
      correct ? "is-correct" : "",
      wrongSelected ? "is-wrong" : "",
    ].filter(Boolean).join(" ");

    return `
      <button type="button" class="${cls}" data-answer="${optionIndex}" ${result ? "disabled" : ""}>
        <span>${String.fromCharCode(65 + optionIndex)}</span>
        <strong>${this._escape(option)}</strong>
      </button>
    `;
  }

  _shortAnswerInput(result, t) {
    if (result) {
      return `<div class="quiz-short-answer readonly">${this._escape(result.userAnswerLabel || "")}</div>`;
    }
    return `
      <div class="quiz-short-answer-row">
        <input type="text" class="form-control" id="quizShortAnswerInput" placeholder="${t.short}" />
        <button class="btn btn-primary" id="shortAnswerCheckBtn">${t.check}</button>
      </div>
    `;
  }

  _feedbackBlock(question, result, t, lang) {
    const title = result.isCorrect ? t.correct : t.wrong;
    const explanation = question.explanation || result.explanation || "";
    return `
      <div class="quiz-feedback ${result.isCorrect ? "is-correct" : "is-wrong"}">
        <div class="quiz-feedback-title">
          <i class="fas ${result.isCorrect ? "fa-check-circle" : "fa-circle-xmark"}"></i>
          <strong>${title}</strong>
        </div>
        ${result.isCorrect ? "" : `<p>${t.correctAnswer}: <strong>${this._escape(result.correctAnswerLabel || "")}</strong></p>`}
        ${explanation ? `<p>${this._escape(explanation)}</p>` : `<p>${t.nextHint}</p>`}
        <button class="btn btn-sm btn-outline-primary quiz-ai-explain-current">
          <i class="fas fa-robot mr-1"></i>${t.explain}
        </button>
      </div>
    `;
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

  _typeLabel(type, lang) {
    const vi = {
      multiple_choice: "Trắc nghiệm",
      true_false: "Đúng / Sai",
      short_answer: "Trả lời ngắn",
    };
    const en = {
      multiple_choice: "Multiple choice",
      true_false: "True / False",
      short_answer: "Short answer",
    };
    return (lang === "vi" ? vi : en)[type] || type;
  }

  _escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  _attr(value) {
    return this._escape(value).replace(/"/g, "&quot;");
  }
}

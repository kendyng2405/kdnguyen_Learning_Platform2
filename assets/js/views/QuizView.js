// ============================================================
//  QuizView.js - Quiz Page Templates (Argon Style)
// ============================================================

import { QuizAnimationPlayer } from "../components/QuizAnimationPlayer.js?v=11";

export class QuizView {
  renderQuizList(rows, lang) {
    const t = lang === "vi" ? {
      kicker: "Quiz Center",
      title: "Tất cả bài quiz",
      sub: "Xem nhanh quiz đang mở, lịch đóng/mở và vào làm bài trực tiếp mà không cần đi qua từng khóa học.",
      search: "Tìm quiz hoặc khóa học...",
      total: "Tổng quiz",
      open: "Đang mở",
      done: "Đã làm",
      quiz: "Quiz",
      course: "Khóa học",
      status: "Trạng thái",
      openTime: "Thời gian mở",
      closeTime: "Thời gian đóng",
      duration: "Thời gian làm",
      best: "Điểm tốt nhất",
      action: "Hành động",
      questions: "câu hỏi",
      start: "Làm bài",
      openCourse: "Vào khóa học",
      empty: "Chưa có quiz nào để hiển thị.",
      emptyHint: "Hãy vào khóa học của bạn hoặc chờ giảng viên tạo quiz mới.",
      browse: "Xem khóa học",
      locked: "Cần đăng ký",
      password: "Có mật khẩu",
    } : {
      kicker: "Quiz Center",
      title: "All quizzes",
      sub: "See open quizzes, deadlines, durations, and start directly without opening each course first.",
      search: "Search quizzes or courses...",
      total: "Total quizzes",
      open: "Open now",
      done: "Taken",
      quiz: "Quiz",
      course: "Course",
      status: "Status",
      openTime: "Open time",
      closeTime: "Close time",
      duration: "Duration",
      best: "Best score",
      action: "Action",
      questions: "questions",
      start: "Start",
      openCourse: "Open course",
      empty: "No quizzes to show yet.",
      emptyHint: "Open your courses or wait for your instructor to create a quiz.",
      browse: "Browse courses",
      locked: "Enroll first",
      password: "Password",
    };

    const openCount = rows.filter(row => row.status.key === "open").length;
    const doneCount = rows.filter(row => row.bestScore !== null).length;

    return `
      <div class="quiz-list-page">
        <section class="quiz-list-hero">
          <div>
            <p class="quiz-list-kicker">${t.kicker}</p>
            <h1>${t.title}</h1>
            <p>${t.sub}</p>
          </div>
          <div class="quiz-list-stats">
            <span><strong>${rows.length}</strong>${t.total}</span>
            <span><strong>${openCount}</strong>${t.open}</span>
            <span><strong>${doneCount}</strong>${t.done}</span>
          </div>
        </section>

        <section class="quiz-list-toolbar">
          <div class="quiz-list-search">
            <i class="fas fa-search"></i>
            <input id="quizListSearch" type="text" placeholder="${t.search}" autocomplete="off" />
          </div>
        </section>

        <section class="quiz-list-panel">
          ${rows.length
            ? `
              <div class="quiz-list-head">
                <span>${t.quiz}</span>
                <span>${t.course}</span>
                <span>${t.status}</span>
                <span>${t.openTime}</span>
                <span>${t.closeTime}</span>
                <span>${t.duration}</span>
                <span>${t.best}</span>
                <span>${t.action}</span>
              </div>
              <div class="quiz-list-body">
                ${rows.map(row => this._quizListRow(row, t)).join("")}
              </div>
            `
            : `
              <div class="quiz-list-empty">
                <span><i class="fas fa-clipboard-list"></i></span>
                <h3>${t.empty}</h3>
                <p>${t.emptyHint}</p>
                <button class="btn btn-primary" type="button" onclick="window.__router.navigate('courses')">${t.browse}</button>
              </div>
            `
          }
        </section>
      </div>
    `;
  }

  renderQuizListError(lang) {
    const text = lang === "vi" ? "Không tải được danh sách quiz." : "Could not load quizzes.";
    return `
      <div class="quiz-list-page">
        <section class="quiz-list-hero">
          <div>
            <p class="quiz-list-kicker">Quiz Center</p>
            <h1>${text}</h1>
          </div>
        </section>
      </div>
    `;
  }

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
      drag: "Kéo thả để sắp xếp đúng thứ tự",
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
      drag: "Drag to arrange the correct order",
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
        <p class="quiz-question-hint">${type === "short_answer" ? t.short : type === "drag_drop" ? t.drag : t.choose}</p>
        ${this._answerInput(question, type, options, result, t, lang)}
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

  _quizListRow(row, t) {
    const search = `${row.title} ${row.courseTitle} ${row.category} ${row.status.label}`.toLowerCase();
    const action = row.needsEnrollment
      ? `<button type="button" class="btn btn-sm btn-outline-primary" data-open-course="${this._attr(row.courseId)}">${t.openCourse}</button>`
      : row.canStart
        ? `<button type="button" class="btn btn-sm btn-primary" data-start-quiz data-course-id="${this._attr(row.courseId)}" data-quiz-id="${this._attr(row.id)}"><i class="fas fa-play mr-1"></i>${t.start}</button>`
        : `<button type="button" class="btn btn-sm btn-secondary" disabled>${this._escape(row.status.label)}</button>`;

    return `
      <article class="quiz-list-row" data-quiz-row data-search="${this._attr(search)}">
        <div class="quiz-list-title">
          <span class="quiz-list-icon"><i class="fas fa-clipboard-check"></i></span>
          <div>
            <strong>${this._escape(row.title)}</strong>
            <small>${row.questionCount} ${t.questions} ${row.hasPassword ? `&middot; ${t.password}` : ""}</small>
          </div>
        </div>
        <div class="quiz-list-course">
          <strong>${this._escape(row.courseTitle)}</strong>
          <small>${this._escape(row.category || "")}</small>
        </div>
        <span class="quiz-status-pill quiz-status-${row.status.tone}">${this._escape(row.status.label)}</span>
        <span class="quiz-list-time">${this._escape(row.openText)}</span>
        <span class="quiz-list-time">${this._escape(row.closeText)}</span>
        <span class="quiz-list-duration"><i class="fas fa-clock mr-1"></i>${this._escape(row.durationText)}</span>
        <span class="quiz-list-score ${row.bestScore !== null ? "has-score" : ""}">${this._escape(row.scoreText)}</span>
        <div class="quiz-list-action">${action}</div>
      </article>
    `;
  }

  _answerInput(question, type, options, result, t, lang) {
    if (type === "short_answer") {
      return this._shortAnswerInput(result, t, lang);
    }
    if (type === "drag_drop") {
      return this._dragDropInput(question, options, result, t, lang);
    }
    return `
      <div class="quiz-play-options">
        ${options.map((option, optionIndex) => this._optionButton(option, optionIndex, result)).join("")}
      </div>
    `;
  }

  _dragDropInput(question, options, result, t, lang) {
    const items = options.length ? options : (question.items || []);
    if (result) {
      const order = Array.isArray(result.userAnswerOrder) ? result.userAnswerOrder : [];
      const ordered = order.map(index => items[index]).filter(Boolean);
      return `
        <div class="quiz-drag-readonly">
          ${ordered.map((item, index) => `
            <span><b>${index + 1}</b>${this._escape(item)}</span>
          `).join("")}
        </div>
      `;
    }

    const shuffled = items.map((item, index) => ({ item, index })).reverse();
    return `
      <div class="quiz-drag-shell">
        <ul class="quiz-drag-list" id="quizDragList">
          ${shuffled.map(({ item, index }) => `
            <li class="quiz-drag-item" draggable="true" data-drag-value="${index}">
              <span><i class="fas fa-grip-vertical"></i></span>
              <strong>${this._escape(item)}</strong>
            </li>
          `).join("")}
        </ul>
        <button class="btn btn-primary quiz-drag-check" type="button" id="dragDropCheckBtn">${t.check}</button>
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
    const animation = QuizAnimationPlayer.render(question.animation_spec || question.animationSpec, result.isCorrect ? "correct" : "wrong", lang);
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
        ${animation}
      </div>
    `;
  }

  _questionType(question) {
    if (question.type) return question.type;
    if ((question.options || []).length === 2) return "true_false";
    return "multiple_choice";
  }

  _questionOptions(question, lang) {
    if (this._questionType(question) === "drag_drop") {
      return Array.isArray(question.options) && question.options.length ? question.options : (question.items || []);
    }
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
      drag_drop: "Kéo thả",
    };
    const en = {
      multiple_choice: "Multiple choice",
      true_false: "True / False",
      short_answer: "Short answer",
      drag_drop: "Drag & drop",
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

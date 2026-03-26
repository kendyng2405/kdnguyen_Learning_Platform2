// ============================================================
//  QuizView.js — Quiz Page Templates
// ============================================================

export class QuizView {
  renderQuiz(course, quiz, lang) {
    const t = lang === "vi" ? {
      back: "← Thoát",
      timer: "Thời gian",
      submit: "Nộp bài",
      answered: "đã trả lời",
      of: "/",
    } : {
      back: "← Exit",
      timer: "Time",
      submit: "Submit",
      answered: "answered",
      of: "/",
    };

    const questions = quiz.questions || [];
    return `
      <div class="quiz-page">
        <div class="quiz-topbar animate-slide-up">
          <button class="btn btn--ghost btn--sm" id="backToCourse">${t.back}</button>
          <div class="quiz-title-wrap">
            <h2 class="quiz-page-title">${quiz.title}</h2>
            <span class="quiz-course-name">${course?.title || ""}</span>
          </div>
          ${quiz.timeLimitMinutes ? `
            <div class="quiz-timer-wrap">
              <span class="timer-icon">⏱</span>
              <span id="quizTimer" class="quiz-timer">${String(quiz.timeLimitMinutes).padStart(2,"0")}:00</span>
            </div>` : "<div></div>"
          }
        </div>

        <div class="quiz-progress-bar-wrap animate-fade">
          <div class="quiz-progress-bar" id="quizProgress" style="width:0%"></div>
        </div>
        <div class="quiz-answered-text">
          <span id="quizProgressText">0/${questions.length}</span> ${t.answered}
        </div>

        <div class="quiz-questions animate-slide-up delay-1">
          ${questions.map((q, i) => `
            <div class="quiz-question-card">
              <div class="question-number">${lang === "vi" ? "Câu" : "Q"} ${i + 1}</div>
              <p class="question-text">${q.question}</p>
              <div class="question-options">
                ${(q.options || []).map((opt, j) => `
                  <div class="quiz-option" data-question="${i}" data-value="${j}">
                    <span class="option-letter">${String.fromCharCode(65 + j)}</span>
                    <span class="option-text">${opt}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>

        <div class="quiz-submit-wrap animate-fade delay-2">
          <button class="btn btn--primary btn--lg" id="submitQuizBtn">${t.submit}</button>
        </div>
      </div>
    `;
  }

  renderQuizResult(quiz, results, score, lang) {
    const total     = results.length;
    const pct       = Math.round((score / total) * 100);
    const passing   = quiz.passingScore || 60;
    const passed    = pct >= passing;

    const t = lang === "vi" ? {
      title: passed ? "🎉 Chúc mừng! Bạn đã vượt qua!" : "😔 Chưa đạt. Cố gắng hơn nhé!",
      score: "Điểm số",
      correct: "Đúng",
      wrong: "Sai",
      retake: "Làm lại",
      back: "← Quay lại",
      review: "Xem đáp án",
      yourAnswer: "Bạn chọn",
      correctAnswer: "Đáp án đúng",
    } : {
      title: passed ? "🎉 Congratulations! You passed!" : "😔 Not passed. Keep trying!",
      score: "Score",
      correct: "Correct",
      wrong: "Wrong",
      retake: "Retake",
      back: "← Back",
      review: "Review Answers",
      yourAnswer: "Your Answer",
      correctAnswer: "Correct Answer",
    };

    return `
      <div class="quiz-result-page">
        <div class="result-card animate-slide-up ${passed ? 'result--pass' : 'result--fail'}">
          <div class="result-score-ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="var(--color-border)" stroke-width="8"/>
              <circle cx="60" cy="60" r="54" fill="none" stroke="${passed ? 'var(--color-success)' : 'var(--color-error)'}" 
                stroke-width="8" stroke-dasharray="${2 * Math.PI * 54}" 
                stroke-dashoffset="${2 * Math.PI * 54 * (1 - pct/100)}"
                stroke-linecap="round" transform="rotate(-90 60 60)" class="ring-fill"/>
            </svg>
            <div class="ring-text">
              <span class="ring-pct">${pct}%</span>
              <span class="ring-label">${t.score}</span>
            </div>
          </div>
          <h2 class="result-title">${t.title}</h2>
          <div class="result-stats">
            <span class="stat-correct">✓ ${score} ${t.correct}</span>
            <span class="stat-wrong">✕ ${total - score} ${t.wrong}</span>
          </div>
          <div class="result-actions">
            <button class="btn btn--outline" id="retakeQuiz">${t.retake}</button>
            <button class="btn btn--ghost" id="backToCourse">${t.back}</button>
          </div>
        </div>

        <div class="result-review animate-slide-up delay-1">
          <h3 class="review-title">${t.review}</h3>
          ${results.map((r, i) => `
            <div class="review-item ${r.isCorrect ? 'review--correct' : 'review--wrong'}">
              <div class="review-q">
                <span class="review-num">${i + 1}</span>
                <span class="review-text">${r.question}</span>
                <span class="review-icon">${r.isCorrect ? "✓" : "✕"}</span>
              </div>
              ${!r.isCorrect ? `
                <div class="review-answers">
                  <span class="your-ans">❌ ${t.yourAnswer}: ${r.userAnswer !== null ? r.options[parseInt(r.userAnswer)] : (lang === "vi" ? "Chưa trả lời" : "Not answered")}</span>
                  <span class="correct-ans">✅ ${t.correctAnswer}: ${r.options[parseInt(r.correct)]}</span>
                </div>` : ""
              }
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }
}

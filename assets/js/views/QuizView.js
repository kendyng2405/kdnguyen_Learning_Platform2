// ============================================================
//  QuizView.js — Quiz Page Templates (Argon Style)
// ============================================================

export class QuizView {
  renderQuiz(course, quiz, lang) {
    const t = lang === "vi" ? {
      back: "← Thoát", timer: "Thời gian", submit: "Nộp bài", answered: "đã trả lời", of: "/",
    } : {
      back: "← Exit", timer: "Time", submit: "Submit", answered: "answered", of: "/",
    };

    const questions = quiz.questions || [];
    return `
      <div class="header bg-gradient-default pb-6">
        <div class="container-fluid">
          <div class="d-flex justify-content-between align-items-center">
            <button class="btn btn-sm btn-neutral" id="backToCourse">${t.back}</button>
            <div class="text-center text-white">
              <h3 class="mb-0 text-white">${quiz.title}</h3>
              <small style="opacity:0.7">${course?.title || ""}</small>
            </div>
            ${quiz.timeLimitMinutes ? `
              <div class="bg-white rounded px-3 py-2 shadow" style="font-weight:700;">
                ⏱ <span id="quizTimer">${String(quiz.timeLimitMinutes).padStart(2,"0")}:00</span>
              </div>` : `<div></div>`
            }
          </div>
        </div>
      </div>
      <div class="container-fluid mt--6">
        <div class="mb-3">
          <div class="progress" style="height:6px;">
            <div class="progress-bar bg-primary" id="quizProgress" style="width:0%"></div>
          </div>
          <small class="text-muted"><span id="quizProgressText">0/${questions.length}</span> ${t.answered}</small>
        </div>

        ${questions.map((q, i) => `
          <div class="card shadow mb-3">
            <div class="card-body">
              <span class="badge badge-primary mb-2">${lang === "vi" ? "Câu" : "Q"} ${i + 1}</span>
              <p class="font-weight-bold mb-3">${q.question}</p>
              <div class="quiz-options">
                ${(q.options || []).map((opt, j) => `
                  <div class="quiz-option d-flex align-items-center p-2 mb-2 border rounded" data-question="${i}" data-value="${j}" style="cursor:pointer; transition: all 0.15s;">
                    <span class="badge badge-circle badge-default mr-3" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:0.8rem;">${String.fromCharCode(65 + j)}</span>
                    <span>${opt}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        `).join("")}

        <div class="text-center py-4">
          <button class="btn btn-lg btn-primary" id="submitQuizBtn">${t.submit}</button>
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
      score: "Điểm số", correct: "Đúng", wrong: "Sai",
      retake: "Làm lại", back: "← Quay lại", review: "Xem đáp án",
      yourAnswer: "Bạn chọn", correctAnswer: "Đáp án đúng",
    } : {
      title: passed ? "🎉 Congratulations! You passed!" : "😔 Not passed. Keep trying!",
      score: "Score", correct: "Correct", wrong: "Wrong",
      retake: "Retake", back: "← Back", review: "Review Answers",
      yourAnswer: "Your Answer", correctAnswer: "Correct Answer",
    };

    return `
      <div class="header ${passed ? 'bg-gradient-success' : 'bg-gradient-danger'} pb-8">
        <div class="container-fluid text-center">
          <div class="py-3">
            <h1 class="text-white display-2 font-weight-bold">${pct}%</h1>
            <p class="text-white h3">${t.title}</p>
            <div class="mt-3">
              <span class="badge badge-success badge-lg mr-2">✓ ${score} ${t.correct}</span>
              <span class="badge badge-danger badge-lg">✕ ${total - score} ${t.wrong}</span>
            </div>
            <div class="mt-4">
              <button class="btn btn-neutral mr-2" id="retakeQuiz">${t.retake}</button>
              <button class="btn btn-outline-white" id="backToCourse">${t.back}</button>
            </div>
          </div>
        </div>
      </div>
      <div class="container-fluid mt--7">
        <div class="card shadow">
          <div class="card-header border-0"><h3 class="mb-0">${t.review}</h3></div>
          <div class="card-body p-0">
            ${results.map((r, i) => `
              <div class="p-3 border-bottom ${r.isCorrect ? '' : 'bg-lighter'}">
                <div class="d-flex align-items-center justify-content-between">
                  <div>
                    <span class="badge badge-${r.isCorrect ? 'success' : 'danger'} mr-2">${i + 1}</span>
                    <strong>${r.question}</strong>
                  </div>
                  <span class="badge badge-${r.isCorrect ? 'success' : 'danger'}">${r.isCorrect ? "✓" : "✕"}</span>
                </div>
                ${!r.isCorrect ? `
                  <div class="mt-2 ml-4">
                    <small class="text-danger d-block">❌ ${t.yourAnswer}: ${r.userAnswer !== null ? r.options[parseInt(r.userAnswer)] : (lang === "vi" ? "Chưa trả lời" : "Not answered")}</small>
                    <small class="text-success d-block">✅ ${t.correctAnswer}: ${r.options[parseInt(r.correct)]}</small>
                    <button class="btn btn-sm btn-outline-primary mt-1 btn-explain-ai" data-question="${r.question}" data-correct="${r.options[parseInt(r.correct)]}" data-wrong="${r.userAnswer !== null ? r.options[parseInt(r.userAnswer)] : ''}">🤖 ${lang === 'vi' ? 'Hỏi AI giải thích' : 'Ask AI to Explain'}</button>
                  </div>` : ""}
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }
}

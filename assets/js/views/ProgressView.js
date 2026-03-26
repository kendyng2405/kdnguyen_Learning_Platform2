// ============================================================
//  ProgressView.js — Progress Tracking Page Template
// ============================================================

export class ProgressView {
  renderProgress(data, lang) {
    const t = lang === "vi" ? {
      title: "Tiến độ học tập",
      sub: "Theo dõi kết quả của bạn",
      noProgress: "Bạn chưa đăng ký khóa học nào.",
      lessons: "bài",
      quizzes: "quiz",
      completed: "hoàn thành",
      bestScore: "Điểm cao nhất",
      viewCourse: "Xem khóa học →",
      progress: "Tiến độ",
    } : {
      title: "Learning Progress",
      sub: "Track your results",
      noProgress: "You haven't enrolled in any courses yet.",
      lessons: "lessons",
      quizzes: "quizzes",
      completed: "completed",
      bestScore: "Best Score",
      viewCourse: "View Course →",
      progress: "Progress",
    };

    if (data.length === 0) {
      return `
        <div class="progress-page">
          <div class="page-header animate-slide-up">
            <h1 class="page-title">${t.title}</h1>
            <p class="page-sub">${t.sub}</p>
          </div>
          <div class="empty-state animate-fade">
            <span>📊</span>
            <p>${t.noProgress}</p>
            <button class="btn btn--primary" onclick="window.__router.navigate('courses')">${lang === "vi" ? "Khám phá khóa học" : "Explore Courses"}</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="progress-page">
        <div class="page-header animate-slide-up">
          <h1 class="page-title">${t.title}</h1>
          <p class="page-sub">${t.sub}</p>
        </div>

        <div class="progress-grid animate-slide-up delay-1">
          ${data.map(p => {
            const course   = p.course;
            if (!course) return "";
            const total    = p.totalLessons || 0;
            const done     = p.completedLessons?.length || 0;
            const pct      = total > 0 ? Math.round((done / total) * 100) : 0;
            const scores   = Object.values(p.quizScores || {});
            const bestScore = scores.length > 0 ? Math.max(...scores.map(s => s.percentage)) : null;

            return `
              <div class="progress-card">
                <div class="progress-card-header">
                  <div class="pcourse-thumb" style="background-image:url('${course.thumbnail || ""}')">
                    ${!course.thumbnail ? '<span>📚</span>' : ""}
                  </div>
                  <div class="pcourse-info">
                    <h3 class="pcourse-title">${course.title}</h3>
                    <div class="pcourse-meta">
                      <span>📖 ${done}/${total} ${t.lessons} ${t.completed}</span>
                      ${scores.length > 0 ? `<span>📝 ${scores.length} ${t.quizzes}</span>` : ""}
                    </div>
                  </div>
                </div>

                <div class="progress-bar-section">
                  <div class="progress-bar-label">
                    <span>${t.progress}</span>
                    <span class="pct-text">${pct}%</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill ${pct === 100 ? 'fill--complete' : ''}" style="width:${pct}%"></div>
                  </div>
                </div>

                ${bestScore !== null ? `
                  <div class="quiz-summary">
                    <span class="quiz-summary-label">${t.bestScore}</span>
                    <span class="quiz-summary-score ${bestScore >= 60 ? 'score--good' : 'score--low'}">${bestScore}%</span>
                  </div>` : ""
                }

                <button class="btn btn--ghost btn--sm" data-goto-course="${course.id}">${t.viewCourse}</button>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }
}
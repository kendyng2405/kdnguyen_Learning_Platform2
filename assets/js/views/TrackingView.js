// ============================================================
//  TrackingView.js - Teacher analytics dashboard
// ============================================================

export class TrackingView {
  renderTracking(reports, summary, lang) {
    const t = lang === "vi" ? {
      kicker: "Theo dõi giảng dạy",
      title: "Số liệu học viên và khóa học",
      sub: "Theo dõi tiến độ, quiz, điểm số và mức độ hoàn thành của từng khóa học bạn đang quản lý.",
      courses: "Khóa học",
      learners: "Học viên",
      avgProgress: "Tiến độ TB",
      avgScore: "Điểm quiz TB",
      chart: "Hiệu suất khóa học",
      noCourses: "Chưa có khóa học nào để theo dõi.",
      noLearners: "Chưa có học viên.",
      lessons: "Bài học",
      quizzes: "Quiz",
      completed: "Hoàn thành",
      learner: "Học viên",
      progress: "Tiến độ",
      quizScore: "Điểm quiz",
      attempts: "Lượt quiz",
      updated: "Cập nhật",
      openCourse: "Mở khóa học",
    } : {
      kicker: "Teaching analytics",
      title: "Learner and course metrics",
      sub: "Track progress, quizzes, scores, and completion across the courses you manage.",
      courses: "Courses",
      learners: "Learners",
      avgProgress: "Avg progress",
      avgScore: "Avg quiz score",
      chart: "Course performance",
      noCourses: "No courses to track yet.",
      noLearners: "No learners yet.",
      lessons: "Lessons",
      quizzes: "Quizzes",
      completed: "Completed",
      learner: "Learner",
      progress: "Progress",
      quizScore: "Quiz score",
      attempts: "Quiz attempts",
      updated: "Updated",
      openCourse: "Open course",
    };

    return `
      <div class="tracking-page">
        <section class="tracking-hero">
          <div>
            <p class="tracking-kicker">${t.kicker}</p>
            <h1>${t.title}</h1>
            <p>${t.sub}</p>
          </div>
          <div class="tracking-stat-grid">
            ${this._stat(t.courses, summary.totalCourses, "fa-book-open", "primary")}
            ${this._stat(t.learners, summary.totalLearners, "fa-user-graduate", "info")}
            ${this._stat(t.avgProgress, `${summary.avgProgress}%`, "fa-chart-line", "success")}
            ${this._stat(t.avgScore, `${summary.avgScore}%`, "fa-clipboard-check", "warning")}
          </div>
        </section>

        ${reports.length ? `
          <section class="tracking-chart-panel">
            <div class="tracking-section-head">
              <div>
                <span>${t.chart}</span>
                <h2>${summary.totalCourses} ${t.courses.toLowerCase()}</h2>
              </div>
            </div>
            <div class="tracking-bars">
              ${reports.map((report, index) => `
                <article style="--bar:${Math.max(4, report.avgProgress)}%; --delay:${index * 0.08}s">
                  <div class="tracking-bar">
                    <span></span>
                  </div>
                  <strong>${this._escape(report.shortTitle)}</strong>
                  <small>${report.avgProgress}%</small>
                </article>
              `).join("")}
            </div>
          </section>

          <section class="tracking-course-grid">
            ${reports.map(report => this._courseReport(report, t, lang)).join("")}
          </section>
        ` : `
          <section class="tracking-empty">
            <span><i class="fas fa-chart-line"></i></span>
            <h2>${t.noCourses}</h2>
          </section>
        `}
      </div>
    `;
  }

  renderDenied(lang) {
    const text = lang === "vi" ? "Bạn không có quyền truy cập trang theo dõi." : "You do not have access to tracking.";
    return `
      <div class="tracking-page">
        <section class="tracking-empty">
          <span><i class="fas fa-lock"></i></span>
          <h2>${text}</h2>
        </section>
      </div>
    `;
  }

  renderError(lang) {
    const text = lang === "vi" ? "Không tải được trang theo dõi." : "Could not load tracking.";
    return `
      <div class="tracking-page">
        <section class="tracking-empty">
          <span><i class="fas fa-triangle-exclamation"></i></span>
          <h2>${text}</h2>
        </section>
      </div>
    `;
  }

  _stat(label, value, icon, tone) {
    return `
      <article class="tracking-stat-card">
        <span class="text-${tone}"><i class="fas ${icon}"></i></span>
        <strong>${value}</strong>
        <small>${label}</small>
      </article>
    `;
  }

  _courseReport(report, t, lang) {
    return `
      <article class="tracking-course-card">
        <header>
          <div>
            <span class="tracking-course-kicker">${this._escape(report.category || t.courses)}</span>
            <h3>${this._escape(report.title)}</h3>
          </div>
          <button class="btn btn-sm btn-outline-primary" data-tracking-course="${this._attr(report.id)}">${t.openCourse}</button>
        </header>

        <div class="tracking-course-metrics">
          <span><strong>${report.learners.length}</strong>${t.learners}</span>
          <span><strong>${report.lessonCount}</strong>${t.lessons}</span>
          <span><strong>${report.quizCount}</strong>${t.quizzes}</span>
          <span><strong>${report.completedCount}</strong>${t.completed}</span>
        </div>

        <div class="tracking-mini-charts">
          <div>
            <div class="tracking-progress-label"><span>${t.avgProgress}</span><b>${report.avgProgress}%</b></div>
            <div class="tracking-track"><span style="width:${report.avgProgress}%"></span></div>
          </div>
          <div>
            <div class="tracking-progress-label"><span>${t.avgScore}</span><b>${report.avgScore}%</b></div>
            <div class="tracking-track tracking-track--score"><span style="width:${report.avgScore}%"></span></div>
          </div>
        </div>

        ${report.learners.length ? `
          <div class="tracking-table-wrap">
            <table class="table tracking-table">
              <thead>
                <tr>
                  <th>${t.learner}</th>
                  <th>${t.progress}</th>
                  <th>${t.quizScore}</th>
                  <th>${t.attempts}</th>
                  <th>${t.updated}</th>
                </tr>
              </thead>
              <tbody>
                ${report.learners.map(row => `
                  <tr>
                    <td><strong>${this._escape(row.name)}</strong><small>${this._escape(row.email || row.username || row.uid)}</small></td>
                    <td>
                      <div class="tracking-progress-label"><span>${row.completedLessons}/${row.totalLessons}</span><b>${row.progressPct}%</b></div>
                      <div class="tracking-track"><span style="width:${row.progressPct}%"></span></div>
                    </td>
                    <td>${row.averageScore === null ? "--" : row.averageScore + "%"}</td>
                    <td>${row.quizTaken}/${row.quizTotal}</td>
                    <td>${this._formatDate(row.lastUpdated, lang)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        ` : `<div class="tracking-no-learners">${t.noLearners}</div>`}
      </article>
    `;
  }

  _formatDate(value, lang) {
    const raw = value?.toDate ? value.toDate() : value;
    const date = raw ? new Date(raw) : null;
    return date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US")
      : "--";
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

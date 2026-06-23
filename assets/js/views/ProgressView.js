// ============================================================
//  ProgressView.js — Progress Page Template (Argon Style)
// ============================================================

export class ProgressView {
  renderProgress(data, lang) {
    const t = lang === "vi" ? {
      title: "Tiến độ học tập", sub: "Theo dõi kết quả của bạn",
      noProgress: "Bạn chưa đăng ký khóa học nào.", lessons: "bài", quizzes: "quiz",
      completed: "hoàn thành", bestScore: "Điểm cao nhất",
      viewCourse: "Xem khóa học →", progress: "Tiến độ", explore: "Khám phá khóa học",
    } : {
      title: "Learning Progress", sub: "Track your results",
      noProgress: "You haven't enrolled in any courses yet.", lessons: "lessons", quizzes: "quizzes",
      completed: "completed", bestScore: "Best Score",
      viewCourse: "View Course →", progress: "Progress", explore: "Explore Courses",
    };

    if (data.length === 0) {
      return `
        <div class="header bg-gradient-info pb-8">
          <div class="container-fluid">
            <h1 class="text-white mb-0">${t.title}</h1>
            <p class="text-white mt-1" style="opacity:0.8">${t.sub}</p>
          </div>
        </div>
        <div class="container-fluid mt--7">
          <div class="card shadow">
            <div class="card-body text-center py-5">
              <span style="font-size:3rem">📊</span>
              <p class="text-muted mt-3">${t.noProgress}</p>
              <button class="btn btn-primary" onclick="window.__router.navigate('courses')">${t.explore}</button>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="header bg-gradient-info pb-8">
        <div class="container-fluid">
          <h1 class="text-white mb-0">${t.title}</h1>
          <p class="text-white mt-1" style="opacity:0.8">${t.sub}</p>
        </div>
      </div>
      <div class="container-fluid mt--7">
        <div class="row">
          ${data.map(p => {
            const course = p.course;
            if (!course) return "";
            const total = p.totalLessons || 0;
            const done = p.completedLessons?.length || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const scores = Object.values(p.quizScores || {});
            const bestScore = scores.length > 0 ? Math.max(...scores.map(s => s.percentage)) : null;

            return `
              <div class="col-xl-4 col-lg-6 mb-4">
                <div class="card shadow">
                  <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                      <div class="icon icon-shape bg-primary text-white rounded-circle shadow mr-3" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
                        ${course.thumbnail ? `<img src="${course.thumbnail}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />` : '📚'}
                      </div>
                      <div>
                        <h5 class="mb-0">${course.title}</h5>
                        <small class="text-muted">📖 ${done}/${total} ${t.lessons} ${t.completed}</small>
                      </div>
                    </div>
                    <div class="d-flex justify-content-between mb-1">
                      <small>${t.progress}</small>
                      <small class="font-weight-bold">${pct}%</small>
                    </div>
                    <div class="progress mb-3" style="height:8px;">
                      <div class="progress-bar ${pct === 100 ? 'bg-success' : 'bg-primary'}" style="width:${pct}%"></div>
                    </div>
                    ${bestScore !== null ? `
                      <div class="d-flex justify-content-between align-items-center mb-3">
                        <small class="text-muted">${t.bestScore}</small>
                        <span class="badge badge-${bestScore >= 60 ? 'success' : 'danger'}">${bestScore}%</span>
                      </div>` : ""
                    }
                    <button class="btn btn-sm btn-outline-primary btn-block" data-goto-course="${course.id}">${t.viewCourse}</button>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }
}

// ============================================================
//  CourseView.js — Course & Lesson Page Templates (Argon Style)
// ============================================================

export class CourseView {

  renderDashboard(courses, allProgress, profile, lang) {
    const name = profile?.username || profile?.fullname || "Learner";
    const name = profile && profile.fullname ? profile.fullname.split(" ")[0] : "Bạn";
    const t = lang === "vi" ? {
      greeting: `Chào mừng trở lại, ${name}! 👋`,
      sub: "Brilliant LMS - Nền tảng học tập tương tác hiện đại.",
      desc: "Khám phá các khóa học chất lượng cao, bài kiểm tra thực hành và theo dõi tiến độ của bạn một cách trực quan.",
      explore: "Khám phá khóa học",
      profile: "Hồ sơ của tôi"
    } : {
      greeting: `Welcome back, ${name}! 👋`,
      sub: "Brilliant LMS - Modern Interactive Learning Platform.",
      desc: "Explore high-quality courses, practice quizzes, and track your progress intuitively.",
      explore: "Explore Courses",
      profile: "My Profile"
    };

    return `
      <div class="header bg-gradient-info pb-8 pt-5 pt-md-8" style="min-height: 80vh; display: flex; align-items: center;">
        <div class="container-fluid">
          <div class="header-body text-center">
            <div class="row justify-content-center">
              <div class="col-xl-8 col-lg-10">
                <div class="icon icon-shape bg-white text-info rounded-circle shadow mb-4" style="width: 80px; height: 80px; font-size: 2rem;">
                  <i class="fas fa-graduation-cap"></i>
                </div>
                <h1 class="display-2 text-white font-weight-bold mb-3">${t.greeting}</h1>
                <h2 class="text-white mb-4" style="font-weight: 400;">${t.sub}</h2>
                <p class="text-white mt-1 mb-5" style="opacity:0.9; font-size: 1.1rem;">${t.desc}</p>
                <div class="mt-4">
                  <button class="btn btn-lg btn-white text-info mr-3 shadow" onclick="window.__router.navigate('courses')">
                    <i class="fas fa-book-open mr-2"></i> ${t.explore}
                  </button>
                  <button class="btn btn-lg btn-outline-white shadow" onclick="window.__router.navigate('profile')">
                    <i class="fas fa-user mr-2"></i> ${t.profile}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderCourseList(courses, progressMap, profile, lang) {
    const t = lang === "vi" ? {
      title: "Khóa học", sub: "Khám phá và học tập",
      enroll: "Đăng ký", enrolled: "Đã đăng ký", view: "Xem khóa học",
      noCourses: "Chưa có khóa học nào.", lessons: "bài học",
      level: { beginner: "Cơ bản", intermediate: "Trung cấp", advanced: "Nâng cao" },
    } : {
      title: "Courses", sub: "Explore and learn",
      enroll: "Enroll", enrolled: "Enrolled", view: "View Course",
      noCourses: "No courses available.", lessons: "lessons",
      level: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
    };

    return `
      <div class="header bg-gradient-info pb-8 pt-5 pt-md-8">
        <div class="container-fluid">
          <h1 class="text-white mb-0">${t.title}</h1>
          <p class="text-white mt-1" style="opacity:0.8">${t.sub}</p>
        </div>
      </div>
      <div class="container-fluid mt--7">
        ${courses.length === 0
          ? `<div class="card shadow"><div class="card-body text-center py-5"><p class="text-muted">${t.noCourses}</p></div></div>`
          : `<div class="row course-card-grid">
              ${courses.map(c => {
                const progress = progressMap[c.id];
                const isEnrolled = !!progress?.enrolledAt;
                return this._courseCardFull(c, progress, isEnrolled, t, lang);
              }).join("")}
            </div>`
        }
      </div>
    `;
  }

  renderCourseDetail(course, lessons, quizzes, progress, profile, lang) {
    const isEnrolled    = !!progress?.enrolledAt;
    const completedLess = progress?.completedLessons || [];
    const totalLessons  = lessons.length;
    const pct = totalLessons > 0 ? Math.round((completedLess.length / totalLessons) * 100) : 0;

    const t = lang === "vi" ? {
      back: "← Quay lại", enroll: "Đăng ký khóa học", enrolled: "Đã đăng ký",
      lessons: "Bài học", quizzes: "Bài kiểm tra", progress: "Tiến độ",
      completed: "hoàn thành", noLessons: "Chưa có bài học.", noQuizzes: "Chưa có bài kiểm tra.",
      done: "✓", start: "Bắt đầu", take: "Làm bài",
    } : {
      back: "← Back", enroll: "Enroll Now", enrolled: "Enrolled",
      lessons: "Lessons", quizzes: "Quizzes", progress: "Progress",
      completed: "completed", noLessons: "No lessons yet.", noQuizzes: "No quizzes yet.",
      done: "✓", start: "Start", take: "Take Quiz",
    };

    const levelMap = { beginner: "bg-success", intermediate: "bg-warning", advanced: "bg-danger" };
    const levelBg = levelMap[course.level] || "bg-primary";

    return `
      <div class="header ${levelBg} pb-8 pt-5 pt-md-8">
        <div class="container-fluid">
          <button class="btn btn-sm btn-neutral mb-3" id="backToCourses">${t.back}</button>
          <h1 class="text-white mb-1">${course.title}</h1>
          <p class="text-white" style="opacity:0.8">${course.description || ""}</p>
          <div class="d-flex align-items-center mt-2" style="gap:1rem;">
            <span class="badge badge-default">📖 ${totalLessons} ${lang === "vi" ? "bài" : "lessons"}</span>
            <span class="badge badge-default">📝 ${quizzes.length} ${lang === "vi" ? "bài kiểm tra" : "quizzes"}</span>
            <span class="badge badge-${course.level === 'beginner' ? 'success' : course.level === 'advanced' ? 'danger' : 'warning'}">${course.level || "—"}</span>
          </div>
          ${isEnrolled ? `
            <div class="mt-3" style="max-width:400px;">
              <div class="d-flex justify-content-between text-white mb-1">
                <small>${t.progress}</small><small>${pct}% ${t.completed}</small>
              </div>
              <div class="progress" style="height:8px;">
                <div class="progress-bar bg-success" style="width:${pct}%"></div>
              </div>
              <button class="btn btn-sm btn-neutral mt-2" id="btnStudyPlan" data-course="${course.title}">📅 ${lang==='vi'?'AI Kế hoạch học tập':'AI Study Plan'}</button>
            </div>
          ` : `<button class="btn btn-neutral mt-3" id="enrollBtn">${t.enroll}</button>`}
        </div>
      </div>
      <div class="container-fluid mt--7">
        <div class="row">
          <div class="col-xl-8">
            <div class="card shadow mb-4">
              <div class="card-header border-0"><h3 class="mb-0">${t.lessons}</h3></div>
              ${lessons.length === 0
                ? `<div class="card-body"><p class="text-muted">${t.noLessons}</p></div>`
                : `<div class="table-responsive">
                    <table class="table align-items-center table-flush">
                      <thead class="thead-light">
                        <tr><th>#</th><th>${lang==='vi'?'Tên bài':'Title'}</th><th>${lang==='vi'?'Loại':'Type'}</th><th>${lang==='vi'?'Trạng thái':'Status'}</th></tr>
                      </thead>
                      <tbody>
                        ${lessons.map((l, i) => {
                          const done = completedLess.includes(l.id);
                          const locked = !isEnrolled;
                          const lockMsg = lang === 'vi' ? 'Đăng ký khóa học để mở khoá' : 'Enroll to unlock';
                          return `<tr class="lesson-list-item ${done ? 'done' : ''} ${locked ? 'locked' : ''}" data-lesson-id="${locked ? '' : l.id}" ${locked ? `title="${lockMsg}"` : ''} style="cursor:${locked?'not-allowed':'pointer'}">
                            <td>${i + 1}</td>
                            <td><strong>${l.title}</strong><br><small class="text-muted">${l.duration || ''}</small></td>
                            <td><span class="badge badge-dot mr-4"><i class="bg-${done ? 'success' : 'info'}"></i> ${this._lessonTypeIcon(l.type)} ${l.type || 'lesson'}</span></td>
                            <td>${done ? '<span class="badge badge-success">✓</span>' : locked ? '<span class="badge badge-secondary">🔒</span>' : '<span class="badge badge-primary">▶</span>'}</td>
                          </tr>`;
                        }).join("")}
                      </tbody>
                    </table>
                  </div>`
              }
            </div>
          </div>
          <div class="col-xl-4">
            <div class="card shadow">
              <div class="card-header border-0"><h3 class="mb-0">${t.quizzes}</h3></div>
              ${quizzes.length === 0
                ? `<div class="card-body"><p class="text-muted">${t.noQuizzes}</p></div>`
                : `<div class="card-body p-0">
                    ${quizzes.map(q => {
                      const score = progress?.quizScores?.[q.id];
                      const now = new Date();
                      let quizStatus = 'open', statusColor = 'text-success', quizStatusText = lang==='vi'?'Đang mở':'Open';
                      const openDate = q.openTime ? new Date(q.openTime) : null;
                      const closeDate = q.closeTime ? new Date(q.closeTime) : null;
                      if (openDate && now < openDate) {
                        quizStatus = 'not_open'; statusColor = 'text-warning';
                        quizStatusText = lang==='vi'?`Mở lúc: ${openDate.toLocaleString('vi-VN')}`:`Opens: ${openDate.toLocaleString('en-US')}`;
                      } else if (closeDate && now > closeDate) {
                        quizStatus = 'closed'; statusColor = 'text-danger';
                        quizStatusText = lang==='vi'?`Đã đóng`:`Closed`;
                      } else if (closeDate) {
                        quizStatusText = lang==='vi'?`Đóng: ${closeDate.toLocaleString('vi-VN')}`:`Closes: ${closeDate.toLocaleString('en-US')}`;
                      }
                      const timeRestricted = quizStatus === 'not_open' || quizStatus === 'closed';
                      const locked = !isEnrolled || timeRestricted;
                      let lockMsg = "";
                      if (!isEnrolled) lockMsg = lang==="vi"?"Đăng ký khóa học để mở":"Enroll to unlock";
                      else if (quizStatus==="not_open") lockMsg = lang==="vi"?"Chưa mở":"Not open yet";
                      else if (quizStatus==="closed") lockMsg = lang==="vi"?"Đã đóng":"Closed";

                      return `<div class="quiz-list-item d-flex align-items-center p-3 border-bottom ${locked?'locked':''}" data-quiz-id="${locked?'':q.id}" ${locked?`title="${lockMsg}"`:''} style="cursor:${locked?'not-allowed':'pointer'}">
                        <div class="flex-fill">
                          <strong>${q.title}</strong>
                          <div><small class="text-muted">${q.questions?.length||0} ${lang==="vi"?"câu":"Q"} ${q.timeLimitMinutes?`• ${q.timeLimitMinutes} ${lang==="vi"?"phút":"min"}`:""}</small></div>
                          <small class="${statusColor}">⏰ ${quizStatusText}</small>
                        </div>
                        ${score
                          ? `<span class="badge badge-${score.percentage>=(q.passingScore||60)?'success':'danger'} badge-lg">${score.percentage}%</span>`
                          : `<span class="badge badge-${locked?'secondary':'primary'}">${timeRestricted&&isEnrolled?'⛔':locked?'🔒':t.take}</span>`
                        }
                      </div>`;
                    }).join("")}
                  </div>`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderLesson(course, lesson, progress, lang) {
    const isCompleted = progress?.completedLessons?.includes(lesson.id);
    const t = lang === "vi" ? {
      back: "← Quay lại khóa học", markDone: "Đánh dấu hoàn thành",
      completed: "✓ Đã hoàn thành", material: "Tài liệu đính kèm", openDoc: "Mở tài liệu",
    } : {
      back: "← Back to course", markDone: "Mark as Complete",
      completed: "✓ Completed", material: "Attached Material", openDoc: "Open Document",
    };

    return `
      <div class="header bg-gradient-default pb-8 pt-5 pt-md-8">
        <div class="container-fluid">
          <button class="btn btn-sm btn-neutral mb-3" id="backToCourse">${t.back}</button>
          <p class="text-white mb-0" style="opacity:0.7">${course?.title || ""}</p>
          <h1 class="text-white">${lesson.title}</h1>
          <div class="d-flex" style="gap:0.5rem;">
            <span class="badge badge-default">${this._lessonTypeIcon(lesson.type)} ${lesson.type || 'lesson'}</span>
            ${lesson.duration ? `<span class="badge badge-default">⏱ ${lesson.duration}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="container-fluid mt--7">
        <div class="card shadow">
          <div class="card-body">
            ${lesson.videoUrl ? `
              <div class="video-container mb-4">${this._embedVideo(lesson.videoUrl)}</div>
            ` : ""}
            ${lesson.content ? `
              <div class="lesson-content-body">${this._parseContent(lesson.content)}</div>
            ` : ""}
            ${lesson.docUrl ? `
              <div class="mt-4 p-3 bg-secondary rounded">
                <h4>📄 ${t.material}</h4>
                <a href="${lesson.docUrl}" target="_blank" class="btn btn-sm btn-primary">${t.openDoc} ↗</a>
              </div>
            ` : ""}
            <div class="mt-4 text-center">
              <button class="btn btn-lg ${isCompleted ? 'btn-success' : 'btn-primary'}" id="markCompleteBtn" ${isCompleted ? 'disabled' : ''}>
                ${isCompleted ? t.completed : t.markDone}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── Private helpers ─────────────────────────────────────

  _courseCard(course, progress, lang) {
    const pct = this._calcProgress(course, progress);
    return `
      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card shadow h-100" data-course-id="${course.id}" style="cursor:pointer;">
          <div class="course-thumb">
            ${course.thumbnail ? `<img src="${course.thumbnail}" alt="${course.title}" />` : `<span>📚</span>`}
          </div>
          <div class="card-body d-flex flex-column">
            <h5 class="card-title mb-1">${course.title}</h5>
            <p class="text-muted small mb-2">${(course.description || "").slice(0, 80)}${course.description?.length > 80 ? "…" : ""}</p>
            <div class="d-flex justify-content-between align-items-center mt-auto">
              <small class="text-muted">📖 ${course.lessonCount || 0} ${lang === "vi" ? "bài" : "lessons"}</small>
              ${pct > 0 ? `<div class="progress" style="width:60px;height:6px;"><div class="progress-bar bg-success" style="width:${pct}%"></div></div>` : ""}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _courseCardFull(course, progress, isEnrolled, t, lang) {
    const pct = this._calcProgress(course, progress);
    const levelMap = { beginner: "success", intermediate: "warning", advanced: "danger" };
    const levelColor = levelMap[course.level] || "primary";

    return `
      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card shadow h-100" data-course-id="${course.id}" style="cursor:pointer;">
          <div class="course-thumb">
            ${course.thumbnail ? `<img src="${course.thumbnail}" alt="${course.title}" />` : `<span>📚</span>`}
          </div>
          <div class="card-body d-flex flex-column">
            ${course.category ? `<span class="badge badge-primary badge-sm mb-2 align-self-start">${course.category}</span>` : ""}
            <h5 class="card-title mb-1">${course.title}</h5>
            <p class="text-muted small mb-2">${(course.description || "").slice(0, 100)}${(course.description || "").length > 100 ? "…" : ""}</p>
            <div class="mt-auto">
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">📖 ${course.lessonCount || 0} ${lang === "vi" ? "bài" : "lessons"}</small>
                <span class="badge badge-${levelColor}">${course.level || "—"}</span>
              </div>
              ${isEnrolled
                ? `<div class="mt-2"><div class="progress" style="height:6px;"><div class="progress-bar bg-success" style="width:${pct}%"></div></div><small class="text-muted">${pct}%</small></div>`
                : `<button class="btn btn-sm btn-primary mt-2 btn-enroll" data-course-id="${course.id}">${t.enroll}</button>`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _calcProgress(course, progress) {
    if (!progress || !course?.lessonCount) return 0;
    return Math.round(((progress.completedLessons?.length || 0) / course.lessonCount) * 100);
  }

  _lessonTypeIcon(type) {
    return { video: "🎥", document: "📄", text: "📝", quiz: "📋" }[type] || "📖";
  }

  _embedVideo(url) {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) {
      return `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" allowfullscreen></iframe>`;
    }
    return `<video controls src="${url}" class="lesson-video"></video>`;
  }

  _parseContent(content) {
    return content
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/^([^<].+)$/gm, (m) => m.startsWith("<") ? m : `<p>${m}</p>`);
  }
}

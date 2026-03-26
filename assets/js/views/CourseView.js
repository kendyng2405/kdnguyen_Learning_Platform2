// ============================================================
//  CourseView.js — Course & Lesson Page Templates
// ============================================================

export class CourseView {

  renderDashboard(courses, allProgress, profile, lang) {
    const name = profile?.username || profile?.fullname || "Learner";
    const totalCourses   = courses.length;
    const enrolled       = allProgress.length;
    const completedCount = allProgress.filter(p => {
      const course = courses.find(c => c.id === p.courseId);
      if (!course) return false;
      return p.completedLessons?.length >= (course.lessonCount || 0) && course.lessonCount > 0;
    }).length;

    const t = lang === "vi" ? {
      greeting: `Chào mừng trở lại, ${name}! 👋`,
      sub: "Tiếp tục hành trình học tập của bạn",
      totalCourses: "Tổng khóa học",
      enrolled: "Đã đăng ký",
      completed: "Hoàn thành",
      recent: "Khóa học gần đây",
      allCourses: "Xem tất cả",
      noCourses: "Chưa có khóa học nào.",
      startLearning: "Bắt đầu học",
      continueLearn: "Tiếp tục",
      lessons: "bài học",
    } : {
      greeting: `Welcome back, ${name}! 👋`,
      sub: "Continue your learning journey",
      totalCourses: "Total Courses",
      enrolled: "Enrolled",
      completed: "Completed",
      recent: "Recent Courses",
      allCourses: "View All",
      noCourses: "No courses yet.",
      startLearning: "Start Learning",
      continueLearn: "Continue",
      lessons: "lessons",
    };

    const recentCourses = courses.slice(0, 4);

    return `
      <div class="dashboard-page">
        <div class="dashboard-hero">
          <div class="hero-content">
            <h1 class="hero-title animate-slide-up">${t.greeting}</h1>
            <p class="hero-sub animate-slide-up delay-1">${t.sub}</p>
          </div>
          <div class="hero-illustration animate-fade delay-2">🎓</div>
        </div>

        <div class="stats-grid animate-slide-up delay-2">
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div class="stat-value">${totalCourses}</div>
            <div class="stat-label">${t.totalCourses}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✏️</div>
            <div class="stat-value">${enrolled}</div>
            <div class="stat-label">${t.enrolled}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-value">${completedCount}</div>
            <div class="stat-label">${t.completed}</div>
          </div>
        </div>

        <div class="section animate-slide-up delay-3">
          <div class="section-header">
            <h2 class="section-title">${t.recent}</h2>
            <button class="btn btn--ghost btn--sm" onclick="window.__router.navigate('courses')">${t.allCourses} →</button>
          </div>
          ${recentCourses.length === 0
            ? `<div class="empty-state"><span>📭</span><p>${t.noCourses}</p></div>`
            : `<div class="courses-grid">
                ${recentCourses.map(c => this._courseCard(c, allProgress.find(p => p.courseId === c.id), lang)).join("")}
              </div>`
          }
        </div>
      </div>
    `;
  }

  renderCourseList(courses, progressMap, profile, lang) {
    const t = lang === "vi" ? {
      title: "Khóa học",
      sub: "Khám phá và học tập",
      enroll: "Đăng ký",
      enrolled: "Đã đăng ký",
      view: "Xem khóa học",
      noCourses: "Chưa có khóa học nào.",
      lessons: "bài học",
      level: { beginner: "Cơ bản", intermediate: "Trung cấp", advanced: "Nâng cao" },
    } : {
      title: "Courses",
      sub: "Explore and learn",
      enroll: "Enroll",
      enrolled: "Enrolled",
      view: "View Course",
      noCourses: "No courses available.",
      lessons: "lessons",
      level: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
    };

    return `
      <div class="courses-page">
        <div class="page-header animate-slide-up">
          <h1 class="page-title">${t.title}</h1>
          <p class="page-sub">${t.sub}</p>
        </div>
        ${courses.length === 0
          ? `<div class="empty-state animate-fade"><span>📭</span><p>${t.noCourses}</p></div>`
          : `<div class="courses-grid animate-slide-up delay-1">
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
      back: "← Quay lại",
      enroll: "Đăng ký khóa học",
      enrolled: "Đã đăng ký",
      lessons: "Bài học",
      quizzes: "Bài kiểm tra",
      progress: "Tiến độ",
      completed: "hoàn thành",
      noLessons: "Chưa có bài học.",
      noQuizzes: "Chưa có bài kiểm tra.",
      done: "✓",
      start: "Bắt đầu",
      take: "Làm bài",
    } : {
      back: "← Back",
      enroll: "Enroll Now",
      enrolled: "Enrolled",
      lessons: "Lessons",
      quizzes: "Quizzes",
      progress: "Progress",
      completed: "completed",
      noLessons: "No lessons yet.",
      noQuizzes: "No quizzes yet.",
      done: "✓",
      start: "Start",
      take: "Take Quiz",
    };

    const levelBadge = { beginner: "🟢", intermediate: "🟡", advanced: "🔴" }[course.level] || "📘";

    return `
      <div class="course-detail-page">
        <button class="btn btn--ghost btn--sm back-btn animate-fade" id="backToCourses">${t.back}</button>

        <div class="course-hero animate-slide-up">
          <div class="course-hero-thumb" style="background-image: url('${course.thumbnail || ""}')">
            ${!course.thumbnail ? `<span class="course-hero-emoji">📚</span>` : ""}
          </div>
          <div class="course-hero-info">
            <div class="course-meta-row">
              <span class="badge badge--level">${levelBadge} ${course.level || "—"}</span>
              ${course.category ? `<span class="badge badge--cat">${course.category}</span>` : ""}
            </div>
            <h1 class="course-detail-title">${course.title}</h1>
            <p class="course-detail-desc">${course.description || ""}</p>
            <div class="course-detail-stats">
              <span>📖 ${totalLessons} ${lang === "vi" ? "bài" : "lessons"}</span>
              <span>📝 ${quizzes.length} ${lang === "vi" ? "bài kiểm tra" : "quizzes"}</span>
            </div>
            ${isEnrolled
              ? `<div class="progress-wrap">
                  <div class="progress-label">${t.progress}: ${pct}% ${t.completed}</div>
                  <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
                </div>`
              : `<button class="btn btn--primary" id="enrollBtn">${t.enroll}</button>`
            }
          </div>
        </div>

        <div class="course-content-grid animate-slide-up delay-1">
          <div class="lessons-section">
            <h2 class="section-title">${t.lessons}</h2>
            ${lessons.length === 0
              ? `<p class="empty-text">${t.noLessons}</p>`
              : `<ul class="lesson-list">
                  ${lessons.map((l, i) => {
                    const done = completedLess.includes(l.id);
                    const locked = !isEnrolled;
                    return `<li class="lesson-item ${done ? 'lesson--done' : ''} ${locked ? 'lesson--locked' : ''}" data-lesson-id="${locked ? '' : l.id}">
                      <span class="lesson-num">${i + 1}</span>
                      <div class="lesson-info">
                        <span class="lesson-title">${l.title}</span>
                        <span class="lesson-meta">${this._lessonTypeIcon(l.type)} ${l.duration || ''}</span>
                      </div>
                      <span class="lesson-status">${done ? '✓' : locked ? '🔒' : '▶'}</span>
                    </li>`;
                  }).join("")}
                </ul>`
            }
          </div>

          <div class="quizzes-section">
            <h2 class="section-title">${t.quizzes}</h2>
            ${quizzes.length === 0
              ? `<p class="empty-text">${t.noQuizzes}</p>`
              : `<ul class="quiz-list">
                  ${quizzes.map(q => {
                    const score   = progress?.quizScores?.[q.id];
                    const locked  = !isEnrolled;
                    return `<li class="quiz-item ${locked ? 'quiz--locked' : ''}" data-quiz-id="${locked ? '' : q.id}">
                      <span class="quiz-icon">📝</span>
                      <div class="quiz-info">
                        <span class="quiz-title">${q.title}</span>
                        <span class="quiz-meta">${q.questions?.length || 0} ${lang === "vi" ? "câu" : "questions"} ${q.timeLimitMinutes ? `• ${q.timeLimitMinutes}${lang === "vi" ? " phút" : " min"}` : ""}</span>
                      </div>
                      ${score
                        ? `<span class="quiz-score ${score.percentage >= (q.passingScore || 60) ? 'score--pass' : 'score--fail'}">${score.percentage}%</span>`
                        : `<span class="quiz-btn">${locked ? '🔒' : t.take}</span>`
                      }
                    </li>`;
                  }).join("")}
                </ul>`
            }
          </div>
        </div>
      </div>
    `;
  }

  renderLesson(course, lesson, progress, lang) {
    const isCompleted = progress?.completedLessons?.includes(lesson.id);
    const t = lang === "vi" ? {
      back: "← Quay lại khóa học",
      markDone: "Đánh dấu hoàn thành",
      completed: "✓ Đã hoàn thành",
      material: "Tài liệu đính kèm",
      openDoc: "Mở tài liệu",
    } : {
      back: "← Back to course",
      markDone: "Mark as Complete",
      completed: "✓ Completed",
      material: "Attached Material",
      openDoc: "Open Document",
    };

    return `
      <div class="lesson-page">
        <div class="lesson-header animate-slide-up">
          <button class="btn btn--ghost btn--sm" id="backToCourse">${t.back}</button>
          <div class="lesson-breadcrumb">
            <span class="breadcrumb-course">${course?.title || ""}</span>
            <span> / </span>
            <span class="breadcrumb-lesson">${lesson.title}</span>
          </div>
        </div>

        <div class="lesson-body animate-slide-up delay-1">
          <h1 class="lesson-title">${lesson.title}</h1>
          <div class="lesson-meta-row">
            <span>${this._lessonTypeIcon(lesson.type)} ${lesson.type || 'lesson'}</span>
            ${lesson.duration ? `<span>⏱ ${lesson.duration}</span>` : ""}
          </div>

          ${lesson.videoUrl ? `
            <div class="video-container">
              ${this._embedVideo(lesson.videoUrl)}
            </div>
          ` : ""}

          ${lesson.content ? `
            <div class="lesson-content-body">
              ${this._parseContent(lesson.content)}
            </div>
          ` : ""}

          ${lesson.docUrl ? `
            <div class="doc-section">
              <h3>📄 ${t.material}</h3>
              <a href="${lesson.docUrl}" target="_blank" class="btn btn--outline">${t.openDoc} ↗</a>
            </div>
          ` : ""}

          <div class="lesson-actions">
            <button class="btn btn--primary btn--lg" id="markCompleteBtn" ${isCompleted ? 'disabled' : ''}>
              ${isCompleted ? t.completed : t.markDone}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Private helpers ─────────────────────────────────────

  _courseCard(course, progress, lang) {
    const pct = this._calcProgress(course, progress);
    return `
      <div class="course-card" data-course-id="${course.id}">
        <div class="course-card-thumb" style="background-image:url('${course.thumbnail || ""}')">
          ${!course.thumbnail ? `<span class="card-emoji">📚</span>` : ""}
        </div>
        <div class="course-card-body">
          <h3 class="course-card-title">${course.title}</h3>
          <p class="course-card-desc">${(course.description || "").slice(0, 80)}${course.description?.length > 80 ? "…" : ""}</p>
          <div class="course-card-footer">
            <span class="course-card-meta">📖 ${course.lessonCount || 0} ${lang === "vi" ? "bài" : "lessons"}</span>
            ${pct > 0 ? `<div class="mini-progress"><div style="width:${pct}%"></div></div>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  _courseCardFull(course, progress, isEnrolled, t, lang) {
    const pct       = this._calcProgress(course, progress);
    const levelMap  = { beginner: "🟢", intermediate: "🟡", advanced: "🔴" };
    const levelIcon = levelMap[course.level] || "📘";

    return `
      <div class="course-card course-card--full" data-course-id="${course.id}">
        <div class="course-card-thumb" style="background-image:url('${course.thumbnail || ""}')">
          ${!course.thumbnail ? `<span class="card-emoji">📚</span>` : ""}
          <span class="card-level-badge">${levelIcon}</span>
        </div>
        <div class="course-card-body">
          ${course.category ? `<span class="card-tag">${course.category}</span>` : ""}
          <h3 class="course-card-title">${course.title}</h3>
          <p class="course-card-desc">${(course.description || "").slice(0, 100)}${(course.description || "").length > 100 ? "…" : ""}</p>
          <div class="course-card-footer">
            <span class="course-card-meta">📖 ${course.lessonCount || 0} ${lang === "vi" ? "bài" : "lessons"}</span>
            ${isEnrolled
              ? `<div class="mini-progress-wrap"><div class="mini-progress"><div style="width:${pct}%"></div></div><span class="mini-pct">${pct}%</span></div>`
              : `<button class="btn btn--primary btn--sm btn-enroll" data-course-id="${course.id}">${t.enroll}</button>`
            }
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
    // YouTube embed
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (ytMatch) {
      return `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" allowfullscreen></iframe>`;
    }
    // Direct video
    return `<video controls src="${url}" class="lesson-video"></video>`;
  }

  _parseContent(content) {
    // Simple markdown-like parsing
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

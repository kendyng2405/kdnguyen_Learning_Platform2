// ============================================================
//  CourseView.js — Course & Lesson Page Templates (Argon Style)
// ============================================================

export class CourseView {

  renderDashboard(courses, allProgress, profile, lang) {
    const name = profile && profile.fullname ? profile.fullname.split(" ")[0] : "Bạn";
    const streak = profile?.streak || 0;
    const completedLessons = allProgress.reduce((sum, item) => (
      sum + (Array.isArray(item.completedLessons) ? item.completedLessons.length : 0)
    ), 0);
    const leaderboardGoal = 2;
    const leaderboardUnlocked = completedLessons >= leaderboardGoal;
    const leaderboardPct = Math.min(100, Math.round((completedLessons / leaderboardGoal) * 100));
    
    // Find the recommended course (first enrolled or first available)
    const recommended = this._pickRecommendedCourse(courses, profile);
    const courseTitle = recommended ? recommended.title : "";
    const courseLevel = recommended ? (recommended.level || "LEVEL 1").toUpperCase() : "";
    const courseThumb = recommended?.thumbnail || "";
    const startAction = recommended ? `window.__router.navigate('course', '${recommended.id}')` : "window.__router.navigate('courses')";
    const recommendedVisibility = recommended ? this._courseVisibility(recommended, lang) : null;
    
    const t = lang === "vi" ? {
      solve: "Giải thêm 3 bài tập để bắt đầu chuỗi ngày",
      leagues: leaderboardUnlocked ? "BẢNG XẾP HẠNG" : "MỞ KHÓA BẢNG XẾP HẠNG",
      leaderboardSub: `${completedLessons} / ${leaderboardGoal} bài học`,
      courseMeta: "Lộ trình học",
      lessons: "bài học",
      recommended: "ĐỀ XUẤT",
      start: "Bắt đầu",
      noCourseTitle: "Chưa có khóa học nào",
      noCourseSub: "Khi giảng viên tạo khóa học, khối đề xuất sẽ hiển thị tại đây.",
      browse: "Xem khóa học",
      days: ["T3", "T4", "T5", "T6", "T7"]
    } : {
      solve: "Solve 3 problems to start a streak",
      leagues: leaderboardUnlocked ? "LEADERBOARD" : "UNLOCK LEADERBOARD",
      leaderboardSub: `${completedLessons} / ${leaderboardGoal} lessons`,
      courseMeta: "Learning path",
      lessons: "lessons",
      recommended: "RECOMMENDED",
      start: "Start",
      noCourseTitle: "No courses yet",
      noCourseSub: "When teachers create courses, recommendations will appear here.",
      browse: "Browse courses",
      days: ["T", "W", "Th", "F", "S"]
    };

    return `
      <div class="container-fluid mt-5 brilliant-bg" style="min-height: 90vh;">
        <div class="row pt-4">
          
          <!-- LEFT COLUMN: STATS & STREAK -->
          <div class="col-lg-4 mb-4">
            
            <!-- Streak Card -->
            <div class="brilliant-card mb-4">
              <div class="d-flex align-items-center mb-3">
                <h1 class="display-3 font-weight-bold mb-0 mr-2" style="line-height: 1;">${streak}</h1>
                <i class="fas fa-bolt text-warning" style="font-size: 2rem; opacity: 0.5;"></i>
              </div>
              <p class="text-dark font-weight-bold mb-4">${t.solve}</p>
              
              <div class="d-flex justify-content-between text-center px-2">
                ${t.days.map((d, i) => `
                  <div>
                    <div class="brilliant-streak-day ${i === 0 && streak > 0 ? 'active' : ''} mb-2">
                      <i class="fas fa-bolt ${i === 0 && streak > 0 ? '' : 'text-light'}"></i>
                    </div>
                    <small class="text-muted font-weight-bold">${d}</small>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Leaderboard Card -->
            <div class="brilliant-card dashboard-leaderboard-card ${leaderboardUnlocked ? 'is-unlocked' : 'is-locked'}" onclick="${leaderboardUnlocked ? "window.__router.navigate('leaderboard')" : "window.__toast.info(window.__i18n.current === 'vi' ? 'Hoàn thành 2 bài học để mở khóa bảng xếp hạng.' : 'Complete 2 lessons to unlock the leaderboard.')"}">
              <div class="icon icon-shape ${leaderboardUnlocked ? 'bg-success text-white' : 'bg-secondary text-dark'} rounded-circle mr-3" style="width: 50px; height: 50px;">
                <i class="fas ${leaderboardUnlocked ? 'fa-trophy' : 'fa-lock'}"></i>
              </div>
              <div class="flex-grow-1">
                <h5 class="text-muted font-weight-bold mb-1" style="letter-spacing: 0.5px;">${t.leagues}</h5>
                <p class="text-dark mb-2 font-weight-bold">${t.leaderboardSub}</p>
                <div class="leaderboard-unlock-track"><span style="width:${leaderboardPct}%"></span></div>
              </div>
            </div>
            
          </div>
          
          <!-- RIGHT COLUMN: RECOMMENDED COURSE -->
          <div class="col-lg-8">
            <div class="brilliant-card text-center p-5">
              ${recommended ? `
              <span class="brilliant-recommended-badge text-uppercase mb-3 d-inline-block">${t.recommended}</span>
              <h2 class="display-4 font-weight-bold mb-1 text-dark">${courseTitle}</h2>
              <p class="text-muted font-weight-bold text-uppercase mb-4" style="letter-spacing: 1px;">${courseLevel}</p>
              
              <div class="brilliant-course-thumb mx-auto mb-4" style="max-width: 250px;">
                ${courseThumb ? `<img src="${courseThumb}" alt="Course" class="img-fluid" />` : `<div class="course-thumb-placeholder"><i class="fas fa-book-open"></i></div>`}
              </div>
              
              <div class="dashboard-course-meta mb-4">
                <span><i class="fas fa-route mr-2 text-success"></i>${recommended?.category || t.courseMeta}</span>
                <span><i class="fas fa-book-open mr-2 text-info"></i>${recommended?.lessonCount || 0} ${t.lessons}</span>
                <span class="course-visibility-pill ${recommendedVisibility.className}"><i class="fas ${recommendedVisibility.icon} mr-2"></i>${recommendedVisibility.label}</span>
                <span><i class="fas fa-users mr-2 text-primary"></i>${recommended?.enrolledCount || 0} ${lang === "vi" ? "người học" : "learners"}</span>
              </div>
              
              <button class="brilliant-btn-gradient btn-block btn-lg shadow" onclick="${startAction}">
                ${t.start}
              </button>
              ` : `
              <div class="dashboard-empty-course">
                <span><i class="fas fa-book-open"></i></span>
                <h2>${t.noCourseTitle}</h2>
                <p>${t.noCourseSub}</p>
                <button class="btn btn-primary" onclick="${startAction}">${t.browse}</button>
              </div>
              `}
            </div>
          </div>
          
        </div>
      </div>
    `;
  }

  renderCourseList(courses, progressMap, profile, lang) {
    const t = lang === "vi" ? {
      title: "Khám phá khóa học", sub: "Mở rộng kiến thức của bạn với các khóa học chất lượng cao.",
      enroll: "Đăng ký", enrolled: "Đã đăng ký", view: "Xem khóa học",
      noCourses: "Chưa có khóa học nào.", lessons: "bài học",
      level: { beginner: "Cơ bản", intermediate: "Trung cấp", advanced: "Nâng cao" },
    } : {
      title: "Explore Courses", sub: "Expand your knowledge with high-quality courses.",
      enroll: "Enroll", enrolled: "Enrolled", view: "View Course",
      noCourses: "No courses available.", lessons: "lessons",
      level: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
    };

    return `
      <div class="container-fluid mt-5 brilliant-bg" style="min-height: 90vh;">
        <div class="row pt-4 px-lg-4">
          <div class="col-12 mb-4 text-center">
            <h1 class="display-3 font-weight-bold text-dark mb-2">${t.title}</h1>
            <p class="text-muted" style="font-size: 1.2rem;">${t.sub}</p>
          </div>
        </div>
        <div class="row px-lg-4 pb-5">
          ${courses.length === 0
            ? `<div class="col-12"><div class="brilliant-card text-center py-5"><p class="text-muted">${t.noCourses}</p></div></div>`
            : courses.map(c => {
                const progress = progressMap[c.id];
                const isEnrolled = this._isCourseEnrolled(c.id, progress, profile);
                return this._courseCardFull(c, progress, isEnrolled, t, lang);
              }).join("")
          }
        </div>
      </div>
    `;
  }

  renderCourseDetail(course, lessons, quizzes, progress, profile, lang) {
    const isEnrolled    = this._isCourseEnrolled(course.id, progress, profile);
    const completedLess = progress?.completedLessons || [];
    const totalLessons  = lessons.length;
    const totalExercises = quizzes.length;
    const courseCompleted = isEnrolled && totalLessons > 0 && completedLess.length >= totalLessons;
    const visibility = this._courseVisibility(course, lang);
    
    // Determine active lesson
    let activeLessonIdx = lessons.findIndex(l => !completedLess.includes(l.id));
    if (activeLessonIdx === -1 && lessons.length > 0) activeLessonIdx = lessons.length - 1; // all completed
    if (activeLessonIdx === -1) activeLessonIdx = 0; // no lessons
    
    const t = lang === "vi" ? {
      lessons: "Bài học", exercises: "Bài tập", start: "Bắt đầu",
      enroll: "Đăng ký để học", locked: "Khóa", level: "CẤP ĐỘ",
      intro: "Giới thiệu", plan: "Kế hoạch AI", certificate: "Nhận chứng chỉ"
    } : {
      lessons: "Lessons", exercises: "Exercises", start: "Start",
      enroll: "Enroll to Learn", locked: "Locked", level: "LEVEL",
      intro: "Introduction", plan: "AI Study Plan", certificate: "Get certificate"
    };

    return `
      <div class="container-fluid mt-5 brilliant-bg" style="min-height: 90vh;">
        <button class="btn btn-sm btn-neutral mb-4 ml-3 shadow-sm" id="backToCourses"><i class="fas fa-arrow-left"></i></button>
        <div class="row px-lg-4">
          
          <!-- LEFT COLUMN: COURSE INFO -->
          <div class="col-lg-4 mb-4">
            <div class="brilliant-card" style="position: sticky; top: 100px;">
              <div class="brilliant-course-thumb mb-4" style="max-width: 100px; box-shadow: none;">
                ${course.thumbnail
                  ? `<img src="${course.thumbnail}" alt="Course" class="img-fluid" />`
                  : `<div class="course-thumb-placeholder course-thumb-placeholder--sm"><i class="fas fa-book-open"></i></div>`}
              </div>
              <div class="course-detail-heading">
                <h2 class="font-weight-bold text-dark mb-0">${course.title}</h2>
                <span class="course-visibility-pill ${visibility.className}"><i class="fas ${visibility.icon} mr-2"></i>${visibility.label}</span>
              </div>
              <p class="text-muted mb-4" style="font-size: 1.05rem; line-height: 1.6;">${course.description || ""}</p>
              
              <div class="d-flex align-items-center text-muted font-weight-bold" style="gap: 1.5rem;">
                <div><i class="fas fa-layer-group mr-2 text-dark"></i>${totalLessons} ${t.lessons}</div>
                <div><i class="fas fa-dumbbell mr-2 text-dark"></i>${totalExercises} ${t.exercises}</div>
                <div><i class="fas fa-users mr-2 text-dark"></i>${course.enrolledCount || 0}</div>
              </div>
              
              ${!isEnrolled ? `
                <button class="brilliant-btn-gradient btn-block mt-4" id="enrollBtn">${t.enroll}</button>
              ` : `
                <button class="btn btn-outline-info btn-block mt-4 font-weight-bold" id="btnStudyPlan" data-course="${course.title}">
                  <i class="fas fa-magic mr-2"></i> ${t.plan}
                </button>
                ${courseCompleted ? `
                  <button class="btn btn-outline-success btn-block mt-3 font-weight-bold" onclick="window.__router.navigate('certificate', '${course.id}')">
                    <i class="fas fa-award mr-2"></i> ${t.certificate}
                  </button>
                ` : ""}
              `}
            </div>
          </div>
          
          <!-- RIGHT COLUMN: LEARNING PATH -->
          <div class="col-lg-8">
            <div class="brilliant-path-container">
              
              <div class="brilliant-level-badge shadow-sm">
                <span class="text-uppercase" style="color: #9b51e0; font-weight: 800; font-size: 0.75rem; letter-spacing: 1px;">${t.level} 1</span>
                <h4 class="mb-0 text-dark font-weight-bold mt-1">${t.intro}</h4>
              </div>
              
              ${lessons.map((l, i) => {
                const isCompleted = completedLess.includes(l.id);
                const isActive = (i === activeLessonIdx) && isEnrolled;
                const isLocked = !isEnrolled || (i > activeLessonIdx);
                
                let nodeClass = "locked";
                let iconHtml = '<i class="fas fa-lock" style="font-size:1.5rem;"></i>';
                
                if (isCompleted) {
                  nodeClass = "completed";
                  iconHtml = '<i class="fas fa-check" style="font-size:2rem;"></i>';
                } else if (isActive) {
                  nodeClass = "active";
                  iconHtml = '<i class="fas fa-play" style="font-size:2rem;"></i>';
                } else if (isEnrolled && !isLocked) {
                  nodeClass = "";
                  iconHtml = '<i class="fas fa-play" style="color:#94a3b8; font-size:1.5rem;"></i>';
                }

                return `
                  <div class="brilliant-node-wrapper">
                    <!-- The visual node -->
                    <div class="brilliant-node ${nodeClass}" data-lesson-id="${isLocked ? '' : l.id}" style="cursor:${isLocked?'not-allowed':'pointer'}">
                      ${iconHtml}
                    </div>
                    
                    ${!isActive ? `
                      <div class="brilliant-node-title ${isLocked ? 'text-muted' : ''}">${l.title}</div>
                    ` : ''}
                    
                    <!-- Popover for active node -->
                    ${isActive ? `
                      <div class="brilliant-node-active-popover">
                        <h4 class="font-weight-bold text-dark mb-3">${l.title}</h4>
                        <button class="brilliant-btn-gradient btn-block" data-lesson-id="${l.id}">
                          ${t.start}
                        </button>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join("")}
              
              ${lessons.length === 0 ? `<p class="text-muted">${t.noLessons || 'No lessons.'}</p>` : ''}
              
              ${quizzes.length > 0 ? `
                <div class="brilliant-level-badge shadow-sm mt-5">
                  <span class="text-uppercase" style="color: #f5365c; font-weight: 800; font-size: 0.75rem; letter-spacing: 1px;">TEST</span>
                  <h4 class="mb-0 text-dark font-weight-bold mt-1">Quizzes</h4>
                </div>
                
                ${quizzes.map((q, i) => {
                  const score = progress?.quizScores?.[q.id];
                  const isCompleted = score && score.percentage >= (q.passingScore || 60);
                  
                  const now = new Date();
                  const openDate = q.openTime ? new Date(q.openTime) : null;
                  const closeDate = q.closeTime ? new Date(q.closeTime) : null;
                  
                  const notOpenYet = openDate && now < openDate;
                  const closed = closeDate && now > closeDate;
                  const timeRestricted = notOpenYet || closed;
                  
                  const isLocked = !isEnrolled || timeRestricted;
                  
                  let nodeClass = "locked";
                  let iconHtml = '<i class="fas fa-lock" style="font-size:1.5rem;"></i>';
                  let subtext = '';
                  
                  if (notOpenYet) {
                     subtext = `<div class="text-warning small mt-1 font-weight-bold" style="font-size:0.75rem;">⏰ ${lang === 'vi' ? 'Mở lúc' : 'Opens'}: ${openDate.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}</div>`;
                  } else if (closed) {
                     subtext = `<div class="text-danger small mt-1 font-weight-bold" style="font-size:0.75rem;">⛔ ${lang === 'vi' ? 'Đã đóng lúc' : 'Closed at'}: ${closeDate.toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}</div>`;
                  }
                  
                  if (isCompleted) {
                    nodeClass = "completed";
                    iconHtml = '<i class="fas fa-check" style="font-size:2rem;"></i>';
                  } else if (!isLocked) {
                    nodeClass = "active";
                    iconHtml = '<i class="fas fa-clipboard-list" style="font-size:2rem;"></i>';
                  }

                  return `
                    <div class="brilliant-node-wrapper">
                      <div class="brilliant-node ${nodeClass}" data-quiz-id="${q.id}" style="cursor:pointer" title="${notOpenYet ? 'Chưa mở' : closed ? 'Đã đóng' : ''}">
                        ${iconHtml}
                      </div>
                      
                      ${isCompleted ? `
                        <div class="brilliant-node-title text-success">${q.title} - ${score.percentage}%</div>
                      ` : `
                        <div class="brilliant-node-title ${isLocked ? 'text-muted' : ''}">${q.title}</div>
                      `}
                      ${subtext}
                      
                      ${!isLocked && !isCompleted ? `
                        <div class="brilliant-node-active-popover">
                          <h4 class="font-weight-bold text-dark mb-3">${q.title}</h4>
                          <button class="brilliant-btn-gradient-orange btn-block" data-quiz-id="${q.id}">
                            ${t.start}
                          </button>
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join("")}
              ` : ''}
              
            </div>
          </div>
          
        </div>
      </div>
    `;
  }

  renderLesson(course, lesson, progress, lang, navigation = {}) {
    const isCompleted = progress?.completedLessons?.includes(lesson.id);
    const preparedLesson = this._prepareLessonContent(lesson, lang);
    const nextLesson = navigation.nextLesson || null;
    const t = lang === "vi" ? {
      back: "← Quay lại khóa học", markDone: "Đánh dấu hoàn thành",
      completed: "✓ Đã hoàn thành", material: "Tài liệu đính kèm", openDoc: "Mở tài liệu",
      next: "Bài tiếp theo", finishNext: "Hoàn thành & sang bài tiếp",
    } : {
      back: "← Back to course", markDone: "Mark as Complete",
      completed: "✓ Completed", material: "Attached Material", openDoc: "Open Document",
      next: "Next lesson", finishNext: "Complete & next lesson",
    };

    return `
      <div class="header bg-gradient-default pb-8">
        <div class="container-fluid">
          <button class="btn btn-sm btn-neutral mb-3" id="backToCourse">${t.back}</button>
          <p class="text-white mb-0" style="opacity:0.7">${course?.title || ""}</p>
          <h1 class="text-white">${lesson.title}</h1>
          <div class="lesson-header-meta">
            <span class="lesson-meta-badge">${this._lessonTypeIcon(lesson.type)} ${lesson.type || 'lesson'}</span>
            ${lesson.duration ? `<span class="lesson-meta-badge">⏱ ${lesson.duration}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="container-fluid mt--7">
        <div class="card shadow">
          <div class="card-body">
            ${lesson.videoUrl ? `
              <div class="video-container mb-4">${this._embedVideo(lesson.videoUrl)}</div>
            ` : ""}
            ${preparedLesson.content ? `
              <div class="lesson-content-body">${this._parseContent(preparedLesson.content)}</div>
            ` : ""}
            ${preparedLesson.miniQuiz.length ? this._renderLessonMiniQuiz(preparedLesson.miniQuiz, lang) : ""}
            ${preparedLesson.contentAfter ? `
              <div class="lesson-content-body lesson-content-body--after-quiz">${this._parseContent(preparedLesson.contentAfter)}</div>
            ` : ""}
            ${lesson.docUrl ? `
              <div class="mt-4 p-3 bg-secondary rounded">
                <h4>📄 ${t.material}</h4>
                <a href="${lesson.docUrl}" target="_blank" class="btn btn-sm btn-primary">${t.openDoc} ↗</a>
              </div>
            ` : ""}
            <div class="lesson-actions-bar mt-4">
              <button class="btn btn-lg ${isCompleted ? 'btn-success' : 'btn-primary'}" id="markCompleteBtn" ${isCompleted ? 'disabled' : ''}>
                ${isCompleted ? t.completed : t.markDone}
              </button>
              ${nextLesson ? `
                <button class="btn btn-lg btn-outline-primary" id="nextLessonBtn" data-next-lesson-id="${this._attr(nextLesson.id)}">
                  <i class="fas fa-arrow-right mr-2"></i>${isCompleted ? t.next : t.finishNext}
                </button>
              ` : ""}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── Private helpers ─────────────────────────────────────

  _courseCard(course, progress, lang) {
    const pct = this._calcProgress(course, progress);
    const visibility = this._courseVisibility(course, lang);
    return `
      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card shadow h-100" data-course-id="${course.id}" style="cursor:pointer;">
          <div class="course-thumb">
            ${course.thumbnail ? `<img src="${course.thumbnail}" alt="${course.title}" />` : `<span>📚</span>`}
          </div>
          <div class="card-body d-flex flex-column">
            <div class="course-card-meta-row mb-2">
              <span class="course-visibility-pill ${visibility.className}"><i class="fas ${visibility.icon} mr-2"></i>${visibility.label}</span>
            </div>
            <h5 class="card-title mb-1">${course.title}</h5>
            <p class="text-muted small mb-2">${(course.description || "").slice(0, 80)}${course.description?.length > 80 ? "…" : ""}</p>
            <div class="d-flex justify-content-between align-items-center mt-auto">
              <small class="text-muted">📖 ${course.lessonCount || 0} ${lang === "vi" ? "bài" : "lessons"} · <i class="fas fa-users"></i> ${course.enrolledCount || 0}</small>
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
    const visibility = this._courseVisibility(course, lang);

    return `
      <div class="col-xl-3 col-lg-6 mb-4">
        <div class="card shadow h-100" data-course-id="${course.id}" style="cursor:pointer;">
          <div class="course-thumb">
            ${course.thumbnail ? `<img src="${course.thumbnail}" alt="${course.title}" />` : `<span>📚</span>`}
          </div>
          <div class="card-body d-flex flex-column">
            <div class="course-card-meta-row mb-2">
              ${course.category ? `<span class="badge badge-primary badge-sm">${course.category}</span>` : "<span></span>"}
              <span class="course-visibility-pill ${visibility.className}"><i class="fas ${visibility.icon} mr-2"></i>${visibility.label}</span>
            </div>
            <h5 class="card-title mb-1">${course.title}</h5>
            <p class="text-muted small mb-2">${(course.description || "").slice(0, 100)}${(course.description || "").length > 100 ? "…" : ""}</p>
            <div class="mt-auto">
              <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">📖 ${course.lessonCount || 0} ${lang === "vi" ? "bài" : "lessons"} · <i class="fas fa-users"></i> ${course.enrolledCount || 0}</small>
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

  _courseVisibility(course, lang) {
    const visibility = String(course?.visibility || course?.privacy || course?.access || "").toLowerCase();
    const hasPassword = !!String(course?.password || "").trim();
    const explicitPrivate = course?.isPrivate === true
      || course?.private === true
      || course?.isPublic === false
      || ["private", "locked", "restricted", "hidden"].includes(visibility);
    const isPrivate = hasPassword || explicitPrivate;

    return {
      isPrivate,
      icon: isPrivate ? "fa-lock" : "fa-globe",
      className: isPrivate ? "is-private" : "is-public",
      label: lang === "vi"
        ? (isPrivate ? "Riêng tư" : "Công khai")
        : (isPrivate ? "Private" : "Public"),
    };
  }

  _isCourseEnrolled(courseId, progress, profile) {
    const enrolledCourses = Array.isArray(profile?.enrolledCourses) ? profile.enrolledCourses : [];
    const listedInProfile = enrolledCourses.some(item => (
      item === courseId || item?.id === courseId || item?.courseId === courseId
    ));
    return listedInProfile || progress?.enrollmentSource === "course_enroll";
  }

  _calcProgress(course, progress) {
    if (!progress || !course?.lessonCount) return 0;
    return Math.round(((progress.completedLessons?.length || 0) / course.lessonCount) * 100);
  }

  _pickRecommendedCourse(courses, profile) {
    if (!courses.length) return null;
    const keywords = profile?.learningPreferences?.keywords || "";
    if (!keywords) return courses[0];
    const words = keywords.split(/\s+/).filter(Boolean);
    return [...courses].sort((a, b) => this._courseMatchScore(b, words) - this._courseMatchScore(a, words))[0] || courses[0];
  }

  _courseMatchScore(course, words) {
    const text = `${course.title || ""} ${course.category || ""} ${course.description || ""}`.toLowerCase();
    return words.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);
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

  _prepareLessonContent(lesson, lang) {
    const sourceContent = String(lesson?.content || "");
    const storedQuiz = this._normalizeMiniQuiz(lesson?.miniQuiz || lesson?.videoQuiz || lesson?.lessonQuiz || [], lang);
    const markerSplit = this._splitMiniQuizMarker(sourceContent);
    if (storedQuiz.length) {
      return {
        content: markerSplit ? markerSplit.before : sourceContent,
        contentAfter: markerSplit ? markerSplit.after : "",
        miniQuiz: storedQuiz,
      };
    }

    const extracted = this._extractLessonMiniQuiz(sourceContent, lang);
    return {
      content: extracted.questions.length ? extracted.before : sourceContent,
      contentAfter: extracted.questions.length ? extracted.after : "",
      miniQuiz: extracted.questions,
    };
  }

  _splitMiniQuizMarker(content) {
    const marker = "<!-- lesson-mini-quiz -->";
    const index = String(content || "").indexOf(marker);
    if (index < 0) return null;
    return {
      before: content.slice(0, index).trim(),
      after: content.slice(index + marker.length).trim(),
    };
  }

  _renderLessonMiniQuiz(questions, lang) {
    const t = lang === "vi" ? {
      kicker: "Mini quiz",
      title: "Kiểm tra nhanh sau video",
      sub: "Chọn đáp án để tự kiểm tra xem bạn đã nắm ý chính chưa.",
      question: "Câu",
      correct: "Chính xác",
      wrong: "Chưa đúng",
      correctAnswer: "Đáp án đúng",
    } : {
      kicker: "Mini quiz",
      title: "Quick check after the video",
      sub: "Pick an answer to check whether you caught the main idea.",
      question: "Question",
      correct: "Correct",
      wrong: "Not quite",
      correctAnswer: "Correct answer",
    };

    return `
      <section class="lesson-mini-quiz" id="lessonMiniQuiz">
        <div class="lesson-mini-quiz-head">
          <span><i class="fas fa-circle-question mr-2"></i>${t.kicker}</span>
          <h2>${t.title}</h2>
          <p>${t.sub}</p>
        </div>
        <div class="lesson-mini-quiz-list">
          ${questions.map((question, questionIndex) => {
            const correctIndex = this._safeCorrectIndex(question);
            const correctText = question.options?.[correctIndex] || "";
            return `
              <article class="lesson-mini-quiz-card" data-mini-quiz-question="${questionIndex}">
                <div class="lesson-mini-quiz-number">${t.question} ${questionIndex + 1}</div>
                <h3>${this._escape(question.question)}</h3>
                <div class="lesson-mini-quiz-options">
                  ${(question.options || []).map((option, optionIndex) => `
                    <button
                      type="button"
                      class="lesson-mini-quiz-option"
                      data-mini-quiz-option
                      data-question-index="${questionIndex}"
                      data-option-index="${optionIndex}"
                      data-correct="${optionIndex === correctIndex ? "true" : "false"}"
                    >
                      <span>${String.fromCharCode(65 + optionIndex)}</span>
                      <strong>${this._escape(option)}</strong>
                    </button>
                  `).join("")}
                </div>
                <div class="lesson-mini-quiz-feedback" data-mini-quiz-feedback="${questionIndex}" data-correct-label="${this._attr(correctText)}">
                  <strong data-mini-quiz-feedback-title></strong>
                  <p data-mini-quiz-feedback-text></p>
                </div>
              </article>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  _extractLessonMiniQuiz(content, lang) {
    const source = String(content || "").replace(/\r/g, "\n");
    const block = this._findLessonMiniQuizBlock(source);
    if (!block) return { content: source.trim(), questions: [] };

    const questions = this._parseLessonMiniQuizBlock(block.text, lang);
    if (!questions.length) return { content: source.trim(), questions: [] };

    const before = source.slice(0, block.start).trim();
    const after = source.slice(block.end).trim();
    return {
      content: [before, after].filter(Boolean).join("\n\n").trim(),
      before,
      after,
      questions,
    };
  }

  _findLessonMiniQuizBlock(content) {
    const lines = content.split("\n");
    let offset = 0;
    let startLine = -1;
    let startOffset = 0;

    for (let i = 0; i < lines.length; i += 1) {
      if (this._isMiniQuizHeading(lines[i])) {
        startLine = i;
        startOffset = offset;
        break;
      }
      offset += lines[i].length + 1;
    }

    if (startLine < 0) return null;

    let endLine = lines.length;
    for (let i = startLine + 1; i < lines.length; i += 1) {
      if (this._isPostMiniQuizHeading(lines[i])) {
        endLine = i;
        break;
      }
    }

    const endOffset = lines.slice(0, endLine).join("\n").length + (endLine < lines.length ? 1 : 0);
    return {
      start: startOffset,
      end: endOffset,
      text: lines.slice(startLine, endLine).join("\n"),
    };
  }

  _isMiniQuizHeading(line) {
    const normalized = this._normalizeText(line)
      .replace(/^#+\s*/, "")
      .replace(/^\d+[\.)]\s*/, "")
      .trim();
    return normalized.length <= 90
      && /(mini quiz|quiz mini|cau hoi trac nghiem|trac nghiem|multiple choice|quick check)/.test(normalized);
  }

  _isPostMiniQuizHeading(line) {
    const normalized = this._normalizeText(line)
      .replace(/^#+\s*/, "")
      .replace(/^\d+[\.)]\s*/, "")
      .trim();
    return normalized.length <= 100
      && /(flashcard|the ghi nho|ghi nho|ket luan|conclusion|tai lieu|references|bai tap|assignment)/.test(normalized);
  }

  _parseLessonMiniQuizBlock(block, lang) {
    const questions = [];
    let current = null;

    const commit = () => {
      if (!current) return;
      const options = current.options.filter(Boolean).slice(0, 4);
      const correctAnswer = Number.isInteger(current.correctAnswer) ? current.correctAnswer : 0;
      if (current.question.length >= 8 && options.length >= 2 && correctAnswer >= 0 && correctAnswer < options.length) {
        questions.push({
          id: `mini_${questions.length + 1}`,
          type: "multiple_choice",
          question: current.question,
          options,
          correctAnswer,
          explanation: current.explanation || "",
        });
      }
      current = null;
    };

    block.split("\n").forEach(rawLine => {
      const line = this._cleanQuizLine(rawLine);
      if (!line || this._isMiniQuizHeading(line)) return;

      const answerMatch = line.match(/(?:đáp án đúng|đáp án|dap an dung|dap an|correct answer|answer)\s*[:：]?\s*([a-d])/i);
      if (answerMatch && current) {
        current.correctAnswer = answerMatch[1].toLowerCase().charCodeAt(0) - 97;
        const explanation = line.replace(answerMatch[0], "").replace(/^[\s:：.)-]+/, "").trim();
        if (explanation) current.explanation = explanation;
        return;
      }

      const optionMatch = line.match(/^(?:[-*]\s*)?([a-dA-D])[\).:-]\s*(.+)$/);
      if (optionMatch && current) {
        current.options[optionMatch[1].toLowerCase().charCodeAt(0) - 97] = this._cleanQuizText(optionMatch[2]);
        return;
      }

      const questionMatch = line.match(/^(?:[-*]\s*)?(?:câu|cau)?\s*(\d+)[\).]\s*(.+)$/i);
      if (questionMatch) {
        commit();
        current = {
          question: this._cleanQuizText(questionMatch[2]),
          options: [],
          correctAnswer: null,
          explanation: "",
        };
        return;
      }

      if (current && !current.options.length) {
        current.question = this._cleanQuizText(`${current.question} ${line}`);
      }
    });

    commit();
    return this._normalizeMiniQuiz(questions, lang);
  }

  _normalizeMiniQuiz(questions, lang) {
    if (!Array.isArray(questions)) return [];
    return questions.map((question, index) => {
      const options = Array.isArray(question.options)
        ? question.options.map(option => this._cleanQuizText(option)).filter(Boolean).slice(0, 4)
        : [];
      const correctAnswer = this._safeCorrectIndex({ ...question, options });
      return {
        id: question.id || `mini_${index + 1}`,
        type: "multiple_choice",
        question: this._cleanQuizText(question.question || question.q || ""),
        options,
        correctAnswer,
        explanation: this._cleanQuizText(question.explanation || ""),
      };
    }).filter(question => question.question.length >= 8 && question.options.length >= 2);
  }

  _safeCorrectIndex(question) {
    const options = Array.isArray(question.options) ? question.options : [];
    if (typeof question.correctAnswer === "number" && question.correctAnswer >= 0 && question.correctAnswer < options.length) {
      return question.correctAnswer;
    }
    const raw = String(question.correctAnswer ?? question.answer ?? "").trim();
    if (/^[a-d]$/i.test(raw)) return raw.toLowerCase().charCodeAt(0) - 97;
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed < options.length) return parsed;
    const matched = options.findIndex(option => this._normalizeText(option) === this._normalizeText(raw));
    return matched >= 0 ? matched : 0;
  }

  _cleanQuizLine(line) {
    return this._cleanQuizText(line)
      .replace(/^#{1,4}\s*/, "")
      .replace(/^>\s*/, "")
      .trim();
  }

  _cleanQuizText(value) {
    return String(value ?? "")
      .replace(/&nbsp;/g, " ")
      .replace(/[*_`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  _normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đ]/g, "d")
      .replace(/\s+/g, " ")
      .trim();
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

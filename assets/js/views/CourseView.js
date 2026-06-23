// ============================================================
//  CourseView.js — Course & Lesson Page Templates (Argon Style)
// ============================================================

export class CourseView {

  renderDashboard(courses, allProgress, profile, lang) {
    const name = profile && profile.fullname ? profile.fullname.split(" ")[0] : "Bạn";
    const streak = profile?.streak || 0;
    
    // Find the recommended course (first enrolled or first available)
    const recommended = courses.length > 0 ? courses[0] : null;
    const courseTitle = recommended ? recommended.title : "Introduction to Programming";
    const courseLevel = recommended ? (recommended.level || "LEVEL 1").toUpperCase() : "LEVEL 1";
    const courseThumb = recommended && recommended.thumbnail ? recommended.thumbnail : "https://cdn-icons-png.flaticon.com/512/4144/4144682.png";
    
    const t = lang === "vi" ? {
      solve: "Giải thêm 3 bài tập để bắt đầu chuỗi ngày",
      premiumTitle: "Mở khóa toàn bộ tính năng Premium",
      premiumSub: "để học thông minh hơn, nhanh hơn",
      premiumBtn: "Khám phá Premium",
      leagues: "MỞ KHÓA BẢNG XẾP HẠNG",
      recommended: "ĐỀ XUẤT",
      start: "Bắt đầu",
      days: ["T3", "T4", "T5", "T6", "T7"]
    } : {
      solve: "Solve 3 problems to start a streak",
      premiumTitle: "Unlock all learning with Premium",
      premiumSub: "to get smarter, faster",
      premiumBtn: "Explore Premium",
      leagues: "UNLOCK LEAGUES",
      recommended: "RECOMMENDED",
      start: "Start",
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

            <!-- Premium Card -->
            <div class="brilliant-card mb-4 text-center" style="background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);">
              <div class="d-flex align-items-center justify-content-center mb-2">
                <i class="fas fa-gem text-info mr-2" style="font-size: 1.5rem;"></i>
                <h4 class="mb-0 font-weight-bold">${t.premiumTitle}</h4>
              </div>
              <p class="text-muted mb-4">${t.premiumSub}</p>
              <button class="brilliant-btn-gradient-orange w-100 shadow-sm" onclick="window.__router.navigate('courses')">${t.premiumBtn}</button>
            </div>

            <!-- Leagues Card -->
            <div class="brilliant-card d-flex align-items-center">
              <div class="icon icon-shape bg-secondary text-dark rounded-circle mr-3" style="width: 50px; height: 50px;">
                <i class="fas fa-lock"></i>
              </div>
              <div>
                <h5 class="text-muted font-weight-bold mb-1" style="letter-spacing: 0.5px;">${t.leagues}</h5>
                <p class="text-dark mb-0 font-weight-bold">0 of 175 XP</p>
              </div>
            </div>
            
          </div>
          
          <!-- RIGHT COLUMN: RECOMMENDED COURSE -->
          <div class="col-lg-8">
            <div class="brilliant-card text-center p-5">
              <span class="brilliant-recommended-badge text-uppercase mb-3 d-inline-block">${t.recommended}</span>
              <h2 class="display-4 font-weight-bold mb-1 text-dark">${courseTitle}</h2>
              <p class="text-muted font-weight-bold text-uppercase mb-4" style="letter-spacing: 1px;">${courseLevel}</p>
              
              <div class="brilliant-course-thumb mx-auto mb-4" style="max-width: 250px;">
                <img src="${courseThumb}" alt="Course" class="img-fluid" />
              </div>
              
              <div class="d-flex align-items-center justify-content-center mb-4">
                <div class="icon icon-shape bg-success text-white rounded-circle mr-3 shadow-sm" style="width: 40px; height: 40px;">
                  <i class="fas fa-play"></i>
                </div>
                <h4 class="mb-0 font-weight-bold text-dark">Filtering Images</h4>
              </div>
              
              <button class="brilliant-btn-gradient btn-block btn-lg shadow" onclick="window.__router.navigate('course', '${recommended ? recommended.id : ''}')">
                ${t.start}
              </button>
              
              <div class="d-flex justify-content-center mt-5">
                ${courses.slice(1, 6).map(c => `
                  <div class="mx-2 brilliant-course-thumb shadow-sm" style="width: 60px; height: 60px; cursor: pointer;" onclick="window.__router.navigate('course', '${c.id}')">
                    <img src="${c.thumbnail || 'https://cdn-icons-png.flaticon.com/512/4144/4144682.png'}" class="img-fluid h-100" style="object-fit: cover;" />
                  </div>
                `).join('')}
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

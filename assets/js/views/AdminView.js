// ============================================================
//  AdminView.js — Admin Panel Templates (Argon Style)
// ============================================================

export class AdminView {
  _renderAdminLegacy(courses, lang) {
    const t = lang === "vi" ? {
      title: "Quản trị hệ thống", sub: "Quản lý nội dung khóa học",
      courses: "Khóa học", addCourse: "+ Thêm khóa học", noCourses: "Chưa có khóa học nào.",
      lessons: "Bài học", quizzes: "Quiz", edit: "Sửa", delete: "Xóa",
    } : {
      title: "Admin Panel", sub: "Manage course content",
      courses: "Courses", addCourse: "+ Add Course", noCourses: "No courses yet.",
      lessons: "Lessons", quizzes: "Quizzes", edit: "Edit", delete: "Delete",
    };

    return `
      <div class="header bg-gradient-danger pb-8">
        <div class="container-fluid">
          <h1 class="text-white mb-0">${t.title}</h1>
          <p class="text-white mt-1" style="opacity:0.8">${t.sub}</p>
        </div>
      </div>
      <div class="container-fluid mt--7 admin-section">
        <div class="card shadow">
          <div class="card-header border-0">
            <div class="row align-items-center">
              <div class="col"><h3 class="mb-0">${t.courses} (${courses.length})</h3></div>
              <div class="col text-right">
                <button class="btn btn-sm btn-primary" id="createCourseBtn">${t.addCourse}</button>
              </div>
            </div>
          </div>
          ${courses.length === 0
            ? `<div class="card-body text-center py-5"><p class="text-muted">${t.noCourses}</p></div>`
            : `<div class="table-responsive">
                <table class="table align-items-center table-flush">
                  <thead class="thead-light">
                    <tr>
                      <th>${lang === "vi" ? "Tên khóa học" : "Title"}</th>
                      <th>${lang === "vi" ? "Danh mục" : "Category"}</th>
                      <th>${lang === "vi" ? "Cấp độ" : "Level"}</th>
                      <th>${lang === "vi" ? "Bài học" : "Lessons"}</th>
                      <th>${lang === "vi" ? "Hành động" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${courses.map(c => `
                      <tr>
                        <td><strong>${c.title}</strong></td>
                        <td>${c.category || "—"}</td>
                        <td><span class="badge badge-dot mr-4"><i class="bg-${c.level === 'beginner' ? 'success' : c.level === 'advanced' ? 'danger' : 'warning'}"></i> ${c.level || "—"}</span></td>
                        <td>${c.lessonCount || 0}</td>
                        <td>
                          <button class="btn btn-sm btn-outline-primary btn-manage-lessons" data-course-id="${c.id}">📖 ${t.lessons}</button>
                          <button class="btn btn-sm btn-outline-info btn-manage-quizzes" data-course-id="${c.id}">📝 ${t.quizzes}</button>
                          <button class="btn btn-sm btn-outline-default btn-edit-course" data-course-id="${c.id}">✏️ ${t.edit}</button>
                          <button class="btn btn-sm btn-outline-danger btn-delete-course" data-course-id="${c.id}">🗑 ${t.delete}</button>
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>`
          }
        </div>
      </div>
    `;
  }

  renderAdmin(courses, lang, context = {}) {
    const users = context.users || [];
    const isSystemAdmin = !!context.isSystemAdmin;
    const t = lang === "vi" ? {
      title: isSystemAdmin ? "Admin hệ thống" : "Không gian giảng viên",
      sub: isSystemAdmin ? "Quản lý người dùng và toàn bộ khóa học trên LMS" : "Quản lý khóa học, bài học và quiz của bạn",
      courses: "Khóa học",
      users: "Người dùng",
      addCourse: "+ Thêm khóa học",
      noCourses: "Chưa có khóa học nào.",
      lessons: "Bài học",
      quizzes: "Quiz",
      edit: "Sửa",
      delete: "Xóa",
      enrolled: "Người học",
      owner: "Giảng viên",
      role: "Vai trò",
      save: "Lưu",
      joined: "Ngày tạo",
    } : {
      title: isSystemAdmin ? "System Admin" : "Teacher Studio",
      sub: isSystemAdmin ? "Manage LMS users and all courses" : "Manage your courses, lessons, and quizzes",
      courses: "Courses",
      users: "Users",
      addCourse: "+ Add Course",
      noCourses: "No courses yet.",
      lessons: "Lessons",
      quizzes: "Quizzes",
      edit: "Edit",
      delete: "Delete",
      enrolled: "Learners",
      owner: "Teacher",
      role: "Role",
      save: "Save",
      joined: "Created",
    };

    return `
      <div class="header bg-gradient-danger pb-8">
        <div class="container-fluid">
          <h1 class="text-white mb-0">${t.title}</h1>
          <p class="text-white mt-1" style="opacity:0.8">${t.sub}</p>
        </div>
      </div>
      <div class="container-fluid mt--7 admin-section">
        <div class="admin-tabs mb-3">
          <button type="button" class="admin-tab active" data-panel="adminCoursesPanel"><i class="fas fa-book mr-2"></i>${t.courses}</button>
          ${isSystemAdmin ? `<button type="button" class="admin-tab" data-panel="adminUsersPanel"><i class="fas fa-users mr-2"></i>${t.users}</button>` : ""}
        </div>
        <section class="admin-panel active" id="adminCoursesPanel">
          <div class="card shadow">
            <div class="card-header border-0">
              <div class="row align-items-center">
                <div class="col"><h3 class="mb-0">${t.courses} (${courses.length})</h3></div>
                <div class="col text-right">
                  <button class="btn btn-sm btn-primary" id="createCourseBtn">${t.addCourse}</button>
                </div>
              </div>
            </div>
            ${courses.length === 0
              ? `<div class="card-body text-center py-5"><p class="text-muted">${t.noCourses}</p></div>`
              : `<div class="table-responsive">
                  <table class="table align-items-center table-flush">
                    <thead class="thead-light">
                      <tr>
                        <th>${lang === "vi" ? "Tên khóa học" : "Title"}</th>
                        <th>${lang === "vi" ? "Danh mục" : "Category"}</th>
                        <th>${lang === "vi" ? "Cấp độ" : "Level"}</th>
                        <th>${t.lessons}</th>
                        <th>${t.enrolled}</th>
                        ${isSystemAdmin ? `<th>${t.owner}</th>` : ""}
                        <th>${lang === "vi" ? "Hành động" : "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${courses.map(c => `
                        <tr>
                          <td><strong>${this._escape(c.title)}</strong></td>
                          <td>${this._escape(c.category || "—")}</td>
                          <td><span class="badge badge-dot mr-4"><i class="bg-${c.level === 'beginner' ? 'success' : c.level === 'advanced' ? 'danger' : 'warning'}"></i> ${this._escape(c.level || "—")}</span></td>
                          <td>${c.lessonCount || 0}</td>
                          <td><span class="admin-enrolled-pill"><i class="fas fa-user-graduate mr-1"></i>${c.enrolledCount || 0}</span></td>
                          ${isSystemAdmin ? `<td>${this._escape(c.ownerName || c.ownerEmail || "—")}</td>` : ""}
                          <td>
                            <button class="btn btn-sm btn-outline-primary btn-manage-lessons" data-course-id="${c.id}"><i class="fas fa-book-open mr-1"></i>${t.lessons}</button>
                            <button class="btn btn-sm btn-outline-info btn-manage-quizzes" data-course-id="${c.id}"><i class="fas fa-clipboard-list mr-1"></i>${t.quizzes}</button>
                            <button class="btn btn-sm btn-outline-default btn-edit-course" data-course-id="${c.id}"><i class="fas fa-pen mr-1"></i>${t.edit}</button>
                            <button class="btn btn-sm btn-outline-danger btn-delete-course" data-course-id="${c.id}"><i class="fas fa-trash mr-1"></i>${t.delete}</button>
                          </td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>`}
          </div>
        </section>
        ${isSystemAdmin ? this._renderUsersPanel(users, t, lang) : ""}
      </div>
    `;
  }

  renderLearnersReportModal(course, rows, meta, lang) {
    const totalLearners = rows.length;
    const avgProgress = totalLearners
      ? Math.round(rows.reduce((sum, row) => sum + row.progressPct, 0) / totalLearners)
      : 0;
    const scoredRows = rows.filter(row => row.averageScore !== null);
    const avgScore = scoredRows.length
      ? Math.round(scoredRows.reduce((sum, row) => sum + row.averageScore, 0) / scoredRows.length)
      : 0;
    const completedRows = rows.filter(row => row.totalLessons > 0 && row.completedLessons >= row.totalLessons).length;
    const t = lang === "vi" ? {
      title: "Theo dõi học viên",
      learners: "Học viên",
      avgProgress: "Tiến độ TB",
      avgScore: "Điểm quiz TB",
      completed: "Hoàn thành",
      learner: "Học viên",
      progress: "Bài học",
      quiz: "Quiz / điểm",
      last: "Cập nhật",
      noLearners: "Chưa có học viên nào đăng ký khóa học này.",
      notTaken: "Chưa làm quiz",
    } : {
      title: "Learner tracking",
      learners: "Learners",
      avgProgress: "Avg progress",
      avgScore: "Avg quiz score",
      completed: "Completed",
      learner: "Learner",
      progress: "Lessons",
      quiz: "Quiz / score",
      last: "Updated",
      noLearners: "No learners have enrolled in this course yet.",
      notTaken: "No quiz attempts",
    };

    return `
      <div id="modalOverlay" class="modal-overlay">
        <div class="modal learner-report-modal">
          <div class="learner-report-head">
            <div>
              <span class="learner-report-kicker"><i class="fas fa-chart-line mr-2"></i>${t.title}</span>
              <h3>${this._escape(course?.title || "Course")}</h3>
            </div>
            <button type="button" class="admin-ai-close" id="cancelModal"><i class="fas fa-xmark"></i></button>
          </div>

          <div class="learner-report-stats">
            <article><strong>${totalLearners}</strong><span>${t.learners}</span></article>
            <article><strong>${avgProgress}%</strong><span>${t.avgProgress}</span></article>
            <article><strong>${avgScore}%</strong><span>${t.avgScore}</span></article>
            <article><strong>${completedRows}</strong><span>${t.completed}</span></article>
          </div>

          ${rows.length === 0
            ? `<div class="learner-report-empty"><i class="fas fa-user-graduate"></i><p>${t.noLearners}</p></div>`
            : `<div class="learner-report-table-wrap">
                <table class="table learner-report-table">
                  <thead>
                    <tr>
                      <th>${t.learner}</th>
                      <th>${t.progress}</th>
                      <th>${t.quiz}</th>
                      <th>${t.last}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows.map(row => `
                      <tr>
                        <td>
                          <strong>${this._escape(row.name)}</strong>
                          <small>${row.email ? this._escape(row.email) : (row.username ? "@" + this._escape(row.username) : this._escape(row.uid || ""))}</small>
                        </td>
                        <td>
                          <div class="learner-progress-line">
                            <span>${row.completedLessons}/${row.totalLessons || meta.totalLessons} ${lang === "vi" ? "bài" : "lessons"}</span>
                            <b>${row.progressPct}%</b>
                          </div>
                          <div class="learner-progress-track"><span style="width:${row.progressPct}%"></span></div>
                        </td>
                        <td>
                          <div class="learner-quiz-summary">
                            <strong>${row.averageScore === null ? "—" : row.averageScore + "%"}</strong>
                            <span>${row.quizTaken}/${row.quizTotal} ${lang === "vi" ? "quiz" : "quizzes"}</span>
                          </div>
                          <div class="learner-quiz-chips">
                            ${row.scores.length
                              ? row.scores.map(score => `<span class="${score.passed ? "is-pass" : "is-fail"}">${this._escape(score.title)} ${score.percentage}%</span>`).join("")
                              : `<em>${t.notTaken}</em>`}
                          </div>
                        </td>
                        <td>${this._formatDate(row.lastUpdated, lang)}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>`}
        </div>
      </div>
    `;
  }

  _renderUsersPanel(users, t, lang) {
    return `
      <section class="admin-panel" id="adminUsersPanel">
        <div class="card shadow">
          <div class="card-header border-0">
            <h3 class="mb-0">${t.users} (${users.length})</h3>
          </div>
          <div class="table-responsive">
            <table class="table align-items-center table-flush">
              <thead class="thead-light">
                <tr>
                  <th>${lang === "vi" ? "Người dùng" : "User"}</th>
                  <th>Email</th>
                  <th>XP</th>
                  <th>${t.role}</th>
                  <th>${t.joined}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${users.map(user => `
                  <tr>
                    <td><strong>${this._escape(user.fullname || user.username || "—")}</strong><br><small class="text-muted">@${this._escape(user.username || "—")}</small></td>
                    <td>${this._escape(user.email || "—")}</td>
                    <td>${user.xp || 0}</td>
                    <td>
                      <select class="form-control form-control-sm user-role-select" data-uid="${user.uid || user.id}">
                        ${["student", "teacher", "admin"].map(role => `<option value="${role}" ${user.role === role ? "selected" : ""}>${this._roleLabel(role, lang)}</option>`).join("")}
                      </select>
                    </td>
                    <td>${this._formatDate(user.createdAt, lang)}</td>
                    <td class="text-right"><button class="btn btn-sm btn-primary btn-save-user-role" data-uid="${user.uid || user.id}">${t.save}</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  _roleLabel(role, lang) {
    const vi = { student: "Học viên", teacher: "Giảng viên", admin: "Admin hệ thống" };
    const en = { student: "Student", teacher: "Teacher", admin: "System Admin" };
    return (lang === "vi" ? vi : en)[role] || role;
  }

  _formatDate(value, lang) {
    const raw = value?.toDate ? value.toDate() : value;
    const date = raw ? new Date(raw) : null;
    return date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US")
      : "—";
  }

  _escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  renderCourseModal(course, lang) {
    const isEdit = !!course;
    const t = lang === "vi" ? {
      title: isEdit ? "Sửa khóa học" : "Thêm khóa học",
      titleField: "Tên khóa học *", desc: "Mô tả", category: "Danh mục",
      level: "Cấp độ", thumbnail: "Ảnh bìa", password: "Mật khẩu (Tùy chọn)",
      save: isEdit ? "Lưu thay đổi" : "Tạo khóa học", cancel: "Hủy",
      levels: ["beginner", "intermediate", "advanced"],
      levelLabels: ["Cơ bản", "Trung cấp", "Nâng cao"],
    } : {
      title: isEdit ? "Edit Course" : "Add Course",
      titleField: "Course Title *", desc: "Description", category: "Category",
      level: "Level", thumbnail: "Thumbnail Image", password: "Password (Optional)",
      save: isEdit ? "Save Changes" : "Create Course", cancel: "Cancel",
      levels: ["beginner", "intermediate", "advanced"],
      levelLabels: ["Beginner", "Intermediate", "Advanced"],
    };

    return `
      <div id="modalOverlay" class="modal-overlay">
        <div class="modal" style="max-width:550px; padding:1.5rem;">
          <h3 class="mb-4">${t.title}</h3>
          <div class="form-group">
            <label class="form-control-label">${t.titleField}</label>
            <input type="text" id="courseTitle" class="form-control" value="${course?.title || ""}" />
          </div>
          <div class="form-group">
            <label class="form-control-label">${t.password}</label>
            <input type="text" id="coursePassword" class="form-control" value="${course?.password || ""}" />
          </div>
          <div class="form-group">
            <label class="form-control-label">${t.desc}</label>
            <textarea id="courseDesc" class="form-control" rows="3">${course?.description || ""}</textarea>
          </div>
          <div class="row">
            <div class="col-6">
              <div class="form-group">
                <label class="form-control-label">${t.category}</label>
                <input type="text" id="courseCategory" class="form-control" value="${course?.category || ""}" />
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="form-control-label">${t.level}</label>
                <select id="courseLevel" class="form-control">
                  ${t.levels.map((l, i) => `<option value="${l}" ${course?.level === l ? "selected" : ""}>${t.levelLabels[i]}</option>`).join("")}
                </select>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label class="form-control-label">${t.thumbnail}</label>
            <input type="file" id="courseThumbnailFile" class="form-control" accept="image/*" />
            <input type="hidden" id="courseThumbnail" value="${course?.thumbnail || ""}" />
            <img src="${course?.thumbnail || ""}" style="max-height:100px;margin-top:10px;border-radius:8px;display:${course?.thumbnail ? 'block' : 'none'};" id="courseThumbnailPreview" />
          </div>
          <div class="d-flex justify-content-end" style="gap:0.5rem;">
            <button class="btn btn-secondary" id="cancelModal">${t.cancel}</button>
            <button class="btn btn-primary" id="saveCourseBtn">${t.save}</button>
          </div>
        </div>
      </div>`;
  }

  renderLessonsModal(course, lessons, lang) {
    const t = lang === "vi" ? {
      title: `Bài học — ${course?.title}`, add: "+ Thêm bài học",
      noLessons: "Chưa có bài học.", edit: "Sửa", delete: "Xóa", close: "Đóng",
    } : {
      title: `Lessons — ${course?.title}`, add: "+ Add Lesson",
      noLessons: "No lessons yet.", edit: "Edit", delete: "Delete", close: "Close",
    };

    return `
      <div id="modalOverlay" class="modal-overlay">
        <div class="modal" style="max-width:650px; padding:1.5rem;">
          <h3 class="mb-3">${t.title}</h3>
          <div class="mb-3"><button class="btn btn-sm btn-primary" id="addLessonBtn">${t.add}</button></div>
          ${lessons.length === 0
            ? `<p class="text-muted">${t.noLessons}</p>`
            : `<div class="table-responsive"><table class="table table-sm"><thead><tr><th>#</th><th>${lang==='vi'?'Tên':'Title'}</th><th>${lang==='vi'?'Loại':'Type'}</th><th></th></tr></thead><tbody>
                ${lessons.map(l => `<tr>
                  <td>${l.order || 0}</td><td>${l.title}</td><td>${l.type || ""}</td>
                  <td class="text-right">
                    <button class="btn btn-sm btn-outline-default btn-edit-lesson" data-lesson-id="${l.id}">✏️</button>
                    <button class="btn btn-sm btn-outline-danger btn-delete-lesson" data-lesson-id="${l.id}">🗑</button>
                  </td>
                </tr>`).join("")}
              </tbody></table></div>`
          }
          <div class="text-right"><button class="btn btn-secondary" id="cancelModal">${t.close}</button></div>
        </div>
      </div>`;
  }

  renderLessonFormModal(lesson, course, lang) {
    const isEdit = !!lesson;
    const t = lang === "vi" ? {
      title: isEdit ? "Sửa bài học" : "Thêm bài học",
      titleField: "Tên bài học *", type: "Loại", content: "Nội dung (hỗ trợ Markdown)",
      videoUrl: "URL Video", docUrl: "URL Tài liệu", order: "Thứ tự",
      duration: "Thời lượng", save: isEdit ? "Lưu" : "Tạo", cancel: "Hủy",
    } : {
      title: isEdit ? "Edit Lesson" : "Add Lesson",
      titleField: "Lesson Title *", type: "Type", content: "Content (Markdown)",
      videoUrl: "Video URL", docUrl: "Document URL", order: "Order",
      duration: "Duration", save: isEdit ? "Save" : "Create", cancel: "Cancel",
    };
    const types = ["video", "text", "document"];

    return `
      <div id="modalOverlay" class="modal-overlay">
        <div class="modal" style="max-width:700px; padding:1.5rem;">
          <h3 class="mb-3">${t.title}</h3>
          <div class="form-group">
            <label class="form-control-label">${t.titleField}</label>
            <input type="text" id="lessonTitle" class="form-control" value="${lesson?.title || ""}" />
          </div>
          <div class="row">
            <div class="col-4"><div class="form-group"><label class="form-control-label">${t.type}</label>
              <select id="lessonType" class="form-control">${types.map(tp => `<option value="${tp}" ${lesson?.type === tp ? "selected" : ""}>${tp}</option>`).join("")}</select>
            </div></div>
            <div class="col-4"><div class="form-group"><label class="form-control-label">${t.order}</label>
              <input type="number" id="lessonOrder" class="form-control" value="${lesson?.order || 0}" min="0" />
            </div></div>
            <div class="col-4"><div class="form-group"><label class="form-control-label">${t.duration}</label>
              <input type="text" id="lessonDuration" class="form-control" value="${lesson?.duration || ""}" />
            </div></div>
          </div>
          <div class="form-group">
            <label class="form-control-label">${t.videoUrl}</label>
            <input type="url" id="lessonVideoUrl" class="form-control" value="${lesson?.videoUrl || ""}" />
          </div>
          <div class="form-group">
            <label class="form-control-label">${t.docUrl}</label>
            <input type="url" id="lessonDocUrl" class="form-control" value="${lesson?.docUrl || ""}" />
          </div>
          <div class="form-group">
            <div class="d-flex justify-content-between align-items-end mb-1">
              <label class="form-control-label mb-0">${t.content}</label>
              <button class="btn btn-sm btn-outline-primary" id="btnAdminAIGenerateLesson">✨ ${lang === "vi" ? "AI Viết nội dung từ Video" : "AI Generate from Video"}</button>
            </div>
            <textarea id="lessonContent" class="form-control" rows="8">${lesson?.content || ""}</textarea>
          </div>
          <div class="d-flex justify-content-end" style="gap:0.5rem;">
            <button class="btn btn-secondary" id="cancelModal">${t.cancel}</button>
            <button class="btn btn-primary" id="saveLessonBtn">${t.save}</button>
          </div>
        </div>
      </div>`;
  }

  renderQuizzesModal(course, quizzes, lang) {
    const t = lang === "vi" ? {
      title: `Quiz — ${course?.title}`, add: "+ Thêm quiz",
      noQuizzes: "Chưa có quiz.", edit: "Sửa", delete: "Xóa", close: "Đóng", questions: "câu",
    } : {
      title: `Quizzes — ${course?.title}`, add: "+ Add Quiz",
      noQuizzes: "No quizzes yet.", edit: "Edit", delete: "Delete", close: "Close", questions: "questions",
    };

    return `
      <div id="modalOverlay" class="modal-overlay">
        <div class="modal" style="max-width:600px; padding:1.5rem;">
          <h3 class="mb-3">${t.title}</h3>
          <div class="mb-3"><button class="btn btn-sm btn-primary" id="addQuizBtn">${t.add}</button></div>
          ${quizzes.length === 0
            ? `<p class="text-muted">${t.noQuizzes}</p>`
            : `<div class="table-responsive"><table class="table table-sm"><thead><tr><th>${lang==='vi'?'Tên':'Title'}</th><th>${lang==='vi'?'Câu hỏi':'Questions'}</th><th></th></tr></thead><tbody>
                ${quizzes.map(q => `<tr>
                  <td>${q.title}</td><td>${q.questions?.length || 0} ${t.questions}</td>
                  <td class="text-right">
                    <button class="btn btn-sm btn-outline-default btn-edit-quiz" data-quiz-id="${q.id}">✏️</button>
                    <button class="btn btn-sm btn-outline-danger btn-delete-quiz" data-quiz-id="${q.id}">🗑</button>
                  </td>
                </tr>`).join("")}
              </tbody></table></div>`
          }
          <div class="text-right"><button class="btn btn-secondary" id="cancelModal">${t.close}</button></div>
        </div>
      </div>`;
  }

  renderQuizFormModal(quiz, course, lang) {
    const isEdit = !!quiz;
    const t = lang === "vi" ? {
      title: isEdit ? "Sửa Quiz" : "Tạo Quiz", titleField: "Tên Quiz *",
      timeLimit: "Giới hạn thời gian (phút)", passing: "Điểm qua (%)",
      openTime: "Thời gian mở", closeTime: "Thời gian đóng",
      password: "Mật khẩu (Tùy chọn)", questions: "Câu hỏi", addQ: "+ Thêm câu hỏi",
      save: isEdit ? "Lưu" : "Tạo Quiz", cancel: "Hủy",
    } : {
      title: isEdit ? "Edit Quiz" : "Create Quiz", titleField: "Quiz Title *",
      timeLimit: "Time Limit (minutes)", passing: "Passing Score (%)",
      openTime: "Open Time", closeTime: "Close Time",
      password: "Password (Optional)", questions: "Questions", addQ: "+ Add Question",
      save: isEdit ? "Save" : "Create Quiz", cancel: "Cancel",
    };

    return `
      <div id="modalOverlay" class="modal-overlay">
        <div class="modal admin-quiz-modal" style="max-width:860px; padding:1.5rem; max-height:90vh; overflow-y:auto;">
          <h3 class="mb-3">${t.title}</h3>
          <div class="form-group">
            <label class="form-control-label">${t.titleField}</label>
            <input type="text" id="quizTitle" class="form-control" value="${quiz?.title || ""}" />
          </div>
          <div class="row">
            <div class="col-6"><div class="form-group"><label class="form-control-label">${t.timeLimit}</label>
              <input type="number" id="quizTimeLimit" class="form-control" value="${quiz?.timeLimitMinutes || 0}" min="0" />
            </div></div>
            <div class="col-6"><div class="form-group"><label class="form-control-label">${t.passing}</label>
              <input type="number" id="quizPassingScore" class="form-control" value="${quiz?.passingScore || 60}" min="0" max="100" />
            </div></div>
          </div>
          <div class="row">
            <div class="col-6"><div class="form-group"><label class="form-control-label">${t.openTime}</label>
              <input type="datetime-local" id="quizOpenTime" class="form-control" value="${quiz?.openTime || ""}" />
            </div></div>
            <div class="col-6"><div class="form-group"><label class="form-control-label">${t.closeTime}</label>
              <input type="datetime-local" id="quizCloseTime" class="form-control" value="${quiz?.closeTime || ""}" />
            </div></div>
          </div>
          <div class="form-group">
            <label class="form-control-label">${t.password}</label>
            <input type="text" id="quizPassword" class="form-control" value="${quiz?.password || ""}" />
          </div>
          <div class="form-group">
            <label class="form-control-label">${t.questions}</label>
            <div id="questionsContainer"></div>
            <div class="d-flex admin-quiz-actions" style="gap:0.5rem; margin-top:0.5rem;">
              <button type="button" class="btn btn-sm btn-secondary" id="addQuestionBtn">${t.addQ}</button>
              <button type="button" class="btn btn-sm btn-outline-primary" id="aiGenerateQuizBtn">🤖 ${lang === 'vi' ? 'AI Tạo Nhanh' : 'AI Generate'}</button>
            </div>
          </div>
          <div class="d-flex justify-content-end" style="gap:0.5rem;">
            <button class="btn btn-secondary" id="cancelModal">${t.cancel}</button>
            <button class="btn btn-primary" id="saveQuizBtn">${t.save}</button>
          </div>
        </div>
      </div>`;
  }
}

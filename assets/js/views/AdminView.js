// ============================================================
//  AdminView.js — Admin Panel Templates
// ============================================================

export class AdminView {
  renderAdmin(courses, lang) {
    const t = lang === "vi" ? {
      title: "Quản trị hệ thống",
      sub: "Quản lý nội dung khóa học",
      courses: "Khóa học",
      addCourse: "+ Thêm khóa học",
      noCourses: "Chưa có khóa học nào.",
      lessons: "Bài học",
      quizzes: "Quiz",
      edit: "Sửa",
      delete: "Xóa",
    } : {
      title: "Admin Panel",
      sub: "Manage course content",
      courses: "Courses",
      addCourse: "+ Add Course",
      noCourses: "No courses yet.",
      lessons: "Lessons",
      quizzes: "Quizzes",
      edit: "Edit",
      delete: "Delete",
    };

    return `
      <div class="admin-page">
        <div class="page-header animate-slide-up">
          <h1 class="page-title">${t.title}</h1>
          <p class="page-sub">${t.sub}</p>
        </div>

        <div class="admin-tabs animate-slide-up delay-1">
          <button class="admin-tab active" data-panel="panel-courses">${t.courses} (${courses.length})</button>
        </div>

        <div id="panel-courses" class="admin-panel active animate-slide-up delay-2">
          <div class="admin-panel-header">
            <h3>${t.courses}</h3>
            <button class="btn btn--primary btn--sm" id="createCourseBtn">${t.addCourse}</button>
          </div>
          ${courses.length === 0
            ? `<div class="empty-state"><span>📭</span><p>${t.noCourses}</p></div>`
            : `<div class="admin-table-wrap">
                <table class="admin-table">
                  <thead>
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
                        <td>${c.level || "—"}</td>
                        <td>${c.lessonCount || 0}</td>
                        <td class="action-cell">
                          <button class="btn btn--ghost btn--xs btn-manage-lessons" data-course-id="${c.id}">📖 ${t.lessons}</button>
                          <button class="btn btn--ghost btn--xs btn-manage-quizzes" data-course-id="${c.id}">📝 ${t.quizzes}</button>
                          <button class="btn btn--outline btn--xs btn-edit-course" data-course-id="${c.id}">✏️ ${t.edit}</button>
                          <button class="btn btn--danger btn--xs btn-delete-course" data-course-id="${c.id}">🗑 ${t.delete}</button>
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

  renderCourseModal(course, lang) {
    const isEdit = !!course;
    const t = lang === "vi" ? {
      title: isEdit ? "Sửa khóa học" : "Thêm khóa học",
      titleField: "Tên khóa học *",
      desc: "Mô tả",
      category: "Danh mục",
      level: "Cấp độ",
      thumbnail: "URL ảnh bìa",
      save: isEdit ? "Lưu thay đổi" : "Tạo khóa học",
      cancel: "Hủy",
      levels: ["beginner", "intermediate", "advanced"],
      levelLabels: ["Cơ bản", "Trung cấp", "Nâng cao"],
    } : {
      title: isEdit ? "Edit Course" : "Add Course",
      titleField: "Course Title *",
      desc: "Description",
      category: "Category",
      level: "Level",
      thumbnail: "Thumbnail URL",
      save: isEdit ? "Save Changes" : "Create Course",
      cancel: "Cancel",
      levels: ["beginner", "intermediate", "advanced"],
      levelLabels: ["Beginner", "Intermediate", "Advanced"],
    };

    return `
      <div id="modalOverlay" class="modal-overlay">
        <div class="modal animate-slide-up">
          <h2 class="modal-title">${t.title}</h2>
          <div class="form-group">
            <label class="form-label">${t.titleField}</label>
            <input type="text" id="courseTitle" class="form-input" value="${course?.title || ""}" />
          </div>
          <div class="form-group">
            <label class="form-label">${t.desc}</label>
            <textarea id="courseDesc" class="form-input form-textarea">${course?.description || ""}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">${t.category}</label>
              <input type="text" id="courseCategory" class="form-input" value="${course?.category || ""}" />
            </div>
            <div class="form-group">
              <label class="form-label">${t.level}</label>
              <select id="courseLevel" class="form-input form-select">
                ${t.levels.map((l, i) => `<option value="${l}" ${course?.level === l ? "selected" : ""}>${t.levelLabels[i]}</option>`).join("")}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t.thumbnail}</label>
            <input type="url" id="courseThumbnail" class="form-input" placeholder="https://..." value="${course?.thumbnail || ""}" />
          </div>
          <div class="modal-actions">
            <button class="btn btn--ghost" id="cancelModal">${t.cancel}</button>
            <button class="btn btn--primary" id="saveCourseBtn">${t.save}</button>
          </div>
        </div>
      </div>`;
  }

  renderLessonsModal(course, lessons, lang) {
    const t = lang === "vi" ? {
      title: `Bài học — ${course?.title}`,
      add: "+ Thêm bài học",
      noLessons: "Chưa có bài học.",
      edit: "Sửa", delete: "Xóa", close: "Đóng",
    } : {
      title: `Lessons — ${course?.title}`,
      add: "+ Add Lesson",
      noLessons: "No lessons yet.",
      edit: "Edit", delete: "Delete", close: "Close",
    };

    return `
      <div id="modalOverlay" class="modal-overlay">
        <div class="modal modal--wide animate-slide-up">
          <h2 class="modal-title">${t.title}</h2>
          <div class="modal-toolbar">
            <button class="btn btn--primary btn--sm" id="addLessonBtn">${t.add}</button>
          </div>
          ${lessons.length === 0
            ? `<p class="empty-text">${t.noLessons}</p>`
            : `<ul class="modal-list">
                ${lessons.map(l => `
                  <li class="modal-list-item">
                    <span class="item-order">${l.order || 0}</span>
                    <span class="item-title">${l.title}</span>
                    <span class="item-type">${l.type || ""}</span>
                    <div class="item-actions">
                      <button class="btn btn--outline btn--xs btn-edit-lesson" data-lesson-id="${l.id}">✏️ ${t.edit}</button>
                      <button class="btn btn--danger btn--xs btn-delete-lesson" data-lesson-id="${l.id}">🗑 ${t.delete}</button>
                    </div>
                  </li>`).join("")}
              </ul>`
          }
          <div class="modal-actions">
            <button class="btn btn--ghost" id="cancelModal">${t.close}</button>
          </div>
        </div>
      </div>`;
  }

  renderLessonFormModal(lesson, course, lang) {
    const isEdit = !!lesson;
    const t = lang === "vi" ? {
      title: isEdit ? "Sửa bài học" : "Thêm bài học",
      titleField: "Tên bài học *",
      type: "Loại",
      content: "Nội dung (hỗ trợ Markdown)",
      videoUrl: "URL Video (YouTube hoặc direct)",
      docUrl: "URL Tài liệu",
      order: "Thứ tự",
      duration: "Thời lượng (VD: 10 phút)",
      save: isEdit ? "Lưu" : "Tạo",
      cancel: "Hủy",
    } : {
      title: isEdit ? "Edit Lesson" : "Add Lesson",
      titleField: "Lesson Title *",
      type: "Type",
      content: "Content (Markdown supported)",
      videoUrl: "Video URL (YouTube or direct)",
      docUrl: "Document URL",
      order: "Order",
      duration: "Duration (e.g. 10 min)",
      save: isEdit ? "Save" : "Create",
      cancel: "Cancel",
    };

    const types = ["video", "text", "document"];

    return `
      <div id="modalOverlay" class="modal-overlay">
        <div class="modal modal--wide animate-slide-up">
          <h2 class="modal-title">${t.title}</h2>
          <div class="form-group">
            <label class="form-label">${t.titleField}</label>
            <input type="text" id="lessonTitle" class="form-input" value="${lesson?.title || ""}" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">${t.type}</label>
              <select id="lessonType" class="form-input form-select">
                ${types.map(tp => `<option value="${tp}" ${lesson?.type === tp ? "selected" : ""}>${tp}</option>`).join("")}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">${t.order}</label>
              <input type="number" id="lessonOrder" class="form-input" value="${lesson?.order || 0}" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">${t.duration}</label>
              <input type="text" id="lessonDuration" class="form-input" value="${lesson?.duration || ""}" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t.videoUrl}</label>
            <input type="url" id="lessonVideoUrl" class="form-input" placeholder="https://youtube.com/..." value="${lesson?.videoUrl || ""}" />
          </div>
          <div class="form-group">
            <label class="form-label">${t.docUrl}</label>
            <input type="url" id="lessonDocUrl" class="form-input" placeholder="https://..." value="${lesson?.docUrl || ""}" />
          </div>
          <div class="form-group">
            <label class="form-label">${t.content}</label>
            <textarea id="lessonContent" class="form-input form-textarea form-textarea--tall">${lesson?.content || ""}</textarea>
          </div>
          <div class="modal-actions">
            <button class="btn btn--ghost" id="cancelModal">${t.cancel}</button>
            <button class="btn btn--primary" id="saveLessonBtn">${t.save}</button>
          </div>
        </div>
      </div>`;
  }

  renderQuizzesModal(course, quizzes, lang) {
    const t = lang === "vi" ? {
      title: `Quiz — ${course?.title}`,
      add: "+ Thêm quiz",
      noQuizzes: "Chưa có quiz.",
      edit: "Sửa", delete: "Xóa", close: "Đóng",
      questions: "câu",
    } : {
      title: `Quizzes — ${course?.title}`,
      add: "+ Add Quiz",
      noQuizzes: "No quizzes yet.",
      edit: "Edit", delete: "Delete", close: "Close",
      questions: "questions",
    };

    return `
      <div id="modalOverlay" class="modal-overlay">
        <div class="modal modal--wide animate-slide-up">
          <h2 class="modal-title">${t.title}</h2>
          <div class="modal-toolbar">
            <button class="btn btn--primary btn--sm" id="addQuizBtn">${t.add}</button>
          </div>
          ${quizzes.length === 0
            ? `<p class="empty-text">${t.noQuizzes}</p>`
            : `<ul class="modal-list">
                ${quizzes.map(q => `
                  <li class="modal-list-item">
                    <span class="item-title">${q.title}</span>
                    <span class="item-meta">${q.questions?.length || 0} ${t.questions}</span>
                    <div class="item-actions">
                      <button class="btn btn--outline btn--xs btn-edit-quiz" data-quiz-id="${q.id}">✏️ ${t.edit}</button>
                      <button class="btn btn--danger btn--xs btn-delete-quiz" data-quiz-id="${q.id}">🗑 ${t.delete}</button>
                    </div>
                  </li>`).join("")}
              </ul>`
          }
          <div class="modal-actions">
            <button class="btn btn--ghost" id="cancelModal">${t.close}</button>
          </div>
        </div>
      </div>`;
  }

  renderQuizFormModal(quiz, course, lang) {
    const isEdit = !!quiz;
    const t = lang === "vi" ? {
      title: isEdit ? "Sửa Quiz" : "Tạo Quiz",
      titleField: "Tên Quiz *",
      timeLimit: "Giới hạn thời gian (phút, 0 = không giới hạn)",
      passing: "Điểm qua môn (%)",
      questions: "Câu hỏi",
      addQ: "+ Thêm câu hỏi",
      save: isEdit ? "Lưu" : "Tạo Quiz",
      cancel: "Hủy",
    } : {
      title: isEdit ? "Edit Quiz" : "Create Quiz",
      titleField: "Quiz Title *",
      timeLimit: "Time Limit (minutes, 0 = no limit)",
      passing: "Passing Score (%)",
      questions: "Questions",
      addQ: "+ Add Question",
      save: isEdit ? "Save" : "Create Quiz",
      cancel: "Cancel",
    };

    return `
      <div id="modalOverlay" class="modal-overlay">
        <div class="modal modal--wide animate-slide-up">
          <h2 class="modal-title">${t.title}</h2>
          <div class="form-group">
            <label class="form-label">${t.titleField}</label>
            <input type="text" id="quizTitle" class="form-input" value="${quiz?.title || ""}" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">${t.timeLimit}</label>
              <input type="number" id="quizTimeLimit" class="form-input" value="${quiz?.timeLimitMinutes || 0}" min="0" />
            </div>
            <div class="form-group">
              <label class="form-label">${t.passing}</label>
              <input type="number" id="quizPassingScore" class="form-input" value="${quiz?.passingScore || 60}" min="0" max="100" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">${t.questions}</label>
            <div id="questionsContainer"></div>
            <button type="button" class="btn btn--ghost btn--sm" id="addQuestionBtn" style="margin-top:0.5rem">${t.addQ}</button>
          </div>
          <div class="modal-actions">
            <button class="btn btn--ghost" id="cancelModal">${t.cancel}</button>
            <button class="btn btn--primary" id="saveQuizBtn">${t.save}</button>
          </div>
        </div>
      </div>`;
  }
}

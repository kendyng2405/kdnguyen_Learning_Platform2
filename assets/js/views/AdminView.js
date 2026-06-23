// ============================================================
//  AdminView.js — Admin Panel Templates (Argon Style)
// ============================================================

export class AdminView {
  renderAdmin(courses, lang) {
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

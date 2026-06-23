// ============================================================
//  AdminController.js — Admin Panel (CRUD for courses/lessons/quizzes)
// ============================================================

import { CourseModel } from "../models/CourseModel.js?v=10";
import { QuizModel }   from "../models/QuizModel.js?v=10";
import { AdminView }   from "../views/AdminView.js?v=10";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

export class AdminController {
  constructor(app) {
    this.app         = app;
    this.courseModel = new CourseModel();
    this.quizModel   = new QuizModel();
    this.view        = new AdminView();
  }

  async showAdmin() {
    if (!this.app.canManageCourses()) {
      window.__toast.error(
        window.__i18n.current === "vi"
          ? "Bạn không có quyền truy cập trang này."
          : "Access denied."
      );
      this.app.navigate("dashboard");
      return;
    }

    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "admin");
    const uid = this.app.getUser()?.uid;
    const isSystemAdmin = this.app.isSystemAdmin();
    const [courses, users] = await Promise.all([
      isSystemAdmin ? this.courseModel.getAllCourses() : this.courseModel.getCoursesForInstructor(uid, true),
      isSystemAdmin ? this.app.authModel.getAllUsers() : Promise.resolve([]),
    ]);
    const lang    = window.__i18n.current;
    const html    = this.view.renderAdmin(courses, lang, { isSystemAdmin, users });
    this._renderPage(html, "admin");
    this._bindAdminEvents();
  }

  _bindAdminEvents() {
    // We use a single event listener on document.body for reliable event delegation
    if (!this._adminClickHandler) {
      this._adminClickHandler = async (e) => {
        // Tab switching
        const tab = e.target.closest(".admin-tab");
        if (tab) {
          document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
          document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
          tab.classList.add("active");
          const panel = document.getElementById(tab.dataset.panel);
          panel?.classList.add("active");
          return;
        }

        // Create course
        const createBtn = e.target.closest("#createCourseBtn");
        if (createBtn) {
          this._showCourseModal();
          return;
        }

        // Edit course
        const editBtn = e.target.closest(".btn-edit-course");
        if (editBtn) {
          e.stopPropagation();
          const id = editBtn.dataset.courseId;
          try {
            const course = await this.courseModel.getCourseById(id);
            this._showCourseModal(course);
          } catch(err) {
            alert("Error loading course: " + err.message);
          }
          return;
        }

        // Delete course
        const deleteBtn = e.target.closest(".btn-delete-course");
        if (deleteBtn) {
          e.stopPropagation();
          const id = deleteBtn.dataset.courseId;
          const lang = window.__i18n.current;
          if (!confirm(lang === "vi" ? "Xóa khóa học này?" : "Delete this course?")) return;
          try {
            await this.courseModel.deleteCourse(id);
            window.__toast.success(lang === "vi" ? "Đã xóa khóa học." : "Course deleted.");
            this.showAdmin();
          } catch (err) {
            alert("Error deleting course: " + err.message);
          }
          return;
        }

        const saveRoleBtn = e.target.closest(".btn-save-user-role");
        if (saveRoleBtn) {
          e.stopPropagation();
          if (!this.app.isSystemAdmin()) return;
          const uid = saveRoleBtn.dataset.uid;
          const select = document.querySelector(`.user-role-select[data-uid="${uid}"]`);
          const role = select?.value || "student";
          try {
            await this.app.authModel.updateUserRole(uid, role);
            window.__toast.success(window.__i18n.current === "vi" ? "Đã cập nhật vai trò người dùng." : "User role updated.");
            this.showAdmin();
          } catch (err) {
            window.__toast.error(err.message);
          }
          return;
        }

        // Manage lessons
        const manageLessonsBtn = e.target.closest(".btn-manage-lessons");
        if (manageLessonsBtn) {
          e.stopPropagation();
          const courseId = manageLessonsBtn.dataset.courseId;
          try {
            await this._showLessonsManager(courseId);
          } catch(err) {
            alert("Error loading lessons: " + err.message);
          }
          return;
        }

        // Manage quizzes
        const manageQuizzesBtn = e.target.closest(".btn-manage-quizzes");
        if (manageQuizzesBtn) {
          e.stopPropagation();
          const courseId = manageQuizzesBtn.dataset.courseId;
          try {
            await this._showQuizzesManager(courseId);
          } catch(err) {
            alert("Error loading quizzes: " + err.message);
          }
          return;
        }
      };
      // Bind only once
      document.body.addEventListener("click", this._adminClickHandler);
    }
  }

  _showCourseModal(course = null) {
    const lang = window.__i18n.current;
    const isEdit = !!course;
    const modal = this.view.renderCourseModal(course, lang);
    document.body.insertAdjacentHTML("beforeend", modal);

    document.getElementById("modalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "modalOverlay") this._closeModal();
    });
    document.getElementById("cancelModal")?.addEventListener("click", () => this._closeModal());

    document.getElementById("courseThumbnailFile")?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const preview = document.getElementById("courseThumbnailPreview");
        preview.src = URL.createObjectURL(file);
        preview.style.display = "block";
      }
    });

    document.getElementById("saveCourseBtn")?.addEventListener("click", async () => {
      const title       = document.getElementById("courseTitle").value.trim();
      const password    = document.getElementById("coursePassword").value.trim();
      const description = document.getElementById("courseDesc").value.trim();
      const category    = document.getElementById("courseCategory").value.trim();
      const level       = document.getElementById("courseLevel").value;
      let thumbnail     = document.getElementById("courseThumbnail").value;

      const fileInput   = document.getElementById("courseThumbnailFile");
      const file        = fileInput?.files[0];

      if (!title) {
        window.__toast.error(lang === "vi" ? "Vui lòng nhập tên khóa học." : "Please enter course title.");
        return;
      }
      
      const saveBtn = document.getElementById("saveCourseBtn");
      saveBtn.disabled = true;
      saveBtn.textContent = lang === "vi" ? "Đang lưu..." : "Saving...";

      try {
        if (file) {
          thumbnail = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 600;
                let width = img.width;
                let height = img.height;
                
                if (width > MAX_WIDTH) {
                  height = Math.round((height * MAX_WIDTH) / width);
                  width = MAX_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                // Return highly compressed Base64 JPEG to save directly into Firestore
                resolve(canvas.toDataURL("image/jpeg", 0.7));
              };
              img.src = e.target.result;
            };
            reader.readAsDataURL(file);
          });
        }

        const ownerProfile = this.app.getUserProfile();
        const ownerData = (!isEdit || !course.ownerId) && !this.app.isSystemAdmin()
          ? {
              ownerId: this.app.getUser()?.uid,
              ownerName: ownerProfile?.fullname || ownerProfile?.username || "",
              ownerEmail: ownerProfile?.email || "",
            }
          : {};
        const data = { title, description, category, level, thumbnail, password, ...ownerData };

        if (isEdit) {
          await this.courseModel.updateCourse(course.id, data);
          window.__toast.success(lang === "vi" ? "Đã cập nhật khóa học." : "Course updated.");
        } else {
          await this.courseModel.createCourse(data);
          window.__toast.success(lang === "vi" ? "Đã tạo khóa học." : "Course created.");
        }
        this._closeModal();
        this.showAdmin();
      } catch (e) {
        window.__toast.error(e.message);
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? (lang === "vi" ? "Lưu thay đổi" : "Save Changes") : (lang === "vi" ? "Tạo khóa học" : "Create Course");
      }
    });
  }

  async _showLessonsManager(courseId) {
    const [course, lessons] = await Promise.all([
      this.courseModel.getCourseById(courseId),
      this.courseModel.getLessons(courseId),
    ]);
    const lang  = window.__i18n.current;
    const modal = this.view.renderLessonsModal(course, lessons, lang);
    document.body.insertAdjacentHTML("beforeend", modal);

    document.getElementById("modalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "modalOverlay") this._closeModal();
    });
    document.getElementById("cancelModal")?.addEventListener("click", () => this._closeModal());

    document.getElementById("addLessonBtn")?.addEventListener("click", () => {
      this._closeModal();
      this._showLessonForm(courseId, null, course);
    });

    document.querySelectorAll(".btn-edit-lesson").forEach(btn => {
      btn.addEventListener("click", async () => {
        const lessonId = btn.dataset.lessonId;
        const lesson   = lessons.find(l => l.id === lessonId);
        this._closeModal();
        this._showLessonForm(courseId, lesson, course);
      });
    });

    document.querySelectorAll(".btn-delete-lesson").forEach(btn => {
      btn.addEventListener("click", async () => {
        const lessonId = btn.dataset.lessonId;
        if (!confirm(lang === "vi" ? "Xóa bài học này?" : "Delete this lesson?")) return;
        try {
          await this.courseModel.deleteLesson(courseId, lessonId);
          window.__toast.success(lang === "vi" ? "Đã xóa bài học." : "Lesson deleted.");
          this._closeModal();
          this._showLessonsManager(courseId);
        } catch (e) {
          window.__toast.error(e.message);
        }
      });
    });
  }

  _showLessonForm(courseId, lesson = null, course = null) {
    const lang   = window.__i18n.current;
    const isEdit = !!lesson;
    const modal  = this.view.renderLessonFormModal(lesson, course, lang);
    document.body.insertAdjacentHTML("beforeend", modal);

    document.getElementById("modalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "modalOverlay") this._closeModal();
    });
    document.getElementById("cancelModal")?.addEventListener("click", () => this._closeModal());

    document.getElementById("btnAdminAIGenerateLesson")?.addEventListener("click", async () => {
      const videoUrl = document.getElementById("lessonVideoUrl").value.trim();
      const title = document.getElementById("lessonTitle").value.trim() || "Bài học mới";
      if (!videoUrl) {
        window.__toast.error(lang === "vi" ? "Vui lòng nhập URL Video trước." : "Please enter Video URL first.");
        return;
      }
      
      const btn = document.getElementById("btnAdminAIGenerateLesson");
      const originalText = btn.innerHTML;
      btn.innerHTML = "⏳ Đang trích xuất video...";
      btn.disabled = true;

      let transcript = "";
      try {
        const videoId = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/)?.[1];
        if (videoId) {
          const fetchHtml = async (proxyUrl) => {
             const controller = new AbortController();
             const timeoutId = setTimeout(() => controller.abort(), 6000);
             const res = await fetch(proxyUrl, { signal: controller.signal });
             const html = await res.text();
             clearTimeout(timeoutId);
             return html;
          };
          let html = "";
          try { html = await fetchHtml(`https://api.allorigins.win/raw?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + videoId)}`); }
          catch (e1) { try { html = await fetchHtml(`https://corsproxy.io/?${encodeURIComponent("https://www.youtube.com/watch?v=" + videoId)}`); } catch (e2) {} }

          const match = html.match(/"captionTracks":\[\{"baseUrl":"([^"]+)"/);
          if (match) {
            const captionUrl = match[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
            let xml = "";
            try { xml = await fetchHtml(`https://api.allorigins.win/raw?url=${encodeURIComponent(captionUrl)}`); }
            catch(e3) { xml = await fetchHtml(`https://corsproxy.io/?${encodeURIComponent(captionUrl)}`); }
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xml, "text/xml");
            const textNodes = xmlDoc.getElementsByTagName("text");
            for (let i = 0; i < textNodes.length; i++) transcript += textNodes[i].textContent + " ";
          }
        }
      } catch(e) { console.error("Admin Transcript error", e); }

      let parts = [];
      if (transcript && transcript.length > 50) {
        if (transcript.length > 15000) transcript = transcript.substring(0, 15000) + "...";
        const msg = lang === "vi"
          ? `Dựa vào phụ đề của video "${title}" dưới đây, hãy viết nội dung bài học bằng Markdown chi tiết gồm: 1. Tóm tắt ngắn gọn. 2. Timeline sự kiện. 3. Các khái niệm chính. 4. Tạo 3 câu trắc nghiệm. 5. Tạo 3 flashcards.\n\nTranscript: ${transcript}`
          : `Based on the transcript of "${title}", write a detailed Markdown lesson including: 1. Summary. 2. Timeline. 3. Key concepts. 4. 3-question quiz. 5. 3 flashcards.\n\nTranscript: ${transcript}`;
        parts.push({ text: msg });
      } else {
        const msg = lang === "vi" 
          ? `Hãy xem video YouTube đính kèm và viết một bài học Markdown chi tiết gồm: 1. Tóm tắt ngắn gọn. 2. Timeline. 3. Khái niệm chính. 4. 3 câu hỏi trắc nghiệm. 5. 3 thẻ ghi nhớ.\nNẾU BẠN KHÔNG XEM ĐƯỢC VIDEO NÀY, HÃY TRẢ LỜI: "ERROR_CANNOT_ACCESS_VIDEO".`
          : `Please watch the attached YouTube video and write a Markdown lesson including: 1. Summary. 2. Timeline. 3. Key concepts. 4. 3-question quiz. 5. 3 flashcards.\nIF YOU CANNOT WATCH THIS VIDEO, REPLY: "ERROR_CANNOT_ACCESS_VIDEO".`;
        
        const yUrlMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?]+)/);
        if (yUrlMatch) {
           parts.push({
              fileData: {
                fileUri: "https://www.youtube.com/watch?v=" + yUrlMatch[1],
                mimeType: "video/mp4"
              }
           });
        }
        parts.push({ text: msg });
      }
      
      try {
        btn.innerHTML = "⏳ AI Đang xem video...";
        const body = {
          contents: [{ role: "user", parts: parts }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8000 }
        };
        const response = await this.app.chatbotController._fetchModel(null, body);
        
        if (response.includes("ERROR_CANNOT_ACCESS_VIDEO")) {
          throw new Error(lang === "vi" ? "AI không thể xem nội dung video này. Vui lòng thêm API Key chính chủ!" : "AI cannot watch this video. Please use a direct API Key.");
        }
        
        document.getElementById("lessonContent").value = response;
        window.__toast.success(lang === "vi" ? "Đã tạo nội dung bài học!" : "Lesson content generated!");
      } catch (e) {
        if (e.message.includes("1048576") || e.message.includes("exceeds the maximum number of tokens")) {
          window.__toast.error(lang === "vi" ? "Video quá dài! AI chỉ có thể xem video ngắn hơn (giới hạn 1 triệu token)." : "Video too long! Exceeds 1 million token limit.");
        } else {
          window.__toast.error("AI Error: " + e.message);
        }
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });

    document.getElementById("saveLessonBtn")?.addEventListener("click", async () => {
      const title    = document.getElementById("lessonTitle").value.trim();
      const type     = document.getElementById("lessonType").value;
      const content  = document.getElementById("lessonContent").value.trim();
      const videoUrl = document.getElementById("lessonVideoUrl").value.trim();
      const docUrl   = document.getElementById("lessonDocUrl").value.trim();
      const order    = parseInt(document.getElementById("lessonOrder").value) || 0;
      const duration = document.getElementById("lessonDuration").value.trim();

      if (!title) {
        window.__toast.error(lang === "vi" ? "Vui lòng nhập tên bài học." : "Please enter lesson title.");
        return;
      }

      const data = { title, type, content, videoUrl, docUrl, order, duration };
      try {
        if (isEdit) {
          await this.courseModel.updateLesson(courseId, lesson.id, data);
          window.__toast.success(lang === "vi" ? "Đã cập nhật bài học." : "Lesson updated.");
        } else {
          await this.courseModel.createLesson(courseId, data);
          window.__toast.success(lang === "vi" ? "Đã tạo bài học." : "Lesson created.");
        }
        this._closeModal();
        this._showLessonsManager(courseId);
      } catch (e) {
        window.__toast.error(e.message);
      }
    });
  }

  async _showQuizzesManager(courseId) {
    const [course, quizzes] = await Promise.all([
      this.courseModel.getCourseById(courseId),
      this.quizModel.getQuizzesByCourse(courseId),
    ]);
    const lang  = window.__i18n.current;
    const modal = this.view.renderQuizzesModal(course, quizzes, lang);
    document.body.insertAdjacentHTML("beforeend", modal);

    document.getElementById("modalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "modalOverlay") this._closeModal();
    });
    document.getElementById("cancelModal")?.addEventListener("click", () => this._closeModal());

    document.getElementById("addQuizBtn")?.addEventListener("click", () => {
      this._closeModal();
      this._showQuizForm(courseId, null, course);
    });

    document.querySelectorAll(".btn-edit-quiz").forEach(btn => {
      btn.addEventListener("click", async () => {
        const quizId = btn.dataset.quizId;
        const quiz   = quizzes.find(q => q.id === quizId);
        this._closeModal();
        this._showQuizForm(courseId, quiz, course);
      });
    });

    document.querySelectorAll(".btn-delete-quiz").forEach(btn => {
      btn.addEventListener("click", async () => {
        const quizId = btn.dataset.quizId;
        if (!confirm(lang === "vi" ? "Xóa quiz này?" : "Delete this quiz?")) return;
        try {
          await this.quizModel.deleteQuiz(courseId, quizId);
          window.__toast.success(lang === "vi" ? "Đã xóa quiz." : "Quiz deleted.");
          this._closeModal();
          this._showQuizzesManager(courseId);
        } catch (e) {
          window.__toast.error(e.message);
        }
      });
    });
  }

  _showQuizForm(courseId, quiz = null, course = null) {
    const lang   = window.__i18n.current;
    const isEdit = !!quiz;
    const modal  = this.view.renderQuizFormModal(quiz, course, lang);
    document.body.insertAdjacentHTML("beforeend", modal);

    document.getElementById("modalOverlay").addEventListener("click", (e) => {
      if (e.target.id === "modalOverlay") this._closeModal();
    });
    document.getElementById("cancelModal")?.addEventListener("click", () => this._closeModal());

    // Dynamic question builder
    let questionCount = quiz?.questions?.length || 1;
    this._renderQuestionForms(quiz?.questions || [{}], lang);

    document.getElementById("addQuestionBtn")?.addEventListener("click", () => {
      questionCount++;
      const questions = this._collectQuestions();
      questions.push({});
      this._renderQuestionForms(questions, lang);
    });

    document.getElementById("aiGenerateQuizBtn")?.addEventListener("click", () => {
      this._openAIQuizGenerator(lang);
    });

    document.getElementById("saveQuizBtn")?.addEventListener("click", async () => {
      const title         = document.getElementById("quizTitle").value.trim();
      const timeLimit     = parseInt(document.getElementById("quizTimeLimit").value) || 0;
      const passingScore  = parseInt(document.getElementById("quizPassingScore").value) || 60;
      const openTime      = document.getElementById("quizOpenTime").value;
      const closeTime     = document.getElementById("quizCloseTime").value;
      const password      = document.getElementById("quizPassword").value.trim();
      const questions     = this._collectQuestions();

      if (!title) {
        window.__toast.error(lang === "vi" ? "Vui lòng nhập tên quiz." : "Please enter quiz title.");
        return;
      }
      if (questions.length === 0 || !questions[0].question) {
        window.__toast.error(lang === "vi" ? "Vui lòng thêm ít nhất 1 câu hỏi." : "Please add at least 1 question.");
        return;
      }

      const data = { title, timeLimitMinutes: timeLimit, passingScore, openTime, closeTime, password, questions };
      try {
        if (isEdit) {
          await this.quizModel.updateQuiz(courseId, quiz.id, data);
          window.__toast.success(lang === "vi" ? "Đã cập nhật quiz." : "Quiz updated.");
        } else {
          await this.quizModel.createQuiz(courseId, data);
          window.__toast.success(lang === "vi" ? "Đã tạo quiz." : "Quiz created.");
        }
        this._closeModal();
        this._showQuizzesManager(courseId);
      } catch (e) {
        window.__toast.error(e.message);
      }
    });
  }

  _renderQuestionForms(questions, lang) {
    const container = document.getElementById("questionsContainer");
    if (!container) return;

    container.innerHTML = questions.map((q, i) => this._questionFormCard(q, i, questions.length, lang)).join("");

    container.querySelectorAll(".btn-remove-q").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx);
        const qs  = this._collectQuestions();
        qs.splice(idx, 1);
        this._renderQuestionForms(qs, lang);
      });
    });

    container.querySelectorAll(".q-type").forEach(select => {
      select.addEventListener("change", () => {
        const idx = parseInt(select.closest(".question-form-card").dataset.qidx, 10);
        const qs = this._collectQuestions();
        qs[idx].type = select.value;
        if (select.value === "true_false") {
          qs[idx].options = lang === "vi" ? ["Đúng", "Sai"] : ["True", "False"];
          qs[idx].correctAnswer = 0;
        }
        if (select.value === "short_answer") {
          qs[idx].options = [];
          qs[idx].correctAnswer = "";
        }
        this._renderQuestionForms(qs, lang);
      });
    });
  }

  _collectQuestions() {
    const cards = document.querySelectorAll(".question-form-card");
    return Array.from(cards).map((card, i) => {
      const question = card.querySelector(".q-text")?.value.trim() || "";
      const type = card.querySelector(".q-type")?.value || "multiple_choice";
      const explanation = card.querySelector(".q-explanation")?.value.trim() || "";

      if (type === "short_answer") {
        return {
          type,
          question,
          options: [],
          correctAnswer: card.querySelector(".q-correct-text")?.value.trim() || "",
          explanation,
        };
      }

      const opts = Array.from(card.querySelectorAll(".q-option")).map(o => o.value.trim());
      const radio = card.querySelector(`input[name="correct_${i}"]:checked`);
      return {
        type,
        question,
        options: opts,
        correctAnswer: radio ? parseInt(radio.value) : 0,
        explanation,
      };
    });
  }

  _questionFormCard(q, i, total, lang) {
    const type = q.type || ((q.options || []).length === 2 ? "true_false" : "multiple_choice");
    const correctAnswer = this._normalizeCorrectAnswer(q.correctAnswer, type);
    const typeLabels = lang === "vi"
      ? { multiple_choice: "Trắc nghiệm", true_false: "Đúng / Sai", short_answer: "Trả lời ngắn" }
      : { multiple_choice: "Multiple choice", true_false: "True / False", short_answer: "Short answer" };

    return `
      <div class="question-form-card admin-question-card" data-qidx="${i}">
        <div class="question-form-header">
          <div>
            <span>${lang === "vi" ? "Câu" : "Q"} ${i + 1}</span>
            <small>${typeLabels[type]}</small>
          </div>
          <div class="admin-question-tools">
            <select class="form-control q-type">
              ${Object.keys(typeLabels).map(key => `<option value="${key}" ${type === key ? "selected" : ""}>${typeLabels[key]}</option>`).join("")}
            </select>
            ${total > 1 ? `<button type="button" class="btn-remove-q" data-idx="${i}" title="${lang === "vi" ? "Xóa câu hỏi" : "Remove question"}"><i class="fas fa-trash"></i></button>` : ""}
          </div>
        </div>
        <textarea class="form-control q-text" rows="2" placeholder="${lang === "vi" ? "Nhập câu hỏi..." : "Enter question..."}">${this._escape(q.question || "")}</textarea>
        ${type === "short_answer"
          ? this._shortAnswerForm(q, lang)
          : this._choiceAnswerForm(q, i, type, correctAnswer, lang)}
        <textarea class="form-control q-explanation" rows="2" placeholder="${lang === "vi" ? "Giải thích đáp án để học viên hiểu nhanh hơn..." : "Explain the answer for learners..."}">${this._escape(q.explanation || "")}</textarea>
      </div>
    `;
  }

  _choiceAnswerForm(q, i, type, correctAnswer, lang) {
    const baseOptions = type === "true_false"
      ? (q.options?.length >= 2 ? q.options.slice(0, 2) : (lang === "vi" ? ["Đúng", "Sai"] : ["True", "False"]))
      : [0, 1, 2, 3].map(j => q.options?.[j] || "");
    return `
      <div class="options-grid admin-options-grid">
        ${baseOptions.map((opt, j) => `
          <label class="option-row admin-option-row">
            <input type="radio" name="correct_${i}" value="${j}" ${parseInt(correctAnswer) === j ? "checked" : ""} />
            <span>${String.fromCharCode(65 + j)}</span>
            <input class="form-control q-option" ${type === "true_false" ? "readonly" : ""} placeholder="${lang === "vi" ? "Đáp án" : "Option"} ${String.fromCharCode(65 + j)}" value="${this._attr(opt)}" />
          </label>
        `).join("")}
      </div>
      <p class="hint-text">${lang === "vi" ? "Chọn đáp án đúng bằng nút tròn bên trái." : "Select the correct answer with the radio button."}</p>
    `;
  }

  _shortAnswerForm(q, lang) {
    const correct = typeof q.correctAnswer === "string" ? q.correctAnswer : (q.answer || "");
    return `
      <div class="admin-short-answer">
        <label class="form-control-label">${lang === "vi" ? "Đáp án đúng" : "Correct answer"}</label>
        <input class="form-control q-correct-text" placeholder="${lang === "vi" ? "Ví dụ: Agile" : "Example: Agile"}" value="${this._attr(correct)}" />
      </div>
    `;
  }

  _normalizeCorrectAnswer(answer, type) {
    if (type === "short_answer") return typeof answer === "string" ? answer : "";
    if (typeof answer === "boolean") return answer ? 0 : 1;
    const parsed = parseInt(answer, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  _openAIQuizGenerator(lang) {
    const t = lang === "vi" ? {
      title: "AI tạo quiz",
      source: "Nội dung bài học",
      sourcePh: "Dán nội dung bài học, transcript hoặc ghi chú vào đây...",
      count: "Số câu hỏi",
      types: "Dạng câu hỏi",
      mc: "Trắc nghiệm",
      tf: "Đúng / Sai",
      short: "Trả lời ngắn",
      cancel: "Hủy",
      generate: "Tạo câu hỏi",
      empty: "Vui lòng nhập nội dung bài học.",
      pickType: "Chọn ít nhất một dạng câu hỏi.",
      generating: "Đang tạo...",
      success: "Đã tạo câu hỏi bằng AI.",
    } : {
      title: "AI quiz generator",
      source: "Lesson content",
      sourcePh: "Paste lesson content, transcript, or notes here...",
      count: "Number of questions",
      types: "Question types",
      mc: "Multiple choice",
      tf: "True / False",
      short: "Short answer",
      cancel: "Cancel",
      generate: "Generate questions",
      empty: "Please enter lesson content.",
      pickType: "Choose at least one question type.",
      generating: "Generating...",
      success: "AI questions generated.",
    };

    document.body.insertAdjacentHTML("beforeend", `
      <div id="aiQuizOverlay" class="modal-overlay admin-ai-overlay">
        <div class="modal admin-ai-modal">
          <div class="admin-ai-header">
            <div>
              <span><i class="fas fa-robot mr-2"></i>AI</span>
              <h3>${t.title}</h3>
            </div>
            <button type="button" class="admin-ai-close" id="cancelAIQuiz"><i class="fas fa-xmark"></i></button>
          </div>
          <div class="form-group">
            <label class="form-control-label">${t.source}</label>
            <textarea id="aiQuizSource" class="form-control" rows="8" placeholder="${t.sourcePh}"></textarea>
          </div>
          <div class="row">
            <div class="col-md-4">
              <div class="form-group">
                <label class="form-control-label">${t.count}</label>
                <input id="aiQuizCount" class="form-control" type="number" min="1" max="20" value="5" />
              </div>
            </div>
            <div class="col-md-8">
              <label class="form-control-label">${t.types}</label>
              <div class="ai-type-grid">
                <label><input type="checkbox" value="multiple_choice" checked /> <span>${t.mc}</span></label>
                <label><input type="checkbox" value="true_false" checked /> <span>${t.tf}</span></label>
                <label><input type="checkbox" value="short_answer" /> <span>${t.short}</span></label>
              </div>
            </div>
          </div>
          <div class="d-flex justify-content-end" style="gap:0.5rem;">
            <button class="btn btn-secondary" id="cancelAIQuizBottom">${t.cancel}</button>
            <button class="btn btn-primary" id="generateAIQuizQuestions"><i class="fas fa-wand-magic-sparkles mr-2"></i>${t.generate}</button>
          </div>
        </div>
      </div>
    `);

    const close = () => document.getElementById("aiQuizOverlay")?.remove();
    document.getElementById("cancelAIQuiz")?.addEventListener("click", close);
    document.getElementById("cancelAIQuizBottom")?.addEventListener("click", close);
    document.getElementById("aiQuizOverlay")?.addEventListener("click", (e) => {
      if (e.target.id === "aiQuizOverlay") close();
    });

    document.getElementById("generateAIQuizQuestions")?.addEventListener("click", async () => {
      const source = document.getElementById("aiQuizSource")?.value.trim();
      const count = Math.max(1, Math.min(20, parseInt(document.getElementById("aiQuizCount")?.value, 10) || 5));
      const types = Array.from(document.querySelectorAll("#aiQuizOverlay input[type='checkbox']:checked")).map(input => input.value);

      if (!source) {
        window.__toast.error(t.empty);
        return;
      }
      if (!types.length) {
        window.__toast.error(t.pickType);
        return;
      }

      const btn = document.getElementById("generateAIQuizQuestions");
      const oldText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-sm"></span> ${t.generating}`;

      try {
        const questions = await this._generateQuestionsWithAI(source, count, types, lang);
        close();
        this._renderQuestionForms(questions, lang);
        setTimeout(() => window.__toast.success(t.success), 80);
      } catch (e) {
        window.__toast.error(lang === "vi" ? "Lỗi tạo câu hỏi AI: " + e.message : "AI Error: " + e.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = oldText;
      }
    });
  }

  async _generateQuestionsWithAI(source, count, types, lang) {
    const typeGuide = {
      multiple_choice: `{"type":"multiple_choice","question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"..."}`,
      true_false: `{"type":"true_false","question":"...","options":["Đúng","Sai"],"correctAnswer":0,"explanation":"..."}`,
      short_answer: `{"type":"short_answer","question":"...","options":[],"correctAnswer":"...","explanation":"..."}`,
    };
    const sysPrompt = [
      "You are an expert LMS quiz author.",
      `Create exactly ${count} questions from the lesson content.`,
      `Allowed question types: ${types.join(", ")}.`,
      "Return ONLY a JSON array. Do not include markdown fences or commentary.",
      `Each item must match one of these schemas: ${types.map(type => typeGuide[type]).join(" OR ")}.`,
      "Use clear wording, plausible distractors, and a short explanation for every question.",
      lang === "vi" ? "Write questions and explanations in Vietnamese when the source is Vietnamese." : "Write questions in English unless the source uses another language.",
    ].join("\n");

    const body = {
      system_instruction: { parts: [{ text: sysPrompt }] },
      contents: [{ role: "user", parts: [{ text: source }] }],
      generationConfig: { temperature: 0.35 },
    };
    try {
      const chatbot = this.app.chatbotController;
      if (!chatbot?._fetchModel) throw new Error("AI service unavailable");
      const previousHistory = [...chatbot.history];
      let text = "";
      try {
        text = await chatbot._fetchModel(null, body);
      } finally {
        chatbot.history = previousHistory;
      }
      if (!text) throw new Error("Empty response");
      const parsed = this._parseAIQuestions(text);
      return parsed.slice(0, count).map(q => this._normalizeGeneratedQuestion(q, lang));
    } catch (error) {
      console.warn("[Admin AI Quiz] Falling back to local generator:", error);
      return this._fallbackGeneratedQuestions(source, count, types, lang);
    }
  }

  _parseAIQuestions(text) {
    const clean = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);
    return JSON.parse(match ? match[0] : clean);
  }

  _normalizeGeneratedQuestion(q, lang) {
    const type = q.type || ((q.options || []).length === 2 ? "true_false" : "multiple_choice");
    if (type === "short_answer") {
      return {
        type,
        question: q.question || "",
        options: [],
        correctAnswer: String(q.correctAnswer ?? q.answer ?? ""),
        explanation: q.explanation || "",
      };
    }
    if (type === "true_false") {
      return {
        type,
        question: q.question || "",
        options: q.options?.length >= 2 ? q.options.slice(0, 2) : (lang === "vi" ? ["Đúng", "Sai"] : ["True", "False"]),
        correctAnswer: this._normalizeCorrectAnswer(q.correctAnswer, type),
        explanation: q.explanation || "",
      };
    }
    return {
      type: "multiple_choice",
      question: q.question || "",
      options: [0, 1, 2, 3].map(i => q.options?.[i] || ""),
      correctAnswer: this._normalizeCorrectAnswer(q.correctAnswer, "multiple_choice"),
      explanation: q.explanation || "",
    };
  }

  _fallbackGeneratedQuestions(source, count, types, lang) {
    const sentences = this._sourceSentences(source);
    const fallbackTypes = types.length ? types : ["multiple_choice"];
    return Array.from({ length: count }).map((_, index) => {
      const type = fallbackTypes[index % fallbackTypes.length];
      const sentence = sentences[index % sentences.length] || source.slice(0, 180);
      const keyword = this._keywordFrom(sentence, lang);
      if (type === "true_false") {
        return {
          type,
          question: lang === "vi"
            ? `Đúng hay sai: ${sentence}`
            : `True or false: ${sentence}`,
          options: lang === "vi" ? ["Đúng", "Sai"] : ["True", "False"],
          correctAnswer: 0,
          explanation: lang === "vi"
            ? "Mệnh đề này được tạo trực tiếp từ nội dung bài học đã cung cấp."
            : "This statement is generated directly from the provided lesson content.",
        };
      }
      if (type === "short_answer") {
        return {
          type,
          question: lang === "vi"
            ? `Từ khóa hoặc ý chính nào nổi bật trong nội dung sau: "${sentence}"?`
            : `What key term or main idea appears in this content: "${sentence}"?`,
          options: [],
          correctAnswer: keyword,
          explanation: lang === "vi"
            ? `Từ khóa "${keyword}" là trọng tâm được rút ra từ câu trong bài học.`
            : `"${keyword}" is the focus extracted from the lesson sentence.`,
        };
      }
      const distractors = this._distractors(keyword, sentences, lang);
      return {
        type: "multiple_choice",
        question: lang === "vi"
          ? `Ý nào phù hợp nhất với nội dung: "${sentence}"?`
          : `Which idea best matches this content: "${sentence}"?`,
        options: [keyword, ...distractors].slice(0, 4),
        correctAnswer: 0,
        explanation: lang === "vi"
          ? `Đáp án đúng bám sát câu gốc trong nội dung bài học.`
          : "The correct answer follows the original lesson sentence.",
      };
    });
  }

  _sourceSentences(source) {
    const sentences = String(source || "")
      .replace(/[#*_`>-]/g, " ")
      .split(/[\n.!?]+/)
      .map(s => s.replace(/\s+/g, " ").trim())
      .filter(s => s.length >= 24)
      .slice(0, 30);
    return sentences.length ? sentences : [String(source || "").replace(/\s+/g, " ").trim() || "Lesson content"];
  }

  _keywordFrom(sentence, lang) {
    const stopWords = new Set((lang === "vi"
      ? "và hoặc là của có các những một trong với được cho khi từ này đó như để về"
      : "the and or is are of to in with for from this that as by on a an"
    ).split(" "));
    const words = String(sentence)
      .split(/\s+/)
      .map(word => word.replace(/[^\p{L}\p{N}/-]/gu, ""))
      .filter(word => word.length >= 3 && !stopWords.has(word.toLowerCase()));
    return words.slice(0, 4).join(" ") || String(sentence).slice(0, 40);
  }

  _distractors(keyword, sentences, lang) {
    const pool = sentences
      .map(sentence => this._keywordFrom(sentence, lang))
      .filter(item => item && item !== keyword);
    const defaults = lang === "vi"
      ? ["Khái niệm phụ", "Ví dụ minh họa", "Thông tin ngoài bài"]
      : ["Secondary concept", "Example detail", "External information"];
    return [...new Set([...pool, ...defaults])].slice(0, 3);
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

  _closeModal() {
    document.getElementById("modalOverlay")?.remove();
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }
}

// ============================================================
//  AdminController.js — Admin Panel (CRUD for courses/lessons/quizzes)
// ============================================================

import { CourseModel } from "../models/CourseModel.js";
import { QuizModel }   from "../models/QuizModel.js";
import { AdminView }   from "../views/AdminView.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

export class AdminController {
  constructor(app) {
    this.app         = app;
    this.courseModel = new CourseModel();
    this.quizModel   = new QuizModel();
    this.view        = new AdminView();
  }

  async showAdmin() {
    if (!this.app.isAdmin()) {
      window.__toast.error(
        window.__i18n.current === "vi"
          ? "Bạn không có quyền truy cập trang này."
          : "Access denied."
      );
      this.app.navigate("dashboard");
      return;
    }

    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "admin");
    const courses = await this.courseModel.getAllCourses();
    const lang    = window.__i18n.current;
    const html    = this.view.renderAdmin(courses, lang);
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

        const data = { title, description, category, level, thumbnail, password };

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
      window.__prompt(
        lang === "vi" ? "AI Tạo Quiz Tự Động" : "AI Quiz Generator",
        lang === "vi" ? "Dán nội dung bài học vào đây..." : "Paste lesson text here...",
        async (promptText) => {
          const btn = document.getElementById("aiGenerateQuizBtn");
          const oldText = btn.innerHTML;
          btn.innerHTML = lang === "vi" ? "⏳ Đang tạo..." : "⏳ Generating...";
          btn.disabled = true;

          try {
            const sysPrompt = `Bạn là một chuyên gia tạo đề thi trắc nghiệm. Dựa vào văn bản dưới đây, hãy tạo ra 3 câu hỏi trắc nghiệm. Output BẮT BUỘC TRẢ VỀ CHỈ MỘT MẢNG JSON, không có code block markdown hay bất cứ chữ gì khác. Định dạng: [{"question":"Câu hỏi 1?","options":["A","B","C","D"],"correctAnswer":0}]`;
            
            const body = {
              system_instruction: { parts: [{ text: sysPrompt }] },
              contents: [{ role: "user", parts: [{ text: promptText }] }],
              generationConfig: { temperature: 0.3 }
            };
            
            let url = window.APP_CONFIG?.geminiKey 
              ? "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + window.APP_CONFIG.geminiKey
              : "https://kdnguyen-learning-platform2-t1cm.vercel.app/api/chat";

            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body)
            });
            
            if (!res.ok) throw new Error("API failed");
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("Empty response");
            const cleanText = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
            const questions = JSON.parse(cleanText);
            this._renderQuestionForms(questions, lang);
            
            window.__toast.success(lang === "vi" ? "Đã tạo câu hỏi bằng AI!" : "AI Questions generated!");
          } catch(e) {
            window.__toast.error(lang === "vi" ? "Lỗi tạo câu hỏi AI: " + e.message : "AI Error: " + e.message);
          } finally {
            btn.innerHTML = oldText;
            btn.disabled = false;
          }
        }
      );
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

    container.innerHTML = questions.map((q, i) => `
      <div class="question-form-card" data-qidx="${i}">
        <div class="question-form-header">
          <span>${lang === "vi" ? "Câu" : "Q"} ${i + 1}</span>
          ${questions.length > 1 ? `<button class="btn-remove-q" data-idx="${i}">🗑</button>` : ""}
        </div>
        <input class="form-input q-text" placeholder="${lang === "vi" ? "Câu hỏi..." : "Question..."}" value="${q.question || ""}" />
        <div class="options-grid">
          ${[0,1,2,3].map(j => `
            <div class="option-row">
              <input type="radio" name="correct_${i}" value="${j}" ${parseInt(q.correctAnswer) === j ? "checked" : ""} />
              <input class="form-input q-option" placeholder="${lang === "vi" ? "Đáp án" : "Option"} ${String.fromCharCode(65+j)}" value="${q.options?.[j] || ""}" />
            </div>
          `).join("")}
        </div>
        <p class="hint-text">${lang === "vi" ? "✓ Chọn đáp án đúng bằng radio button" : "✓ Select correct answer with radio"}</p>
      </div>
    `).join("");

    // Bind remove buttons
    container.querySelectorAll(".btn-remove-q").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx);
        const qs  = this._collectQuestions();
        qs.splice(idx, 1);
        this._renderQuestionForms(qs, lang);
      });
    });
  }

  _collectQuestions() {
    const cards = document.querySelectorAll(".question-form-card");
    return Array.from(cards).map((card, i) => {
      const question = card.querySelector(".q-text")?.value.trim() || "";
      const opts     = Array.from(card.querySelectorAll(".q-option")).map(o => o.value.trim());
      const radio    = card.querySelector(`input[name="correct_${i}"]:checked`);
      return {
        question,
        options: opts,
        correctAnswer: radio ? parseInt(radio.value) : 0,
      };
    });
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

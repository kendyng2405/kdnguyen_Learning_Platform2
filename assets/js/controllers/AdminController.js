// ============================================================
//  AdminController.js — Admin Panel (CRUD for courses/lessons/quizzes)
// ============================================================

import { CourseModel } from "../models/CourseModel.js?v=10";
import { QuizModel }   from "../models/QuizModel.js?v=11";
import { AdminView }   from "../views/AdminView.js?v=11";
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
    const [courses, users, enrollmentCounts] = await Promise.all([
      isSystemAdmin ? this.courseModel.getAllCourses() : this.courseModel.getCoursesForInstructor(uid, false),
      isSystemAdmin ? this.app.authModel.getAllUsers() : Promise.resolve([]),
      this.quizModel.getEnrollmentCountsByCourse(),
    ]);
    const lang    = window.__i18n.current;
    const html    = this.view.renderAdmin(this._withEnrollmentCounts(courses, enrollmentCounts), lang, { isSystemAdmin, users });
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
          if (manageLessonsBtn.disabled) return;
          const courseId = manageLessonsBtn.dataset.courseId;
          manageLessonsBtn.disabled = true;
          try {
            await this._showLessonsManager(courseId);
          } catch(err) {
            alert("Error loading lessons: " + err.message);
          } finally {
            manageLessonsBtn.disabled = false;
          }
          return;
        }

        // Manage quizzes
        const manageQuizzesBtn = e.target.closest(".btn-manage-quizzes");
        if (manageQuizzesBtn) {
          e.stopPropagation();
          if (manageQuizzesBtn.disabled) return;
          const courseId = manageQuizzesBtn.dataset.courseId;
          manageQuizzesBtn.disabled = true;
          try {
            await this._showQuizzesManager(courseId);
          } catch(err) {
            alert("Error loading quizzes: " + err.message);
          } finally {
            manageQuizzesBtn.disabled = false;
          }
          return;
        }
      };
      // Bind only once
      document.body.addEventListener("click", this._adminClickHandler);
    }
  }

  async _showLearnersReport(courseId) {
    const [course, lessons, quizzes, progressRows, users] = await Promise.all([
      this.courseModel.getCourseById(courseId),
      this.courseModel.getLessons(courseId),
      this.quizModel.getQuizzesByCourse(courseId),
      this.quizModel.getProgressForCourse(courseId),
      this.app.authModel.getAllUsers(300).catch(() => []),
    ]);

    const usersById = new Map(users.map(user => [user.uid || user.id, user]));
    const totalLessons = lessons.length;
    const quizMap = new Map(quizzes.map(quiz => [quiz.id, quiz]));
    const report = progressRows.map(progress => {
      const user = usersById.get(progress.uid) || {};
      const completedLessons = Array.isArray(progress.completedLessons) ? progress.completedLessons.length : 0;
      const scores = Object.entries(progress.quizScores || {}).map(([quizId, score]) => {
        const quiz = quizMap.get(quizId);
        const percentage = Number(score?.percentage ?? (score?.total ? (score.score / score.total) * 100 : 0));
        return {
          quizId,
          title: quiz?.title || "Quiz",
          score: Number(score?.score || 0),
          total: Number(score?.total || 0),
          percentage: Math.round(percentage),
          passed: percentage >= (quiz?.passingScore || 60),
          takenAt: score?.takenAt || null,
        };
      });
      const averageScore = scores.length
        ? Math.round(scores.reduce((sum, item) => sum + item.percentage, 0) / scores.length)
        : null;

      return {
        uid: progress.uid,
        name: user.fullname || user.username || progress.uid || "Learner",
        username: user.username || "",
        email: user.email || "",
        completedLessons,
        totalLessons,
        progressPct: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
        quizTaken: scores.length,
        quizTotal: quizzes.length,
        averageScore,
        passedQuizzes: scores.filter(item => item.passed).length,
        scores,
        lastUpdated: progress.lastUpdated || progress.enrolledAt || null,
      };
    }).sort((a, b) => b.progressPct - a.progressPct || (b.averageScore || 0) - (a.averageScore || 0));

    const lang = window.__i18n.current;
    const modal = this.view.renderLearnersReportModal(course, report, { totalLessons, quizzes }, lang);
    const overlay = this._openAdminModal(modal);
    this._bindModalClose(overlay);
  }

  _showCourseModal(course = null) {
    const lang = window.__i18n.current;
    const isEdit = !!course;
    const modal = this.view.renderCourseModal(course, lang);
    const overlay = this._openAdminModal(modal);
    this._bindModalClose(overlay);

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
    const overlay = this._openAdminModal(modal);
    this._bindModalClose(overlay);

    overlay.querySelector("#addLessonBtn")?.addEventListener("click", () => {
      this._closeModal();
      this._showLessonForm(courseId, null, course);
    }, { once: true });

    overlay.querySelectorAll(".btn-edit-lesson").forEach(btn => {
      btn.addEventListener("click", async () => {
        const lessonId = btn.dataset.lessonId;
        const lesson   = lessons.find(l => l.id === lessonId);
        this._closeModal();
        this._showLessonForm(courseId, lesson, course);
      });
    });

    overlay.querySelectorAll(".btn-delete-lesson").forEach(btn => {
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
    const overlay = this._openAdminModal(modal);
    this._bindModalClose(overlay);

    document.getElementById("btnAdminAIGenerateLesson")?.addEventListener("click", async () => {
      const videoUrl = document.getElementById("lessonVideoUrl").value.trim();
      const title = document.getElementById("lessonTitle").value.trim() || "Bài học mới";
      const targetLang = document.getElementById("aiLessonLanguage")?.value || lang;
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
        const msg = targetLang === "vi"
          ? `Dựa vào phụ đề của video "${title}" dưới đây, hãy viết nội dung bài học bằng Markdown chi tiết gồm: 1. Tóm tắt ngắn gọn. 2. Timeline sự kiện. 3. Các khái niệm chính. 4. Tạo 3 câu trắc nghiệm. 5. Tạo 3 flashcards.\n\nTranscript: ${transcript}`
          : `Based on the transcript of "${title}", write a detailed Markdown lesson including: 1. Summary. 2. Timeline. 3. Key concepts. 4. 3-question quiz. 5. 3 flashcards.\n\nTranscript: ${transcript}`;
        parts.push({ text: msg });
      } else {
        const msg = targetLang === "vi"
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
    const overlay = this._openAdminModal(modal);
    this._bindModalClose(overlay);

    overlay.querySelector("#addQuizBtn")?.addEventListener("click", () => {
      this._closeModal();
      this._showQuizForm(courseId, null, course);
    }, { once: true });

    overlay.querySelectorAll(".btn-edit-quiz").forEach(btn => {
      btn.addEventListener("click", async () => {
        const quizId = btn.dataset.quizId;
        const quiz   = quizzes.find(q => q.id === quizId);
        this._closeModal();
        this._showQuizForm(courseId, quiz, course);
      });
    });

    overlay.querySelectorAll(".btn-delete-quiz").forEach(btn => {
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
    const overlay = this._openAdminModal(modal);
    this._bindModalClose(overlay);
    this._activeQuizContext = { courseId, quizId: quiz?.id || null };

    // Dynamic question builder
    const initialQuestions = this._sanitizeQuestionList(quiz?.questions || [{}], lang);
    let questionCount = initialQuestions.length || 1;
    this._renderQuestionForms(initialQuestions, lang);

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
      const badIndex = questions.findIndex(q => this._isLowQualityGeneratedQuestion(q));
      if (badIndex >= 0) {
        window.__toast.error(lang === "vi"
          ? `Câu ${badIndex + 1} là câu AI kém chất lượng. Hãy xóa câu đó và tạo lại từ nội dung bài học cụ thể hơn.`
          : `Question ${badIndex + 1} is a low-quality AI draft. Delete it and regenerate from more concrete lesson content.`);
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

    const safeQuestions = this._sanitizeQuestionList(questions, lang);
    container.innerHTML = safeQuestions.map((q, i) => this._questionFormCard(q, i, safeQuestions.length, lang)).join("");

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
        if (select.value === "drag_drop") {
          qs[idx].options = qs[idx].options?.length ? qs[idx].options : ["", "", "", ""];
          qs[idx].correctAnswer = qs[idx].options.map((_, index) => index);
        }
        this._renderQuestionForms(qs, lang);
      });
    });

  }

  _sanitizeQuestionList(questions, lang) {
    const source = Array.isArray(questions) && questions.length ? questions : [{}];
    const filledCount = source.filter(q => q?.question).length;
    const cleaned = source.filter(q => !this._isLowQualityGeneratedQuestion(q));
    if (filledCount && cleaned.length < source.length) {
      const now = Date.now();
      if (!this._lastBadQuestionToast || now - this._lastBadQuestionToast > 1500) {
        this._lastBadQuestionToast = now;
        setTimeout(() => {
          window.__toast.warning(lang === "vi"
            ? "Mình đã loại bỏ câu AI kém chất lượng khỏi form. Hãy tạo lại từ nội dung bài học cụ thể hơn."
            : "Low-quality AI draft questions were removed. Regenerate from more concrete lesson content.");
        }, 80);
      }
    }
    return cleaned.length ? cleaned : [{}];
  }

  _isLowQualityGeneratedQuestion(q) {
    if (!q?.question) return false;
    const question = this._normalizeTextForQuality(q.question);
    const explanation = this._normalizeTextForQuality(q.explanation);
    const options = Array.isArray(q.options) ? q.options.map(option => this._normalizeTextForQuality(option)) : [];

    if (/which idea best matches|y nao phu hop nhat|true or false video nay|dung hay sai video nay/.test(question)) return true;
    if (/correct answer follows original lesson sentence|dap an dung bam sat cau goc/.test(explanation)) return true;
    if (q.type === "multiple_choice" && options.some(option => /^(bai hoc gioi thieu|video nay gioi thieu|nguoi huong dan voi|khoa hoc bao gom)$/.test(option))) return true;
    if (q.type === "multiple_choice" && options.length && options.filter(option => option.length < 8).length >= 2) return true;
    return false;
  }

  _collectQuestions() {
    const cards = document.querySelectorAll(".question-form-card");
    return Array.from(cards).map((card, i) => {
      const question = card.querySelector(".q-text")?.value.trim() || "";
      const type = card.querySelector(".q-type")?.value || "multiple_choice";
      const explanation = card.querySelector(".q-explanation")?.value.trim() || "";
      const id = card.querySelector(".q-id")?.value || this._questionId();
      if (type === "short_answer") {
        return {
          id,
          type,
          question,
          options: [],
          correctAnswer: card.querySelector(".q-correct-text")?.value.trim() || "",
          explanation,
        };
      }

      if (type === "drag_drop") {
        const opts = Array.from(card.querySelectorAll(".q-drag-item-input"))
          .map(o => o.value.trim())
          .filter(Boolean);
        return {
          id,
          type,
          question,
          options: opts,
          correctAnswer: opts.map((_, index) => index),
          explanation,
        };
      }

      const opts = Array.from(card.querySelectorAll(".q-option")).map(o => o.value.trim());
      const radio = card.querySelector(`input[name="correct_${i}"]:checked`);
      return {
        id,
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
    const questionId = q.id || this._questionId();
    const typeLabels = lang === "vi"
      ? { multiple_choice: "Trắc nghiệm", true_false: "Đúng / Sai", short_answer: "Trả lời ngắn", drag_drop: "Kéo thả" }
      : { multiple_choice: "Multiple choice", true_false: "True / False", short_answer: "Short answer", drag_drop: "Drag & drop" };

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
        <input type="hidden" class="q-id" value="${this._attr(questionId)}" />
        <textarea class="form-control q-text" rows="2" placeholder="${lang === "vi" ? "Nhập câu hỏi..." : "Enter question..."}">${this._escape(q.question || "")}</textarea>
        ${type === "short_answer"
          ? this._shortAnswerForm(q, lang)
          : type === "drag_drop"
            ? this._dragDropAnswerForm(q, lang)
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

  _dragDropAnswerForm(q, lang) {
    const items = (Array.isArray(q.options) && q.options.length ? q.options : (q.items || ["", "", "", ""])).slice(0, 8);
    const padded = items.length ? items : ["", "", "", ""];
    while (padded.length < 4) padded.push("");
    return `
      <div class="admin-drag-author">
        <label class="form-control-label">${lang === "vi" ? "Các mục đúng theo thứ tự" : "Items in the correct order"}</label>
        <div class="admin-drag-list">
          ${padded.map((item, index) => `
            <label>
              <span>${index + 1}</span>
              <input class="form-control q-drag-item-input" placeholder="${lang === "vi" ? "Bước / ý" : "Step / item"} ${index + 1}" value="${this._attr(item)}" />
            </label>
          `).join("")}
        </div>
        <p class="hint-text">${lang === "vi" ? "Học viên sẽ kéo thả để sắp xếp lại đúng thứ tự này." : "Learners will drag the shuffled items back into this order."}</p>
      </div>
    `;
  }

  _normalizeCorrectAnswer(answer, type) {
    if (type === "drag_drop") return Array.isArray(answer) ? answer : [0, 1, 2, 3];
    if (type === "short_answer") return typeof answer === "string" ? answer : "";
    if (typeof answer === "boolean") return answer ? 0 : 1;
    const parsed = parseInt(answer, 10);
    const letter = String(answer ?? "").trim().toUpperCase();
    if (/^[A-D]$/.test(letter)) return letter.charCodeAt(0) - 65;
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  _questionId() {
    return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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
      drag: "Kéo thả",
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
      drag: "Drag & drop",
      cancel: "Cancel",
      generate: "Generate questions",
      empty: "Please enter lesson content.",
      pickType: "Choose at least one question type.",
      generating: "Generating...",
      success: "AI questions generated.",
    };

    document.getElementById("aiQuizOverlay")?.remove();
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
                <label><input type="checkbox" value="short_answer" checked /> <span>${t.short}</span></label>
                <label><input type="checkbox" value="drag_drop" checked /> <span>${t.drag}</span></label>
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
        const usedFallback = this._lastAIQuizUsedFallback;
        close();
        this._renderQuestionForms(questions, lang);
        setTimeout(() => {
          if (usedFallback) {
            window.__toast.warning(lang === "vi"
              ? "Gemini đang trả rỗng, mình đã tạo câu hỏi dự phòng từ nội dung bài học."
              : "Gemini returned an empty response, so fallback questions were generated from the lesson.");
          } else {
            window.__toast.success(t.success);
          }
        }, 80);
      } catch (e) {
        window.__toast.error(lang === "vi" ? "AI chưa tạo được câu hỏi đạt chất lượng: " + e.message : "AI could not create valid questions: " + e.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = oldText;
      }
    });
  }

  async _generateQuestionsWithAI(source, count, types, lang) {
    this._lastAIQuizUsedFallback = false;
    const typeGuide = {
      multiple_choice: `{"type":"multiple_choice","question":"Clear question about one concrete fact/concept from the lesson","options":["Correct answer","Plausible wrong option","Plausible wrong option","Plausible wrong option"],"correctAnswer":0,"explanation":"Why the correct answer is supported by the lesson"}`,
      true_false: `{"type":"true_false","question":"Concrete true/false statement from the lesson","options":["Đúng","Sai"],"correctAnswer":0,"explanation":"Why the statement is true or false"}`,
      short_answer: `{"type":"short_answer","question":"Ask for a specific term, reason, step, or concept from the lesson","options":[],"correctAnswer":"Short exact answer","explanation":"Short explanation from the lesson"}`,
      drag_drop: `{"type":"drag_drop","question":"Arrange these lesson steps in the correct order","options":["First concrete step","Second concrete step","Third concrete step","Fourth concrete step"],"correctAnswer":[0,1,2,3],"explanation":"Why this order is correct"}`,
    };
    const targetLanguage = lang === "vi" ? "Vietnamese" : "English";
    const sanitizedSource = this._sanitizeQuizSource(source);
    const sysPrompt = [
      "You are a strict LMS assessment designer. Create useful, varied quiz questions ONLY from the lesson content.",
      `Create exactly ${count} questions in ${targetLanguage}.`,
      `Allowed question types: ${types.join(", ")}.`,
      "Use a balanced mix of the allowed question types. Do not put the same type twice in a row unless there are more questions than available types.",
      "Return ONLY valid JSON, no markdown fences, no commentary.",
      "JSON shape must be: {\"questions\":[ ... ]}.",
      `Each item must match one of these schemas: ${types.map(type => typeGuide[type]).join(" OR ")}.`,
      "Question variety rules:",
      "- Mix factual recall, concept understanding, application scenarios, cause/effect, misconception checks, compare/contrast, and order/sequence when the content supports it.",
      "- Multiple-choice questions should have plausible distractors, not random fragments.",
      "- True/false questions must test a meaningful claim, not whether a sentence exists.",
      "- Short-answer questions should ask for a concrete term, tool, step, reason, or result.",
      "- Drag & drop questions should arrange real process steps or related concepts in a logical order.",
      "Quality rules:",
      "- Do NOT ask vague questions like 'Which idea best matches this content?'.",
      "- Do NOT use fragments as answer options.",
      "- Do NOT ask about the title, transcript, video, or wording of the content itself.",
      "- Every multiple-choice option must be a complete meaningful answer.",
      "- The correct answer must be derivable from the lesson content.",
      "- Explanation must cite the lesson idea briefly.",
      "- Keep quiz question text in the selected UI language unless the lesson contains a proper noun or technical term.",
      "- If the lesson content already contains Q&A pairs, rewrite them into clean quiz questions and answers.",
    ].join("\n");

    const attempts = [
      {
        system_instruction: { parts: [{ text: sysPrompt }] },
        contents: [{ role: "user", parts: [{ text: `LESSON CONTENT:\n${sanitizedSource}` }] }],
        generationConfig: {
          temperature: 0.18,
          maxOutputTokens: 6500,
          responseMimeType: "application/json",
        },
      },
      {
        system_instruction: { parts: [{ text: `${sysPrompt}\nReturn a compact JSON object. Do not include markdown.` }] },
        contents: [{ role: "user", parts: [{ text: `Build quiz questions from these notes:\n${sanitizedSource.slice(0, 9000)}` }] }],
        generationConfig: {
          temperature: 0.12,
          maxOutputTokens: 4200,
        },
      },
    ];
    let lastError = null;
    for (const body of attempts) {
      try {
        const text = await this._callQuizAI(body);
        const parsed = this._parseAIQuestions(text);
        const normalized = parsed
          .map(q => this._normalizeGeneratedQuestion(q, lang, types))
          .filter(q => this._isUsableAIQuestion(q) && !this._isLowQualityGeneratedQuestion(q));
        const mixed = this._ensureQuestionTypeMix(normalized, sanitizedSource, count, types, lang);
        if (mixed.length >= count) {
          return mixed.slice(0, count);
        }
        throw new Error(lang === "vi"
          ? `AI chỉ tạo được ${normalized.length}/${count} câu hợp lệ.`
          : `AI only produced ${normalized.length}/${count} valid questions.`);
      } catch (error) {
        lastError = error;
        console.warn("[Admin AI Quiz] Generation attempt rejected:", error);
      }
    }

    const fallback = this._fallbackGeneratedQuestions(sanitizedSource, count, types, lang)
      .map(q => this._normalizeGeneratedQuestion(q, lang, types))
      .filter(q => this._isUsableAIQuestion(q) && !this._isLowQualityGeneratedQuestion(q));

    if (fallback.length >= Math.min(count, 1)) {
      this._lastAIQuizUsedFallback = true;
      return fallback.slice(0, count);
    }

    throw lastError || new Error(lang === "vi"
      ? "Không tạo được câu hỏi từ nội dung này."
      : "Could not generate questions from this content.");
  }

  async _callQuizAI(body) {
    const chatbot = this.app.chatbotController;
    if (!chatbot?._fetchModel) throw new Error("AI service unavailable");
    const previousHistory = [...chatbot.history];
    try {
      return await chatbot._fetchModel(null, body);
    } finally {
      chatbot.history = previousHistory;
    }
  }

  _parseAIQuestions(text) {
    const clean = text.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    let parsed = null;
    try {
      parsed = JSON.parse(clean);
    } catch (error) {
      const arrayMatch = clean.match(/\[[\s\S]*\]/);
      const objectMatch = clean.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(arrayMatch?.[0] || objectMatch?.[0] || clean);
    }
    const questions = Array.isArray(parsed)
      ? parsed
      : (Array.isArray(parsed?.questions) ? parsed.questions : []);
    if (!questions.length) {
      throw new Error("AI returned no questions.");
    }
    return questions;
  }

  _normalizeGeneratedQuestion(q, lang, allowedTypes = []) {
    const type = q.type || ((q.options || []).length === 2 ? "true_false" : "multiple_choice");
    const normalizedType = allowedTypes.includes(type) ? type : allowedTypes[0] || "multiple_choice";
    if (normalizedType === "short_answer") {
      return {
        type: normalizedType,
        question: this._cleanAIText(q.question),
        options: [],
        correctAnswer: this._cleanAIText(q.correctAnswer ?? q.answer ?? ""),
        explanation: this._cleanAIText(q.explanation || ""),
      };
    }
    if (normalizedType === "true_false") {
      return {
        type: normalizedType,
        question: this._cleanAIText(q.question),
        options: lang === "vi" ? ["Đúng", "Sai"] : ["True", "False"],
        correctAnswer: this._normalizeCorrectAnswer(q.correctAnswer, normalizedType),
        explanation: this._cleanAIText(q.explanation || ""),
      };
    }
    if (normalizedType === "drag_drop") {
      const options = Array.isArray(q.options) && q.options.length
        ? q.options.slice(0, 8).map(option => this._cleanAIText(option)).filter(Boolean)
        : [lang === "vi" ? "Bước 1" : "Step 1", lang === "vi" ? "Bước 2" : "Step 2", lang === "vi" ? "Bước 3" : "Step 3", lang === "vi" ? "Bước 4" : "Step 4"];
      return {
        type: normalizedType,
        question: this._cleanAIText(q.question),
        options,
        correctAnswer: options.map((_, index) => index),
        explanation: this._cleanAIText(q.explanation || ""),
      };
    }
    const options = [0, 1, 2, 3]
      .map(i => this._cleanAIText(q.options?.[i] || ""))
      .filter(Boolean);
    return {
      type: "multiple_choice",
      question: this._cleanAIText(q.question),
      options,
      correctAnswer: this._normalizeChoiceCorrectAnswer(q.correctAnswer, options),
      explanation: this._cleanAIText(q.explanation || ""),
    };
  }

  _normalizeChoiceCorrectAnswer(answer, options) {
    if (typeof answer === "number" && answer >= 0 && answer < options.length) return answer;
    const raw = String(answer ?? "").trim();
    const letter = raw.toUpperCase();
    if (/^[A-D]$/.test(letter)) return letter.charCodeAt(0) - 65;
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed < options.length) return parsed;
    const normalized = this._normalizeTextForQuality(answer);
    const matched = options.findIndex(option => this._normalizeTextForQuality(option) === normalized);
    return matched >= 0 ? matched : 0;
  }

  _ensureQuestionTypeMix(questions, source, count, types, lang) {
    const allowed = Array.isArray(types) && types.length ? types : ["multiple_choice"];
    if (allowed.length <= 1 || count <= 1) return questions;

    const fallback = this._fallbackGeneratedQuestions(source, count, allowed, lang)
      .map(q => this._normalizeGeneratedQuestion(q, lang, allowed))
      .filter(q => this._isUsableAIQuestion(q) && !this._isLowQualityGeneratedQuestion(q));
    const pool = [...questions, ...fallback];
    const picked = [];
    const used = new Set();
    const answerOf = (q) => q.type === "multiple_choice"
      ? (q.options?.[Number(q.correctAnswer)] ?? q.correctAnswer ?? "")
      : (Array.isArray(q.correctAnswer) ? q.correctAnswer.join(",") : (q.correctAnswer ?? ""));
    const keyOf = (q) => `${q.type}|${this._normalizeTextForQuality(q.question)}|${this._normalizeTextForQuality(answerOf(q))}`;
    const add = (candidate) => {
      if (!candidate || picked.length >= count) return false;
      const key = keyOf(candidate);
      if (used.has(key)) return false;
      used.add(key);
      picked.push(candidate);
      return true;
    };

    const requiredTypes = allowed.slice(0, Math.min(allowed.length, count));
    requiredTypes.forEach(type => add(pool.find(q => q.type === type)));

    let cursor = 0;
    while (picked.length < count && pool.length) {
      const preferredType = allowed[cursor % allowed.length];
      add(pool.find(q => q.type === preferredType && !used.has(keyOf(q)))) || add(pool.find(q => !used.has(keyOf(q))));
      cursor += 1;
      if (cursor > pool.length + count + allowed.length) break;
    }

    return picked.length ? picked : questions;
  }

  _sanitizeQuizSource(source) {
    return String(source || "")
      .replace(/\r/g, "\n")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/[#*_>`]/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
      .slice(0, 18000);
  }

  _cleanAIText(value) {
    return String(value ?? "")
      .replace(/\s+/g, " ")
      .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
      .trim();
  }

  _isUsableAIQuestion(q) {
    if (!q?.question || q.question.length < 12) return false;
    if (/which idea best matches|ý nào phù hợp nhất|true or false:\s*video này|đúng hay sai:\s*video này/i.test(q.question)) return false;
    if (/lesson content|nội dung bài học|transcript|video này giới thiệu|bài học giới thiệu/i.test(q.question) && q.question.length < 90) return false;

    if (q.type === "short_answer") {
      return !!q.correctAnswer && String(q.correctAnswer).length >= 2;
    }

    if (q.type === "drag_drop") {
      return Array.isArray(q.options)
        && q.options.length >= 3
        && q.options.every(option => String(option).trim().length >= 8);
    }

    if (q.type === "true_false") {
      return Array.isArray(q.options) && q.options.length === 2 && [0, 1].includes(Number(q.correctAnswer));
    }

    if (q.type === "multiple_choice") {
      const options = Array.isArray(q.options) ? q.options : [];
      const correct = Number(q.correctAnswer);
      const unique = new Set(options.map(option => this._normalizeTextForQuality(option)));
      return options.length === 4
        && unique.size === 4
        && options.every(option => String(option).trim().length >= 5)
        && correct >= 0
        && correct < options.length
        && !options.some(option => /^(khóa học bao gồm|video này giới thiệu|người hướng dẫn với|bài học giới thiệu)$/i.test(String(option).trim()));
    }

    return false;
  }

  _normalizeTextForQuality(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  }

  _fallbackGeneratedQuestions(source, count, types, lang) {
    const qaPairs = this._qaPairsFromSource(source);
    const sentences = this._sourceSentences(source).map(sentence => this._compactSentence(sentence, 170));
    const fallbackTypes = Array.isArray(types) && types.length ? types : ["multiple_choice"];
    return Array.from({ length: count }).map((_, index) => {
      const type = fallbackTypes[index % fallbackTypes.length];
      const qa = qaPairs[index % qaPairs.length];
      if (qa && type !== "drag_drop") {
        if (type === "true_false") {
          return {
            type,
            question: lang === "vi"
              ? `Theo bài học, đáp án sau có đúng cho câu hỏi "${qa.question}" không? "${qa.answer}"`
              : `According to the lesson, is this answer correct for "${qa.question}"? "${qa.answer}"`,
            options: lang === "vi" ? ["Đúng", "Sai"] : ["True", "False"],
            correctAnswer: 0,
            explanation: lang === "vi"
              ? `Bài học trả lời: "${qa.answer}"`
              : `The lesson answer is: "${qa.answer}"`,
          };
        }
        if (type === "short_answer") {
          return {
            type,
            question: qa.question,
            options: [],
            correctAnswer: qa.answer,
            explanation: lang === "vi"
              ? `Đáp án được lấy trực tiếp từ phần trả lời trong bài học: "${qa.answer}"`
              : `The answer is taken directly from the lesson: "${qa.answer}"`,
          };
        }
        return {
          type: "multiple_choice",
          question: qa.question,
          options: this._answerOptionSet(qa.answer, qaPairs, sentences, lang),
          correctAnswer: 0,
          explanation: lang === "vi"
            ? `Bài học trả lời: "${qa.answer}"`
            : `The lesson answer is: "${qa.answer}"`,
        };
      }
      const sentence = sentences[index % sentences.length] || this._compactSentence(source, 170);
      const keyword = this._keywordFrom(sentence, lang);
      if (type === "true_false") {
        return {
          type,
          question: lang === "vi"
            ? `Theo bài học, nhận định sau đúng hay sai: "${sentence}"`
            : `True or false: ${sentence}`,
          options: lang === "vi" ? ["Đúng", "Sai"] : ["True", "False"],
          correctAnswer: 0,
          explanation: lang === "vi"
            ? `Bài học có nêu ý này: "${sentence}"`
            : "This statement is generated directly from the provided lesson content.",
        };
      }
      if (type === "short_answer") {
        return {
          type,
          question: lang === "vi"
            ? `Bài học nhấn mạnh khái niệm hoặc công cụ nào trong ý sau: "${sentence}"?`
            : `What key term or main idea appears in this content: "${sentence}"?`,
          options: [],
          correctAnswer: keyword,
          explanation: lang === "vi"
            ? `Từ khóa "${keyword}" là trọng tâm được rút ra từ câu trong bài học.`
            : `"${keyword}" is the focus extracted from the lesson sentence.`,
        };
      }
      if (type === "drag_drop") {
        const items = this._orderedLessonItems(sentences, sentence, index, lang);
        return {
          type,
          question: lang === "vi"
            ? "Sắp xếp các ý chính sau theo mạch nội dung bài học."
            : "Arrange these ideas in a logical order.",
          options: items,
          correctAnswer: items.map((_, itemIndex) => itemIndex),
          explanation: lang === "vi"
            ? "Thứ tự đúng đi từ ý nền tảng đến ý triển khai chi tiết."
            : "The correct order moves from foundation to supporting detail.",
        };
      }
      const options = this._sentenceOptionSet(sentence, sentences, lang);
      return {
        type: "multiple_choice",
        question: lang === "vi"
          ? "Chi tiết nào sau đây được nêu trong bài học?"
          : "Which detail is stated in the lesson?",
        options,
        correctAnswer: 0,
        explanation: lang === "vi"
          ? `Bài học nêu: "${sentence}"`
          : `The lesson states: "${sentence}"`,
      };
    });
  }

  _qaPairsFromSource(source) {
    const lines = String(source || "").replace(/\r/g, "\n").split("\n");
    const pairs = [];
    let current = null;
    const afterColon = (value) => {
      const first = value.indexOf(":");
      const second = value.indexOf("：");
      const index = first >= 0 && second >= 0 ? Math.min(first, second) : Math.max(first, second);
      return index >= 0 ? value.slice(index + 1).trim() : "";
    };
    const commit = () => {
      if (!current) return;
      const question = this._compactSentence(current.question, 180);
      const answer = this._compactSentence(current.answer, 180);
      if (question.length >= 8 && answer.length >= 2) {
        pairs.push({ question, answer });
      }
      current = null;
    };

    lines.forEach(rawLine => {
      const line = rawLine.trim();
      if (!line || /^---+$/.test(line)) return;
      const withoutNumber = line.replace(/^\d+\.\s*/, "");
      const normalized = this._normalizeTextForQuality(withoutNumber);
      if (/^(cau hoi|question)\s*\d*\s*[:：]/.test(normalized)) {
        commit();
        current = { question: afterColon(withoutNumber), answer: "", mode: "question" };
        return;
      }
      if (/^(tra loi|answer)\s*[:：]/.test(normalized)) {
        if (!current) current = { question: "", answer: "", mode: "answer" };
        current.answer = [current.answer, afterColon(withoutNumber)].filter(Boolean).join(" ");
        current.mode = "answer";
        return;
      }
      if (current?.mode === "question") {
        current.question = [current.question, line].filter(Boolean).join(" ");
      } else if (current?.mode === "answer") {
        current.answer = [current.answer, line].filter(Boolean).join(" ");
      }
    });

    commit();
    return pairs.slice(0, 20);
  }

  _answerOptionSet(answer, qaPairs, sentences, lang) {
    const defaults = lang === "vi"
      ? [
        "Chỉ học lý thuyết mà không cần thực hành",
        "Không có công cụ hoặc kỹ năng cụ thể nào",
        "Chỉ áp dụng cho người học nâng cao",
      ]
      : [
        "Only studying theory without practice",
        "No specific tool or skill is mentioned",
        "Only applies to advanced learners",
      ];
    const options = [];
    const add = (value) => {
      const clean = this._compactSentence(value, 135);
      const normalized = this._normalizeTextForQuality(clean);
      if (clean.length >= 5 && !options.some(item => this._normalizeTextForQuality(item) === normalized)) {
        options.push(clean);
      }
    };
    add(answer);
    qaPairs.forEach(pair => add(pair.answer));
    sentences.forEach(sentence => add(sentence));
    defaults.forEach(add);
    while (options.length < 4) add(lang === "vi" ? `Đáp án nhiễu ${options.length + 1}` : `Distractor ${options.length + 1}`);
    return options.slice(0, 4);
  }

  _compactSentence(sentence, max = 150) {
    const clean = String(sentence || "").replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    return clean.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
  }

  _sentenceOptionSet(sentence, sentences, lang) {
    const correct = this._compactSentence(sentence, 135);
    const defaults = lang === "vi"
      ? [
        "Chỉ học lý thuyết mà không cần thực hành",
        "Không đề cập đến quy trình kiểm thử phần mềm",
        "Chỉ phù hợp với người đã có nhiều năm kinh nghiệm nâng cao",
      ]
      : [
        "Only studying theory without practice",
        "Not covering the software testing process",
        "Only suitable for highly experienced learners",
      ];
    const options = [];
    const add = (value) => {
      const clean = this._compactSentence(value, 135);
      const normalized = this._normalizeTextForQuality(clean);
      if (clean.length >= 8 && !options.some(item => this._normalizeTextForQuality(item) === normalized)) {
        options.push(clean);
      }
    };
    add(correct);
    sentences.forEach(item => {
      if (this._normalizeTextForQuality(item) !== this._normalizeTextForQuality(correct)) add(item);
    });
    defaults.forEach(add);
    while (options.length < 4) add(lang === "vi" ? `Ý phụ ${options.length + 1} không được nêu rõ` : `Unstated supporting idea ${options.length + 1}`);
    return options.slice(0, 4);
  }

  _orderedLessonItems(sentences, sentence, index, lang) {
    let items = sentences.slice(index, index + 4);
    if (items.length < 3) items = sentences.slice(0, 4);
    if (items.length < 3) {
      items = String(sentence || "")
        .split(/[,;:]+/)
        .map(item => this._compactSentence(item, 110))
        .filter(item => item.length >= 8);
    }
    while (items.length < 3) {
      items.push(lang === "vi" ? `Ý chính ${items.length + 1}` : `Main idea ${items.length + 1}`);
    }
    return items.slice(0, 4).map(item => this._compactSentence(item, 120));
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

  _openAdminModal(html) {
    this._closeModal();
    document.body.insertAdjacentHTML("beforeend", html);
    return document.body.lastElementChild?.id === "modalOverlay"
      ? document.body.lastElementChild
      : document.getElementById("modalOverlay");
  }

  _bindModalClose(overlay) {
    if (!overlay) return;
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this._closeModal();
    });
    overlay.querySelector("#cancelModal")?.addEventListener("click", () => this._closeModal());
  }

  _closeModal() {
    document.querySelectorAll("#modalOverlay").forEach(overlay => overlay.remove());
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }

  _withEnrollmentCounts(courses, counts = {}) {
    return courses.map(course => ({ ...course, enrolledCount: counts[course.id] || 0 }));
  }
}

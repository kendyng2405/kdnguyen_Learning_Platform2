// ============================================================
//  AdminController.js — Admin Panel (CRUD for courses/lessons/quizzes)
// ============================================================

import { CourseModel } from "../models/CourseModel.js";
import { QuizModel }   from "../models/QuizModel.js";
import { AdminView }   from "../views/AdminView.js";

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
    // Tab switching
    document.querySelectorAll(".admin-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".admin-panel").forEach(p => p.classList.remove("active"));
        tab.classList.add("active");
        const panel = document.getElementById(tab.dataset.panel);
        panel?.classList.add("active");
      });
    });

    // Create course
    document.getElementById("createCourseBtn")?.addEventListener("click", () => this._showCourseModal());

    // Edit/Delete course
    document.querySelectorAll(".btn-edit-course").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.dataset.courseId;
        const course = await this.courseModel.getCourseById(id);
        this._showCourseModal(course);
      });
    });

    document.querySelectorAll(".btn-delete-course").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id   = btn.dataset.courseId;
        const lang = window.__i18n.current;
        if (!confirm(lang === "vi" ? "Xóa khóa học này?" : "Delete this course?")) return;
        try {
          await this.courseModel.deleteCourse(id);
          window.__toast.success(lang === "vi" ? "Đã xóa khóa học." : "Course deleted.");
          this.showAdmin();
        } catch (e) {
          window.__toast.error(e.message);
        }
      });
    });

    // Manage lessons
    document.querySelectorAll(".btn-manage-lessons").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const courseId = btn.dataset.courseId;
        await this._showLessonsManager(courseId);
      });
    });

    // Manage quizzes
    document.querySelectorAll(".btn-manage-quizzes").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const courseId = btn.dataset.courseId;
        await this._showQuizzesManager(courseId);
      });
    });
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

    document.getElementById("saveCourseBtn")?.addEventListener("click", async () => {
      const title       = document.getElementById("courseTitle").value.trim();
      const description = document.getElementById("courseDesc").value.trim();
      const category    = document.getElementById("courseCategory").value.trim();
      const level       = document.getElementById("courseLevel").value;
      const thumbnail   = document.getElementById("courseThumbnail").value.trim();

      if (!title) {
        window.__toast.error(lang === "vi" ? "Vui lòng nhập tên khóa học." : "Please enter course title.");
        return;
      }

      const data = { title, description, category, level, thumbnail };
      try {
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

    document.getElementById("saveQuizBtn")?.addEventListener("click", async () => {
      const title         = document.getElementById("quizTitle").value.trim();
      const timeLimit     = parseInt(document.getElementById("quizTimeLimit").value) || 0;
      const passingScore  = parseInt(document.getElementById("quizPassingScore").value) || 60;
      const questions     = this._collectQuestions();

      if (!title) {
        window.__toast.error(lang === "vi" ? "Vui lòng nhập tên quiz." : "Please enter quiz title.");
        return;
      }
      if (questions.length === 0 || !questions[0].question) {
        window.__toast.error(lang === "vi" ? "Vui lòng thêm ít nhất 1 câu hỏi." : "Please add at least 1 question.");
        return;
      }

      const data = { title, timeLimitMinutes: timeLimit, passingScore, questions };
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

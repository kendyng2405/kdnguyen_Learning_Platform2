// ============================================================
//  CourseController.js — Course & Lesson Business Logic
// ============================================================

import { CourseModel } from "../models/CourseModel.js";
import { QuizModel }   from "../models/QuizModel.js";
import { CourseView }  from "../views/CourseView.js";

export class CourseController {
  constructor(app) {
    this.app         = app;
    this.courseModel = new CourseModel();
    this.quizModel   = new QuizModel();
    this.view        = new CourseView();
  }

  async showDashboard() {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "dashboard");
    const [courses, allProgress] = await Promise.all([
      this.courseModel.getAllCourses(),
      this.quizModel.getAllProgressForUser(this.app.getUser().uid),
    ]);
    const lang    = window.__i18n.current;
    const profile = this.app.getUserProfile();
    const html    = this.view.renderDashboard(courses, allProgress, profile, lang);
    this._renderPage(html, "dashboard");
    this._bindCourseCards();
  }

  async showCourseList() {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "courses");
    const courses = await this.courseModel.getAllCourses();
    const uid     = this.app.getUser().uid;
    const profile = this.app.getUserProfile();
    const lang    = window.__i18n.current;

    // Load progress for all courses
    const progressMap = {};
    for (const c of courses) {
      progressMap[c.id] = await this.quizModel.getProgress(uid, c.id);
    }

    const html = this.view.renderCourseList(courses, progressMap, profile, lang);
    this._renderPage(html, "courses");
    this._bindCourseCards();
    this._bindEnrollButtons();
  }

  async showCourseDetail(courseId) {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "course-detail");
    const [course, lessons, quizzes] = await Promise.all([
      this.courseModel.getCourseById(courseId),
      this.courseModel.getLessons(courseId),
      this.quizModel.getQuizzesByCourse(courseId),
    ]);

    if (!course) {
      window.__toast.error("Course not found");
      this.app.navigate("courses");
      return;
    }

    const uid      = this.app.getUser().uid;
    const progress = await this.quizModel.getProgress(uid, courseId);
    const profile  = this.app.getUserProfile();
    const lang     = window.__i18n.current;

    const html = this.view.renderCourseDetail(course, lessons, quizzes, progress, profile, lang);
    this._renderPage(html, "course-detail");
    this._bindLessonItems(courseId);
    this._bindQuizItems(courseId);
    document.getElementById("backToCourses")?.addEventListener("click", () => this.app.navigate("courses"));
    document.getElementById("enrollBtn")?.addEventListener("click", () => this._enroll(courseId));
  }

  async showLesson(courseId, lessonId) {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "lesson");
    const [course, lesson] = await Promise.all([
      this.courseModel.getCourseById(courseId),
      this.courseModel.getLessonById(courseId, lessonId),
    ]);

    if (!lesson) {
      window.__toast.error("Lesson not found");
      this.app.navigate("course", courseId);
      return;
    }

    const uid      = this.app.getUser().uid;
    const progress = await this.quizModel.getProgress(uid, courseId);
    const lang     = window.__i18n.current;

    const html = this.view.renderLesson(course, lesson, progress, lang);
    this._renderPage(html, "lesson");

    // Mark complete button
    document.getElementById("markCompleteBtn")?.addEventListener("click", async () => {
      await this.quizModel.markLessonComplete(uid, courseId, lessonId);
      window.__toast.success(lang === "vi" ? "Đã hoàn thành bài học! 🎉" : "Lesson completed! 🎉");
      document.getElementById("markCompleteBtn").disabled = true;
      document.getElementById("markCompleteBtn").textContent = lang === "vi" ? "✓ Đã hoàn thành" : "✓ Completed";
    });

    document.getElementById("backToCourse")?.addEventListener("click", () => this.app.navigate("course", courseId));
  }

  async _enroll(courseId) {
    const uid = this.app.getUser().uid;
    const lang = window.__i18n.current;
    try {
      await this.quizModel.enrollCourse(uid, courseId);
      window.__toast.success(lang === "vi" ? "Đăng ký khóa học thành công!" : "Enrolled successfully!");
      this.showCourseDetail(courseId);
    } catch (e) {
      window.__toast.error(e.message);
    }
  }

  _bindCourseCards() {
    document.querySelectorAll("[data-course-id]").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".btn-enroll")) return;
        const id = card.dataset.courseId;
        if (id) this.app.navigate("course", id);
      });
    });
  }

  _bindEnrollButtons() {
    document.querySelectorAll(".btn-enroll").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const courseId = btn.dataset.courseId;
        if (courseId) await this._enroll(courseId);
      });
    });
  }

  _bindLessonItems(courseId) {
    document.querySelectorAll("[data-lesson-id]").forEach(item => {
      item.addEventListener("click", () => {
        const lid = item.dataset.lessonId;
        if (lid) this.app.navigate("lesson", courseId, lid);
      });
    });
  }

  _bindQuizItems(courseId) {
    document.querySelectorAll("[data-quiz-id]").forEach(item => {
      item.addEventListener("click", () => {
        const qid = item.dataset.quizId;
        if (qid) this.app.navigate("quiz", courseId, qid);
      });
    });
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }
}

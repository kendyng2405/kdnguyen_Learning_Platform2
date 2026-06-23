// ============================================================
//  ProgressController.js — Progress Tracking
// ============================================================

import { QuizModel }    from "../models/QuizModel.js?v=8";
import { CourseModel }  from "../models/CourseModel.js?v=8";
import { ProgressView } from "../views/ProgressView.js?v=8";

export class ProgressController {
  constructor(app) {
    this.app         = app;
    this.quizModel   = new QuizModel();
    this.courseModel = new CourseModel();
    this.view        = new ProgressView();
  }

  async showProgress() {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "progress");
    const uid  = this.app.getUser().uid;
    const lang = window.__i18n.current;

    const [allProgress, allCourses] = await Promise.all([
      this.quizModel.getAllProgressForUser(uid),
      this.courseModel.getAllCourses(),
    ]);

    // Merge progress with course info
    const data = allProgress.map((p) => {
      const course = allCourses.find(c => c.id === p.courseId);
      return { ...p, course, totalLessons: course?.lessonCount || 0 };
    });

    const html = this.view.renderProgress(data, lang);
    this._renderPage(html, "progress");

    document.querySelectorAll("[data-goto-course]").forEach(btn => {
      btn.addEventListener("click", () => this.app.navigate("course", btn.dataset.gotoCourse));
    });
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }
}

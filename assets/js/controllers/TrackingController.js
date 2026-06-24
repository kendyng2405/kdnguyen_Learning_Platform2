// ============================================================
//  TrackingController.js - Teacher course analytics
// ============================================================

import { CourseModel } from "../models/CourseModel.js?v=10";
import { QuizModel }   from "../models/QuizModel.js?v=11";
import { TrackingView } from "../views/TrackingView.js?v=10";

export class TrackingController {
  constructor(app) {
    this.app = app;
    this.courseModel = new CourseModel();
    this.quizModel = new QuizModel();
    this.view = new TrackingView();
  }

  async showTracking() {
    const lang = window.__i18n.current;
    if (!this.app.canManageCourses()) {
      this._renderPage(this.view.renderDenied(lang), "tracking");
      return;
    }

    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "tracking");
    try {
      const uid = this.app.getUser()?.uid;
      const [courses, users, allProgress] = await Promise.all([
        this.app.isSystemAdmin()
          ? this.courseModel.getAllCourses()
          : this.courseModel.getCoursesForInstructor(uid, false),
        this.app.authModel.getAllUsers(500).catch(() => []),
        this.quizModel.getAllProgressDocs(),
      ]);
      const reports = await Promise.all(courses.map(course => this._buildCourseReport(course, users, allProgress)));
      const summary = this._summary(reports);
      this._renderPage(this.view.renderTracking(reports, summary, lang), "tracking");
      this._bindEvents();
    } catch (error) {
      console.error(error);
      this._renderPage(this.view.renderError(lang), "tracking");
    }
  }

  async _buildCourseReport(course, users, allProgress = []) {
    const [lessons, quizzes] = await Promise.all([
      this.courseModel.getLessons(course.id),
      this.quizModel.getQuizzesByCourse(course.id),
    ]);
    const progressRows = allProgress.filter(item => (
      item.courseId === course.id && this._isEnrollmentProgress(item)
    ));
    const usersById = new Map(users.map(user => [user.uid || user.id, user]));
    const lessonCount = lessons.length;
    const quizCount = quizzes.length;
    const quizMap = new Map(quizzes.map(quiz => [quiz.id, quiz]));

    const learners = progressRows.map(progress => {
      const user = usersById.get(progress.uid) || {};
      const completedLessons = Array.isArray(progress.completedLessons) ? progress.completedLessons.length : 0;
      const scores = Object.entries(progress.quizScores || {}).map(([quizId, score]) => {
        const quiz = quizMap.get(quizId);
        const pct = Number(score?.percentage ?? (score?.total ? (score.score / score.total) * 100 : 0));
        return {
          quizId,
          title: quiz?.title || "Quiz",
          percentage: Math.round(pct),
          passed: pct >= (quiz?.passingScore || 60),
          takenAt: score?.takenAt || null,
        };
      });
      const averageScore = scores.length
        ? Math.round(scores.reduce((sum, item) => sum + item.percentage, 0) / scores.length)
        : null;

      return {
        uid: progress.uid,
        name: user.fullname || user.username || progress.uid || "Learner",
        username: user.username ? `@${user.username}` : "",
        email: user.email || "",
        completedLessons,
        totalLessons: lessonCount,
        progressPct: lessonCount ? Math.round((completedLessons / lessonCount) * 100) : 0,
        quizTaken: scores.length,
        quizTotal: quizCount,
        averageScore,
        scores,
        lastUpdated: progress.lastUpdated || progress.enrolledAt || null,
      };
    }).sort((a, b) => b.progressPct - a.progressPct || (b.averageScore || 0) - (a.averageScore || 0));

    const avgProgress = learners.length
      ? Math.round(learners.reduce((sum, row) => sum + row.progressPct, 0) / learners.length)
      : 0;
    const scored = learners.filter(row => row.averageScore !== null);
    const avgScore = scored.length
      ? Math.round(scored.reduce((sum, row) => sum + row.averageScore, 0) / scored.length)
      : 0;

    return {
      id: course.id,
      title: course.title || "Course",
      shortTitle: this._shortTitle(course.title || "Course"),
      category: course.category || "",
      lessonCount,
      quizCount,
      learners,
      avgProgress,
      avgScore,
      completedCount: learners.filter(row => lessonCount > 0 && row.completedLessons >= lessonCount).length,
    };
  }

  _summary(reports) {
    const learners = reports.flatMap(report => report.learners);
    const scored = learners.filter(row => row.averageScore !== null);
    return {
      totalCourses: reports.length,
      totalLearners: learners.length,
      avgProgress: learners.length
        ? Math.round(learners.reduce((sum, row) => sum + row.progressPct, 0) / learners.length)
        : 0,
      avgScore: scored.length
        ? Math.round(scored.reduce((sum, row) => sum + row.averageScore, 0) / scored.length)
        : 0,
    };
  }

  _shortTitle(title) {
    const words = String(title || "").trim().split(/\s+/);
    if (words.length <= 2) return title;
    return words.slice(0, 2).join(" ");
  }

  _bindEvents() {
    document.querySelectorAll("[data-tracking-course]").forEach(button => {
      button.addEventListener("click", () => this.app.navigate("course", button.dataset.trackingCourse));
    });
  }

  _isEnrollmentProgress(progress) {
    return !!(
      progress?.enrolledAt ||
      progress?.lastUpdated ||
      progress?.completedLessons?.length ||
      Object.keys(progress?.quizScores || {}).length
    );
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }
}

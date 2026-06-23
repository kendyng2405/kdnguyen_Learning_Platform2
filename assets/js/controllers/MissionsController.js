// ============================================================
//  MissionsController.js - Daily learning missions
// ============================================================

import { CourseModel } from "../models/CourseModel.js?v=9";
import { QuizModel } from "../models/QuizModel.js?v=9";
import { MissionsView } from "../views/MissionsView.js?v=9";

export class MissionsController {
  constructor(app) {
    this.app = app;
    this.courseModel = new CourseModel();
    this.quizModel = new QuizModel();
    this.view = new MissionsView();
  }

  async showMissions() {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "missions");
    const uid = this.app.getUser()?.uid;
    const lang = window.__i18n.current;
    const profile = this.app.getUserProfile();

    try {
      const [courses, progress] = await Promise.all([
        this.courseModel.getAllCourses(),
        this.quizModel.getAllProgressForUser(uid),
      ]);
      const stats = this._buildStats(courses, progress, profile);
      const missions = this._buildMissions(stats, lang);
      this._renderPage(this.view.renderMissions(stats, missions, lang), "missions");
    } catch (e) {
      window.__toast.error(e.message);
      this._renderPage(this.view.renderError(lang), "missions");
    }
  }

  _buildStats(courses, progress, profile) {
    const completedLessons = progress.reduce((sum, item) => (
      sum + (Array.isArray(item.completedLessons) ? item.completedLessons.length : 0)
    ), 0);
    const quizAttempts = progress.reduce((sum, item) => (
      sum + Object.keys(item.quizScores || {}).length
    ), 0);
    const passedQuizzes = progress.reduce((sum, item) => (
      sum + Object.values(item.quizScores || {}).filter(score => (score.percentage || 0) >= 60).length
    ), 0);
    const enrolledCourses = progress.filter(item => item.enrolledAt).length || (profile?.enrolledCourses || []).length;
    const totalLessons = courses.reduce((sum, course) => sum + (course.lessonCount || 0), 0);

    return {
      completedLessons,
      totalLessons,
      quizAttempts,
      passedQuizzes,
      enrolledCourses,
      xp: profile?.xp || 0,
      streak: profile?.streak || 0,
    };
  }

  _buildMissions(stats, lang) {
    const vi = lang === "vi";
    return [
      {
        icon: "fa-book-open",
        tone: "primary",
        title: vi ? "Hoàn thành 2 bài học" : "Complete 2 lessons",
        description: vi ? "Mở khóa bảng xếp hạng và bắt đầu cạnh tranh XP." : "Unlock the leaderboard and start competing with XP.",
        progress: stats.completedLessons,
        target: 2,
        reward: vi ? "Mở khóa bảng xếp hạng" : "Unlock leaderboard",
      },
      {
        icon: "fa-fire",
        tone: "danger",
        title: vi ? "Giữ chuỗi học hôm nay" : "Keep today's streak",
        description: vi ? "Vào học mỗi ngày để duy trì nhịp học đều đặn." : "Study every day to keep a steady learning rhythm.",
        progress: Math.min(stats.streak, 7),
        target: 7,
        reward: vi ? "+10 XP đăng nhập mỗi ngày" : "+10 daily login XP",
      },
      {
        icon: "fa-clipboard-check",
        tone: "success",
        title: vi ? "Luyện quiz" : "Practice quizzes",
        description: vi ? "Làm quiz để kiểm tra kiến thức ngay sau khi học." : "Take quizzes to check your knowledge after learning.",
        progress: stats.quizAttempts,
        target: 3,
        reward: vi ? "Tăng độ chính xác" : "Improve accuracy",
      },
      {
        icon: "fa-layer-group",
        tone: "info",
        title: vi ? "Theo một lộ trình" : "Follow a learning path",
        description: vi ? "Đăng ký ít nhất một khóa học và đi theo từng bài." : "Enroll in a course and move through its lessons.",
        progress: stats.enrolledCourses,
        target: 1,
        reward: vi ? "Có lộ trình rõ ràng" : "Clear study path",
      },
    ];
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }
}

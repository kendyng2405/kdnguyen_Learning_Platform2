// ============================================================
//  CalendarController.js - Weekly schedule, deadlines, AI reminders
// ============================================================

import { CourseModel } from "../models/CourseModel.js?v=9";
import { QuizModel } from "../models/QuizModel.js?v=9";
import { CalendarView } from "../views/CalendarView.js?v=9";

export class CalendarController {
  constructor(app) {
    this.app = app;
    this.courseModel = new CourseModel();
    this.quizModel = new QuizModel();
    this.view = new CalendarView();
    this.tasks = [];
  }

  async showCalendar() {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "calendar");
    const uid = this.app.getUser()?.uid;
    const lang = window.__i18n.current;

    try {
      const [courses, progress] = await Promise.all([
        this.courseModel.getAllCourses(),
        this.quizModel.getAllProgressForUser(uid),
      ]);
      const progressMap = Object.fromEntries(progress.map(item => [item.courseId, item]));
      const enrolledCourses = courses.filter(course => this._hasStarted(progressMap[course.id]));

      const courseBundles = await Promise.all(enrolledCourses.map(async (course) => {
        const [lessons, quizzes] = await Promise.all([
          this.courseModel.getLessons(course.id),
          this.quizModel.getQuizzesByCourse(course.id),
        ]);
        return { course, progress: progressMap[course.id], lessons, quizzes };
      }));

      const week = this._buildWeek(new Date());
      this.tasks = this._buildWeekTasks(courseBundles, week, lang);
      this._renderPage(this.view.renderCalendar(week, this.tasks, courseBundles, lang), "calendar");
      this._bindCalendarEvents();
    } catch (e) {
      window.__toast.error(e.message);
      this._renderPage(this.view.renderError(lang), "calendar");
    }
  }

  _hasStarted(progress) {
    return !!progress?.enrolledAt
      || (progress?.completedLessons || []).length > 0
      || Object.keys(progress?.quizScores || {}).length > 0;
  }

  _buildWeek(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const dayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - dayOffset);

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }

  _buildWeekTasks(courseBundles, week, lang) {
    const tasks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = week[0].getTime();
    const weekEnd = new Date(week[6]);
    weekEnd.setHours(23, 59, 59, 999);

    courseBundles.forEach((bundle, bundleIndex) => {
      const completed = bundle.progress?.completedLessons || [];
      const nextLessons = bundle.lessons.filter(lesson => !completed.includes(lesson.id)).slice(0, 3);

      nextLessons.forEach((lesson, lessonIndex) => {
        const dayIndex = Math.min(6, Math.max(0, ((today.getTime() - weekStart) / 86400000 | 0) + lessonIndex + bundleIndex));
        const date = week[dayIndex] || week[0];
        tasks.push({
          type: "study",
          tone: "primary",
          icon: "fa-book-open",
          dateKey: this._dateKey(date),
          title: lesson.title,
          courseTitle: bundle.course.title,
          subtitle: lang === "vi" ? "Buổi học gợi ý" : "Suggested study session",
          time: `${9 + ((bundleIndex + lessonIndex) % 5)}:00`,
          action: { page: "lesson", courseId: bundle.course.id, itemId: lesson.id },
        });
      });

      bundle.quizzes.forEach((quiz) => {
        const close = quiz.closeTime ? new Date(quiz.closeTime) : null;
        if (close && close >= week[0] && close <= weekEnd) {
          tasks.push({
            type: "deadline",
            tone: "danger",
            icon: "fa-hourglass-half",
            dateKey: this._dateKey(close),
            title: quiz.title,
            courseTitle: bundle.course.title,
            subtitle: lang === "vi" ? "Deadline assignment / quiz" : "Assignment / quiz deadline",
            time: close.toLocaleTimeString(lang === "vi" ? "vi-VN" : "en-US", { hour: "2-digit", minute: "2-digit" }),
            action: { page: "quiz", courseId: bundle.course.id, itemId: quiz.id },
          });
        }
      });
    });

    if (!tasks.length && courseBundles.length) {
      const bundle = courseBundles[0];
      tasks.push({
        type: "study",
        tone: "success",
        icon: "fa-seedling",
        dateKey: this._dateKey(new Date()),
        title: lang === "vi" ? "Ôn lại lộ trình học" : "Review your learning path",
        courseTitle: bundle.course.title,
        subtitle: lang === "vi" ? "AI có thể gợi ý kế hoạch học tiếp" : "AI can suggest the next study plan",
        time: "20:00",
        action: { page: "course", courseId: bundle.course.id },
      });
    }

    return tasks.sort((a, b) => `${a.dateKey} ${a.time}`.localeCompare(`${b.dateKey} ${b.time}`));
  }

  _bindCalendarEvents() {
    document.querySelectorAll("[data-calendar-task]").forEach(button => {
      button.addEventListener("click", () => {
        const idx = parseInt(button.dataset.calendarTask, 10);
        const task = this.tasks[idx];
        if (!task?.action) return;
        if (task.action.page === "lesson") this.app.navigate("lesson", task.action.courseId, task.action.itemId);
        if (task.action.page === "quiz") this.app.navigate("quiz", task.action.courseId, task.action.itemId);
        if (task.action.page === "course") this.app.navigate("course", task.action.courseId);
      });
    });

    document.querySelectorAll("[data-ai-reminder]").forEach(button => {
      button.addEventListener("click", () => {
        const task = this.tasks[parseInt(button.dataset.aiReminder, 10)];
        if (task) this._askAIForReminder(task);
      });
    });
  }

  _askAIForReminder(task) {
    const lang = window.__i18n.current;
    const msg = lang === "vi"
      ? `Hãy tạo lời nhắc học ngắn gọn và kế hoạch 3 bước cho nhiệm vụ "${task.title}" trong khóa "${task.courseTitle}", thời gian ${task.time}. Nếu là deadline, ưu tiên cách hoàn thành trước hạn.`
      : `Create a short study reminder and a 3-step plan for "${task.title}" in "${task.courseTitle}" at ${task.time}. If it is a deadline, prioritize finishing before it is due.`;

    const chatInput = document.getElementById("chatbotInput");
    const fab = document.getElementById("chatbotFab");
    const chatSend = document.getElementById("chatbotSend");
    if (!this.app.chatbotController.isOpen) fab?.click();
    if (chatInput && chatSend) {
      chatInput.value = msg;
      chatSend.click();
    }
  }

  _dateKey(date) {
    return date.toISOString().slice(0, 10);
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }
}

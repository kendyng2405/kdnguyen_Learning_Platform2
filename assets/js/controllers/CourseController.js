// ============================================================
//  CourseController.js — Course & Lesson Business Logic
// ============================================================

import { CourseModel } from "../models/CourseModel.js?v=10";
import { QuizModel }   from "../models/QuizModel.js?v=12";
import { CourseView }  from "../views/CourseView.js?v=14";

export class CourseController {
  constructor(app) {
    this.app         = app;
    this.courseModel = new CourseModel();
    this.quizModel   = new QuizModel();
    this.view        = new CourseView();
  }

  async showDashboard() {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "dashboard");
    const [courses, allProgress, enrollmentCounts] = await Promise.all([
      this.courseModel.getAllCourses(),
      this.quizModel.getAllProgressForUser(this.app.getUser().uid),
      this.quizModel.getEnrollmentCountsByCourse(),
    ]);
    const lang    = window.__i18n.current;
    const profile = this.app.getUserProfile();
    const html    = this.view.renderDashboard(this._withEnrollmentCounts(courses, enrollmentCounts), allProgress, profile, lang);
    this._renderPage(html, "dashboard");
    this._bindCourseCards();
  }

  async showCourseList() {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "courses");
    const uid     = this.app.getUser().uid;
    const profile = this.app.getUserProfile();
    const lang    = window.__i18n.current;
    const [courses, allProgress, enrollmentCounts] = await Promise.all([
      this.courseModel.getAllCourses(),
      this.quizModel.getAllProgressForUser(uid),
      this.quizModel.getEnrollmentCountsByCourse(),
    ]);
    const progressMap = Object.fromEntries(allProgress.map(p => [p.courseId, p]));

    const html = this.view.renderCourseList(this._withEnrollmentCounts(courses, enrollmentCounts), progressMap, profile, lang);
    this._renderPage(html, "courses");
    this._bindCourseCards();
    this._bindEnrollButtons();
  }

  async showCourseDetail(courseId) {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "course-detail");
    const [course, lessons, quizzes, enrollmentCounts] = await Promise.all([
      this.courseModel.getCourseById(courseId),
      this.courseModel.getLessons(courseId),
      this.quizModel.getQuizzesByCourse(courseId),
      this.quizModel.getEnrollmentCountsByCourse(),
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

    const html = this.view.renderCourseDetail(this._withEnrollmentCount(course, enrollmentCounts), lessons, quizzes, progress, profile, lang);
    this._renderPage(html, "course-detail");
    this._bindLessonItems(courseId);
    this._bindQuizItems(courseId);
    document.getElementById("backToCourses")?.addEventListener("click", () => this.app.navigate("courses"));
    document.getElementById("enrollBtn")?.addEventListener("click", () => this._enroll(courseId));
    
    // AI Study Plan
    document.getElementById("btnStudyPlan")?.addEventListener("click", (e) => {
      const btn = e.target;
      const title = btn.dataset.course;
      window.__prompt(
        lang === "vi" ? "Lên kế hoạch học tập (AI)" : "AI Study Plan",
        lang === "vi" ? "Bạn muốn học khóa này trong bao lâu? (VD: 7 ngày)" : "How long to finish? (e.g. 7 days)",
        (days) => {
          const msg = lang === "vi"
            ? `Lập cho tôi kế hoạch học khóa "${title}" trong vòng ${days}. Bao gồm các mục tiêu từng ngày.`
            : `Generate a study plan for the course "${title}" over ${days}. Include daily goals.`;
            
          const chatInput = document.getElementById("chatbotInput");
          const fab = document.getElementById("chatbotFab");
          const chatSend = document.getElementById("chatbotSend");
          
          if (!this.app.chatbotController.isOpen) {
            fab?.click();
          }
          
          if (chatInput && chatSend) {
            chatInput.value = msg;
            chatSend.click();
          }
        }
      );
    });
  }

  async showLesson(courseId, lessonId) {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "lesson");
    const [course, lesson, lessons] = await Promise.all([
      this.courseModel.getCourseById(courseId),
      this.courseModel.getLessonById(courseId, lessonId),
      this.courseModel.getLessons(courseId),
    ]);

    if (!lesson) {
      window.__toast.error("Lesson not found");
      this.app.navigate("course", courseId);
      return;
    }

    const uid      = this.app.getUser().uid;
    const progress = await this.quizModel.getProgress(uid, courseId);
    const lang     = window.__i18n.current;
    const navigation = this._lessonNavigation(lessons, lessonId);

    const html = this.view.renderLesson(course, lesson, progress, lang, navigation);
    this._renderPage(html, "lesson");

    let completed = progress?.completedLessons?.includes(lessonId);
    const markComplete = async ({ silent = false } = {}) => {
      if (!completed) {
        await this.quizModel.markLessonComplete(uid, courseId, lessonId);
        completed = true;
        if (!silent) {
          window.__toast.success(lang === "vi" ? "Đã hoàn thành bài học! 🎉" : "Lesson completed! 🎉");
        }
      }

      const markBtn = document.getElementById("markCompleteBtn");
      if (markBtn) {
        markBtn.disabled = true;
        markBtn.classList.remove("btn-primary");
        markBtn.classList.add("btn-success");
        markBtn.textContent = lang === "vi" ? "✓ Đã hoàn thành" : "✓ Completed";
      }

      const nextBtn = document.getElementById("nextLessonBtn");
      if (nextBtn) {
        nextBtn.innerHTML = `<i class="fas fa-arrow-right mr-2"></i>${lang === "vi" ? "Bài tiếp theo" : "Next lesson"}`;
      }
    };

    document.getElementById("markCompleteBtn")?.addEventListener("click", () => markComplete());

    document.getElementById("nextLessonBtn")?.addEventListener("click", async (event) => {
      const btn = event.currentTarget;
      const nextLessonId = btn.dataset.nextLessonId;
      if (!nextLessonId) return;
      btn.disabled = true;
      await markComplete({ silent: true });
      this.app.navigate("lesson", courseId, nextLessonId);
    });

    document.getElementById("backToCourse")?.addEventListener("click", () => this.app.navigate("course", courseId));
    this._bindLessonMiniQuiz(lang);
    
  }

  async _enroll(courseId) {
    const uid = this.app.getUser()?.uid;
    if (!uid) return;
    const lang = window.__i18n.current;

    try {
      const course = await this.courseModel.getCourseById(courseId);
      
      const doEnroll = async () => {
        await this.quizModel.enrollCourse(uid, courseId);
        const profile = this.app.getUserProfile();
        if (profile) {
          const enrolledCourses = Array.isArray(profile.enrolledCourses) ? profile.enrolledCourses : [];
          if (!enrolledCourses.includes(courseId)) {
            profile.enrolledCourses = [...enrolledCourses, courseId];
          }
        }
        window.__toast.success(lang === "vi" ? "Đăng ký khóa học thành công!" : "Enrolled successfully!");
        this.showCourseDetail(courseId);
      };

      if (course?.password) {
        window.__prompt(
          lang === "vi" ? "Khóa học này yêu cầu mật khẩu" : "This course requires a password",
          lang === "vi" ? "Nhập mật khẩu..." : "Enter password...",
          (val) => {
            if (val === course.password) {
              doEnroll();
            } else {
              window.__toast.error(lang === "vi" ? "Mật khẩu không đúng!" : "Incorrect password!");
            }
          },
          true // isPassword = true
        );
      } else {
        await doEnroll();
      }
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

  _bindLessonMiniQuiz(lang) {
    const t = lang === "vi" ? {
      correct: "Chính xác",
      wrong: "Chưa đúng",
      correctAnswer: "Đáp án đúng",
    } : {
      correct: "Correct",
      wrong: "Not quite",
      correctAnswer: "Correct answer",
    };

    document.querySelectorAll("[data-mini-quiz-option]").forEach(button => {
      button.addEventListener("click", () => {
        const card = button.closest("[data-mini-quiz-question]");
        if (!card || card.dataset.answered === "true") return;

        card.dataset.answered = "true";
        const isCorrect = button.dataset.correct === "true";
        const options = card.querySelectorAll("[data-mini-quiz-option]");
        options.forEach(option => {
          option.disabled = true;
          if (option.dataset.correct === "true") option.classList.add("is-correct");
        });

        button.classList.add(isCorrect ? "is-selected-correct" : "is-selected-wrong");

        const feedback = card.querySelector("[data-mini-quiz-feedback]");
        const title = feedback?.querySelector("[data-mini-quiz-feedback-title]");
        const text = feedback?.querySelector("[data-mini-quiz-feedback-text]");
        if (feedback && title && text) {
          feedback.classList.add(isCorrect ? "is-correct" : "is-wrong", "show");
          title.textContent = isCorrect ? t.correct : t.wrong;
          text.textContent = isCorrect
            ? (lang === "vi" ? "Bạn đã chọn đúng." : "You picked the right answer.")
            : `${t.correctAnswer}: ${feedback.dataset.correctLabel || ""}`;
        }
      });
    });
  }

  _lessonNavigation(lessons, lessonId) {
    const safeLessons = Array.isArray(lessons) ? lessons : [];
    const currentIndex = safeLessons.findIndex(lesson => lesson.id === lessonId);
    return {
      previousLesson: currentIndex > 0 ? safeLessons[currentIndex - 1] : null,
      nextLesson: currentIndex >= 0 && currentIndex < safeLessons.length - 1 ? safeLessons[currentIndex + 1] : null,
    };
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }

  _withEnrollmentCounts(courses, counts = {}) {
    return courses.map(course => this._withEnrollmentCount(course, counts));
  }

  _withEnrollmentCount(course, counts = {}) {
    if (!course) return course;
    return { ...course, enrolledCount: counts[course.id] || 0 };
  }
}

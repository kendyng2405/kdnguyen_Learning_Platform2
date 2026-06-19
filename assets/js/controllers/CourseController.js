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
    
    // AI Summarize
    document.getElementById("btnSummarizeLesson")?.addEventListener("click", async (e) => {
      const btn = e.target;
      const title = btn.dataset.title;
      let text = btn.dataset.content;
      const videoUrl = btn.dataset.videourl;
      
      // limit text size just in case
      if (text.length > 3000) text = text.substring(0, 3000) + "...";
      
      let msg = "";
      if (text && text.trim().length > 0) {
        msg = lang === "vi" 
          ? `Tóm tắt giúp tôi những ý chính của bài học "${title}" sau đây:\n\n${text}`
          : `Please summarize the key points of the lesson "${title}":\n\n${text}`;
      } else if (videoUrl) {
        const btnText = btn.innerHTML;
        btn.innerHTML = "⏳...";
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
            try {
              html = await fetchHtml(`https://api.allorigins.win/raw?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + videoId)}`);
            } catch (e1) {
              try {
                html = await fetchHtml(`https://corsproxy.io/?${encodeURIComponent("https://www.youtube.com/watch?v=" + videoId)}`);
              } catch (e2) {}
            }

            const match = html.match(/"captionTracks":\[\{"baseUrl":"([^"]+)"/);
            if (match) {
              const captionUrl = match[1].replace(/\\u0026/g, "&").replace(/\\\//g, "/");
              let xml = "";
              try {
                 xml = await fetchHtml(`https://api.allorigins.win/raw?url=${encodeURIComponent(captionUrl)}`);
              } catch(e3) {
                 xml = await fetchHtml(`https://corsproxy.io/?${encodeURIComponent(captionUrl)}`);
              }
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(xml, "text/xml");
              const textNodes = xmlDoc.getElementsByTagName("text");
              for (let i = 0; i < textNodes.length; i++) {
                  transcript += textNodes[i].textContent + " ";
              }
            }

            // Remove the hardcoded mock transcript.
            // If transcript is empty, we will rely on Gemini's native YouTube processing capability
          }
        } catch(e) { console.error("Transcript error", e); }
        
        btn.innerHTML = btnText;
        btn.disabled = false;

        if (transcript && transcript.length > 50) {
          if (transcript.length > 15000) transcript = transcript.substring(0, 15000) + "...";
          msg = lang === "vi"
            ? `Dựa vào toàn bộ phụ đề (transcript) của video bài học "${title}" dưới đây, hãy làm các việc sau:\n1. Tóm tắt ngắn gọn.\n2. Lập Timeline theo nội dung.\n3. Trích xuất các Khái niệm chính (Key concepts).\n4. Tạo 3 câu hỏi trắc nghiệm (Quiz).\n5. Tạo 3 thẻ ghi nhớ (Flashcard).\n\nTranscript:\n${transcript}`
            : `Based on the video transcript of the lesson "${title}" below, please provide:\n1. A short summary.\n2. A timeline of events/topics.\n3. Key concepts.\n4. A 3-question quiz.\n5. 3 study flashcards.\n\nTranscript:\n${transcript}`;
        } else {
          // Fallback: If transcript proxy fails, pass the URL and instruct Gemini to use its YouTube integration
          msg = lang === "vi"
            ? `Dưới đây là một video bài học từ YouTube. Link video: ${videoUrl}\n\nHãy sử dụng công cụ YouTube Workspace của bạn để xem nội dung video và thực hiện các việc sau: 1. Tóm tắt. 2. Timeline. 3. Các khái niệm chính. 4. 3 câu hỏi Quiz. 5. 3 Flashcards.\nCẢNH BÁO QUAN TRỌNG: Nếu bạn không thể truy cập, không thể xem nội dung thực tế của video này, hoặc bị chặn, BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP ĐOÁN HAY TỰ TẠO NỘI DUNG DỰA VÀO TIÊU ĐỀ. Nếu không xem được video, hãy chỉ trả lời duy nhất chuỗi này: "ERROR_CANNOT_ACCESS_VIDEO".`
            : `Here is a YouTube video. Link: ${videoUrl}\n\nPlease use your native YouTube capabilities to analyze the video and provide: 1. Summary. 2. Timeline. 3. Key concepts. 4. Quiz. 5. Flashcards.\nIMPORTANT WARNING: If you cannot access the actual video content or it is blocked, YOU MUST NOT GUESS OR HALLUCINATE based on the title. If you cannot read the video, reply EXACTLY with this string: "ERROR_CANNOT_ACCESS_VIDEO".`;
        }
      } else {
        msg = lang === "vi"
          ? `Hãy giải thích chi tiết khái niệm "${title}" là gì giúp tôi nhé.`
          : `Please explain the concept of "${title}" in detail.`;
      }
        
      const chatInput = document.getElementById("chatbotInput");
      const fab = document.getElementById("chatbotFab");
      const chatSend = document.getElementById("chatbotSend");
      
      if (!this.app.chatbotController.isOpen) {
        fab?.click();
      }
      
      if (chatInput && chatSend) {
        // Intercept sending to check for error response
        chatInput.value = msg;
        
        // Let the normal chatbot send flow happen, but we can hook into ChatbotController 
        // to filter "ERROR_CANNOT_ACCESS_VIDEO". Actually, the chatbot UI will show the user 
        // the error if Gemini returns it, which is fine! 
        // Or we can just let it type it out, or we can add a filter in ChatbotController.
        chatSend.click();
      }
    });
  }

  async _enroll(courseId) {
    const uid = this.app.getUser()?.uid;
    if (!uid) return;
    const lang = window.__i18n.current;

    try {
      const course = await this.courseModel.getCourseById(courseId);
      
      const doEnroll = async () => {
        await this.quizModel.enrollCourse(uid, courseId);
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

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }
}

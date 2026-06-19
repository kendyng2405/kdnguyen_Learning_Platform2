// ============================================================
//  ChatbotController.js — AI Chatbot via Gemini API
//  Tự động thử nhiều model nếu model đầu bị lỗi 404
// ============================================================

import { GEMINI_PROXY_URL } from "../config.js";

// Thứ tự ưu tiên: thử từ trên xuống, dùng cái đầu tiên OK
//const GEMINI_MODELS = [
//  "gemini-2.5-flash",
//  "gemini-2.5-flash-lite",
//];

// const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export class ChatbotController {
  constructor(app) {
    this.app         = app;
    this.isOpen      = false;
    this.history     = [];
    this.isTyping    = false;
    this.activeModel = null;
    this._bindFAB();
    this._bindInput();
  }

  _bindFAB() {
    document.getElementById("chatbotFab")?.addEventListener("click", () => {
      this.isOpen ? this._closeChat() : this._openChat();
    });
    document.getElementById("chatbotClose")?.addEventListener("click", () => this._closeChat());
  }

  _bindInput() {
    const input = document.getElementById("chatbotInput");
    const send  = document.getElementById("chatbotSend");
    send?.addEventListener("click", () => this._handleSend());
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this._handleSend();
      }
    });
  }

  _openChat() {
    this.isOpen = true;
    document.getElementById("chatbotWidget")?.classList.add("open");
    document.getElementById("fabBadge")?.classList.add("hidden");
    document.getElementById("chatbotInput")?.focus();
  }

  _closeChat() {
    this.isOpen = false;
    document.getElementById("chatbotWidget")?.classList.remove("open");
  }

  async _handleSend() {
    if (this.isTyping) return;
    const input = document.getElementById("chatbotInput");
    const msg   = input?.value.trim();
    if (!msg) return;

    input.value = "";
    this._appendMessage("user", msg);
    this._showTyping();

    try {
      const reply = await this._callGemini(msg);
      this._hideTyping();
      if (reply.includes("ERROR_CANNOT_ACCESS_VIDEO")) {
        const lang = window.__i18n?.current || "vi";
        this._appendMessage("bot", lang === "vi" 
          ? "🚫 Lỗi: YouTube đã chặn hệ thống lấy phụ đề của video này. Bạn hãy thử nhập API Key của riêng bạn vào mục Admin, hoặc tự copy nội dung video vào đây nhé!" 
          : "🚫 Error: YouTube blocked transcript access. Please use your own API Key in the Admin panel, or copy the transcript manually.");
        return;
      }
      this._appendMessage("bot", reply);
    } catch (e) {
      this._hideTyping();
      console.error("[KDLearnBot] Error:", e.message);
      const lang = window.__i18n?.current || "vi";
      if (e.message.includes("1048576") || e.message.includes("exceeds the maximum number of tokens")) {
        this._appendMessage("bot", lang === "vi"
          ? "🚫 Lỗi: Video này quá dài (vượt quá giới hạn 1 triệu token). AI không thể phân tích hết được, bạn có thể chọn video ngắn hơn nha!"
          : "🚫 Error: This video is too long (exceeds 1 million token limit). Please choose a shorter video!");
      } else {
        this._appendMessage("bot", lang === "vi"
          ? "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau!"
          : "Sorry, I'm having issues. Please try again later!");
      }
    }
  }

  async _callGemini(userMessage) {
    const profile  = this.app.getUserProfile();
    const lang     = window.__i18n?.current || "vi";
    const userName = profile?.username || profile?.fullname || "bạn";

    let contextStr = "";
    const currentPath = this.app.currentPath || "";
    
    try {
      if (currentPath.startsWith("/lesson/")) {
        const parts = currentPath.split("/");
        const courseId = parts[2];
        const lessonId = parts[3];
        const lesson = await this.app.courseModel.getLessonById(courseId, lessonId);
        if (lesson) {
          // Limit context size to avoid exceeding tokens, just in case
          let content = lesson.content || "";
          if (content.length > 8000) content = content.substring(0, 8000) + "...";
          contextStr = `\nContext: Học viên đang ở bài học "${lesson.title}" thuộc khóa học ID ${courseId}. Nội dung chính của bài học:\n${content}\n\nHãy hỗ trợ học viên dựa trên nội dung bài học này. Dùng Socratic method để dạy, không nói thẳng đáp án nếu học viên hỏi bài.`;
        }
      } else if (currentPath.startsWith("/quiz/")) {
        const parts = currentPath.split("/");
        const courseId = parts[2];
        const quizId = parts[3];
        const quiz = await this.app.quizModel.getQuizById(courseId, quizId);
        if (quiz) {
          const questions = quiz.questions.map((q, i) => `Câu ${i+1}: ${q.q}\nCác lựa chọn: ${q.options.join(" | ")}`).join("\n");
          contextStr = `\nContext: Học viên đang làm bài quiz "${quiz.title}".\nNội dung các câu hỏi trong quiz:\n${questions}\n\nHãy dùng Socratic method để gợi ý, KHÔNG BAO GIỜ đưa đáp án trực tiếp cho quiz. Khuyến khích học viên tự tìm ra câu trả lời.`;
        }
      }
    } catch (e) {
      console.warn("Could not fetch context data for chatbot", e);
    }

   const systemPrompt = lang === "vi"
    ? `Bạn là KDLearnBot - trợ lý AI thông minh của KDLearnSpace. Trả lời thân thiện, xưng là mình và gọi người dùng là bạn.\nQUAN TRỌNG: Bạn ĐÃ ĐƯỢC CUNG CẤP nội dung của trang web hiện tại trong phần "Context" bên dưới. NẾU người dùng hỏi về "trang này", "câu hỏi này", "bài học này" hoặc hỏi các câu hỏi liên quan đến nội dung đang học, HÃY DỰA VÀO phần Context để trả lời. TUYỆT ĐỐI KHÔNG BẢO LÀ "không thể nhìn thấy trang", "không có khả năng truy cập", v.v. vì bạn đã có toàn bộ dữ liệu ở phần Context. ${contextStr}`
    : `You are KDLearnBot, a smart AI tutor for KDLearnSpace. Always reply directly and kindly.\nIMPORTANT: You HAVE BEEN PROVIDED the content of the current page in the "Context" section below. IF the user asks about "this page", "this question", "this lesson", you MUST USE the Context to answer. NEVER SAY "I cannot see your screen" or "I don't have access to the page" because you already have the data in Context. ${contextStr}`;

    this.history.push({ role: "user", parts: [{ text: userMessage }] });
    if (this.history.length > 20) this.history = this.history.slice(-20);

    let finalHistory = [];
    for (const msg of this.history) {
      if (msg.role === "user" && msg.parts[0]?.text) {
         let text = msg.parts[0].text;
         let ytMatch = text.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s?"']+)/);
         if (ytMatch) {
            finalHistory.push({
               role: "user",
               parts: [
                 { fileData: { fileUri: "https://www.youtube.com/watch?v=" + ytMatch[1], mimeType: "video/mp4" } },
                 { text: text }
               ]
            });
         } else {
            finalHistory.push(msg);
         }
      } else {
         finalHistory.push(msg);
      }
    }

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: finalHistory,
      generationConfig: { temperature: 0.7, maxOutputTokens: 5000 },
    };

    return await this._fetchModel(null, body);
  }

async _fetchModel(model, body) {
  let url = GEMINI_PROXY_URL;
  if (window.APP_CONFIG?.geminiKey) {
     url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + window.APP_CONFIG.geminiKey;
  }

  const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
  });

  if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  
  console.log("[KDLearnBot] Full Gemini Response:", JSON.stringify(data, null, 2));

  const candidate = data.candidates?.[0];
  if (!candidate?.content?.parts?.[0]?.text) {
    console.warn("[KDLearnBot] Empty response - finishReason:", candidate?.finishReason);
    throw new Error("Empty response from Gemini");
  }

  const reply = candidate.content.parts[0].text;
  this.history.push({ role: "model", parts: [{ text: reply }] });
  return reply;
}

  _appendMessage(role, text) {
    const messages = document.getElementById("chatbotMessages");
    if (!messages) return;
    const div = document.createElement("div");
    div.className = `chat-message chat-message--${role} animate-in`;
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
    div.innerHTML = role === "bot"
      ? `<span class="chat-avatar">🤖</span><div class="chat-bubble">${formatted}</div>`
      : `<div class="chat-bubble">${formatted}</div><span class="chat-avatar">👤</span>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  _showTyping() {
    this.isTyping = true;
    const messages = document.getElementById("chatbotMessages");
    if (!messages) return;
    const div = document.createElement("div");
    div.id = "typingIndicator";
    div.className = "chat-message chat-message--bot";
    div.innerHTML = `<span class="chat-avatar">🤖</span><div class="chat-bubble typing-indicator"><span></span><span></span><span></span></div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  _hideTyping() {
    this.isTyping = false;
    document.getElementById("typingIndicator")?.remove();
  }
}

// ============================================================
//  ChatbotController.js — AI Chatbot via Gemini API
// ============================================================

import { GEMINI_API_URL } from "../config.js";

export class ChatbotController {
  constructor(app) {
    this.app        = app;
    this.isOpen     = false;
    this.history    = [];
    this.isTyping   = false;
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
      this._appendMessage("bot", reply);
    } catch (e) {
      this._hideTyping();
      const lang = window.__i18n.current;
      this._appendMessage("bot", lang === "vi"
        ? "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại!"
        : "Sorry, I'm having connection issues. Please try again!");
    }
  }

  async _callGemini(userMessage) {
    const profile  = this.app.getUserProfile();
    const lang     = window.__i18n.current;
    const userName = profile?.username || profile?.fullname || "bạn";

    const systemContext = lang === "vi"
      ? `Bạn là KDLearnBot, trợ lý AI của nền tảng học tập KDLearnSpace. 
         Người dùng là ${userName}. Hãy trả lời bằng tiếng Việt, thân thiện, ngắn gọn và hữu ích.
         Chuyên môn: giải đáp thắc mắc về bài học, lập trình, toán học, khoa học, và các chủ đề học thuật.
         Luôn khuyến khích người học và đưa ra ví dụ cụ thể khi cần.`
      : `You are KDLearnBot, the AI assistant for the KDLearnSpace learning platform. 
         The user is ${userName}. Reply in English, friendly, concise and helpful.
         Expertise: answering questions about lessons, programming, math, science, and academic topics.
         Always encourage learners and provide concrete examples when needed.`;

    this.history.push({ role: "user", parts: [{ text: userMessage }] });

    // Keep history to last 10 turns
    if (this.history.length > 20) {
      this.history = this.history.slice(-20);
    }

    const body = {
      system_instruction: { parts: [{ text: systemContext }] },
      contents: this.history,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      }
    };

    const res = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Gemini error: ${res.status}`);

    const data  = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "...";

    this.history.push({ role: "model", parts: [{ text: reply }] });
    return reply;
  }

  _appendMessage(role, text) {
    const messages = document.getElementById("chatbotMessages");
    if (!messages) return;

    const div  = document.createElement("div");
    div.className = `chat-message chat-message--${role} animate-in`;

    // Convert markdown-like formatting
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

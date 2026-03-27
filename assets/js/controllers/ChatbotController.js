// ============================================================
//  ChatbotController.js — AI Chatbot via Gemini API
//  Tự động thử nhiều model nếu model đầu bị lỗi 404
// ============================================================

import { GEMINI_API_KEY } from "../config.js";

// Thứ tự ưu tiên: thử từ trên xuống, dùng cái đầu tiên OK
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
];

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

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
      this._appendMessage("bot", reply);
    } catch (e) {
      this._hideTyping();
      console.error("[KDLearnBot] Error:", e.message);
      const lang = window.__i18n?.current || "vi";
      this._appendMessage("bot", lang === "vi"
        ? "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau!"
        : "Sorry, I'm having issues. Please try again later!");
    }
  }

  async _callGemini(userMessage) {
    const profile    = this.app.getUserProfile();
    const lang       = window.__i18n?.current || "vi";
    const userName   = profile?.username || profile?.fullname || "bạn";

    const systemPrompt = lang === "vi"
      ? `Bạn là KDLearnBot, trợ lý AI của KDLearnSpace. Người dùng: ${userName}. Trả lời tiếng Việt, thân thiện, ngắn gọn, hữu ích.`
      : `You are KDLearnBot, AI assistant of KDLearnSpace. User: ${userName}. Reply in English, friendly, concise, helpful.`;

    this.history.push({ role: "admin", parts: [{ text: userMessage }] });
    if (this.history.length > 20) this.history = this.history.slice(-20);

    const body = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: this.history,
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    };

    // Dùng model đã cache nếu có
    if (this.activeModel) {
      return await this._fetchModel(this.activeModel, body);
    }

    // Thử từng model
    let lastError = null;
    for (const model of GEMINI_MODELS) {
      try {
        console.log(`[KDLearnBot] Trying: ${model}`);
        const reply = await this._fetchModel(model, body);
        this.activeModel = model;
        console.log(`[KDLearnBot] OK: ${model}`);
        return reply;
      } catch (err) {
        console.warn(`[KDLearnBot] Failed ${model}: ${err.message}`);
        lastError = err;
      }
    }
    throw lastError || new Error("All models failed");
  }

  async _fetchModel(model, body) {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${res.status}`);
    }

    const data  = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error("Empty response");

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

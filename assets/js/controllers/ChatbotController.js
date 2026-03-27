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
  const profile  = this.app.getUserProfile();
  const lang     = window.__i18n?.current || "vi";
  const userName = profile?.username || profile?.fullname || "bạn";

 const systemPrompt = lang === "vi"
  ? `Bạn là KDLearnBot - trợ lý AI thân thiện, luôn trả lời trực tiếp, ngắn gọn bằng tiếng Việt. Không dài dòng.`
  : `You are KDLearnBot, a friendly AI assistant. Always reply directly and concisely.`;

  this.history.push({ role: "user", parts: [{ text: userMessage }] });
  if (this.history.length > 20) this.history = this.history.slice(-20);

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: this.history,
    generationConfig: { temperature: 0.7, maxOutputTokens: 5000 },
  };

  return await this._fetchModel(null, body);
}

async _fetchModel(model, body) {
  const res = await fetch(GEMINI_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
  });

  if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  
  console.log("[KDLearnBot] Full Gemini Response:", JSON.stringify(data, null, 2)); // ← thêm dòng này để debug

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

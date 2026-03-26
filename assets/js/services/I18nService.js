// ============================================================
//  I18nService.js — Internationalization (Vi/En)
// ============================================================

import { APP_CONFIG } from "../config.js";

export class I18nService {
  constructor() {
    this.current = localStorage.getItem("kd_lang") || APP_CONFIG.defaultLang;
    this._applyLang(this.current);
  }

  toggle() {
    this.current = this.current === "vi" ? "en" : "vi";
    localStorage.setItem("kd_lang", this.current);
    this._applyLang(this.current);
    const btn = document.getElementById("langToggle");
    if (btn) btn.textContent = this.current === "vi" ? "VI/EN" : "EN/VI";
    const profile = window.__app?.getUserProfile();
    const user    = window.__app?.getUser();
    if (user && profile) {
      const displayName = profile.username || profile.fullname || user.email.split("@")[0];
      const welcome = document.getElementById("welcomeText");
      if (welcome) {
        welcome.textContent = this.current === "vi"
          ? `Chào, ${displayName} 👋`
          : `Welcome, ${displayName} 👋`;
      }
    }
  }

  _applyLang(lang) {
    document.querySelectorAll(`[data-${lang}]`).forEach(el => {
      el.textContent = el.dataset[lang];
    });
  }
}

// ============================================================
//  ThemeService.js — Light / Dark Theme
// ============================================================

export class ThemeService {
  constructor() {
    this.current = localStorage.getItem("kd_theme") || APP_CONFIG.defaultTheme;
    this._apply(this.current);
    const btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = this.current === "dark" ? "☀️" : "🌙";
  }

  toggle() {
    this.current = this.current === "light" ? "dark" : "light";
    localStorage.setItem("kd_theme", this.current);
    this._apply(this.current);
  }

  _apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

// ============================================================
//  ToastService.js — Notification Toasts
// ============================================================

export class ToastService {
  constructor() {
    this.container = document.getElementById("toastContainer");
  }

  success(msg) { this._show(msg, "success", "✓"); }
  error(msg)   { this._show(msg, "error",   "✕"); }
  warning(msg) { this._show(msg, "warning", "⚠"); }
  info(msg)    { this._show(msg, "info",    "ℹ"); }

  _show(msg, type, icon) {
    const toast = document.createElement("div");
    toast.className = `toast toast--${type} toast-enter`;
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${msg}</span>`;
    this.container?.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("toast-visible"));
    setTimeout(() => {
      toast.classList.remove("toast-visible");
      toast.classList.add("toast-exit");
      setTimeout(() => toast.remove(), 400);
    }, 3800);
  }
}

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
    return this.current;
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
    this.syncButton();
  }

  toggle() {
    this.current = this.current === "light" ? "dark" : "light";
    localStorage.setItem("kd_theme", this.current);
    this._apply(this.current);
    this.syncButton();
    return this.current;
  }

  syncButton() {
    const btn = document.getElementById("themeToggle");
    const icon = btn?.querySelector("i");
    if (icon) {
      icon.className = this.current === "dark" ? "fas fa-sun" : "fas fa-moon";
    }
    if (btn) {
      btn.setAttribute(
        "aria-label",
        this.current === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    }
  }

  _apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.body?.setAttribute("data-theme", theme);
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

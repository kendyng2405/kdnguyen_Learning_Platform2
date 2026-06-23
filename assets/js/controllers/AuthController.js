// ============================================================
//  AuthController.js — Authentication Business Logic (MVC2)
// ============================================================

import { AuthModel } from "../models/AuthModel.js?v=10";
import { AuthView }  from "../views/AuthView.js?v=10";

export class AuthController {
  constructor(app) {
    this.app   = app;
    this.model = new AuthModel();
    this.view  = new AuthView();
  }

  showLandingPage() {
    const lang = window.__i18n.current;
    this.app._showAppChrome?.(false);
    const html = this.view.renderLanding(lang);
    this._renderPage(html, "landing");
    this._bindLandingPage();
  }

  showLoginPage() {
    const lang = window.__i18n.current;
    const html = this.view.renderLogin(lang);
    this._renderPage(html, "login");
    this._bindLoginForm();
  }

  showRegisterPage(role = "student") {
    const lang = window.__i18n.current;
    const html = this.view.renderRegister(lang, role);
    this._renderPage(html, "register");
    this._bindRegisterOnboarding();
    this._bindRegisterForm();
  }

  _bindLandingPage() {
    document.getElementById("landingStudentBtn")?.addEventListener("click", () => this.app.navigate("register", "student"));
    document.getElementById("landingTeacherBtn")?.addEventListener("click", () => this.app.navigate("register", "teacher"));
    document.getElementById("landingLoginBtn")?.addEventListener("click", () => this.app.navigate("login"));
  }

  async logout() {
    try {
      await this.model.logout();
      window.__toast.success(
        window.__i18n.current === "vi" ? "Đã đăng xuất!" : "Logged out!"
      );
    } catch (e) {
      window.__toast.error(e.message);
    }
  }

  _bindLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const identifier = document.getElementById("loginIdentifier").value.trim();
      const password   = document.getElementById("loginPassword").value;
      const btn        = form.querySelector(".btn--submit");

      if (!identifier || !password) {
        window.__toast.error(
          window.__i18n.current === "vi"
            ? "Vui lòng nhập đầy đủ thông tin."
            : "Please fill in all fields."
        );
        return;
      }

      this._setLoading(btn, true);
      try {
        await this.model.login(identifier, password);
        // onAuthStateChanged in app.js handles redirect
      } catch (err) {
        const msg = this._friendlyError(err.code);
        window.__toast.error(msg);
        this._setLoading(btn, false);
      }
    });

    document.getElementById("goToRegister")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.app.navigate("register");
    });
  }

  _bindRegisterForm() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("registerUsername").value.trim();
      const fullname = document.getElementById("registerFullname").value.trim();
      const email    = document.getElementById("registerEmail").value.trim();
      const password = document.getElementById("registerPassword").value;
      const confirm  = document.getElementById("registerConfirm").value;
      const role     = document.getElementById("registerRole")?.value === "teacher" ? "teacher" : "student";
      const learningPreferences = this._collectLearningPreferences();
      const btn      = form.querySelector(".btn--submit");
      const lang     = window.__i18n.current;

      // Validate username format
      if (!/^[a-z0-9_]+$/.test(username)) {
        window.__toast.error(
          lang === "vi"
            ? "Tên đăng nhập chỉ được dùng chữ thường, số và dấu _ (không dấu, không khoảng trắng)."
            : "Username may only contain lowercase letters, numbers, and underscores."
        );
        return;
      }

      if (!fullname) {
        window.__toast.error(lang === "vi" ? "Vui lòng nhập họ tên." : "Please enter your full name.");
        return;
      }

      if (password !== confirm) {
        window.__toast.error(
          lang === "vi" ? "Mật khẩu không khớp!" : "Passwords do not match!"
        );
        return;
      }

      if (password.length < 6) {
        window.__toast.error(
          lang === "vi" ? "Mật khẩu phải có ít nhất 6 ký tự." : "Password must be at least 6 characters."
        );
        return;
      }

      this._setLoading(btn, true);
      try {
        await this.model.register(username, fullname, email, password, { role, learningPreferences });
        window.__toast.success(
          lang === "vi" ? "Đăng ký thành công! Chào mừng bạn! 🎉" : "Registration successful! Welcome! 🎉"
        );
      } catch (err) {
        window.__toast.error(this._friendlyError(err.code));
        this._setLoading(btn, false);
      }
    });

    document.getElementById("goToLogin")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.app.navigate("login");
    });
  }

  _bindRegisterOnboarding() {
    const wizard = document.getElementById("studentOnboardingWizard");
    if (!wizard) return;

    const steps = Array.from(wizard.querySelectorAll(".onboarding-step"));
    let current = 0;

    const showStep = (index) => {
      steps.forEach((step, i) => step.classList.toggle("active", i === index));
      const progress = document.getElementById("onboardingProgress");
      if (progress) progress.style.width = `${Math.round(((index + 1) / steps.length) * 100)}%`;
    };

    wizard.addEventListener("click", (e) => {
      const option = e.target.closest(".onboarding-option");
      if (option) {
        const step = option.closest(".onboarding-step");
        step.querySelectorAll(".onboarding-option").forEach(btn => btn.classList.remove("selected"));
        option.classList.add("selected");
        const input = step.querySelector("[data-onboarding-input]");
        if (input) input.value = option.dataset.value || option.textContent.trim();
        this._playUiSound(660, 0.1);
      }

      if (e.target.closest("[data-onboarding-next]") && current < steps.length - 1) {
        current += 1;
        showStep(current);
        this._playUiSound(760, 0.08);
      }

      if (e.target.closest("[data-onboarding-prev]") && current > 0) {
        current -= 1;
        showStep(current);
        this._playUiSound(520, 0.08);
      }
    });

    showStep(current);
  }

  _collectLearningPreferences() {
    const fields = ["level", "field", "topic", "subject", "goal"];
    const prefs = {};
    fields.forEach(key => {
      const value = document.querySelector(`[name="pref_${key}"]`)?.value.trim();
      if (value) prefs[key] = value;
    });
    const keywords = Object.values(prefs).join(" ").toLowerCase();
    return Object.keys(prefs).length ? { ...prefs, keywords } : null;
  }

  _playUiSound(freq = 640, duration = 0.08) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }

  _setLoading(btn, isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    const lang = window.__i18n.current;
    if (isLoading) {
      btn.dataset.original = btn.textContent;
      btn.innerHTML = '<span class="spinner-sm"></span>';
    } else {
      btn.textContent = btn.dataset.original || (lang === "vi" ? "Xác nhận" : "Submit");
    }
  }

  _friendlyError(code) {
    const vi = {
      "auth/user-not-found":       "Tài khoản không tồn tại.",
      "auth/wrong-password":       "Mật khẩu không đúng.",
      "auth/email-already-in-use": "Email đã được sử dụng.",
      "auth/weak-password":        "Mật khẩu quá yếu (tối thiểu 6 ký tự).",
      "auth/invalid-email":        "Email không hợp lệ.",
      "auth/invalid-credential":   "Tên đăng nhập/email hoặc mật khẩu không đúng.",
      "auth/username-taken":       "Tên đăng nhập đã được dùng. Vui lòng chọn tên khác.",
      "auth/too-many-requests":    "Quá nhiều lần thử. Vui lòng thử lại sau.",
    };
    const en = {
      "auth/user-not-found":       "Account not found.",
      "auth/wrong-password":       "Wrong password.",
      "auth/email-already-in-use": "Email already in use.",
      "auth/weak-password":        "Password too weak (min 6 chars).",
      "auth/invalid-email":        "Invalid email address.",
      "auth/invalid-credential":   "Invalid username/email or password.",
      "auth/username-taken":       "Username already taken. Please choose another.",
      "auth/too-many-requests":    "Too many attempts. Please try again later.",
    };
    const map = window.__i18n.current === "vi" ? vi : en;
    return map[code] || (window.__i18n.current === "vi" ? "Đã xảy ra lỗi." : "An error occurred.");
  }
}

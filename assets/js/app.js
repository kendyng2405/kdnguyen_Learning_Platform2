// ============================================================
//  app.js — Brilliant LMS MVC2 Bootstrap & Router
//  Argon Dashboard layout with sidebar + top navbar
// ============================================================

import { AuthController }     from "./controllers/AuthController.js";
import { CourseController }   from "./controllers/CourseController.js";
import { QuizController }     from "./controllers/QuizController.js";
import { ProgressController } from "./controllers/ProgressController.js";
import { AdminController }    from "./controllers/AdminController.js";
import { ChatbotController }  from "./controllers/ChatbotController.js";
import { ProfileController }  from "./controllers/ProfileController.js";
import { AuthModel }          from "./models/AuthModel.js";
import { I18nService }        from "./services/I18nService.js";
import { ThemeService }       from "./services/ThemeService.js";
import { ToastService }       from "./services/ToastService.js";

export class App {
  constructor() {
    this.routes = {
      "/":          () => this._defaultRoute(),
      "/home":      () => this.courseController.showDashboard(),
      "/courses":   () => this.courseController.showCourseList(),
      "/progress":  () => this.progressController.showProgress(),
      "/admin":     () => this.adminController.showAdmin(),
      "/login":     () => this.authController.showLoginPage(),
      "/register":  () => this.authController.showRegisterPage(),
      "/profile":   () => this.profileController.showProfile(),
    };
    this.currentUser    = null;
    this.currentPath    = null;
    this._pendingPath   = null;
    this._authReady     = false;
  }

  async init() {
    this.i18n  = new I18nService();
    this.theme = new ThemeService();
    this.toast = new ToastService();

    window.__i18n   = this.i18n;
    window.__theme  = this.theme;
    window.__toast  = this.toast;
    window.__router = this;

    // Custom Prompt UI
    window.__prompt = (title, placeholder, callback, isPassword = false, onCancel = null) => {
      const lang = this.i18n.current;
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.innerHTML = `
        <div class="modal" style="max-width: 400px; padding: 1.5rem">
          <h3 style="margin-bottom: 1rem; font-size: 1.2rem; font-weight: 600">${title}</h3>
          <input type="${isPassword ? 'password' : 'text'}" id="aiPromptInput" class="form-control" placeholder="${placeholder}" />
          <div class="modal-actions" style="margin-top: 1.5rem">
            <button class="btn btn-secondary btn-sm" id="aiPromptCancel">${lang === 'vi' ? 'Hủy' : 'Cancel'}</button>
            <button class="btn btn-primary btn-sm" id="aiPromptOk">OK</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      const input = overlay.querySelector("#aiPromptInput");
      const btnOk = overlay.querySelector("#aiPromptOk");
      const btnCancel = overlay.querySelector("#aiPromptCancel");

      const close = (isCancel = false) => {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 200);
        if (isCancel && typeof onCancel === 'function') onCancel();
      };

      btnOk.addEventListener("click", () => {
        const val = input.value.trim();
        if (val) {
          callback(val);
          close(false);
        }
      });

      btnCancel.addEventListener("click", () => close(true));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close(true);
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") btnOk.click();
      });
      setTimeout(() => input.focus(), 100);
    };

    this.authModel          = new AuthModel();
    this.authController     = new AuthController(this);
    this.courseController   = new CourseController(this);
    this.quizController     = new QuizController(this);
    this.progressController = new ProgressController(this);
    this.adminController    = new AdminController(this);
    this.chatbotController  = new ChatbotController(this);
    this.profileController  = new ProfileController(this);

    this._bindNavEvents();
    this._bindThemeToggle();
    this._bindLangToggle();
    this._bindSidebarToggle();
    this._bindUserDropdown();
    this._handleGHPagesRedirect();

    // Browser Back/Forward
    window.addEventListener("popstate", (e) => {
      const path = e.state?.path || window.location.pathname;
      this._dispatchRoute(path, false);
    });

    this.authModel.onAuthStateChanged(async (user) => {
      this.currentUser = user;

      if (user) {
        await this.authModel.loadUserProfile(user.uid);
        this._showAppChrome(true);
        this._updateNavbar(user);
        document.getElementById("chatbotWidget")?.classList.remove("hidden");
        document.getElementById("chatbotFab")?.classList.remove("hidden");

        const target = this._pendingPath || this._getCurrentPath();
        this._pendingPath = null;
        const publicPaths = ["/login", "/register"];
        this._dispatchRoute(publicPaths.includes(target) ? "/home" : target, false);
      } else {
        this._showAppChrome(false);
        document.getElementById("chatbotWidget")?.classList.add("hidden");
        document.getElementById("chatbotFab")?.classList.add("hidden");
        const protectedPaths = ["/home", "/courses", "/course", "/lesson", "/quiz", "/progress", "/admin", "/profile"];
        const cur = this._getCurrentPath();
        if (protectedPaths.some(p => cur.startsWith(p))) {
          this._dispatchRoute("/login", false);
        } else {
          this._dispatchRoute(cur || "/login", false);
        }
      }

      this._hideLoading();
      this._authReady = true;
    });
  }

  // ── Show/hide sidebar + navbar (Argon chrome) ────────────
  _showAppChrome(show) {
    const sidebar = document.getElementById("sidenav-main");
    const navbar  = document.getElementById("navbar-main");
    const footer  = document.getElementById("appFooter");

    if (show) {
      document.body.classList.remove("auth-active");
      sidebar.style.display = "";
      navbar.style.display = "";
      footer.style.display = "";
    } else {
      document.body.classList.add("auth-active");
      sidebar.style.display = "none";
      navbar.style.display = "none";
      footer.style.display = "none";
    }
  }

  // ── Public navigate (pushes history) ─────────────────────
  navigate(page, ...args) {
    const pathMap = {
      dashboard: "/home",
      courses:   "/courses",
      progress:  "/progress",
      admin:     "/admin",
      login:     "/login",
      register:  "/register",
      profile:   "/profile",
      course:    args[0] ? `/course/${args[0]}`   : "/courses",
      lesson:    args[1] ? `/lesson/${args[0]}/${args[1]}` : "/courses",
      quiz:      args[1] ? `/quiz/${args[0]}/${args[1]}`   : "/courses",
    };

    const path = pathMap[page] || "/home";
    history.pushState({ path }, "", path);
    this._dispatchRoute(path, false, ...args);
  }

  // ── Internal route dispatch ───────────────────────────────
  _dispatchRoute(path, pushState = true, ...args) {
    this.currentPath = path;

    // Update sidebar active state
    document.querySelectorAll("#sidenav-main .nav-link").forEach(l => {
      const href = l.getAttribute("href");
      l.classList.toggle("active", path === href || (path.startsWith(href) && href !== "/" && href !== "#"));
    });

    // Update top navbar brand text
    const pageNames = {
      "/home": "Dashboard", "/courses": "Courses", "/progress": "Progress",
      "/admin": "Admin", "/profile": "Profile",
    };
    const brandText = document.getElementById("navBrandText");
    if (brandText) {
      brandText.textContent = pageNames[path] || "Brilliant LMS";
    }

    if (pushState) {
      history.pushState({ path }, "", path);
    }

    // Parametric routes
    const courseMatch = path.match(/^\/course\/(.+)$/);
    const lessonMatch = path.match(/^\/lesson\/([^/]+)\/(.+)$/);
    const quizMatch   = path.match(/^\/quiz\/([^/]+)\/(.+)$/);

    if (courseMatch)  return this.courseController.showCourseDetail(courseMatch[1]);
    if (lessonMatch)  return this.courseController.showLesson(lessonMatch[1], lessonMatch[2]);
    if (quizMatch)    return this.quizController.showQuiz(quizMatch[1], quizMatch[2]);

    const handler = this.routes[path];
    if (handler) {
      handler(...args);
    } else {
      this._defaultRoute();
    }
  }

  _defaultRoute() {
    if (this.currentUser) {
      this._dispatchRoute("/home", false);
    } else {
      this._dispatchRoute("/login", false);
    }
  }

  _getCurrentPath() {
    const search = window.location.search;
    if (search.startsWith("?/")) {
      const path = "/" + search.slice(2).split("&")[0].replace(/~and~/g, "&");
      history.replaceState({ path }, "", path);
      return path;
    }
    return window.location.pathname || "/";
  }

  _handleGHPagesRedirect() {
    const path = this._getCurrentPath();
    if (path !== window.location.pathname) {
      history.replaceState({ path }, "", path);
    }
  }

  // ── Nav bindings ─────────────────────────────────────────
  _bindNavEvents() {
    // Sidebar nav links
    document.querySelectorAll("#sidenav-main .nav-link[data-page]").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.navigate(link.dataset.page);
        // Close mobile sidebar
        const collapse = document.getElementById("sidebarCollapse");
        if (collapse && collapse.classList.contains("show")) {
          collapse.classList.remove("show");
        }
      });
    });

    // Logout
    document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.authController.logout();
    });

    // Profile dropdown
    document.getElementById("dropdownProfile")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.navigate("profile");
    });
  }

  _bindSidebarToggle() {
    const toggler = document.getElementById("sidebarToggler");
    const collapse = document.getElementById("sidebarCollapse");
    toggler?.addEventListener("click", () => {
      collapse?.classList.toggle("show");
    });
  }

  _bindUserDropdown() {
    const toggle = document.getElementById("userDropdownToggle");
    const menu = document.getElementById("userDropdownMenu");
    toggle?.addEventListener("click", (e) => {
      e.preventDefault();
      menu?.classList.toggle("show");
    });
    document.addEventListener("click", (e) => {
      if (!toggle?.contains(e.target) && !menu?.contains(e.target)) {
        menu?.classList.remove("show");
      }
    });
  }

  _bindThemeToggle() {
    const btn = document.getElementById("themeToggle");
    btn?.addEventListener("click", (e) => {
      e.preventDefault();
      this.theme.toggle();
      const icon = btn.querySelector("i");
      if (icon) {
        icon.className = this.theme.current === "dark" ? "fas fa-sun" : "fas fa-moon";
      }
    });
  }

  _bindLangToggle() {
    document.getElementById("langToggle")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.i18n.toggle();
      this._updateNavbar(this.currentUser);
      this._updateAllI18nTexts();
      // Re-render current page
      if (this.currentPath && this._authReady) {
        this._dispatchRoute(this.currentPath, false);
      }
    });
  }

  // ── Update all data-vi / data-en elements ────────────────
  _updateAllI18nTexts() {
    const lang = this.i18n.current;
    document.querySelectorAll("[data-vi][data-en]").forEach(el => {
      el.textContent = lang === "vi" ? el.dataset.vi : el.dataset.en;
    });
    const langBtn = document.getElementById("langBtnText");
    if (langBtn) langBtn.textContent = lang === "vi" ? "🇻🇳 VI" : "🇺🇸 EN";
  }

  // ── Navbar update ────────────────────────────────────────
  _updateNavbar(user) {
    const adminItem = document.querySelector(".nav-item--admin");
    const welcomeText = document.getElementById("welcomeText");
    const avatar    = document.getElementById("navAvatar");
    const streakBadge = document.getElementById("navStreak");
    const dropdownWelcome = document.getElementById("dropdownWelcome");

    if (user) {
      const profile     = this.authModel.userProfile;
      const username    = profile?.username || user.email.split("@")[0];
      const lang        = this.i18n.current;

      if (welcomeText) {
        welcomeText.textContent = username;
      }
      if (dropdownWelcome) {
        dropdownWelcome.textContent = lang === "vi" ? `Chào, ${username}!` : `Welcome, ${username}!`;
      }

      if (streakBadge) {
        streakBadge.textContent = `🔥 ${profile?.streak || 0}`;
      }

      if (avatar) {
        const initials = (profile?.fullname || username || "?").charAt(0).toUpperCase();
        avatar.textContent = initials;
      }

      if (profile?.role === "admin") {
        adminItem?.style && (adminItem.style.display = "");
      } else {
        adminItem?.style && (adminItem.style.display = "none");
      }
    }

    this._updateAllI18nTexts();
  }

  _hideLoading() {
    const overlay = document.getElementById("loadingOverlay");
    if (!overlay) return;
    overlay.classList.add("fade-out");
    setTimeout(() => overlay.remove(), 600);
  }

  // ── Public helpers ────────────────────────────────────────
  isAdmin()        { return this.authModel.userProfile?.role === "admin"; }
  getUser()        { return this.currentUser; }
  getUserProfile() { return this.authModel.userProfile; }
}

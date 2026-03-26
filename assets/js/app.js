// ============================================================
//  app.js — KDLearnSpace MVC2 Bootstrap & Router
//  Path-based routing: /home, /courses, /login, /register, /profile
//  GitHub Pages compatible via 404.html redirect trick
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
    // Route map: pathname → handler
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
    this._handleGHPagesRedirect();

    // Browser Back/Forward
    window.addEventListener("popstate", (e) => {
      const path = e.state?.path || window.location.pathname;
      this._dispatchRoute(path, false);
    });

    this.authModel.onAuthStateChanged(async (user) => {
      this.currentUser = user;
      this._updateNavbar(user);

      if (user) {
        await this.authModel.loadUserProfile(user.uid);
        this._updateNavbar(user);
        document.getElementById("chatbotWidget")?.classList.remove("hidden");
        document.getElementById("chatbotFab")?.classList.remove("hidden");

        // Go to pending path or current URL path
        const target = this._pendingPath || this._getCurrentPath();
        this._pendingPath = null;
        const publicPaths = ["/login", "/register"];
        this._dispatchRoute(publicPaths.includes(target) ? "/home" : target, false);
      } else {
        document.getElementById("chatbotWidget")?.classList.add("hidden");
        document.getElementById("chatbotFab")?.classList.add("hidden");
        const protectedPaths = ["/home", "/courses", "/progress", "/admin", "/profile"];
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

    // Update active nav link
    document.querySelectorAll(".nav-link").forEach(l => {
      const lPath = l.getAttribute("href");
      l.classList.toggle("active", path === lPath || (path.startsWith(lPath) && lPath !== "/"));
    });

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
    // Handle GitHub Pages redirect: /?/some/path
    const search = window.location.search;
    if (search.startsWith("?/")) {
      const path = "/" + search.slice(2).split("&")[0].replace(/~and~|\/and\//g, "&")
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
    document.querySelectorAll(".nav-link[data-page]").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.navigate(link.dataset.page);
      });
    });

    document.getElementById("logoutBtn")?.addEventListener("click", () => {
      this.authController.logout();
    });

    document.getElementById("navAvatarBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.navigate("profile");
    });

    // Mobile hamburger
    const ham = document.getElementById("navHamburger");
    const navLinks = document.getElementById("navLinks");
    ham?.addEventListener("click", () => {
      navLinks?.classList.toggle("nav-links--open");
    });
  }

  _bindThemeToggle() {
    const btn = document.getElementById("themeToggle");
    btn?.addEventListener("click", () => {
      this.theme.toggle();
      btn.textContent = this.theme.current === "dark" ? "☀️" : "🌙";
    });
  }

  _bindLangToggle() {
    document.getElementById("langToggle")?.addEventListener("click", () => {
      this.i18n.toggle();
      this._updateNavbar(this.currentUser);
    });
  }

  // ── Navbar update ────────────────────────────────────────
  _updateNavbar(user) {
    const navbar    = document.getElementById("navbar");
    const navUser   = document.getElementById("navUser");
    const welcome   = document.getElementById("welcomeText");
    const adminLink = document.querySelector(".nav-link--admin");
    const avatar    = document.getElementById("navAvatar");
    const ham       = document.getElementById("navHamburger");

    if (user) {
      navbar.classList.remove("hidden");
      navUser.classList.remove("hidden");
      ham?.classList.remove("hidden");

      const profile     = this.authModel.userProfile;
      const username    = profile?.username || user.email.split("@")[0];
      const lang        = this.i18n.current;
      welcome.textContent = lang === "vi"
        ? `Chào, ${username} 👋`
        : `Welcome, ${username} 👋`;

      // Avatar initials
      if (avatar) {
        const initials = (profile?.fullname || username || "?").charAt(0).toUpperCase();
        avatar.textContent = initials;
      }

      if (profile?.role === "admin") {
        adminLink?.classList.remove("hidden");
      } else {
        adminLink?.classList.add("hidden");
      }
    } else {
      navbar.classList.add("hidden");
      navUser.classList.add("hidden");
      ham?.classList.add("hidden");
    }
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

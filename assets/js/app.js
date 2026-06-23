// ============================================================
//  app.js — Brilliant LMS MVC2 Bootstrap & Router
//  Argon Dashboard layout with sidebar + top navbar
// ============================================================

import { AuthController }         from "./controllers/AuthController.js?v=11";
import { CourseController }       from "./controllers/CourseController.js?v=11";
import { QuizController }         from "./controllers/QuizController.js?v=10";
import { ProgressController }     from "./controllers/ProgressController.js?v=10";
import { AdminController }        from "./controllers/AdminController.js?v=11";
import { ChatbotController }      from "./controllers/ChatbotController.js?v=10";
import { ProfileController }      from "./controllers/ProfileController.js?v=10";
import { LeaderboardController }  from "./controllers/LeaderboardController.js?v=10";
import { MissionsController }     from "./controllers/MissionsController.js?v=10";
import { CalendarController }     from "./controllers/CalendarController.js?v=10";
import { CertificateController }  from "./controllers/CertificateController.js?v=10";
import { AuthModel }              from "./models/AuthModel.js?v=10";
import { I18nService }            from "./services/I18nService.js?v=10";
import { ThemeService }           from "./services/ThemeService.js?v=10";
import { ToastService }           from "./services/ToastService.js?v=10";

export class App {
  constructor() {
    this.routes = {
      "/":          () => this.authController.showLandingPage(),
      "/home":      () => this.courseController.showDashboard(),
      "/courses":   () => this.courseController.showCourseList(),
      "/progress":  () => this.progressController.showProgress(),
      "/leaderboard": () => this.leaderboardController.showLeaderboard(),
      "/calendar":  () => this.calendarController.showCalendar(),
      "/missions":  () => this.missionsController.showMissions(),
      "/admin":     () => this.adminController.showAdmin(),
      "/login":     () => this.authController.showLoginPage(),
      "/register":  () => this.authController.showRegisterPage("student"),
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

    // Custom Alert UI
    window.__alert = (title, message, type = "info", onClose = null) => {
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      const icon = type === "error" ? "❌" : type === "warning" ? "⚠️" : type === "success" ? "✅" : "ℹ️";
      overlay.innerHTML = `
        <div class="text-center bg-white" style="max-width: 400px; width: 90%; padding: 2rem; border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); position: relative; animation: slideDown 0.3s ease-out;">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">${icon}</div>
          <h3 style="margin-bottom: 0.5rem; font-size: 1.5rem; font-weight: 800; color: #333;">${title}</h3>
          <p class="text-muted mb-4" style="font-size: 1.1rem;">${message}</p>
          <button class="brilliant-btn-gradient btn-block" id="alertOk">OK</button>
        </div>
      `;
      document.body.appendChild(overlay);
      const btnOk = overlay.querySelector("#alertOk");
      const close = () => {
        overlay.style.opacity = "0";
        setTimeout(() => overlay.remove(), 200);
        if (typeof onClose === "function") onClose();
      };
      btnOk.addEventListener("click", close);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    };

    // Custom Prompt UI
    window.__prompt = (title, placeholder, callback, isPassword = false, onCancel = null) => {
      const lang = this.i18n.current;
      const overlay = document.createElement("div");
      overlay.className = "modal-overlay";
      overlay.innerHTML = `
        <div class="bg-white" style="max-width: 400px; width: 90%; padding: 1.5rem; border-radius: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.2); position: relative; animation: slideDown 0.3s ease-out;">
          <h3 style="margin-bottom: 1rem; font-size: 1.2rem; font-weight: 600">${title}</h3>
          <input type="${isPassword ? 'password' : 'text'}" id="aiPromptInput" class="form-control" placeholder="${placeholder}" />
          <div class="modal-actions" style="margin-top: 1.5rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
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
    this.leaderboardController = new LeaderboardController(this);
    this.missionsController = new MissionsController(this);
    this.calendarController = new CalendarController(this);
    this.certificateController = new CertificateController(this);

    this._bindNavEvents();
    this._bindCourseSearch();
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
        if (this.authController?.isCompletingOnboarding) {
          this._showAppChrome(false);
          document.getElementById("chatbotWidget")?.classList.add("hidden");
          document.getElementById("chatbotFab")?.classList.add("hidden");
          this._hideLoading();
          this._authReady = true;
          return;
        }
        await this.authModel.loadUserProfile(user.uid);
        this._showAppChrome(true);
        this._updateNavbar(user);
        document.getElementById("chatbotWidget")?.classList.remove("hidden");
        document.getElementById("chatbotFab")?.classList.remove("hidden");

        const target = this._pendingPath || this._getCurrentPath();
        this._pendingPath = null;
        const authOnlyPath = target === "/login" || target.startsWith("/register");
        this._dispatchRoute(authOnlyPath ? "/home" : target, false);
      } else {
        this._showAppChrome(false);
        document.getElementById("chatbotWidget")?.classList.add("hidden");
        document.getElementById("chatbotFab")?.classList.add("hidden");
        const protectedPaths = ["/home", "/courses", "/course", "/lesson", "/quiz", "/progress", "/leaderboard", "/calendar", "/missions", "/certificate", "/admin", "/profile"];
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
      leaderboard: "/leaderboard",
      calendar:  "/calendar",
      missions:  "/missions",
      admin:     "/admin",
      login:     "/login",
      register:  args[0] ? `/register/${args[0]}` : "/register",
      profile:   "/profile",
      course:    args[0] ? `/course/${args[0]}`   : "/courses",
      lesson:    args[1] ? `/lesson/${args[0]}/${args[1]}` : "/courses",
      quiz:      args[1] ? `/quiz/${args[0]}/${args[1]}`   : "/courses",
      certificate: args[0] ? `/certificate/${args[0]}` : "/courses",
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
      "/": "Brilliant LMS", "/home": "Dashboard", "/courses": "Courses", "/progress": "Progress",
      "/leaderboard": "Leaderboard", "/calendar": "Calendar", "/missions": "Missions", "/admin": "Admin", "/profile": "Profile",
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
    const certificateMatch = path.match(/^\/certificate\/(.+)$/);
    const registerMatch = path.match(/^\/register\/(teacher|student)$/);

    if (courseMatch)  return this.courseController.showCourseDetail(courseMatch[1]);
    if (lessonMatch)  return this.courseController.showLesson(lessonMatch[1], lessonMatch[2]);
    if (quizMatch)    return this.quizController.showQuiz(quizMatch[1], quizMatch[2]);
    if (certificateMatch) return this.certificateController.showCertificate(certificateMatch[1]);
    if (registerMatch) return this.authController.showRegisterPage(registerMatch[1]);

    const handler = this.routes[path];
    if (handler) {
      handler(...args);
    } else {
      this._defaultRoute();
    }
  }

  _defaultRoute() {
    this.authController.showLandingPage();
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

  _bindCourseSearch() {
    const form = document.getElementById("navSearchForm");
    const input = document.getElementById("navSearchInput");
    if (!form || !input) return;

    const panel = document.createElement("div");
    panel.id = "globalCourseSearchPanel";
    panel.className = "global-search-panel hidden";
    form.appendChild(panel);

    let coursesCache = null;
    let debounce = null;

    const close = () => panel.classList.add("hidden");
    const render = (courses, query) => {
      const lang = this.i18n?.current || "vi";
      const safeQuery = query.trim().toLowerCase();
      if (!safeQuery) {
        close();
        return;
      }

      const results = courses
        .filter(course => `${course.title || ""} ${course.category || ""}`.toLowerCase().includes(safeQuery))
        .slice(0, 6);

      panel.innerHTML = results.length
        ? results.map(course => `
          <button type="button" class="global-search-item" data-course-id="${course.id}">
            <span class="global-search-icon"><i class="fas fa-book-open"></i></span>
            <span>
              <strong>${this._escapeHtml(course.title || "")}</strong>
              <small>${this._escapeHtml(course.category || (lang === "vi" ? "Khóa học" : "Course"))}</small>
            </span>
          </button>
        `).join("")
        : `<div class="global-search-empty">${lang === "vi" ? "Không tìm thấy khóa học." : "No courses found."}</div>`;
      panel.classList.remove("hidden");
    };

    input.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(async () => {
        const query = input.value.trim();
        if (!query) {
          close();
          return;
        }
        coursesCache = coursesCache || await this.courseController.courseModel.getAllCourses();
        render(coursesCache, query);
      }, 160);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const first = panel.querySelector("[data-course-id]");
      if (first) first.click();
    });

    panel.addEventListener("click", (e) => {
      const item = e.target.closest("[data-course-id]");
      if (!item) return;
      input.value = "";
      close();
      this.navigate("course", item.dataset.courseId);
    });

    document.addEventListener("click", (e) => {
      if (!form.contains(e.target)) close();
    });
  }

  _bindThemeToggle() {
    const btn = document.getElementById("themeToggle");
    btn?.addEventListener("click", (e) => {
      e.preventDefault();
      this.theme.toggle();
      this.theme.syncButton();
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
    const langIcon = document.getElementById("langBtnIcon");
    if (langBtn) langBtn.textContent = lang === "vi" ? "VI" : "EN";
    if (langIcon) langIcon.className = lang === "vi" ? "fas fa-globe-asia mr-1" : "fas fa-globe-americas mr-1";
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
        streakBadge.innerHTML = `<i class="fas fa-fire mr-1 text-danger"></i> ${profile?.streak || 0}`;
        streakBadge.style.color = "#fb6340";
      }

      if (avatar) {
        const initials = (profile?.fullname || username || "?").charAt(0).toUpperCase();
        avatar.textContent = initials;
      }

      if (this.canManageCourses()) {
        adminItem?.style && (adminItem.style.display = "");
        const adminLabel = adminItem?.querySelector("[data-vi][data-en]");
        if (adminLabel) {
          adminLabel.dataset.vi = this.isSystemAdmin() ? "Admin hệ thống" : "Giảng dạy";
          adminLabel.dataset.en = this.isSystemAdmin() ? "System Admin" : "Teaching";
          adminLabel.textContent = lang === "vi" ? adminLabel.dataset.vi : adminLabel.dataset.en;
        }
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
    setTimeout(() => overlay.remove(), 150);
  }

  // ── Public helpers ────────────────────────────────────────
  isSystemAdmin()  {
    const profile = this.authModel.userProfile;
    return profile?.role === "admin" && (profile?.isSuperAdmin === true || this.authModel.isConfiguredAdmin(profile?.email));
  }
  isTeacher()      { return ["teacher", "admin"].includes(this.authModel.userProfile?.role); }
  canManageCourses() { return this.isTeacher() || this.isSystemAdmin(); }
  isAdmin()        { return this.canManageCourses(); }
  getUser()        { return this.currentUser; }
  getUserProfile() { return this.authModel.userProfile; }

  _escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

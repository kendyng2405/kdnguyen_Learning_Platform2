// ============================================================
//  AuthView.js — Login & Register (Argon Dashboard Style)
// ============================================================

export class AuthView {

  renderLanding(lang) {
    const t = lang === "vi" ? {
      login: "Đăng nhập",
      badge: "Nền tảng học tập cá nhân hóa bằng AI",
      title: "Brilliant LMS",
      sub: "Học theo lộ trình riêng, làm quiz có phản hồi tức thì, theo dõi deadline và nhận chứng chỉ khi hoàn thành khóa học.",
      student: "Tạo tài khoản học viên",
      teacher: "Tạo tài khoản giảng viên",
      scroll: "Cuộn để khám phá",
      features: ["AI đề xuất khóa học", "Quiz phản hồi tức thì", "Lịch học + deadline", "Chứng chỉ PDF"],
      sectionTitle: "Một không gian học tập sống động",
      sectionSub: "Brilliant LMS kết hợp bài học, nhiệm vụ, bảng xếp hạng và trợ lý AI để người học luôn biết bước tiếp theo.",
      teacherTitle: "Dành cho giảng viên",
      teacherSub: "Tạo khóa học, bài học, quiz AI và quản lý học viên trong các khóa học của mình.",
      studentTitle: "Dành cho học viên",
      studentSub: "Trả lời vài câu hỏi, nhận đề xuất khóa phù hợp và bắt đầu học ngay.",
      stats: ["Lộ trình AI", "Quiz tức thì", "Theo dõi học viên"],
      flow: ["Đăng ký", "AI hỏi mục tiêu", "Đề xuất khóa học", "Học và nhận chứng chỉ"],
      previewTitle: "Bảng học tập cá nhân",
      previewSub: "Deadline, nhiệm vụ, tiến độ và gợi ý khóa học nằm cùng một nơi.",
      analyticsTitle: "Teacher analytics",
      analyticsSub: "Giảng viên xem được học viên học tới đâu, làm test ra sao và điểm cụ thể.",
      ctaTitle: "Bắt đầu với Brilliant LMS hôm nay",
      ctaSub: "Một nền tảng gọn, đẹp và có AI hỗ trợ đúng lúc.",
    } : {
      login: "Sign in",
      badge: "AI-personalized learning platform",
      title: "Brilliant LMS",
      sub: "Follow a personal path, get instant quiz feedback, track deadlines, and earn certificates when courses are completed.",
      student: "Create student account",
      teacher: "Create teacher account",
      scroll: "Scroll to explore",
      features: ["AI recommendations", "Instant quiz feedback", "Calendar + deadlines", "PDF certificates"],
      sectionTitle: "A living learning space",
      sectionSub: "Brilliant LMS combines lessons, missions, leaderboards, and an AI tutor so every learner knows the next step.",
      teacherTitle: "For teachers",
      teacherSub: "Create courses, lessons, AI quizzes, and manage learners in your own courses.",
      studentTitle: "For students",
      studentSub: "Answer a few questions, get matched with suitable courses, and start learning.",
      stats: ["AI path", "Instant quiz", "Learner tracking"],
      flow: ["Sign up", "AI asks goals", "Course match", "Learn and certify"],
      previewTitle: "Personal learning board",
      previewSub: "Deadlines, missions, progress, and recommendations in one place.",
      analyticsTitle: "Teacher analytics",
      analyticsSub: "Teachers can see learner progress, quiz attempts, and detailed scores.",
      ctaTitle: "Start Brilliant LMS today",
      ctaSub: "A clean, modern LMS with AI help at the right moment.",
    };

    return `
      <div class="landing-page">
        <header class="landing-nav">
          <div class="landing-logo"><i class="fas fa-graduation-cap"></i><span>Brilliant LMS</span></div>
          <button class="btn btn-outline-primary" id="landingLoginBtn">${t.login}</button>
        </header>
        <section class="landing-hero">
          <div class="landing-hero-copy">
            <span class="landing-badge">${t.badge}</span>
            <h1>${t.title}</h1>
            <p>${t.sub}</p>
            <div class="landing-actions">
              <button class="btn btn-primary btn-lg" id="landingStudentBtn"><i class="fas fa-user-graduate mr-2"></i>${t.student}</button>
              <button class="btn btn-outline-primary btn-lg" id="landingTeacherBtn"><i class="fas fa-chalkboard-teacher mr-2"></i>${t.teacher}</button>
            </div>
            <div class="landing-hero-stats">
              ${t.stats.map((item, index) => `<span><strong>${index === 0 ? "AI" : index === 1 ? "1:1" : "360°"}</strong>${item}</span>`).join("")}
            </div>
            <small>${t.scroll}</small>
          </div>
          <div class="landing-orbit" aria-hidden="true">
            <span></span><span></span><span></span>
            <div class="landing-orbit-card">
              <div class="landing-preview-head">
                <i class="fas fa-robot"></i>
                <div><strong>${t.previewTitle}</strong><small>${t.previewSub}</small></div>
              </div>
              <div class="landing-preview-progress"><b>68%</b><span></span></div>
              <div class="landing-preview-grid">
                <span><i class="fas fa-calendar-check"></i> Deadline</span>
                <span><i class="fas fa-list-check"></i> Mission</span>
                <span><i class="fas fa-award"></i> Certificate</span>
                <span><i class="fas fa-comments"></i> AI Tutor</span>
              </div>
            </div>
          </div>
        </section>
        <section class="landing-feature-band">
          ${t.features.map((feature, index) => `
            <article style="--delay:${index * 0.08}s">
              <i class="fas ${["fa-magic", "fa-check-circle", "fa-calendar-alt", "fa-award"][index]}"></i>
              <strong>${feature}</strong>
            </article>
          `).join("")}
        </section>
        <section class="landing-flow">
          ${t.flow.map((item, index) => `
            <article style="--delay:${index * 0.1}s">
              <span>${index + 1}</span>
              <strong>${item}</strong>
            </article>
          `).join("")}
        </section>
        <section class="landing-story">
          <div>
            <span class="landing-badge">${t.sectionTitle}</span>
            <h2>${t.sectionTitle}</h2>
            <p>${t.sectionSub}</p>
          </div>
          <div class="landing-role-grid">
            <article>
              <i class="fas fa-chalkboard-teacher"></i>
              <h3>${t.teacherTitle}</h3>
              <p>${t.teacherSub}</p>
              <button class="btn btn-sm btn-primary" onclick="window.__router.navigate('register','teacher')">${t.teacher}</button>
            </article>
            <article>
              <i class="fas fa-user-graduate"></i>
              <h3>${t.studentTitle}</h3>
              <p>${t.studentSub}</p>
              <button class="btn btn-sm btn-primary" onclick="window.__router.navigate('register','student')">${t.student}</button>
            </article>
          </div>
        </section>
        <section class="landing-analytics">
          <div class="landing-analytics-panel">
            <div>
              <span class="landing-badge">${t.analyticsTitle}</span>
              <h2>${t.analyticsTitle}</h2>
              <p>${t.analyticsSub}</p>
            </div>
            <div class="landing-analytics-table">
              ${["Nguyen Dang Khoi", "Kendy Nguyen", "John Pham"].map((name, index) => `
                <div>
                  <strong>${name}</strong>
                  <span>${[92, 76, 58][index]}%</span>
                  <em style="width:${[92, 76, 58][index]}%"></em>
                </div>
              `).join("")}
            </div>
          </div>
        </section>
        <section class="landing-cta">
          <h2>${t.ctaTitle}</h2>
          <p>${t.ctaSub}</p>
          <div class="landing-actions">
            <button class="btn btn-primary btn-lg" onclick="window.__router.navigate('register','student')">${t.student}</button>
            <button class="btn btn-outline-primary btn-lg" onclick="window.__router.navigate('register','teacher')">${t.teacher}</button>
          </div>
        </section>
      </div>
    `;
  }

  renderLogin(lang) {
    const t = lang === "vi" ? {
      title: "Chào mừng trở lại!",
      sub: "Đăng nhập để tiếp tục học tập",
      identifier: "Tên đăng nhập hoặc Email",
      password: "Mật khẩu",
      submit: "Đăng nhập",
      noAccount: "Chưa có tài khoản?",
      register: "Đăng ký ngay",
      identifierPh: "username hoặc email@example.com",
      passPh: "Mật khẩu của bạn",
    } : {
      title: "Welcome Back!",
      sub: "Sign in to continue learning",
      identifier: "Username or Email",
      password: "Password",
      submit: "Sign In",
      noAccount: "Don't have an account?",
      register: "Register now",
      identifierPh: "username or email@example.com",
      passPh: "Your password",
    };

    return `
      <div class="auth-page-wrapper">
        <div class="header bg-gradient-info py-7 py-lg-8">
          <div class="container">
            <div class="header-body text-center mb-7">
              <div class="row justify-content-center">
                <div class="col-lg-5 col-md-6">
                  <h1 class="text-white">🎓 Brilliant LMS</h1>
                  <p class="text-lead text-light">${t.sub}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="separator separator-bottom separator-skew zindex-100">
            <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" version="1.1" viewBox="0 0 2560 100" x="0" y="0">
              <polygon class="fill-default" points="2560 0 2560 100 0 100"></polygon>
            </svg>
          </div>
        </div>
        <div class="container mt--8 pb-5">
          <div class="row justify-content-center">
            <div class="col-lg-5 col-md-7">
              <div class="card bg-secondary shadow border-0">
                <div class="card-body px-lg-5 py-lg-5">
                  <div class="text-center text-muted mb-4">
                    <small>${t.title}</small>
                  </div>
                  <form id="loginForm" autocomplete="on" novalidate>
                    <div class="form-group mb-3">
                      <div class="input-group input-group-alternative">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-envelope"></i></span>
                        </div>
                        <input class="form-control" placeholder="${t.identifierPh}" type="text" id="loginIdentifier" name="username" required autocomplete="username" />
                      </div>
                    </div>
                    <div class="form-group">
                      <div class="input-group input-group-alternative">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-lock"></i></span>
                        </div>
                        <input class="form-control" placeholder="${t.passPh}" type="password" id="loginPassword" name="password" required autocomplete="current-password" />
                      </div>
                    </div>
                    <div class="text-center">
                      <button type="submit" class="btn btn-primary my-4 auth-submit-btn">${t.submit}</button>
                    </div>
                  </form>
                </div>
              </div>
              <div class="row mt-3">
                <div class="col-6"></div>
                <div class="col-6 text-right">
                  <a href="/register" class="text-light" id="goToRegister"><small>${t.noAccount} ${t.register}</small></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderRegister(lang, role = "student") {
    const isTeacher = role === "teacher";
    const t = lang === "vi" ? {
      title: "Tạo tài khoản mới",
      sub: "Bắt đầu hành trình học tập của bạn",
      username: "Tên đăng nhập",
      fullname: "Họ và tên",
      email: "Email",
      password: "Mật khẩu",
      confirm: "Xác nhận mật khẩu",
      submit: "Đăng ký",
      hasAccount: "Đã có tài khoản?",
      login: "Đăng nhập",
      usernamePh: "vd: nguyenvana",
      fullnamePh: "Nguyễn Văn A",
      emailPh: "email@example.com",
      passPh: "Ít nhất 6 ký tự",
      confirmPh: "Nhập lại mật khẩu",
      usernameHint: "Chỉ chữ cái thường, số, dấu gạch dưới (_).",
      passwordHint: "Tối thiểu 6 ký tự.",
    } : {
      title: "Create Account",
      sub: "Start your learning journey",
      username: "Username",
      fullname: "Full Name",
      email: "Email",
      password: "Password",
      confirm: "Confirm Password",
      submit: "Register",
      hasAccount: "Already have an account?",
      login: "Sign in",
      usernamePh: "e.g. johndoe",
      fullnamePh: "John Doe",
      emailPh: "email@example.com",
      passPh: "At least 6 characters",
      confirmPh: "Re-enter password",
      usernameHint: "Lowercase letters, numbers, underscore (_) only.",
      passwordHint: "Minimum 6 characters.",
    };

    return `
      <div class="auth-page-wrapper">
        <div class="header bg-gradient-info py-7 py-lg-8">
          <div class="container">
            <div class="header-body text-center mb-7">
              <div class="row justify-content-center">
                <div class="col-lg-5 col-md-6">
                  <h1 class="text-white">🎓 Brilliant LMS</h1>
                  <p class="text-lead text-light">${isTeacher ? (lang === "vi" ? "Tạo và quản lý khóa học của riêng bạn" : "Create and manage your own courses") : t.sub}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="separator separator-bottom separator-skew zindex-100">
            <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" version="1.1" viewBox="0 0 2560 100" x="0" y="0">
              <polygon class="fill-default" points="2560 0 2560 100 0 100"></polygon>
            </svg>
          </div>
        </div>
        <div class="container mt--8 pb-5">
          <div class="row justify-content-center">
            <div class="col-lg-6 col-md-8">
              <div class="card bg-secondary shadow border-0">
                <div class="card-body px-lg-5 py-lg-5">
                  <div class="text-center text-muted mb-4">
                    <small>${isTeacher ? (lang === "vi" ? "Tạo tài khoản giảng viên" : "Create Teacher Account") : t.title}</small>
                  </div>
                  <form id="registerForm" autocomplete="on" novalidate>
                    <input type="hidden" id="registerRole" value="${isTeacher ? "teacher" : "student"}" />
                    <div class="form-group">
                      <div class="input-group input-group-alternative mb-3">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-graduation-cap"></i></span>
                        </div>
                        <input class="form-control" placeholder="${t.usernamePh}" type="text" id="registerUsername" name="username" required autocomplete="username" pattern="[a-z0-9_]+" />
                      </div>
                      <small class="text-muted">${t.usernameHint}</small>
                    </div>
                    <div class="form-group">
                      <div class="input-group input-group-alternative mb-3">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-user"></i></span>
                        </div>
                        <input class="form-control" placeholder="${t.fullnamePh}" type="text" id="registerFullname" name="name" required autocomplete="name" />
                      </div>
                    </div>
                    <div class="form-group">
                      <div class="input-group input-group-alternative mb-3">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-envelope"></i></span>
                        </div>
                        <input class="form-control" placeholder="${t.emailPh}" type="email" id="registerEmail" name="email" required autocomplete="email" />
                      </div>
                    </div>
                    <div class="form-group">
                      <div class="input-group input-group-alternative">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-lock"></i></span>
                        </div>
                        <input class="form-control" placeholder="${t.passPh}" type="password" id="registerPassword" name="new-password" required autocomplete="new-password" />
                      </div>
                      <small class="text-muted">${t.passwordHint}</small>
                    </div>
                    <div class="form-group">
                      <div class="input-group input-group-alternative">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-lock"></i></span>
                        </div>
                        <input class="form-control" placeholder="${t.confirmPh}" type="password" id="registerConfirm" name="confirm-password" required autocomplete="new-password" />
                      </div>
                    </div>
                    <div class="text-center">
                      <button type="submit" class="btn btn-primary my-4 auth-submit-btn">${t.submit}</button>
                    </div>
                  </form>
                </div>
              </div>
              <div class="row mt-3">
                <div class="col-12 text-center">
                  <a href="/login" class="text-light" id="goToLogin"><small>${t.hasAccount} ${t.login}</small></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      ${isTeacher ? "" : this._renderPostRegisterOnboarding(lang)}
    `;
  }

  _renderStudentOnboarding(lang, id = "studentOnboardingWizard") {
    const t = lang === "vi" ? {
      next: "Tiếp",
      back: "Quay lại",
      done: "Hoàn tất định hướng",
      progress: "AI sẽ dùng các câu trả lời này để đề xuất khóa học phù hợp.",
      steps: [
        { key: "level", title: "Bạn đang học ở bậc nào?", options: ["THCS", "THPT", "Đại học", "Đi làm"] },
        { key: "field", title: "Bạn muốn học về mảng nào?", options: ["Công nghệ", "Kinh doanh", "Ngoại ngữ", "Thiết kế"] },
        { key: "topic", title: "Chủ đề bạn đang quan tâm?", options: ["Lập trình", "AI", "Kỹ năng mềm", "Ôn thi"] },
        { key: "subject", title: "Môn bạn thích nhất?", options: ["Toán", "Tin học", "Tiếng Anh", "SWT"] },
        { key: "goal", title: "Mục tiêu học của bạn?", options: ["Nắm nền tảng", "Thi đạt điểm cao", "Làm dự án", "Đi làm tốt hơn"] },
      ],
    } : {
      next: "Next",
      back: "Back",
      done: "Finish setup",
      progress: "AI will use these answers to recommend suitable courses.",
      steps: [
        { key: "level", title: "What is your current level?", options: ["Middle school", "High school", "University", "Working"] },
        { key: "field", title: "What field do you want to learn?", options: ["Technology", "Business", "Languages", "Design"] },
        { key: "topic", title: "What topic interests you?", options: ["Programming", "AI", "Soft skills", "Exam prep"] },
        { key: "subject", title: "Favorite subject?", options: ["Math", "Computer Science", "English", "SWT"] },
        { key: "goal", title: "Your learning goal?", options: ["Build basics", "Score higher", "Build projects", "Work better"] },
      ],
    };

    return `
      <div id="${id}" class="student-onboarding-wizard">
        <div class="onboarding-progress"><span id="onboardingProgress"></span></div>
        <p class="onboarding-hint">${t.progress}</p>
        ${t.steps.map((step, index) => `
          <section class="onboarding-step ${index === 0 ? "active" : ""}">
            <h3>${step.title}</h3>
            <input type="hidden" name="pref_${step.key}" data-onboarding-input />
            <div class="onboarding-options">
              ${step.options.map(option => `<button type="button" class="onboarding-option" data-value="${this._attr(option)}">${option}</button>`).join("")}
            </div>
            <div class="onboarding-actions">
              ${index > 0 ? `<button type="button" class="btn btn-sm btn-outline-primary" data-onboarding-prev>${t.back}</button>` : "<span></span>"}
              ${index < t.steps.length - 1
                ? `<button type="button" class="btn btn-sm btn-primary" data-onboarding-next>${t.next}</button>`
                : `<button type="button" class="btn btn-sm btn-success" data-onboarding-finish>${t.done}</button>`}
            </div>
          </section>
        `).join("")}
      </div>
    `;
  }

  _renderPostRegisterOnboarding(lang) {
    const t = lang === "vi" ? {
      title: "Tài khoản đã sẵn sàng",
      sub: "Trả lời nhanh vài câu để Brilliant LMS đề xuất khóa học hợp với mục tiêu của bạn.",
      note: "Bạn có thể đổi lựa chọn sau trong hồ sơ.",
    } : {
      title: "Your account is ready",
      sub: "Answer a few quick questions so Brilliant LMS can suggest the right courses.",
      note: "You can update these choices later in your profile.",
    };

    return `
      <div id="postRegisterOnboardingOverlay" class="post-onboarding-overlay hidden">
        <div class="post-onboarding-shell">
          <div class="post-onboarding-copy">
            <span><i class="fas fa-wand-magic-sparkles mr-2"></i>AI Match</span>
            <h2>${t.title}</h2>
            <p>${t.sub}</p>
            <small>${t.note}</small>
          </div>
          ${this._renderStudentOnboarding(lang, "postRegisterOnboardingWizard")}
        </div>
      </div>
    `;
  }

  _attr(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

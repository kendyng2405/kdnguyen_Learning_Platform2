// ============================================================
//  AuthView.js — Login & Register Page Templates (MVC2 View)
// ============================================================

export class AuthView {

  renderLogin(lang) {
    const t = lang === "vi" ? {
      title: "Chào mừng trở lại",
      sub: "Đăng nhập để tiếp tục học tập",
      identifier: "Tên đăng nhập hoặc Email",
      password: "Mật khẩu",
      submit: "Đăng nhập",
      noAccount: "Chưa có tài khoản?",
      register: "Đăng ký ngay",
      identifierPh: "username hoặc email@example.com",
      passPh: "Mật khẩu của bạn",
    } : {
      title: "Welcome Back",
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
      <div class="auth-page">
        <div class="auth-bg">
          <div class="auth-blob blob-1"></div>
          <div class="auth-blob blob-2"></div>
          <div class="auth-blob blob-3"></div>
        </div>
        <div class="auth-card animate-slide-up">
          <div class="auth-brand">
            <div class="auth-logo">🎓</div>
            <h1 class="auth-logo-text">KDLearnSpace</h1>
          </div>
          <h2 class="auth-title">${t.title}</h2>
          <p class="auth-sub">${t.sub}</p>
          <form id="loginForm" class="auth-form" novalidate>
            <div class="form-group">
              <label class="form-label">${t.identifier}</label>
              <input type="text" id="loginIdentifier" class="form-input"
                placeholder="${t.identifierPh}" required autocomplete="username" />
            </div>
            <div class="form-group">
              <label class="form-label">${t.password}</label>
              <div class="input-password-wrap">
                <input type="password" id="loginPassword" class="form-input"
                  placeholder="${t.passPh}" required autocomplete="current-password" />
                <button type="button" class="btn-eye"
                  onclick="const i=this.previousElementSibling; i.type=i.type==='password'?'text':'password'; this.textContent=i.type==='password'?'👁':'🙈'">👁</button>
              </div>
            </div>
            <button type="submit" class="btn btn--primary btn--submit btn--full">${t.submit}</button>
          </form>
          <p class="auth-switch">
            ${t.noAccount}
            <a href="/register" id="goToRegister" class="link">${t.register}</a>
          </p>
        </div>
      </div>
    `;
  }

  renderRegister(lang) {
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
      usernameHint: "Chỉ chữ cái thường, số, dấu gạch dưới (_). Không dấu, không khoảng trắng.",
      passwordHint: "Tối thiểu 6 ký tự. Nên có chữ HOA, số và ký tự đặc biệt (!@#$...).",
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
      usernameHint: "Lowercase letters, numbers, underscore (_) only. No spaces or accents.",
      passwordHint: "Minimum 6 characters. Recommended: uppercase, number, special char (!@#$...).",
    };

    return `
      <div class="auth-page">
        <div class="auth-bg">
          <div class="auth-blob blob-1"></div>
          <div class="auth-blob blob-2"></div>
          <div class="auth-blob blob-3"></div>
        </div>
        <div class="auth-card auth-card--register animate-slide-up">
          <div class="auth-brand">
            <div class="auth-logo">🎓</div>
            <h1 class="auth-logo-text">KDLearnSpace</h1>
          </div>
          <h2 class="auth-title">${t.title}</h2>
          <p class="auth-sub">${t.sub}</p>
          <form id="registerForm" class="auth-form" novalidate>

            <div class="form-group">
              <label class="form-label">${t.username} <span class="label-required">*</span></label>
              <input type="text" id="registerUsername" class="form-input"
                placeholder="${t.usernamePh}" required autocomplete="username"
                pattern="[a-z0-9_]+" />
              <p class="form-hint">⚠ ${t.usernameHint}</p>
            </div>

            <div class="form-group">
              <label class="form-label">${t.fullname} <span class="label-required">*</span></label>
              <input type="text" id="registerFullname" class="form-input"
                placeholder="${t.fullnamePh}" required />
            </div>

            <div class="form-group">
              <label class="form-label">${t.email} <span class="label-required">*</span></label>
              <input type="email" id="registerEmail" class="form-input"
                placeholder="${t.emailPh}" required autocomplete="email" />
            </div>

            <div class="form-group">
              <label class="form-label">${t.password} <span class="label-required">*</span></label>
              <div class="input-password-wrap">
                <input type="password" id="registerPassword" class="form-input"
                  placeholder="${t.passPh}" required autocomplete="new-password" />
                <button type="button" class="btn-eye"
                  onclick="const i=this.previousElementSibling; i.type=i.type==='password'?'text':'password'; this.textContent=i.type==='password'?'👁':'🙈'">👁</button>
              </div>
              <p class="form-hint">🔒 ${t.passwordHint}</p>
            </div>

            <div class="form-group">
              <label class="form-label">${t.confirm} <span class="label-required">*</span></label>
              <div class="input-password-wrap">
                <input type="password" id="registerConfirm" class="form-input"
                  placeholder="${t.confirmPh}" required autocomplete="new-password" />
                <button type="button" class="btn-eye"
                  onclick="const i=this.previousElementSibling; i.type=i.type==='password'?'text':'password'; this.textContent=i.type==='password'?'👁':'🙈'">👁</button>
              </div>
            </div>

            <button type="submit" class="btn btn--primary btn--submit btn--full">${t.submit}</button>
          </form>
          <p class="auth-switch">
            ${t.hasAccount}
            <a href="/login" id="goToLogin" class="link">${t.login}</a>
          </p>
        </div>
      </div>
    `;
  }
}

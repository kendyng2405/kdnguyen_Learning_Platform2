// ============================================================
//  AuthView.js — Login & Register (Argon Dashboard Style)
// ============================================================

export class AuthView {

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
                  <form id="loginForm" novalidate>
                    <div class="form-group mb-3">
                      <div class="input-group input-group-alternative">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-envelope"></i></span>
                        </div>
                        <input class="form-control" placeholder="${t.identifierPh}" type="text" id="loginIdentifier" required autocomplete="username" />
                      </div>
                    </div>
                    <div class="form-group">
                      <div class="input-group input-group-alternative">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-lock"></i></span>
                        </div>
                        <input class="form-control" placeholder="${t.passPh}" type="password" id="loginPassword" required autocomplete="current-password" />
                      </div>
                    </div>
                    <div class="text-center">
                      <button type="submit" class="btn btn-primary my-4">${t.submit}</button>
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
            <div class="col-lg-6 col-md-8">
              <div class="card bg-secondary shadow border-0">
                <div class="card-body px-lg-5 py-lg-5">
                  <div class="text-center text-muted mb-4">
                    <small>${t.title}</small>
                  </div>
                  <form id="registerForm" novalidate>
                    <div class="form-group">
                      <div class="input-group input-group-alternative mb-3">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-graduation-cap"></i></span>
                        </div>
                        <input class="form-control" placeholder="${t.usernamePh}" type="text" id="registerUsername" required autocomplete="username" pattern="[a-z0-9_]+" />
                      </div>
                      <small class="text-muted">${t.usernameHint}</small>
                    </div>
                    <div class="form-group">
                      <div class="input-group input-group-alternative mb-3">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-user"></i></span>
                        </div>
                        <input class="form-control" placeholder="${t.fullnamePh}" type="text" id="registerFullname" required />
                      </div>
                    </div>
                    <div class="form-group">
                      <div class="input-group input-group-alternative mb-3">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-envelope"></i></span>
                        </div>
                        <input class="form-control" placeholder="${t.emailPh}" type="email" id="registerEmail" required autocomplete="email" />
                      </div>
                    </div>
                    <div class="form-group">
                      <div class="input-group input-group-alternative">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-lock"></i></span>
                        </div>
                        <input class="form-control" placeholder="${t.passPh}" type="password" id="registerPassword" required autocomplete="new-password" />
                      </div>
                      <small class="text-muted">${t.passwordHint}</small>
                    </div>
                    <div class="form-group">
                      <div class="input-group input-group-alternative">
                        <div class="input-group-prepend">
                          <span class="input-group-text"><i class="fas fa-lock"></i></span>
                        </div>
                        <input class="form-control" placeholder="${t.confirmPh}" type="password" id="registerConfirm" required autocomplete="new-password" />
                      </div>
                    </div>
                    <div class="text-center">
                      <button type="submit" class="btn btn-primary my-4">${t.submit}</button>
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
    `;
  }
}

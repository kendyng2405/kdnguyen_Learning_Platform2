// ============================================================
//  ProfileView.js — User Profile Page (Argon Style)
// ============================================================

export class ProfileView {

  renderProfile(profile, lang) {
    const t = lang === "vi" ? {
      title: "Hồ sơ cá nhân", sub: "Quản lý thông tin tài khoản",
      info: "Thông tin tài khoản", security: "Bảo mật",
      username: "Tên đăng nhập", email: "Email", fullname: "Họ và tên",
      dob: "Ngày sinh", readonly: "(Không thể thay đổi)",
      saveInfo: "Lưu thay đổi", resetPw: "Đặt lại mật khẩu",
      resetPwDesc: "Gửi email đặt lại mật khẩu đến địa chỉ email của bạn.",
      sendReset: "Gửi email đặt lại", fullnamePh: "Nhập họ tên đầy đủ",
      roleStudent: "Học viên", roleAdmin: "Quản trị viên",
    } : {
      title: "My Profile", sub: "Manage your account information",
      info: "Account Information", security: "Security",
      username: "Username", email: "Email", fullname: "Full Name",
      dob: "Date of Birth", readonly: "(Cannot be changed)",
      saveInfo: "Save Changes", resetPw: "Reset Password",
      resetPwDesc: "Send a password reset email to your email address.",
      sendReset: "Send Reset Email", fullnamePh: "Enter your full name",
      roleStudent: "Student", roleAdmin: "Administrator",
    };

    const roleLabel = profile?.role === "admin" ? t.roleAdmin : t.roleStudent;
    const initials  = (profile?.fullname || profile?.username || "?").charAt(0).toUpperCase();

    return `
      <div class="header pb-8 pt-5 pt-lg-8 d-flex align-items-center" style="min-height:350px; background-image:url(assets/img/theme/profile-cover.jpg); background-size:cover; background-position:center top;">
        <span class="mask bg-gradient-default opacity-8"></span>
        <div class="container-fluid d-flex align-items-center">
          <div class="row">
            <div class="col-lg-12">
              <h1 class="display-2 text-white">${profile?.fullname || profile?.username || "—"}</h1>
              <p class="text-white mt-0 mb-3">@${profile?.username || "—"} · <span class="badge badge-${profile?.role === 'admin' ? 'warning' : 'info'}">${roleLabel}</span></p>
            </div>
          </div>
        </div>
      </div>
      <div class="container-fluid mt--7">
        <div class="row">
          <div class="col-xl-4 order-xl-2 mb-5 mb-xl-0">
            <div class="card card-profile shadow">
              <div class="row justify-content-center">
                <div class="col-lg-3 order-lg-2">
                  <div class="card-profile-image">
                    <div class="rounded-circle bg-gradient-primary text-white d-flex align-items-center justify-content-center mx-auto" style="width:120px;height:120px;font-size:3rem;font-weight:700;margin-top:-60px;border:4px solid #fff;">
                      ${initials}
                    </div>
                  </div>
                </div>
              </div>
              <div class="card-body pt-0 pt-md-4 text-center" style="margin-top:60px;">
                <h3>${profile?.fullname || "—"}</h3>
                <div class="h5 font-weight-300 text-muted">@${profile?.username || "—"}</div>
                <div class="h5 mt-3">
                  <span class="mr-3">🔥 ${lang === 'vi' ? 'Chuỗi' : 'Streak'}: ${profile?.streak || 0}</span>
                  <span>⭐ XP: ${profile?.xp || 0}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="col-xl-8 order-xl-1">
            <div class="card shadow">
              <div class="card-header bg-white border-0">
                <div class="row align-items-center">
                  <div class="col-8"><h3 class="mb-0">${t.info}</h3></div>
                </div>
              </div>
              <div class="card-body">
                <h6 class="heading-small text-muted mb-4">${t.info}</h6>
                <div class="pl-lg-4">
                  <div class="row">
                    <div class="col-lg-6">
                      <div class="form-group">
                        <label class="form-control-label">${t.username} <small class="text-muted">${t.readonly}</small></label>
                        <input type="text" class="form-control form-control-alternative" value="${profile?.username || ""}" readonly disabled />
                      </div>
                    </div>
                    <div class="col-lg-6">
                      <div class="form-group">
                        <label class="form-control-label">${t.email} <small class="text-muted">${t.readonly}</small></label>
                        <input type="email" class="form-control form-control-alternative" value="${profile?.email || ""}" readonly disabled />
                      </div>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-lg-6">
                      <div class="form-group">
                        <label class="form-control-label">${t.fullname}</label>
                        <input type="text" id="profileFullname" class="form-control form-control-alternative" value="${profile?.fullname || ""}" placeholder="${t.fullnamePh}" />
                      </div>
                    </div>
                    <div class="col-lg-6">
                      <div class="form-group">
                        <label class="form-control-label">${t.dob}</label>
                        <input type="date" id="profileDob" class="form-control form-control-alternative" value="${profile?.dob || ""}" />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <button class="btn btn-primary" id="saveProfileBtn">${t.saveInfo}</button>
                </div>
                <hr class="my-4" />
                <h6 class="heading-small text-muted mb-4">🔒 ${t.security}</h6>
                <div class="pl-lg-4">
                  <p>${t.resetPwDesc}</p>
                  <p class="text-muted">${t.email}: <strong>${profile?.email || ""}</strong></p>
                  <button class="btn btn-outline-warning" id="sendResetEmailBtn">${t.sendReset}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

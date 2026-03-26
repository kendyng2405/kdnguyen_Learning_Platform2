// ============================================================
//  ProfileView.js — User Profile Page Template (MVC2 View)
// ============================================================

export class ProfileView {

  renderProfile(profile, lang) {
    const t = lang === "vi" ? {
      title: "Hồ sơ cá nhân",
      sub: "Quản lý thông tin tài khoản",
      info: "Thông tin tài khoản",
      security: "Bảo mật",
      username: "Tên đăng nhập",
      email: "Email",
      fullname: "Họ và tên",
      dob: "Ngày sinh",
      readonly: "(Không thể thay đổi)",
      saveInfo: "Lưu thay đổi",
      resetPw: "Đặt lại mật khẩu",
      resetPwDesc: "Gửi email đặt lại mật khẩu đến địa chỉ email của bạn.",
      sendReset: "Gửi email đặt lại",
      dobPh: "dd/mm/yyyy",
      fullnamePh: "Nhập họ tên đầy đủ",
      back: "← Quay lại",
      joinedAt: "Tham gia",
      role: "Vai trò",
      roleStudent: "Học viên",
      roleAdmin: "Quản trị viên",
    } : {
      title: "My Profile",
      sub: "Manage your account information",
      info: "Account Information",
      security: "Security",
      username: "Username",
      email: "Email",
      fullname: "Full Name",
      dob: "Date of Birth",
      readonly: "(Cannot be changed)",
      saveInfo: "Save Changes",
      resetPw: "Reset Password",
      resetPwDesc: "Send a password reset email to your email address.",
      sendReset: "Send Reset Email",
      dobPh: "dd/mm/yyyy",
      fullnamePh: "Enter your full name",
      back: "← Back",
      joinedAt: "Joined",
      role: "Role",
      roleStudent: "Student",
      roleAdmin: "Administrator",
    };

    const roleLabel = profile?.role === "admin" ? t.roleAdmin : t.roleStudent;
    const roleBadge = profile?.role === "admin" ? "badge--admin" : "badge--student";
    const initials  = (profile?.fullname || profile?.username || "?").charAt(0).toUpperCase();

    return `
      <div class="profile-page">
        <div class="profile-hero animate-slide-up">
          <div class="profile-avatar-lg">${initials}</div>
          <div class="profile-hero-info">
            <h1 class="profile-name">${profile?.fullname || profile?.username || "—"}</h1>
            <p class="profile-username">@${profile?.username || "—"}</p>
            <span class="badge ${roleBadge}">${roleLabel}</span>
          </div>
        </div>

        <div class="profile-tabs animate-slide-up delay-1">
          <button class="profile-tab active" data-tab="tab-info">
            👤 ${t.info}
          </button>
          <button class="profile-tab" data-tab="tab-security">
            🔒 ${t.security}
          </button>
        </div>

        <!-- Tab: Info -->
        <div id="tab-info" class="profile-panel active animate-slide-up delay-2">
          <div class="profile-form-card">
            <div class="form-group">
              <label class="form-label">
                ${t.username}
                <span class="form-label-readonly">${t.readonly}</span>
              </label>
              <input type="text" class="form-input form-input--readonly"
                value="${profile?.username || ""}" readonly disabled />
            </div>

            <div class="form-group">
              <label class="form-label">
                ${t.email}
                <span class="form-label-readonly">${t.readonly}</span>
              </label>
              <input type="email" class="form-input form-input--readonly"
                value="${profile?.email || ""}" readonly disabled />
            </div>

            <div class="form-group">
              <label class="form-label">${t.fullname} <span class="label-required">*</span></label>
              <input type="text" id="profileFullname" class="form-input"
                value="${profile?.fullname || ""}" placeholder="${t.fullnamePh}" />
            </div>

            <div class="form-group">
              <label class="form-label">${t.dob}</label>
              <input type="date" id="profileDob" class="form-input"
                value="${profile?.dob || ""}" />
              <p class="form-hint">📅 ${lang === "vi" ? "Định dạng: Năm-Tháng-Ngày (YYYY-MM-DD)" : "Format: YYYY-MM-DD"}</p>
            </div>

            <div class="profile-actions">
              <button class="btn btn--primary" id="saveProfileBtn">${t.saveInfo}</button>
            </div>
          </div>
        </div>

        <!-- Tab: Security -->
        <div id="tab-security" class="profile-panel animate-slide-up delay-2">
          <div class="profile-form-card">
            <div class="security-section">
              <h3 class="security-title">🔑 ${t.resetPw}</h3>
              <p class="security-desc">${t.resetPwDesc}</p>
              <div class="security-email-preview">
                <span class="security-email-label">${t.email}:</span>
                <span class="security-email-val">${profile?.email || ""}</span>
              </div>
              <button class="btn btn--outline" id="sendResetEmailBtn">${t.sendReset}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

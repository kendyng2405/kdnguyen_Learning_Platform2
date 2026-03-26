// ============================================================
//  ProfileController.js — Profile Management (MVC2 Controller)
// ============================================================

import { AuthModel }   from "../models/AuthModel.js";
import { ProfileView } from "../views/ProfileView.js";

export class ProfileController {
  constructor(app) {
    this.app   = app;
    this.model = new AuthModel();
    this.view  = new ProfileView();
  }

  showProfile() {
    const profile = this.app.getUserProfile();
    const lang    = window.__i18n.current;

    if (!profile) {
      window.__toast.error(lang === "vi" ? "Không tìm thấy hồ sơ." : "Profile not found.");
      this.app.navigate("dashboard");
      return;
    }

    const html = this.view.renderProfile(profile, lang);
    this._renderPage(html, "profile");
    this._bindTabs();
    this._bindSaveProfile();
    this._bindResetEmail();
  }

  _bindTabs() {
    document.querySelectorAll(".profile-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".profile-tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".profile-panel").forEach(p => p.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(tab.dataset.tab)?.classList.add("active");
      });
    });
  }

  _bindSaveProfile() {
    document.getElementById("saveProfileBtn")?.addEventListener("click", async () => {
      const fullname = document.getElementById("profileFullname")?.value.trim();
      const dob      = document.getElementById("profileDob")?.value;
      const lang     = window.__i18n.current;
      const uid      = this.app.getUser()?.uid;

      if (!fullname) {
        window.__toast.error(lang === "vi" ? "Họ tên không được để trống." : "Full name cannot be empty.");
        return;
      }

      const btn = document.getElementById("saveProfileBtn");
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-sm"></span>';

      try {
        await this.app.authModel.updateProfile(uid, { fullname, dob: dob || null });
        window.__toast.success(
          lang === "vi" ? "Đã cập nhật hồ sơ!" : "Profile updated!"
        );
        // Refresh navbar to reflect new fullname
        this.app._updateNavbar(this.app.getUser());
        // Refresh page
        this.showProfile();
      } catch (e) {
        window.__toast.error(e.message);
        btn.disabled = false;
        btn.textContent = lang === "vi" ? "Lưu thay đổi" : "Save Changes";
      }
    });
  }

  _bindResetEmail() {
    document.getElementById("sendResetEmailBtn")?.addEventListener("click", async () => {
      const profile = this.app.getUserProfile();
      const email   = profile?.email;
      const lang    = window.__i18n.current;
      const btn     = document.getElementById("sendResetEmailBtn");

      if (!email) {
        window.__toast.error(lang === "vi" ? "Không tìm thấy email." : "Email not found.");
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-sm"></span>';

      try {
        await this.app.authModel.sendPasswordReset(email);
        window.__toast.success(
          lang === "vi"
            ? `Email đặt lại mật khẩu đã gửi đến ${email}. Kiểm tra hộp thư nhé!`
            : `Password reset email sent to ${email}. Check your inbox!`
        );
        btn.textContent = lang === "vi" ? "✓ Đã gửi!" : "✓ Sent!";
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = lang === "vi" ? "Gửi email đặt lại" : "Send Reset Email";
        }, 30000);
      } catch (e) {
        window.__toast.error(e.message);
        btn.disabled = false;
        btn.textContent = lang === "vi" ? "Gửi email đặt lại" : "Send Reset Email";
      }
    });
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }
}

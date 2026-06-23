// ============================================================
//  LeaderboardController.js — XP ranking page
// ============================================================

import { AuthModel } from "../models/AuthModel.js?v=7";
import { LeaderboardView } from "../views/LeaderboardView.js?v=7";

export class LeaderboardController {
  constructor(app) {
    this.app = app;
    this.model = new AuthModel();
    this.view = new LeaderboardView();
  }

  async showLeaderboard() {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "leaderboard");
    const lang = window.__i18n.current;
    try {
      const leaders = await this.model.getLeaderboard(30);
      const html = this.view.renderLeaderboard(leaders, this.app.getUser()?.uid, lang);
      this._renderPage(html, "leaderboard");
    } catch (e) {
      window.__toast.error(e.message);
      this._renderPage(this.view.renderError(lang), "leaderboard");
    }
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }
}

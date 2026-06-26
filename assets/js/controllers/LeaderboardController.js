// ============================================================
//  LeaderboardController.js — XP ranking page
// ============================================================

import { AuthModel } from "../models/AuthModel.js?v=10";
import { QuizModel } from "../models/QuizModel.js?v=12";
import { LeaderboardView } from "../views/LeaderboardView.js?v=10";

export class LeaderboardController {
  constructor(app) {
    this.app = app;
    this.model = new AuthModel();
    this.progressModel = new QuizModel();
    this.view = new LeaderboardView();
    this.unlockGoal = 2;
  }

  async showLeaderboard() {
    this._renderPage('<div class="page-loading"><div class="spinner-ring"></div></div>', "leaderboard");
    const lang = window.__i18n.current;
    try {
      const uid = this.app.getUser()?.uid;
      const progress = uid ? await this.progressModel.getAllProgressForUser(uid) : [];
      const completedLessons = this._countCompletedLessons(progress);

      if (completedLessons < this.unlockGoal) {
        this._renderPage(this.view.renderLocked(completedLessons, this.unlockGoal, lang), "leaderboard");
        return;
      }

      const leaders = await this.model.getLeaderboard(30);
      const html = this.view.renderLeaderboard(leaders, this.app.getUser()?.uid, lang);
      this._renderPage(html, "leaderboard");
    } catch (e) {
      window.__toast.error(e.message);
      this._renderPage(this.view.renderError(lang), "leaderboard");
    }
  }

  _countCompletedLessons(progress) {
    return progress.reduce((sum, item) => (
      sum + (Array.isArray(item.completedLessons) ? item.completedLessons.length : 0)
    ), 0);
  }

  _renderPage(html, name) {
    const container = document.getElementById("pageContainer");
    container.innerHTML = html;
    container.className = `page-container page-${name}`;
    requestAnimationFrame(() => container.classList.add("page-enter"));
  }
}

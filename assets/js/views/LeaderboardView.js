// ============================================================
//  LeaderboardView.js — XP ranking templates
// ============================================================

export class LeaderboardView {
  renderLeaderboard(leaders, currentUid, lang) {
    const t = lang === "vi" ? {
      title: "Bảng xếp hạng",
      sub: "So tài XP, giữ chuỗi học và leo hạng mỗi ngày.",
      topLearners: "Top học viên",
      allRanks: "Tất cả thứ hạng",
      xp: "XP",
      streak: "ngày streak",
      you: "Bạn",
      empty: "Chưa có dữ liệu xếp hạng.",
      explore: "Học thêm để kiếm XP",
    } : {
      title: "Leaderboard",
      sub: "Compare XP, keep your streak, and climb the ranks every day.",
      topLearners: "Top learners",
      allRanks: "All ranks",
      xp: "XP",
      streak: "day streak",
      you: "You",
      empty: "No leaderboard data yet.",
      explore: "Learn more to earn XP",
    };

    if (!leaders.length) {
      return `
        <div class="leaderboard-page">
          <div class="leaderboard-hero">
            <div>
              <p class="leaderboard-kicker">${t.topLearners}</p>
              <h1>${t.title}</h1>
              <p>${t.empty}</p>
            </div>
            <button class="btn btn-neutral" onclick="window.__router.navigate('courses')">${t.explore}</button>
          </div>
        </div>
      `;
    }

    const topThree = leaders.slice(0, 3);
    const rest = leaders.slice(3);

    return `
      <div class="leaderboard-page">
        <div class="leaderboard-hero">
          <div>
            <p class="leaderboard-kicker">${t.topLearners}</p>
            <h1>${t.title}</h1>
            <p>${t.sub}</p>
          </div>
          <button class="btn btn-neutral" onclick="window.__router.navigate('courses')">${t.explore}</button>
        </div>

        <div class="leaderboard-podium">
          ${topThree.map((user, idx) => this._podiumCard(user, currentUid, t, idx)).join("")}
        </div>

        <div class="leaderboard-list-card">
          <div class="leaderboard-list-header">
            <h3>${t.allRanks}</h3>
            <span>${leaders.length} ${t.topLearners.toLowerCase()}</span>
          </div>
          <div class="leaderboard-list">
            ${leaders.map(user => this._rankRow(user, currentUid, t)).join("")}
          </div>
        </div>
      </div>
    `;
  }

  renderError(lang) {
    const text = lang === "vi" ? "Không tải được bảng xếp hạng." : "Could not load leaderboard.";
    return `
      <div class="leaderboard-page">
        <div class="leaderboard-hero">
          <div>
            <p class="leaderboard-kicker">Leaderboard</p>
            <h1>${text}</h1>
          </div>
        </div>
      </div>
    `;
  }

  _podiumCard(user, currentUid, t, idx) {
    const isCurrent = user.uid === currentUid || user.id === currentUid;
    const medals = ["#f7c948", "#cbd5e1", "#d97706"];
    return `
      <div class="leaderboard-podium-card ${isCurrent ? "is-current" : ""}">
        <div class="leaderboard-medal" style="background:${medals[idx] || "#5e72e4"}">#${user.rank}</div>
        <div class="leaderboard-avatar">${this._initial(user)}</div>
        <h3>${this._name(user)} ${isCurrent ? `<span>${t.you}</span>` : ""}</h3>
        <strong>${user.xp || 0} ${t.xp}</strong>
        <small><i class="fas fa-fire text-danger mr-1"></i>${user.streak || 0} ${t.streak}</small>
      </div>
    `;
  }

  _rankRow(user, currentUid, t) {
    const isCurrent = user.uid === currentUid || user.id === currentUid;
    const xp = user.xp || 0;
    const pct = Math.min(100, Math.round((xp / 500) * 100));
    return `
      <div class="leaderboard-row ${isCurrent ? "is-current" : ""}">
        <div class="leaderboard-rank">#${user.rank}</div>
        <div class="leaderboard-avatar leaderboard-avatar--sm">${this._initial(user)}</div>
        <div class="leaderboard-user">
          <div>${this._name(user)} ${isCurrent ? `<span>${t.you}</span>` : ""}</div>
          <small>${user.streak || 0} ${t.streak}</small>
        </div>
        <div class="leaderboard-xp">
          <strong>${xp} ${t.xp}</strong>
          <div class="leaderboard-xp-track"><span style="width:${pct}%"></span></div>
        </div>
      </div>
    `;
  }

  _name(user) {
    return user.fullname || user.username || user.email?.split("@")[0] || "Learner";
  }

  _initial(user) {
    return this._name(user).charAt(0).toUpperCase();
  }
}

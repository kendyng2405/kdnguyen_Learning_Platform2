// ============================================================
//  MissionsView.js - Mission board templates
// ============================================================

export class MissionsView {
  renderMissions(stats, missions, lang) {
    const t = lang === "vi" ? {
      kicker: "Nhiệm vụ học tập",
      title: "Hoàn thành từng mục nhỏ mỗi ngày",
      sub: "Theo dõi bài học, quiz, chuỗi ngày và các mốc mở khóa trong một màn hình.",
      completed: "Bài đã học",
      quizzes: "Quiz đã làm",
      streak: "Chuỗi ngày",
      xp: "XP",
      progress: "Tiến độ",
      done: "Hoàn thành",
      continue: "Tiếp tục học",
    } : {
      kicker: "Learning missions",
      title: "Finish small goals every day",
      sub: "Track lessons, quizzes, streaks, and unlock milestones in one place.",
      completed: "Lessons done",
      quizzes: "Quizzes taken",
      streak: "Day streak",
      xp: "XP",
      progress: "Progress",
      done: "Done",
      continue: "Keep learning",
    };

    const statCards = [
      { icon: "fa-book-open", label: t.completed, value: `${stats.completedLessons}/${Math.max(stats.totalLessons, stats.completedLessons) || 0}`, tone: "primary" },
      { icon: "fa-clipboard-check", label: t.quizzes, value: stats.quizAttempts, tone: "success" },
      { icon: "fa-fire", label: t.streak, value: stats.streak, tone: "danger" },
      { icon: "fa-star", label: t.xp, value: stats.xp, tone: "warning" },
    ];

    return `
      <div class="missions-page">
        <section class="missions-hero">
          <div>
            <p class="missions-kicker">${t.kicker}</p>
            <h1>${t.title}</h1>
            <p>${t.sub}</p>
          </div>
          <button class="btn btn-neutral" onclick="window.__router.navigate('courses')">
            <i class="fas fa-arrow-right mr-2"></i>${t.continue}
          </button>
        </section>

        <section class="missions-stat-grid">
          ${statCards.map(card => `
            <div class="missions-stat-card">
              <span class="missions-stat-icon text-${card.tone}"><i class="fas ${card.icon}"></i></span>
              <div>
                <strong>${card.value}</strong>
                <span>${card.label}</span>
              </div>
            </div>
          `).join("")}
        </section>

        <section class="missions-grid">
          ${missions.map(mission => this._missionCard(mission, t)).join("")}
        </section>
      </div>
    `;
  }

  renderError(lang) {
    const text = lang === "vi" ? "Không tải được nhiệm vụ." : "Could not load missions.";
    return `
      <div class="missions-page">
        <section class="missions-hero">
          <div>
            <p class="missions-kicker">Missions</p>
            <h1>${text}</h1>
          </div>
        </section>
      </div>
    `;
  }

  _missionCard(mission, t) {
    const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
    const done = mission.progress >= mission.target;
    return `
      <article class="mission-card ${done ? "is-complete" : ""}">
        <div class="mission-card-head">
          <span class="mission-icon text-${mission.tone}"><i class="fas ${mission.icon}"></i></span>
          <span class="mission-status">${done ? t.done : `${mission.progress}/${mission.target}`}</span>
        </div>
        <h3>${mission.title}</h3>
        <p>${mission.description}</p>
        <div class="mission-progress-label">
          <span>${t.progress}</span>
          <strong>${pct}%</strong>
        </div>
        <div class="mission-track"><span style="width:${pct}%"></span></div>
        <div class="mission-reward"><i class="fas fa-gift mr-2"></i>${mission.reward}</div>
      </article>
    `;
  }
}

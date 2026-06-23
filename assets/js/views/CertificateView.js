// ============================================================
//  CertificateView.js - Certificate page templates
// ============================================================

export class CertificateView {
  renderCertificate(certificate, lang) {
    const t = lang === "vi" ? {
      kicker: "Chứng chỉ hoàn thành",
      title: "Bạn đã hoàn thành khóa học",
      intro: "Brilliant LMS xác nhận học viên đã hoàn thành toàn bộ bài học của khóa.",
      certify: "Chứng nhận rằng",
      completed: "đã hoàn thành khóa học",
      lessons: "Bài học",
      quizzes: "Quiz",
      average: "Điểm TB",
      date: "Ngày hoàn thành",
      download: "Tải PDF",
      back: "Quay lại khóa học",
      signature: "Brilliant LMS",
    } : {
      kicker: "Completion certificate",
      title: "Course completed",
      intro: "Brilliant LMS certifies that the learner completed all lessons in this course.",
      certify: "This certifies that",
      completed: "has successfully completed",
      lessons: "Lessons",
      quizzes: "Quizzes",
      average: "Avg score",
      date: "Completed",
      download: "Download PDF",
      back: "Back to course",
      signature: "Brilliant LMS",
    };

    return `
      <div class="certificate-page">
        <section class="certificate-hero">
          <div>
            <p class="certificate-kicker">${t.kicker}</p>
            <h1>${t.title}</h1>
            <p>${t.intro}</p>
          </div>
          <div class="certificate-actions">
            <button type="button" class="btn btn-outline-primary" id="backToCourse">
              <i class="fas fa-arrow-left mr-2"></i>${t.back}
            </button>
            <button type="button" class="btn btn-primary" id="downloadCertificatePdf">
              <i class="fas fa-file-pdf mr-2"></i>${t.download}
            </button>
          </div>
        </section>

        <section class="certificate-shell">
          <div class="certificate-paper">
            <div class="certificate-border"></div>
            <div class="certificate-brand">
              <i class="fas fa-graduation-cap"></i>
              <span>Brilliant LMS</span>
            </div>
            <p class="certificate-overline">${t.certify}</p>
            <h2>${this._escape(certificate.studentName)}</h2>
            <p class="certificate-completed">${t.completed}</p>
            <h3>${this._escape(certificate.courseTitle)}</h3>
            <div class="certificate-meta-grid">
              <span><strong>${certificate.lessonCount}</strong>${t.lessons}</span>
              <span><strong>${certificate.quizCount}</strong>${t.quizzes}</span>
              <span><strong>${certificate.averageScore ?? "N/A"}%</strong>${t.average}</span>
              <span><strong>${this._escape(certificate.completedAt)}</strong>${t.date}</span>
            </div>
            <div class="certificate-footer-row">
              <div>
                <small>ID</small>
                <strong>${this._escape(certificate.id)}</strong>
              </div>
              <div class="certificate-signature">
                <span></span>
                <strong>${t.signature}</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  renderLocked(course, completed, total, lang) {
    const pct = total ? Math.min(100, Math.round((completed / total) * 100)) : 0;
    const t = lang === "vi" ? {
      title: "Chứng chỉ chưa mở",
      sub: `Hoàn thành đủ ${total} bài học để nhận chứng chỉ của khóa ${course?.title || ""}.`,
      progress: `${completed} / ${total} bài học`,
      back: "Quay lại khóa học",
    } : {
      title: "Certificate locked",
      sub: `Complete all ${total} lessons to earn the certificate for ${course?.title || ""}.`,
      progress: `${completed} / ${total} lessons`,
      back: "Back to course",
    };

    return `
      <div class="certificate-page">
        <section class="certificate-locked">
          <div class="certificate-lock-icon"><i class="fas fa-lock"></i></div>
          <h1>${t.title}</h1>
          <p>${this._escape(t.sub)}</p>
          <div class="leaderboard-unlock-track certificate-progress"><span style="width:${pct}%"></span></div>
          <strong>${t.progress}</strong>
          <button type="button" class="btn btn-primary mt-4" id="backToCourse">
            <i class="fas fa-arrow-left mr-2"></i>${t.back}
          </button>
        </section>
      </div>
    `;
  }

  renderError(lang) {
    const text = lang === "vi" ? "Không tải được chứng chỉ." : "Could not load certificate.";
    return `
      <div class="certificate-page">
        <section class="certificate-locked">
          <div class="certificate-lock-icon"><i class="fas fa-triangle-exclamation"></i></div>
          <h1>${text}</h1>
        </section>
      </div>
    `;
  }

  _escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

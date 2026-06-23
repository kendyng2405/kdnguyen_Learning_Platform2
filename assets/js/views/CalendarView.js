// ============================================================
//  CalendarView.js - Weekly timetable templates
// ============================================================

export class CalendarView {
  renderCalendar(week, tasks, courseBundles, lang) {
    const t = lang === "vi" ? {
      kicker: "Calendar + Deadline",
      title: "Thời khóa biểu tuần này",
      sub: "Theo dõi lịch học, deadline assignment/quiz và tạo lời nhắc học bằng AI.",
      enrolled: "Khóa đang học",
      deadlines: "Deadline",
      ai: "AI nhắc học",
      open: "Mở",
      empty: "Chưa có lịch học trong tuần. Hãy đăng ký khóa học hoặc hoàn thành bài tiếp theo để tạo lộ trình.",
    } : {
      kicker: "Calendar + Deadline",
      title: "This week's timetable",
      sub: "Track study sessions, assignment/quiz deadlines, and generate AI study reminders.",
      enrolled: "Active courses",
      deadlines: "Deadlines",
      ai: "AI reminder",
      open: "Open",
      empty: "No study schedule this week. Enroll in a course or continue a lesson to build your path.",
    };

    const deadlineCount = tasks.filter(task => task.type === "deadline").length;
    return `
      <div class="calendar-page">
        <section class="calendar-hero">
          <div>
            <p class="calendar-kicker">${t.kicker}</p>
            <h1>${t.title}</h1>
            <p>${t.sub}</p>
          </div>
          <div class="calendar-hero-stats">
            <span><strong>${courseBundles.length}</strong>${t.enrolled}</span>
            <span><strong>${deadlineCount}</strong>${t.deadlines}</span>
          </div>
        </section>

        <section class="calendar-grid">
          ${week.map(day => this._dayColumn(day, tasks, t, lang)).join("")}
        </section>

        ${tasks.length ? "" : `<div class="calendar-empty">${t.empty}</div>`}
      </div>
    `;
  }

  renderError(lang) {
    const text = lang === "vi" ? "Không tải được lịch học." : "Could not load calendar.";
    return `
      <div class="calendar-page">
        <section class="calendar-hero">
          <div>
            <p class="calendar-kicker">Calendar</p>
            <h1>${text}</h1>
          </div>
        </section>
      </div>
    `;
  }

  _dayColumn(day, tasks, t, lang) {
    const dateKey = day.toISOString().slice(0, 10);
    const dayTasks = tasks
      .map((task, index) => ({ ...task, index }))
      .filter(task => task.dateKey === dateKey);
    const isToday = dateKey === new Date().toISOString().slice(0, 10);
    const weekday = day.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", { weekday: "short" });
    const dateLabel = day.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", { day: "2-digit", month: "2-digit" });

    return `
      <article class="calendar-day ${isToday ? "is-today" : ""}">
        <header>
          <span>${weekday}</span>
          <strong>${dateLabel}</strong>
        </header>
        <div class="calendar-task-list">
          ${dayTasks.length
            ? dayTasks.map(task => this._taskCard(task, t)).join("")
            : `<div class="calendar-day-empty">--</div>`}
        </div>
      </article>
    `;
  }

  _taskCard(task, t) {
    return `
      <div class="calendar-task calendar-task--${task.tone}">
        <div class="calendar-task-head">
          <span><i class="fas ${task.icon}"></i></span>
          <strong>${this._escape(task.time)}</strong>
        </div>
        <h3>${this._escape(task.title)}</h3>
        <p>${this._escape(task.courseTitle)}</p>
        <small>${this._escape(task.subtitle)}</small>
        <div class="calendar-task-actions">
          <button type="button" class="btn btn-sm btn-outline-primary" data-calendar-task="${task.index}">${t.open}</button>
          <button type="button" class="btn btn-sm btn-outline-info" data-ai-reminder="${task.index}">${t.ai}</button>
        </div>
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

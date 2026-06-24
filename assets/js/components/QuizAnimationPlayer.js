// ============================================================
//  QuizAnimationPlayer.js - Lightweight CSS animation renderer
// ============================================================

export class QuizAnimationPlayer {
  static render(animationSpec, result = "correct", lang = "vi") {
    const spec = this._normalizeSpec(animationSpec);
    if (!spec) return "";

    const template = this._template(spec.template);
    const animation = result === "correct" ? spec.correctAnimation : spec.wrongAnimation;
    const steps = this._steps(animation);
    if (!steps.length) return "";

    const title = result === "correct"
      ? (spec.correctTitle || (lang === "vi" ? "Vì sao đúng?" : "Why it is correct"))
      : (spec.wrongTitle || (lang === "vi" ? "Cách sửa lỗi" : "How to fix it"));

    return `
      <div class="quiz-animation-player quiz-animation-player--${template} is-${result}" aria-live="polite">
        <div class="quiz-animation-orbit" aria-hidden="true"></div>
        <div class="quiz-animation-head">
          <span><i class="fas fa-wand-magic-sparkles"></i></span>
          <strong>${this._escape(title)}</strong>
        </div>
        <div class="quiz-animation-stage">
          ${steps.map((step, index) => this._step(step, index, template)).join("")}
        </div>
      </div>
    `;
  }

  static _normalizeSpec(animationSpec) {
    if (!animationSpec) return null;
    if (typeof animationSpec === "string") {
      try {
        return JSON.parse(animationSpec);
      } catch (error) {
        return null;
      }
    }
    return typeof animationSpec === "object" ? animationSpec : null;
  }

  static _steps(animation) {
    if (Array.isArray(animation)) return animation;
    if (Array.isArray(animation?.steps)) return animation.steps;
    return [];
  }

  static _step(step, index, template) {
    const text = typeof step === "string" ? step : (step.text || step.title || "");
    const detail = typeof step === "string" ? "" : (step.detail || step.description || "");
    const icon = this._icon(template, index);
    return `
      <article class="quiz-animation-step" style="--delay:${index * 0.34}s">
        <span class="quiz-animation-step-icon">${icon}</span>
        <div>
          <strong>${this._escape(text)}</strong>
          ${detail ? `<small>${this._escape(detail)}</small>` : ""}
        </div>
      </article>
    `;
  }

  static _template(template) {
    const allowed = new Set(["code_trace", "equation_steps", "physics_motion", "concept_flow", "generic_steps"]);
    return allowed.has(template) ? template : "generic_steps";
  }

  static _icon(template, index) {
    const icons = {
      code_trace: ["{ }", "if", "=>", "✓"],
      equation_steps: ["1", "2", "=", "✓"],
      physics_motion: ["●", "→", "↗", "✓"],
      concept_flow: ["A", "B", "C", "✓"],
      generic_steps: ["1", "2", "3", "✓"],
    };
    const list = icons[template] || icons.generic_steps;
    return list[index % list.length];
  }

  static _escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

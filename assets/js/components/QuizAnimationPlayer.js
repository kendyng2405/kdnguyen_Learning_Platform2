// ============================================================
//  QuizAnimationPlayer.js - Lightweight CSS animation renderer
// ============================================================

export class QuizAnimationPlayer {
  static render(animationSpec, result = "correct", lang = "vi", question = null) {
    const spec = this._normalizeSpec(animationSpec, question, lang);
    if (!spec) return "";

    const template = this._template(spec.template);
    const animation = result === "correct" ? spec.correctAnimation : spec.wrongAnimation;
    const steps = this._steps(animation);
    if (!steps.length) return "";

    const title = result === "correct"
      ? (spec.correctTitle || (lang === "vi" ? "Vì sao đúng?" : "Why it is correct"))
      : (spec.wrongTitle || (lang === "vi" ? "Cách sửa lỗi" : "How to fix it"));
    const visibleSteps = steps.slice(0, 4);
    const cycle = Math.max(visibleSteps.length, 1) * 2.4;

    return `
      <div class="quiz-animation-player quiz-animation-player--${template} is-${result}" style="--step-count:${visibleSteps.length}; --cycle:${cycle}s; --cursor-travel:${Math.max(visibleSteps.length - 1, 0) * 43}px" aria-live="polite">
        <div class="quiz-animation-orbit" aria-hidden="true"></div>
        <div class="quiz-animation-head">
          <span><i class="fas fa-wand-magic-sparkles"></i></span>
          <strong>${this._escape(title)}</strong>
        </div>
        <div class="quiz-animation-stage">
          ${this._scene(template, visibleSteps, result)}
          <div class="quiz-animation-caption-stack">
            ${visibleSteps.map((step, index) => this._caption(step, index)).join("")}
          </div>
        </div>
      </div>
    `;
  }

  static _normalizeSpec(animationSpec, question = null, lang = "vi") {
    if (!animationSpec) return null;
    let spec = null;
    if (typeof animationSpec === "string") {
      try {
        spec = JSON.parse(animationSpec);
      } catch (error) {
        return null;
      }
    } else {
      spec = typeof animationSpec === "object" ? animationSpec : null;
    }
    if (spec && question && this._isGenericSpec(spec)) {
      return this._fallbackSpec(question, lang);
    }
    return spec;
  }

  static _steps(animation) {
    if (Array.isArray(animation)) return animation;
    if (Array.isArray(animation?.steps)) return animation.steps;
    return [];
  }

  static _scene(template, steps, result) {
    if (template === "code_trace") return this._codeTraceScene(steps, result);
    if (template === "equation_steps") return this._equationScene(steps, result);
    if (template === "physics_motion") return this._physicsScene(steps, result);
    return this._flowScene(steps, template, result);
  }

  static _flowScene(steps, template, result) {
    return `
      <div class="quiz-animation-scene quiz-animation-scene--flow">
        <div class="quiz-animation-flow-line"></div>
        <div class="quiz-animation-runner"></div>
        ${steps.map((step, index) => {
          const pos = steps.length <= 1 ? 50 : 12 + ((76 * index) / (steps.length - 1));
          return `
          <span class="quiz-animation-node" style="--idx:${index}; --pos:${pos}%">
            <b>${this._icon(template, index)}</b>
            <small>${this._escape(this._shortText(step, 18))}</small>
          </span>`;
        }).join("")}
        <div class="quiz-animation-pulse-core">
          <i class="fas ${result === "correct" ? "fa-check" : "fa-rotate-right"}"></i>
        </div>
      </div>
    `;
  }

  static _codeTraceScene(steps, result) {
    const labels = steps.length ? steps : ["Read input", "Check logic", "Return result"];
    return `
      <div class="quiz-animation-scene quiz-animation-scene--code">
        <div class="quiz-code-window">
          <div class="quiz-code-dots"><span></span><span></span><span></span></div>
          <pre>${labels.map((step, index) => `<code style="--idx:${index}">${this._escape(this._shortText(step, 42))}</code>`).join("")}</pre>
          <span class="quiz-code-cursor"></span>
        </div>
        <div class="quiz-animation-pulse-core">
          <i class="fas ${result === "correct" ? "fa-check" : "fa-bug"}"></i>
        </div>
      </div>
    `;
  }

  static _equationScene(steps, result) {
    return `
      <div class="quiz-animation-scene quiz-animation-scene--equation">
        ${steps.map((step, index) => `
          <span class="quiz-equation-tile" style="--idx:${index}">
            <b>${index + 1}</b>
            <small>${this._escape(this._shortText(step, 22))}</small>
          </span>
        `).join("")}
        <span class="quiz-equation-equals">=</span>
        <span class="quiz-equation-result"><i class="fas ${result === "correct" ? "fa-check" : "fa-xmark"}"></i></span>
      </div>
    `;
  }

  static _physicsScene(steps, result) {
    const coords = [
      { x: 10, y: 65 },
      { x: 34, y: 24 },
      { x: 62, y: 48 },
      { x: 84, y: 25 },
    ];
    return `
      <div class="quiz-animation-scene quiz-animation-scene--physics">
        <svg class="quiz-physics-path" viewBox="0 0 360 180" aria-hidden="true">
          <path d="M35 135 C95 30, 170 30, 225 95 S300 155, 335 55"></path>
        </svg>
        <span class="quiz-physics-ball"><i class="fas ${result === "correct" ? "fa-check" : "fa-exclamation"}"></i></span>
        ${steps.map((step, index) => `
          <span class="quiz-physics-marker" style="--idx:${index}; --x:${coords[index % coords.length].x}%; --y:${coords[index % coords.length].y}%">${index + 1}</span>
        `).join("")}
      </div>
    `;
  }

  static _caption(step, index) {
    const text = typeof step === "string" ? step : (step.text || step.title || "");
    const detail = typeof step === "string" ? "" : (step.detail || step.description || "");
    return `
      <article class="quiz-animation-caption" style="--idx:${index}">
        <span>${index + 1}</span>
        <div>
          <strong>${this._escape(text)}</strong>
          ${detail ? `<small>${this._escape(detail)}</small>` : ""}
        </div>
      </article>
    `;
  }

  static _isGenericSpec(spec) {
    const text = [
      spec?.correctTitle,
      spec?.wrongTitle,
      ...(spec?.correctAnimation?.steps || []),
      ...(spec?.wrongAnimation?.steps || []),
    ].map(item => {
      if (typeof item === "string") return item;
      return `${item?.text || ""} ${item?.detail || ""}`;
    }).join(" ").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return [
      "find the mismatch",
      "compare your choice",
      "return to the concept",
      "choose by evidence",
      "prefer the answer",
      "read the prompt",
      "match the evidence",
      "review the idea",
      "tim diem lech",
      "khoanh vung loi",
      "quay lai khai niem",
      "chon theo bang chung",
      "doi chieu du kien",
      "xac dinh yeu cau",
      "ghi nho y chinh",
    ].some(phrase => text.includes(phrase));
  }

  static _fallbackSpec(question, lang = "vi") {
    const isVi = lang === "vi";
    const answer = this._answerLabel(question, lang);
    const focus = this._questionFocus(question, isVi);
    const explanation = this._clip(question?.explanation, 190) || (isVi
      ? "Giải thích dựa trực tiếp trên nội dung bài học của câu hỏi này."
      : "The explanation follows the lesson content for this question.");
    const prompt = this._clip(question?.question, 190);
    const isDrag = question?.type === "drag_drop";

    return {
      template: isDrag ? "concept_flow" : "generic_steps",
      correctTitle: isVi ? "Animation câu hỏi" : "Question animation",
      wrongTitle: isVi ? "Giải thích câu hỏi" : "Question explanation",
      correctAnimation: {
        steps: [
          {
            text: focus,
            detail: prompt,
          },
          {
            text: answer ? (isVi ? `Đáp án: ${this._clip(answer, 55)}` : `Answer: ${this._clip(answer, 55)}`) : (isVi ? "Ý chính của câu hỏi" : "Question key idea"),
            detail: answer || explanation,
          },
          {
            text: isVi ? "Vì sao đúng" : "Why it is correct",
            detail: explanation,
          },
        ],
      },
      wrongAnimation: {
        steps: [
          {
            text: focus,
            detail: prompt,
          },
          {
            text: answer ? (isVi ? `Đáp án đúng: ${this._clip(answer, 48)}` : `Correct answer: ${this._clip(answer, 48)}`) : (isVi ? "Khái niệm đúng" : "Correct concept"),
            detail: answer || explanation,
          },
          {
            text: isVi ? "Giải thích kiến thức" : "Concept explanation",
            detail: explanation,
          },
        ],
      },
    };
  }

  static _answerLabel(question, lang = "vi") {
    if (!question) return "";
    if (question.type === "drag_drop") {
      const options = Array.isArray(question.options) ? question.options : [];
      const order = Array.isArray(question.correctAnswer) ? question.correctAnswer : options.map((_, index) => index);
      return order.map(index => options[index]).filter(Boolean).join(" → ");
    }
    if (question.type === "short_answer") {
      return this._clip(question.correctAnswer, 150);
    }
    const options = Array.isArray(question.options) ? question.options : [];
    const index = Number(question.correctAnswer);
    if (Number.isInteger(index) && options[index]) return this._clip(options[index], 150);
    if (typeof question.correctAnswer === "string" && question.correctAnswer.trim()) {
      return this._clip(question.correctAnswer, 150);
    }
    return "";
  }

  static _questionFocus(question, isVi) {
    const raw = this._clip(question?.question, 80);
    if (!raw) return isVi ? "Nội dung câu hỏi" : "Question concept";
    const cleaned = raw
      .replace(/^(theo bài học|according to the lesson|true or false|đúng hay sai)[:,\s]*/i, "")
      .replace(/\?+$/, "")
      .trim();
    return this._clip(cleaned || raw, 58);
  }

  static _clip(value, max = 120) {
    const clean = String(value || "").replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    return `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
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

  static _shortText(step, max = 24) {
    const text = typeof step === "string" ? step : (step.text || step.title || "");
    const clean = String(text).replace(/\s+/g, " ").trim();
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
  }

  static _escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

// ============================================================
//  QuizAnimationPlayer.js - One-shot illustrative quiz scenes
// ============================================================

export class QuizAnimationPlayer {
  static render(animationSpec, result = "correct", lang = "vi", question = null) {
    const spec = this._normalizeSpec(animationSpec);
    const illustration = this._illustration(spec, question, lang);
    if (!illustration) return "";

    const sceneType = this._sceneType(illustration.type, question);
    const title = illustration.title || (lang === "vi" ? "Ví dụ minh họa" : "Illustrative example");
    const subtitle = illustration.caption || illustration.example || this._defaultCaption(question, lang);

    return `
      <div class="quiz-animation-player quiz-illustration-player quiz-illustration-player--${sceneType} is-${result}" aria-live="polite">
        <div class="quiz-animation-head quiz-illustration-head">
          <span><i class="fas fa-clapperboard"></i></span>
          <strong>${this._escape(title)}</strong>
        </div>
        <div class="quiz-illustration-stage">
          ${this._scene(sceneType, illustration, question, result, lang)}
          <article class="quiz-illustration-note">
            <span>${lang === "vi" ? "Ví dụ tương tự" : "Similar example"}</span>
            <strong>${this._escape(this._clip(subtitle, 110))}</strong>
            <small>${this._escape(this._clip(illustration.takeaway || this._answerLabel(question) || "", 180))}</small>
          </article>
        </div>
      </div>
    `;
  }

  static _normalizeSpec(animationSpec) {
    if (!animationSpec) return null;
    if (typeof animationSpec === "string") {
      try {
        return JSON.parse(animationSpec);
      } catch {
        return null;
      }
    }
    return typeof animationSpec === "object" ? animationSpec : null;
  }

  static _illustration(spec, question, lang) {
    const fromSpec = spec?.illustration || spec?.exampleScene || spec?.scene;
    if (fromSpec && typeof fromSpec === "object") {
      return {
        ...fromSpec,
        title: fromSpec.title || (lang === "vi" ? "Ví dụ minh họa" : "Illustrative example"),
      };
    }
    return this._deriveIllustration(question, lang);
  }

  static _deriveIllustration(question, lang) {
    if (!question) return null;
    const answer = this._answerLabel(question);
    const haystack = [question.question, answer, question.explanation, ...(question.options || [])].join(" ");
    const equation = this._deriveEquation(haystack);
    if (equation) {
      return {
        type: "equation",
        title: lang === "vi" ? "Hoạt cảnh phép tính tương tự" : "Similar equation scene",
        example: equation.label,
        formula: equation.label,
        leftCount: equation.left,
        rightCount: equation.right,
        total: equation.total,
        takeaway: lang === "vi"
          ? "Hai nhóm giá trị nhập lại thành tổng cuối cùng."
          : "Two value groups merge into the final total.",
      };
    }

    if (question.type === "drag_drop") {
      const items = (question.options || []).slice(0, 4);
      return {
        type: "sorting",
        title: lang === "vi" ? "Hoạt cảnh sắp xếp tương tự" : "Similar sorting scene",
        example: lang === "vi" ? "Các thẻ được đưa vào đúng vị trí" : "Cards move into their correct slots",
        items,
        takeaway: this._clip(items.join(" → "), 180),
      };
    }

    const items = this._conceptItems(answer || question.explanation || question.question, question.options);
    return {
      type: "concept",
      title: lang === "vi" ? "Hoạt cảnh ví dụ minh họa" : "Illustrative example scene",
      example: this._conceptExample(items, lang),
      items,
      target: this._conceptTarget(question, lang),
      takeaway: answer || question.explanation || "",
    };
  }

  static _sceneType(type, question) {
    const normalized = String(type || "").toLowerCase();
    if (["equation", "math", "equation_steps"].includes(normalized)) return "equation";
    if (["sorting", "sequence", "drag_drop", "concept_flow"].includes(normalized) && question?.type === "drag_drop") return "sorting";
    if (["motion", "physics", "physics_motion"].includes(normalized)) return "motion";
    if (["code", "code_trace"].includes(normalized)) return "code";
    return "concept";
  }

  static _scene(sceneType, illustration, question, result, lang) {
    if (sceneType === "equation") return this._equationScene(illustration, result);
    if (sceneType === "sorting") return this._sortingScene(illustration, lang);
    if (sceneType === "motion") return this._motionScene(illustration, result);
    if (sceneType === "code") return this._codeScene(illustration, question, result);
    return this._conceptScene(illustration, result, lang);
  }

  static _equationScene(illustration, result) {
    const left = this._safeCount(illustration.leftCount, 2);
    const right = this._safeCount(illustration.rightCount, 2);
    const total = this._safeCount(illustration.total, left + right);
    const formula = illustration.formula || illustration.example || `${left} + ${right} = ${total}`;
    return `
      <div class="quiz-illustration-scene quiz-illustration-scene--equation">
        <div class="quiz-illustration-dots is-left">
          ${Array.from({ length: left }).map((_, index) => `<i style="--idx:${index}"></i>`).join("")}
        </div>
        <b class="quiz-illustration-plus">+</b>
        <div class="quiz-illustration-dots is-right">
          ${Array.from({ length: right }).map((_, index) => `<i style="--idx:${index}"></i>`).join("")}
        </div>
        <b class="quiz-illustration-equals">=</b>
        <div class="quiz-illustration-total">
          ${Array.from({ length: total }).map((_, index) => `<i style="--idx:${index}"></i>`).join("")}
        </div>
        <strong class="quiz-illustration-formula">${this._escape(formula)}</strong>
        <span class="quiz-illustration-final-mark"><i class="fas ${result === "correct" ? "fa-check" : "fa-lightbulb"}"></i></span>
      </div>
    `;
  }

  static _conceptScene(illustration, result, lang) {
    const items = this._items(illustration.items, lang).slice(0, 3);
    const target = illustration.target || (lang === "vi" ? "Kết luận" : "Result");
    return `
      <div class="quiz-illustration-scene quiz-illustration-scene--concept">
        <div class="quiz-concept-source">
          ${items.map((item, index) => `
            <span style="--idx:${index}">
              <i class="fas ${this._conceptIcon(index)}"></i>
              <b>${this._escape(this._clip(item, 24))}</b>
            </span>
          `).join("")}
        </div>
        <div class="quiz-concept-target">
          <i class="fas ${result === "correct" ? "fa-bullseye" : "fa-lightbulb"}"></i>
          <strong>${this._escape(this._clip(target, 38))}</strong>
        </div>
        <svg class="quiz-concept-beam" viewBox="0 0 420 220" aria-hidden="true">
          <path d="M88 72 C160 30, 230 40, 318 92"></path>
          <path d="M88 150 C160 190, 235 182, 318 132"></path>
        </svg>
      </div>
    `;
  }

  static _sortingScene(illustration, lang) {
    const items = this._items(illustration.items, lang).slice(0, 4);
    return `
      <div class="quiz-illustration-scene quiz-illustration-scene--sorting">
        <div class="quiz-sort-stack">
          ${items.map((item, index) => `<span style="--idx:${index}">${this._escape(this._clip(item, 24))}</span>`).join("")}
        </div>
        <div class="quiz-sort-slots">
          ${items.map((item, index) => `<b style="--idx:${index}">${index + 1}</b>`).join("")}
        </div>
        <strong class="quiz-sort-finish">${lang === "vi" ? "Đúng thứ tự" : "Correct order"}</strong>
      </div>
    `;
  }

  static _motionScene(illustration, result) {
    return `
      <div class="quiz-illustration-scene quiz-illustration-scene--motion">
        <svg class="quiz-motion-path" viewBox="0 0 480 240" aria-hidden="true">
          <path d="M42 178 C120 52, 220 46, 286 132 S390 220, 438 70"></path>
        </svg>
        <span class="quiz-motion-object"><i class="fas ${result === "correct" ? "fa-check" : "fa-lightbulb"}"></i></span>
        <strong class="quiz-motion-label">${this._escape(this._clip(illustration.example || illustration.caption || "", 58))}</strong>
      </div>
    `;
  }

  static _codeScene(illustration, question, result) {
    const answer = this._answerLabel(question) || illustration.example || "result";
    return `
      <div class="quiz-illustration-scene quiz-illustration-scene--code">
        <div class="quiz-mini-code">
          <span></span><span></span><span></span>
          <code>input → check</code>
          <code>rule → ${this._escape(this._clip(answer, 34))}</code>
          <code>output → ${result === "correct" ? "ok" : "learn"}</code>
        </div>
      </div>
    `;
  }

  static _deriveEquation(text) {
    const match = String(text || "").match(/(\d+)\s*([+\-x×*])\s*(\d+)\s*=\s*(\d+)/);
    if (!match) return null;
    const a = Math.min(6, Math.max(1, Number(match[1]) + 1));
    const b = Math.min(6, Math.max(1, Number(match[3]) + 1));
    const op = match[2];
    const total = op === "-" ? Math.max(1, a - b) : a + b;
    return { left: a, right: op === "-" ? b : b, total, label: `${a} ${op === "*" || op === "x" ? "+" : op} ${b} = ${total}` };
  }

  static _conceptItems(text, options = []) {
    const source = String(text || "");
    const explicit = source
      .split(/,|;|\/|\+|\bvà\b|\band\b/gi)
      .map(item => item.replace(/[.:"'()]/g, "").trim())
      .filter(item => item.length >= 2 && item.length <= 42);
    const acronyms = source.match(/\b[A-Z][A-Z0-9+#.-]{1,}\b/g) || [];
    const optionItems = (options || []).slice(0, 3).filter(item => String(item).length <= 42);
    return [...new Set([...acronyms, ...explicit, ...optionItems])].slice(0, 3);
  }

  static _conceptExample(items, lang) {
    if (items.length >= 2) {
      return lang === "vi"
        ? `${items[0]} và ${items[1]} cùng đi vào một tình huống minh họa.`
        : `${items[0]} and ${items[1]} move into one example situation.`;
    }
    return lang === "vi" ? "Một ví dụ tương tự được mô phỏng bằng hoạt cảnh." : "A similar example is shown as a short scene.";
  }

  static _conceptTarget(question, lang) {
    if (question?.type === "multiple_choice") return lang === "vi" ? "Ý đúng" : "Correct idea";
    if (question?.type === "true_false") return lang === "vi" ? "Nhận định đúng" : "True statement";
    if (question?.type === "short_answer") return lang === "vi" ? "Từ khóa" : "Key term";
    return lang === "vi" ? "Khái niệm" : "Concept";
  }

  static _answerLabel(question) {
    if (!question) return "";
    if (question.type === "drag_drop") {
      const options = Array.isArray(question.options) ? question.options : [];
      const order = Array.isArray(question.correctAnswer) ? question.correctAnswer : options.map((_, index) => index);
      return order.map(index => options[index]).filter(Boolean).join(" → ");
    }
    if (question.type === "short_answer") return this._clip(question.correctAnswer, 150);
    const options = Array.isArray(question.options) ? question.options : [];
    const index = Number(question.correctAnswer);
    if (Number.isInteger(index) && options[index]) return this._clip(options[index], 150);
    return typeof question.correctAnswer === "string" ? this._clip(question.correctAnswer, 150) : "";
  }

  static _items(items, lang) {
    const clean = Array.isArray(items)
      ? items.map(item => String(item || "").trim()).filter(Boolean)
      : [];
    return clean.length ? clean : (lang === "vi" ? ["Ví dụ A", "Ví dụ B", "Kết quả"] : ["Example A", "Example B", "Result"]);
  }

  static _safeCount(value, fallback) {
    return Math.min(8, Math.max(1, Number.parseInt(value, 10) || fallback));
  }

  static _conceptIcon(index) {
    return ["fa-database", "fa-diagram-project", "fa-screwdriver-wrench"][index % 3];
  }

  static _defaultCaption(question, lang) {
    const answer = this._answerLabel(question);
    if (answer) return answer;
    return lang === "vi" ? "Một ví dụ cùng bản chất với đáp án." : "An example with the same idea as the answer.";
  }

  static _clip(value, max = 120) {
    const clean = String(value || "").replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    return `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
  }

  static _escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

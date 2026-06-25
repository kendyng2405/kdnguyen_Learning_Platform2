const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    const questionId = req.query?.questionId || "";
    res.status(200).json({
      questionId,
      animation_spec: fallbackAnimationSpec({ question: "" }, req.query?.lang || "vi"),
      source: "fallback",
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { questionId, question = {}, uiLanguage = "vi" } = req.body || {};
  const fallback = fallbackAnimationSpec(question, uiLanguage);

  if (!process.env.OPENAI_API_KEY) {
    res.status(200).json({ questionId, animation_spec: fallback, source: "fallback_missing_key" });
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: [
                  "Create an LMS quiz animation_spec as strict JSON.",
                  "Do not create video. Do not include markdown.",
                  "Required shape: {\"template\":\"equation_steps|physics_motion|concept_flow|code_trace|generic_steps\",\"correctTitle\":\"...\",\"wrongTitle\":\"...\",\"illustration\":{\"type\":\"equation|concept|sorting|motion|code\",\"title\":\"...\",\"example\":\"...\",\"caption\":\"...\",\"items\":[\"...\"],\"target\":\"...\",\"formula\":\"...\",\"leftCount\":2,\"rightCount\":2,\"total\":4,\"takeaway\":\"...\"}}.",
                  "The illustration must be a similar example/mini scene that demonstrates the answer, not a sequence of solving steps.",
                  "Example: if the quiz idea is '1 + 1 = 2', create an illustration like '2 + 2 = 4' with leftCount 2, rightCount 2, total 4.",
                  "For concept questions, create moving example objects/cards that combine into the correct concept.",
                  "For ordering questions, create a sorting illustration with items moving into correct slots.",
                  "Do NOT create answer hints, checklist steps, or tutoring instructions.",
                  "Do NOT use phrases like 'Find the mismatch', 'Return to the concept', 'Choose by evidence', 'Read the prompt', 'Match the evidence', or 'Why it is correct'.",
                  "Match the UI language unless the quiz question text itself is quoted.",
                ].join("\n"),
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({ questionId, uiLanguage, question }),
              },
            ],
          },
        ],
        text: { format: { type: "json_object" } },
        temperature: 0.25,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `OpenAI HTTP ${response.status}`);
    }

    const raw = extractOutputText(data);
    const parsed = JSON.parse(raw);
    const spec = normalizeSpec(parsed.animation_spec || parsed, fallback);
    res.status(200).json({ questionId, animation_spec: spec, source: "openai" });
  } catch (error) {
    res.status(200).json({
      questionId,
      animation_spec: fallback,
      source: "fallback_error",
      warning: error.message,
    });
  }
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }
  const text = data.output
    ?.flatMap(item => item.content || [])
    ?.map(part => part.text || part.value || "")
    ?.find(Boolean);
  if (!text) throw new Error("OpenAI returned empty animation JSON");
  return text;
}

function normalizeSpec(spec, fallback) {
  const allowedTemplates = new Set(["code_trace", "equation_steps", "physics_motion", "concept_flow", "generic_steps"]);
  const template = allowedTemplates.has(spec?.template) ? spec.template : fallback.template;
  const correctSteps = normalizeSteps(spec?.correctAnimation?.steps || spec?.correctAnimation);
  const wrongSteps = normalizeSteps(spec?.wrongAnimation?.steps || spec?.wrongAnimation);
  const useCorrectFallback = !correctSteps.length || isGenericSteps(correctSteps, spec?.correctTitle);
  const useWrongFallback = !wrongSteps.length || isGenericSteps(wrongSteps, spec?.wrongTitle);
  return {
    template,
    correctTitle: isGenericText(spec?.correctTitle) ? fallback.correctTitle : stringOr(spec?.correctTitle, fallback.correctTitle),
    wrongTitle: isGenericText(spec?.wrongTitle) ? fallback.wrongTitle : stringOr(spec?.wrongTitle, fallback.wrongTitle),
    illustration: normalizeIllustration(spec?.illustration || spec?.exampleScene || spec?.scene, fallback.illustration),
    correctAnimation: {
      steps: useCorrectFallback ? fallback.correctAnimation.steps : correctSteps,
    },
    wrongAnimation: {
      steps: useWrongFallback ? fallback.wrongAnimation.steps : wrongSteps,
    },
  };
}

function normalizeIllustration(value, fallback = {}) {
  if (!value || typeof value !== "object") return fallback;
  const allowed = new Set(["equation", "concept", "sorting", "motion", "code"]);
  const type = allowed.has(String(value.type || "").toLowerCase())
    ? String(value.type).toLowerCase()
    : fallback.type || "concept";
  return {
    type,
    title: stringOr(value.title, fallback.title || "Illustrative example"),
    example: stringOr(value.example, fallback.example || ""),
    caption: stringOr(value.caption, fallback.caption || ""),
    items: Array.isArray(value.items) ? value.items.map(item => String(item).slice(0, 80)).filter(Boolean).slice(0, 4) : (fallback.items || []),
    target: stringOr(value.target, fallback.target || ""),
    formula: stringOr(value.formula, fallback.formula || ""),
    leftCount: numberOr(value.leftCount, fallback.leftCount),
    rightCount: numberOr(value.rightCount, fallback.rightCount),
    total: numberOr(value.total, fallback.total),
    takeaway: stringOr(value.takeaway, fallback.takeaway || ""),
  };
}

function numberOr(value, fallback) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? number : fallback;
}

function isGenericSteps(steps, title = "") {
  return isGenericText([
    title,
    ...steps.map(step => `${step.text || ""} ${step.detail || ""}`),
  ].join(" "));
}

function isGenericText(value = "") {
  const text = String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function normalizeSteps(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(step => ({
      text: String(step?.text || step?.title || step || "").slice(0, 120),
      detail: String(step?.detail || step?.description || "").slice(0, 220),
    }))
    .filter(step => step.text);
}

function stringOr(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function fallbackAnimationSpec(question = {}, lang = "vi") {
  const isVi = lang === "vi";
  const isDrag = question?.type === "drag_drop";
  const prompt = trim(question?.question, 190);
  const answer = answerLabel(question);
  const focus = questionFocus(question, isVi);
  const explanation = trim(question?.explanation, 190) || (isVi
    ? "Giải thích dựa trực tiếp trên nội dung bài học của câu hỏi này."
    : "The explanation follows the lesson content for this question.");
  return {
    template: isDrag ? "concept_flow" : "generic_steps",
    correctTitle: isVi ? "Animation câu hỏi" : "Question animation",
    wrongTitle: isVi ? "Giải thích câu hỏi" : "Question explanation",
    illustration: fallbackIllustration(question, lang),
    correctAnimation: {
      steps: [
        {
          text: focus,
          detail: prompt,
        },
        {
          text: answer ? (isVi ? `Đáp án: ${trim(answer, 55)}` : `Answer: ${trim(answer, 55)}`) : (isVi ? "Ý chính của câu hỏi" : "Question key idea"),
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
          text: answer ? (isVi ? `Đáp án đúng: ${trim(answer, 48)}` : `Correct answer: ${trim(answer, 48)}`) : (isVi ? "Khái niệm đúng" : "Correct concept"),
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

function answerLabel(question = {}) {
  if (question.type === "drag_drop") {
    const options = Array.isArray(question.options) ? question.options : [];
    const order = Array.isArray(question.correctAnswer) ? question.correctAnswer : options.map((_, index) => index);
    return order.map(index => options[index]).filter(Boolean).join(" → ");
  }
  if (question.type === "short_answer") {
    return trim(question.correctAnswer, 150);
  }
  const options = Array.isArray(question.options) ? question.options : [];
  const index = Number(question.correctAnswer);
  if (Number.isInteger(index) && options[index]) return trim(options[index], 150);
  return typeof question.correctAnswer === "string" ? trim(question.correctAnswer, 150) : "";
}

function questionFocus(question = {}, isVi = true) {
  const raw = trim(question?.question, 80);
  if (!raw) return isVi ? "Nội dung câu hỏi" : "Question concept";
  const cleaned = raw
    .replace(/^(theo bài học|according to the lesson|true or false|đúng hay sai)[:,\s]*/i, "")
    .replace(/\?+$/, "")
    .trim();
  return trim(cleaned || raw, 58);
}

function fallbackIllustration(question = {}, lang = "vi") {
  const isVi = lang === "vi";
  const answer = answerLabel(question);
  const haystack = [question.question, answer, question.explanation, ...(question.options || [])].join(" ");
  const equation = deriveEquation(haystack);
  if (equation) {
    return {
      type: "equation",
      title: isVi ? "Hoạt cảnh phép tính tương tự" : "Similar equation scene",
      example: equation.label,
      caption: equation.label,
      formula: equation.label,
      leftCount: equation.left,
      rightCount: equation.right,
      total: equation.total,
      takeaway: isVi ? "Hai nhóm giá trị nhập lại thành tổng cuối cùng." : "Two value groups merge into the final total.",
    };
  }
  if (question.type === "drag_drop") {
    const items = (question.options || []).slice(0, 4);
    return {
      type: "sorting",
      title: isVi ? "Hoạt cảnh sắp xếp tương tự" : "Similar sorting scene",
      example: isVi ? "Các thẻ được đưa vào đúng vị trí." : "Cards move into their correct slots.",
      items,
      takeaway: items.join(" → "),
    };
  }
  const items = conceptItems(answer || question.explanation || question.question, question.options);
  return {
    type: "concept",
    title: isVi ? "Hoạt cảnh ví dụ minh họa" : "Illustrative example scene",
    example: items.length >= 2
      ? (isVi ? `${items[0]} và ${items[1]} cùng đi vào một tình huống minh họa.` : `${items[0]} and ${items[1]} move into one example situation.`)
      : (isVi ? "Một ví dụ tương tự được mô phỏng bằng hoạt cảnh." : "A similar example is shown as a short scene."),
    items,
    target: question.type === "short_answer" ? (isVi ? "Từ khóa" : "Key term") : (isVi ? "Ý đúng" : "Correct idea"),
    takeaway: answer || question.explanation || "",
  };
}

function deriveEquation(text) {
  const match = String(text || "").match(/(\d+)\s*([+\-x×*])\s*(\d+)\s*=\s*(\d+)/);
  if (!match) return null;
  const a = Math.min(6, Math.max(1, Number(match[1]) + 1));
  const b = Math.min(6, Math.max(1, Number(match[3]) + 1));
  const op = match[2];
  if (op === "-") {
    const total = Math.max(1, a - b);
    return { left: a, right: b, total, label: `${a} - ${b} = ${total}` };
  }
  if (op === "*" || op === "x" || op === "×") {
    const left = Math.min(4, a);
    const right = Math.min(4, b);
    return { left, right, total: left * right, label: `${left} × ${right} = ${left * right}` };
  }
  return { left: a, right: b, total: a + b, label: `${a} + ${b} = ${a + b}` };
}

function conceptItems(text, options = []) {
  const source = String(text || "");
  const explicit = source
    .split(/,|;|\/|\+|\bvà\b|\band\b/gi)
    .map(item => item.replace(/[.:"'()]/g, "").trim())
    .filter(item => item.length >= 2 && item.length <= 42);
  const acronyms = source.match(/\b[A-Z][A-Z0-9+#.-]{1,}\b/g) || [];
  const optionItems = (options || []).slice(0, 3).filter(item => String(item).length <= 42);
  return [...new Set([...acronyms, ...explicit, ...optionItems])].slice(0, 3);
}

function trim(value, max = 160) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

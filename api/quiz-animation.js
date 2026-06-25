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
                  "Required shape: {\"template\":\"code_trace|equation_steps|physics_motion|concept_flow|generic_steps\",\"correctTitle\":\"...\",\"wrongTitle\":\"...\",\"correctAnimation\":{\"steps\":[{\"text\":\"...\",\"detail\":\"...\"}]},\"wrongAnimation\":{\"steps\":[{\"text\":\"...\",\"detail\":\"...\"}]}}.",
                  "Use 3 to 4 short steps for each animation.",
                  "The animation must visualize the specific concept, fact, sequence, or process in this quiz question.",
                  "This is NOT answer-selection advice. Do not write generic coaching steps.",
                  "Never use phrases like 'Find the mismatch', 'Return to the concept', 'Choose by evidence', 'Read the prompt', or 'Match the evidence'.",
                  "Use concrete words from the question, correct answer, options, and explanation.",
                  "wrongAnimation is shown after a wrong answer; explain the correct concept for this exact question instead of giving hints.",
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
    correctAnimation: {
      steps: useCorrectFallback ? fallback.correctAnimation.steps : correctSteps,
    },
    wrongAnimation: {
      steps: useWrongFallback ? fallback.wrongAnimation.steps : wrongSteps,
    },
  };
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

function trim(value, max = 160) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

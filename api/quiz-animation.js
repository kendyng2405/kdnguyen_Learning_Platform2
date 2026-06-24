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
                  "Create an LMS quiz explanation animation_spec as strict JSON.",
                  "Do not create video. Do not include markdown.",
                  "Required shape: {\"template\":\"code_trace|equation_steps|physics_motion|concept_flow|generic_steps\",\"correctTitle\":\"...\",\"wrongTitle\":\"...\",\"correctAnimation\":{\"steps\":[{\"text\":\"...\",\"detail\":\"...\"}]},\"wrongAnimation\":{\"steps\":[{\"text\":\"...\",\"detail\":\"...\"}]}}.",
                  "Use 3 to 4 short steps for each animation.",
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
  return {
    template,
    correctTitle: stringOr(spec?.correctTitle, fallback.correctTitle),
    wrongTitle: stringOr(spec?.wrongTitle, fallback.wrongTitle),
    correctAnimation: {
      steps: correctSteps.length ? correctSteps : fallback.correctAnimation.steps,
    },
    wrongAnimation: {
      steps: wrongSteps.length ? wrongSteps : fallback.wrongAnimation.steps,
    },
  };
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
  return {
    template: isDrag ? "concept_flow" : "generic_steps",
    correctTitle: isVi ? "Bạn đã chọn đúng" : "You got it right",
    wrongTitle: isVi ? "Xem lại cách làm" : "Review the idea",
    correctAnimation: {
      steps: [
        {
          text: isVi ? "Đọc yêu cầu" : "Read the prompt",
          detail: trim(question?.question, 180),
        },
        {
          text: isVi ? "Đối chiếu dữ kiện" : "Match the evidence",
          detail: isVi ? "Đáp án đúng bám sát dữ kiện chính." : "The correct answer follows the key evidence.",
        },
        {
          text: isVi ? "Ghi nhớ" : "Remember",
          detail: trim(question?.explanation, 180) || (isVi ? "Giữ lại ý chính để áp dụng ở câu sau." : "Keep the main idea for the next question."),
        },
      ],
    },
    wrongAnimation: {
      steps: [
        {
          text: isVi ? "Tìm điểm lệch" : "Find the mismatch",
          detail: isVi ? "So sánh lựa chọn với nội dung câu hỏi." : "Compare the selected choice with the prompt.",
        },
        {
          text: isVi ? "Quay lại khái niệm" : "Return to the concept",
          detail: trim(question?.explanation, 180) || (isVi ? "Đọc lại phần giải thích ngắn." : "Review the short explanation."),
        },
        {
          text: isVi ? "Chọn theo bằng chứng" : "Choose by evidence",
          detail: isVi ? "Ưu tiên đáp án khớp trực tiếp với bài học." : "Prefer the answer directly supported by the lesson.",
        },
      ],
    },
  };
}

function trim(value, max = 160) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

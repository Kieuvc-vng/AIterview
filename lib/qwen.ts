import OpenAI from "openai";

const API_KEY = process.env.QWEN_API_KEY || "";
const IS_MOCK = !API_KEY || API_KEY === "your-api-key-here" || API_KEY === "mock";

const client = IS_MOCK
  ? null
  : new OpenAI({
      apiKey: API_KEY,
      baseURL: process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });

const PRIMARY_MODEL = process.env.QWEN_MODEL_PRIMARY || "qwen-plus-2025-04-28";
const BACKUP_MODEL = process.env.QWEN_MODEL_BACKUP || "qwen-turbo-2025-04-28";

function getMockResponse(userMessage: string): string {
  if (userMessage.includes("Analyze this job description")) {
    return JSON.stringify({
      jobTitle: "Software Engineer",
      skills: [
        {
          name: "JavaScript",
          category: "technical",
          description: "Ngôn ngữ lập trình chính cho phát triển web",
          questions: [
            "Closures trong JavaScript hoạt động như thế nào?",
            "Sự khác nhau giữa var, let và const?",
            "Event loop trong JavaScript là gì?",
          ],
        },
        {
          name: "React",
          category: "technical",
          description: "Framework frontend để xây dựng giao diện người dùng",
          questions: [
            "Giải thích lifecycle của một React component.",
            "useState và useEffect dùng để làm gì?",
            "Virtual DOM hoạt động như thế nào?",
          ],
        },
        {
          name: "Node.js",
          category: "technical",
          description: "Runtime JavaScript phía server",
          questions: [
            "Node.js xử lý concurrent requests như thế nào?",
            "Middleware trong Express.js là gì?",
          ],
        },
        {
          name: "Làm việc nhóm",
          category: "soft",
          description: "Khả năng phối hợp và giao tiếp hiệu quả trong team",
          questions: [
            "Bạn xử lý xung đột trong nhóm như thế nào?",
            "Mô tả một lần bạn phải thuyết phục đồng nghiệp thay đổi ý kiến.",
          ],
        },
        {
          name: "Giải quyết vấn đề",
          category: "soft",
          description: "Tư duy phân tích và giải quyết vấn đề phức tạp",
          questions: [
            "Mô tả một bug khó mà bạn đã debug thành công.",
            "Bạn tiếp cận một bài toán hoàn toàn mới như thế nào?",
          ],
        },
        {
          name: "Tiếng Anh",
          category: "other",
          description: "Khả năng giao tiếp và đọc tài liệu kỹ thuật bằng tiếng Anh",
          questions: [
            "Bạn có kinh nghiệm làm việc với team quốc tế không?",
            "Bạn thường đọc tài liệu kỹ thuật bằng tiếng Anh ở đâu?",
          ],
        },
      ],
    });
  }

  if (userMessage.includes("Evaluate this interview conversation")) {
    const isGoodAnswer = userMessage.length > 300;
    if (isGoodAnswer) {
      return JSON.stringify({
        evaluation: "sufficient",
        score: 4,
        notes: "Ứng viên trả lời tốt, thể hiện hiểu biết vững chắc.",
      });
    }
    return JSON.stringify({
      evaluation: "need_followup",
      score: 2,
      followUpQuestion: "Bạn có thể giải thích thêm và cho ví dụ cụ thể không?",
      notes: "Câu trả lời còn chung chung, cần thêm chi tiết.",
    });
  }

  if (userMessage.includes("Evaluate this completed interview")) {
    return JSON.stringify({
      overallScore: 3.5,
      recommendation: "Maybe",
      summary: "Ứng viên có kiến thức cơ bản tốt nhưng cần cải thiện ở một số lĩnh vực.",
      skillEvaluations: [
        {
          skill: "JavaScript",
          score: 4,
          level: "Intermediate",
          strengths: ["Hiểu biết cơ bản vững"],
          weaknesses: ["Cần thêm kinh nghiệm thực tế"],
          notes: "Có tiềm năng phát triển.",
        },
      ],
      strengths: ["Tư duy logic tốt", "Giao tiếp rõ ràng"],
      weaknesses: ["Thiếu kinh nghiệm với hệ thống lớn"],
      interviewNotes: "Buổi phỏng vấn diễn ra suôn sẻ. Ứng viên thể hiện thái độ cầu thị.",
    });
  }

  return "{}";
}

async function callModel(
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await client!.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 4096,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from model");
  return content;
}

export function safeParseJSON<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

export async function callQwen(
  systemPrompt: string,
  userMessage: string,
  options?: { useBackup?: boolean }
): Promise<string> {
  if (IS_MOCK) {
    console.log("[MOCK] Returning mock response");
    return getMockResponse(userMessage);
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await callModel(PRIMARY_MODEL, systemPrompt, userMessage);
    } catch (error) {
      if (attempt === 1) {
        if (options?.useBackup) {
          console.warn(`Primary model failed after retry, switching to backup: ${BACKUP_MODEL}`);
          return await callModel(BACKUP_MODEL, systemPrompt, userMessage);
        }
        throw error;
      }
    }
  }
  throw new Error("Unreachable");
}

import { describe, it, expect } from "vitest";
import { encodeConfig, decodeConfig } from "../config";
import { InterviewConfig } from "../types";

describe("config encode/decode", () => {
  const sampleConfig: InterviewConfig = {
    lang: "vi",
    jobTitle: "Frontend Developer",
    skills: [
      {
        name: "React",
        description: "React framework",
        questions: ["Giải thích useEffect?", "So sánh state và props?"],
      },
    ],
    createdAt: "2026-09-09",
  };

  it("round-trips a config object", () => {
    const encoded = encodeConfig(sampleConfig);
    const decoded = decodeConfig(encoded);
    expect(decoded).toEqual(sampleConfig);
  });

  it("handles Vietnamese characters", () => {
    const config: InterviewConfig = {
      lang: "vi",
      jobTitle: "Kỹ sư phần mềm",
      skills: [
        {
          name: "Giao tiếp",
          description: "Kỹ năng giao tiếp",
          questions: ["Bạn xử lý xung đột như thế nào?"],
        },
      ],
      createdAt: "2026-09-09",
    };
    const encoded = encodeConfig(config);
    const decoded = decodeConfig(encoded);
    expect(decoded).toEqual(config);
  });

  it("returns null for invalid input", () => {
    expect(decodeConfig("not-valid-base64!!!")).toBeNull();
  });

  it("returns null for valid base64 but missing fields", () => {
    const encoded = btoa(encodeURIComponent(JSON.stringify({ foo: "bar" })));
    expect(decodeConfig(encoded)).toBeNull();
  });
});

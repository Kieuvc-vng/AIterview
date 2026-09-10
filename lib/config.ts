import { InterviewConfig } from "./types";

export function encodeConfig(config: InterviewConfig): string {
  const json = JSON.stringify(config);
  return btoa(encodeURIComponent(json));
}

export function decodeConfig(encoded: string): InterviewConfig | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    if (!parsed.lang || !parsed.jobTitle || !Array.isArray(parsed.skills)) {
      return null;
    }
    return parsed as InterviewConfig;
  } catch {
    return null;
  }
}

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("openai", () => {
  const mockCreate = vi.fn();
  return {
    default: class {
      chat = { completions: { create: mockCreate } };
    },
    __mockCreate: mockCreate,
  };
});

describe("callQwen", () => {
  let mockCreate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("openai");
    mockCreate = (mod as unknown as { __mockCreate: ReturnType<typeof vi.fn> }).__mockCreate;
    mockCreate.mockReset();
  });

  it("returns text from primary model on success", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '{"result":"ok"}' } }],
    });

    const { callQwen } = await import("../qwen");
    const result = await callQwen("system", "user");

    expect(result).toBe('{"result":"ok"}');
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("retries once on primary failure before throwing (no backup)", async () => {
    mockCreate.mockRejectedValueOnce(new Error("timeout"));
    mockCreate.mockRejectedValueOnce(new Error("timeout again"));

    const { callQwen } = await import("../qwen");
    await expect(callQwen("system", "user")).rejects.toThrow("timeout again");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("falls back to backup model when useBackup is true and primary fails", async () => {
    mockCreate.mockRejectedValueOnce(new Error("primary fail"));
    mockCreate.mockRejectedValueOnce(new Error("primary retry fail"));
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '{"backup":"yes"}' } }],
    });

    const { callQwen } = await import("../qwen");
    const result = await callQwen("system", "user", { useBackup: true });

    expect(result).toBe('{"backup":"yes"}');
    expect(mockCreate).toHaveBeenCalledTimes(3);
  });

  it("throws when both primary and backup fail", async () => {
    mockCreate.mockRejectedValueOnce(new Error("primary fail"));
    mockCreate.mockRejectedValueOnce(new Error("primary retry fail"));
    mockCreate.mockRejectedValueOnce(new Error("backup fail"));

    const { callQwen } = await import("../qwen");
    await expect(callQwen("system", "user", { useBackup: true })).rejects.toThrow("backup fail");
    expect(mockCreate).toHaveBeenCalledTimes(3);
  });
});

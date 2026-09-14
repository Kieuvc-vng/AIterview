import { promises as fs } from "fs";
import path from "path";
import { AppStore } from "./types";

const STORE_PATH = path.join(process.cwd(), "data", "store.json");

const EMPTY_STORE: AppStore = { jobs: [], candidates: [] };

export async function getStore(): Promise<AppStore> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    return JSON.parse(raw) as AppStore;
  } catch {
    return { ...EMPTY_STORE, jobs: [], candidates: [] };
  }
}

export async function saveStore(store: AppStore): Promise<void> {
  const dir = path.dirname(STORE_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

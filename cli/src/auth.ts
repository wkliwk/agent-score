import fs from "fs";
import path from "path";
import os from "os";

const AUTH_DIR = path.join(os.homedir(), ".agentscore");
const AUTH_FILE = path.join(AUTH_DIR, "auth.json");

interface AuthData {
  token: string;
  username: string;
  github?: string;
  expiresAt?: string;
}

function ensureAuthDir(): void {
  try {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  } catch {
    // Already exists or can't create — surface errors downstream
  }
}

export function getToken(): AuthData | null {
  try {
    const raw = fs.readFileSync(AUTH_FILE, "utf-8");
    return JSON.parse(raw) as AuthData;
  } catch {
    return null;
  }
}

export function saveToken(data: AuthData): void {
  ensureAuthDir();
  fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
}

export function clearToken(): void {
  try {
    fs.unlinkSync(AUTH_FILE);
  } catch {
    // File doesn't exist — that's fine
  }
}

export function isTokenExpired(data: AuthData): boolean {
  if (data.expiresAt === undefined) return false;
  return new Date(data.expiresAt) <= new Date();
}

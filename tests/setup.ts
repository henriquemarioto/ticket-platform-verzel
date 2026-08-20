import { vi } from "vitest";
import fs from "fs";

// Configure default environment variables for testing
process.env.AUTH_SECRET =
  process.env.AUTH_SECRET || "test-auth-secret-super-secure-key-32-chars-long";
process.env.QR_HMAC_SECRET =
  process.env.QR_HMAC_SECRET || "test-qr-hmac-secret-super-secure-key-32-chars";

// Determine if tests are running inside Docker container or on the host machine
const isDocker =
  fs.existsSync("/.dockerenv") ||
  Boolean(process.env.DOCKER) ||
  Boolean(process.env.IS_DOCKER) ||
  (fs.existsSync("/proc/1/cgroup") &&
    fs.readFileSync("/proc/1/cgroup", "utf8").includes("docker"));

if (!isDocker) {
  // On host machine, map @postgres:5432 or @postgres: to localhost:5433
  if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_URL
      .replace(/@postgres:\d+/, "@localhost:5433")
      .replace(/@postgres(?!\w)/, "@localhost:5433");
  } else {
    process.env.DATABASE_URL =
      "postgresql://postgres:password@localhost:5433/ticket_platform?schema=public";
  }

  if (process.env.DIRECT_URL) {
    process.env.DIRECT_URL = process.env.DIRECT_URL
      .replace(/@postgres:\d+/, "@localhost:5433")
      .replace(/@postgres(?!\w)/, "@localhost:5433");
  } else {
    process.env.DIRECT_URL =
      "postgresql://postgres:password@localhost:5433/ticket_platform?schema=public";
  }
} else {
  // Inside Docker container, use postgres:5432
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      "postgresql://postgres:password@postgres:5432/ticket_platform?schema=public";
  }
  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL =
      "postgresql://postgres:password@postgres:5432/ticket_platform?schema=public";
  }
}

Object.assign(process.env, {
  NODE_ENV: "test",
  APP_ENV: "test",
});

// In-memory cookie store for mocking next/headers
const cookieStore = new Map<string, string>();

export const mockCookies = {
  get: vi.fn((name: string) => {
    const value = cookieStore.get(name);
    return value ? { name, value } : undefined;
  }),
  set: vi.fn((name: string, value: string) => {
    cookieStore.set(name, value);
  }),
  delete: vi.fn((name: string) => {
    cookieStore.delete(name);
  }),
  clear: () => {
    cookieStore.clear();
  },
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookies),
  headers: vi.fn(async () => new Headers()),
}));

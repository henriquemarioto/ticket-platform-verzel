import { describe, it, expect, beforeEach } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createSession,
  verifySession,
  getSession,
  deleteSession,
} from "@/lib/auth";
import { proxy } from "@/proxy";
import { NextRequest } from "next/server";
import { mockCookies } from "../setup";

describe("RBAC & Auth Utilities (UC01, UC02, UC30)", () => {
  beforeEach(() => {
    mockCookies.clear();
  });

  describe("Password Hashing & Verification", () => {
    it("should hash a password and verify it correctly", async () => {
      const password = "mySecretPassword123";
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword("wrongPassword", hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("Session JWT Management", () => {
    it("should create and verify a valid JWT session token", async () => {
      const payload = {
        id: "user-123",
        email: "customer@example.com",
        role: "CUSTOMER",
      };

      const token = await createSession(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const verified = await verifySession(token);
      expect(verified).not.toBeNull();
      expect(verified?.id).toBe(payload.id);
      expect(verified?.email).toBe(payload.email);
      expect(verified?.role).toBe(payload.role);
    });

    it("should return null when verifying an invalid or tampered token", async () => {
      const invalidToken = "invalid.jwt.token";
      const result = await verifySession(invalidToken);
      expect(result).toBeNull();
    });

    it("should get session from cookie store and delete session", async () => {
      const payload = {
        id: "organizer-456",
        email: "organizer@example.com",
        role: "ORGANIZER",
      };

      await createSession(payload);
      const session = await getSession();

      expect(session).not.toBeNull();
      expect(session?.id).toBe("organizer-456");
      expect(session?.role).toBe("ORGANIZER");

      await deleteSession();
      const sessionAfterDelete = await getSession();
      expect(sessionAfterDelete).toBeNull();
    });
  });

  describe("Proxy Middleware & RBAC Isolation", () => {
    const createReq = (url: string, cookieValue?: string) => {
      const headers = new Headers();
      if (cookieValue) {
        headers.set("cookie", `session=${cookieValue}`);
      }
      return new NextRequest(new URL(url, "http://localhost:3000"), {
        headers,
      });
    };

    it("should allow unauthenticated access to public routes", async () => {
      const req = createReq("http://localhost:3000/");
      const res = await proxy(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("x-user-role")).toBeNull();
    });

    it("should return 401 for unauthenticated access to protected API routes", async () => {
      const req = createReq("http://localhost:3000/api/reservations/seats");
      const res = await proxy(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe("Não autorizado");
    });

    it("should redirect unauthenticated user to /login for protected pages", async () => {
      const req = createReq("http://localhost:3000/organizer/analytics");
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
      expect(res.headers.get("location")).toContain("returnUrl=%2Forganizer%2Fanalytics");
    });

    it("should rewrite to /forbidden when CUSTOMER attempts to access /organizer", async () => {
      const customerToken = await createSession({
        id: "cust-1",
        email: "cust@test.com",
        role: "CUSTOMER",
      });

      const req = createReq("http://localhost:3000/organizer/events", customerToken);
      const res = await proxy(req);

      expect(res.headers.get("x-middleware-rewrite")).toContain("/forbidden");
    });

    it("should rewrite to /forbidden when ORGANIZER attempts to access /gatekeeper", async () => {
      const orgToken = await createSession({
        id: "org-1",
        email: "org@test.com",
        role: "ORGANIZER",
      });

      const req = createReq("http://localhost:3000/gatekeeper", orgToken);
      const res = await proxy(req);

      expect(res.headers.get("x-middleware-rewrite")).toContain("/forbidden");
    });

    it("should redirect GATEKEEPER to /gatekeeper when accessing customer pages", async () => {
      const gatekeeperToken = await createSession({
        id: "gate-1",
        email: "gate@test.com",
        role: "GATEKEEPER",
      });

      const req = createReq("http://localhost:3000/my-tickets", gatekeeperToken);
      const res = await proxy(req);

      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/gatekeeper");
    });

    it("should inject user headers for authenticated requests", async () => {
      const token = await createSession({
        id: "org-123",
        email: "org@events.com",
        role: "ORGANIZER",
      });

      const req = createReq("http://localhost:3000/organizer/analytics", token);
      const res = await proxy(req);

      expect(res.headers.get("x-user-id")).toBe("org-123");
      expect(res.headers.get("x-user-email")).toBe("org@events.com");
      expect(res.headers.get("x-user-role")).toBe("ORGANIZER");
    });
  });
});

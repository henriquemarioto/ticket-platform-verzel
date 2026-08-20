import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateTicketQRPayload,
  parseAndVerifyQRPayload,
  generateSharePasscode,
} from "@/lib/crypto";

describe("Crypto HMAC Utilities (UC19, UC30)", () => {
  const originalSecret = process.env.QR_HMAC_SECRET;
  const testSecret = "test-qr-hmac-secret-super-secure-key-32-chars";

  beforeEach(() => {
    process.env.QR_HMAC_SECRET = testSecret;
  });

  afterEach(() => {
    process.env.QR_HMAC_SECRET = originalSecret;
  });

  describe("generateTicketQRPayload", () => {
    it("should generate a valid QR payload with 32-character HMAC signature", () => {
      const ticketCode = "TCK-123456";
      const eventId = "event-abc";
      const timestamp = 1700000000;

      const result = generateTicketQRPayload(ticketCode, eventId, timestamp);

      expect(result).toBeDefined();
      expect(result.secureToken).toHaveLength(32);
      expect(result.qrPayload).toBe(
        `v1:${ticketCode}:${eventId}:${timestamp}:${result.secureToken}`
      );
    });

    it("should generate deterministic signatures for identical inputs", () => {
      const payload1 = generateTicketQRPayload("TCK-ABC", "ev-1", 1700000000);
      const payload2 = generateTicketQRPayload("TCK-ABC", "ev-1", 1700000000);

      expect(payload1.secureToken).toBe(payload2.secureToken);
      expect(payload1.qrPayload).toBe(payload2.qrPayload);
    });

    it("should generate different signatures for different timestamps or codes", () => {
      const p1 = generateTicketQRPayload("TCK-1", "ev-1", 1700000000);
      const p2 = generateTicketQRPayload("TCK-2", "ev-1", 1700000000);
      const p3 = generateTicketQRPayload("TCK-1", "ev-1", 1700000001);

      expect(p1.secureToken).not.toBe(p2.secureToken);
      expect(p1.secureToken).not.toBe(p3.secureToken);
    });

    it("should throw error if QR_HMAC_SECRET is missing", () => {
      delete process.env.QR_HMAC_SECRET;

      expect(() =>
        generateTicketQRPayload("TCK-123", "ev-1", 1700000000)
      ).toThrow("ERRO FATAL: Variável QR_HMAC_SECRET não definida no ambiente.");
    });
  });

  describe("parseAndVerifyQRPayload", () => {
    it("should successfully verify and parse a valid QR payload", () => {
      const ticketCode = "TCK-VAL-999";
      const eventId = "event-xyz";
      const timestamp = 1715000000;

      const { qrPayload } = generateTicketQRPayload(ticketCode, eventId, timestamp);
      const parsed = parseAndVerifyQRPayload(qrPayload);

      expect(parsed).not.toBeNull();
      expect(parsed?.version).toBe("v1");
      expect(parsed?.ticketCode).toBe(ticketCode);
      expect(parsed?.eventId).toBe(eventId);
      expect(parsed?.timestamp).toBe(timestamp);
      expect(parsed?.isValidSignature).toBe(true);
    });

    it("should detect tampered signature (invalid signature)", () => {
      const { qrPayload } = generateTicketQRPayload("TCK-1", "ev-1", 1700000000);
      // Alter the last character of the signature
      const tampered = qrPayload.slice(0, -1) + (qrPayload.endsWith("a") ? "b" : "a");

      const parsed = parseAndVerifyQRPayload(tampered);
      expect(parsed).not.toBeNull();
      expect(parsed?.isValidSignature).toBe(false);
    });

    it("should detect tampered ticket code with original signature", () => {
      const { secureToken } = generateTicketQRPayload("TCK-GENUINE", "ev-1", 1700000000);
      const forgedPayload = `v1:TCK-FORGED:ev-1:1700000000:${secureToken}`;

      const parsed = parseAndVerifyQRPayload(forgedPayload);
      expect(parsed).not.toBeNull();
      expect(parsed?.isValidSignature).toBe(false);
    });

    it("should return null for malformed payloads", () => {
      expect(parseAndVerifyQRPayload("invalid-string")).toBeNull();
      expect(parseAndVerifyQRPayload("v2:TCK:EV:12345:sig")).toBeNull();
      expect(parseAndVerifyQRPayload("v1:TCK:EV:notanumber:sig")).toBeNull();
      expect(parseAndVerifyQRPayload("v1:TCK:EV:12345")).toBeNull();
    });
  });

  describe("generateSharePasscode", () => {
    it("should generate a 6-character hex passcode from share token", () => {
      const shareToken = "share-token-uuid-123456";
      const passcode = generateSharePasscode(shareToken);

      expect(passcode).toHaveLength(6);
      expect(typeof passcode).toBe("string");
      expect(/^[0-9a-f]{6}$/i.test(passcode)).toBe(true);
    });

    it("should be deterministic for the same token", () => {
      const token = "token-abc";
      expect(generateSharePasscode(token)).toBe(generateSharePasscode(token));
    });

    it("should produce different passcodes for different tokens", () => {
      expect(generateSharePasscode("token-1")).not.toBe(
        generateSharePasscode("token-2")
      );
    });

    it("should throw error if QR_HMAC_SECRET is missing", () => {
      delete process.env.QR_HMAC_SECRET;
      expect(() => generateSharePasscode("tok")).toThrow(
        "ERRO FATAL: Variável QR_HMAC_SECRET não definida no ambiente."
      );
    });
  });
});

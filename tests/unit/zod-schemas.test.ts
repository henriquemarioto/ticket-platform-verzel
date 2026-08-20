import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import {
  createSectorSchema,
  createEventSchema,
  updateEventStatusSchema,
} from "@/lib/validations/events";
import { checkoutSchema } from "@/lib/validations/checkout";
import { validateTicketSchema } from "@/lib/validations/gate";
import { createTemporaryGatekeeperSchema } from "@/lib/validations/gatekeeper-management";
import {
  reserveGeneralAdmissionSchema,
  reserveSeatsSchema,
} from "@/lib/validations/reservation";

describe("Zod Validation Schemas (UC30)", () => {
  describe("Auth Schemas", () => {
    it("should validate correct login data and reject invalid email/empty password", () => {
      const valid = loginSchema.safeParse({
        email: "user@example.com",
        password: "password123",
      });
      expect(valid.success).toBe(true);

      const invalidEmail = loginSchema.safeParse({
        email: "not-an-email",
        password: "password123",
      });
      expect(invalidEmail.success).toBe(false);

      const emptyPassword = loginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(emptyPassword.success).toBe(false);
    });

    it("should validate register data and enforce password match & length", () => {
      const valid = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "securePassword123",
        confirmPassword: "securePassword123",
        role: "CUSTOMER",
      });
      expect(valid.success).toBe(true);

      const mismatch = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        confirmPassword: "differentPassword",
        role: "CUSTOMER",
      });
      expect(mismatch.success).toBe(false);

      const shortPassword = registerSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "123",
        confirmPassword: "123",
      });
      expect(shortPassword.success).toBe(false);
    });
  });

  describe("Event & Sector Schemas", () => {
    it("should validate General Admission sector with capacity > 0", () => {
      const validGA = createSectorSchema.safeParse({
        name: "Pista Premium",
        type: "GENERAL_ADMISSION",
        price: 150.0,
        totalCapacity: 500,
      });
      expect(validGA.success).toBe(true);

      const invalidGA = createSectorSchema.safeParse({
        name: "Pista",
        type: "GENERAL_ADMISSION",
        price: 100,
        totalCapacity: 0,
      });
      expect(invalidGA.success).toBe(false);
    });

    it("should validate Numbered Seats sector with rows and seatsPerRow", () => {
      const validNumbered = createSectorSchema.safeParse({
        name: "Plateia Central",
        type: "NUMBERED_SEATS",
        price: 250.0,
        rows: ["A", "B", "C"],
        seatsPerRow: 10,
      });
      expect(validNumbered.success).toBe(true);

      const invalidNumbered = createSectorSchema.safeParse({
        name: "Plateia",
        type: "NUMBERED_SEATS",
        price: 250.0,
        rows: [],
        seatsPerRow: 0,
      });
      expect(invalidNumbered.success).toBe(false);
    });

    it("should validate event creation with description >= 300 chars and correct gate timings", () => {
      const now = Date.now();
      const eventDate = new Date(now + 24 * 60 * 60 * 1000).toISOString(); // tomorrow
      const entryStartTime = new Date(now + 22 * 60 * 60 * 1000).toISOString(); // 2h before event
      const endDate = new Date(now + 28 * 60 * 60 * 1000).toISOString(); // 4h after event start

      const longDescription = "A".repeat(300);

      const validEvent = createEventSchema.safeParse({
        title: "Grande Festival de Música 2026",
        description: longDescription,
        category: "FESTIVAL",
        bannerUrl: "https://example.com/banner.jpg",
        locationName: "Allianz Parque",
        street: "Av. Francisco Matarazzo",
        number: "1705",
        neighborhood: "Água Branca",
        city: "São Paulo, SP",
        eventDate,
        entryStartTime,
        endDate,
        isAdult: false,
        sectors: [
          {
            name: "Pista",
            type: "GENERAL_ADMISSION",
            price: 120.0,
            totalCapacity: 1000,
          },
        ],
      });

      expect(validEvent.success).toBe(true);
    });

    it("should reject event creation if description is less than 300 characters", () => {
      const now = Date.now();
      const eventDate = new Date(now + 24 * 60 * 60 * 1000).toISOString();
      const entryStartTime = new Date(now + 22 * 60 * 60 * 1000).toISOString();

      const invalidEvent = createEventSchema.safeParse({
        title: "Show",
        description: "Curto demais",
        category: "SHOW",
        bannerUrl: "https://example.com/b.jpg",
        locationName: "Local",
        street: "Rua",
        number: "10",
        neighborhood: "Bairro",
        city: "São Paulo, SP",
        eventDate,
        entryStartTime,
        sectors: [
          {
            name: "Pista",
            type: "GENERAL_ADMISSION",
            price: 50,
            totalCapacity: 100,
          },
        ],
      });

      expect(invalidEvent.success).toBe(false);
    });

    it("should validate updateEventStatusSchema", () => {
      expect(updateEventStatusSchema.safeParse({ status: "PUBLISHED" }).success).toBe(true);
      expect(updateEventStatusSchema.safeParse({ status: "CLOSED" }).success).toBe(true);
      expect(updateEventStatusSchema.safeParse({ status: "INVALID_STATUS" }).success).toBe(false);
    });
  });

  describe("Checkout & Gate Schemas", () => {
    it("should validate checkoutSchema", () => {
      const valid = checkoutSchema.safeParse({
        reservationId: "res-123",
        paymentMethod: "SIMULATED_CREDIT_CARD",
        action: "APPROVE",
      });
      expect(valid.success).toBe(true);

      const invalid = checkoutSchema.safeParse({
        reservationId: "",
        action: "UNKNOWN_ACTION",
      });
      expect(invalid.success).toBe(false);
    });

    it("should validate validateTicketSchema with qrPayload or ticketCode", () => {
      const validQR = validateTicketSchema.safeParse({
        eventId: "event-1",
        qrPayload: "v1:TCK-1:event-1:1700000000:sig",
      });
      expect(validQR.success).toBe(true);

      const validCode = validateTicketSchema.safeParse({
        eventId: "event-1",
        ticketCode: "TCK-123",
      });
      expect(validCode.success).toBe(true);

      const invalidEmpty = validateTicketSchema.safeParse({
        eventId: "event-1",
      });
      expect(invalidEmpty.success).toBe(false);
    });

    it("should validate createTemporaryGatekeeperSchema", () => {
      const valid = createTemporaryGatekeeperSchema.safeParse({
        name: "Portaria Principal",
        autoGenerate: true,
      });
      expect(valid.success).toBe(true);

      const invalidShortName = createTemporaryGatekeeperSchema.safeParse({
        name: "A",
      });
      expect(invalidShortName.success).toBe(false);
    });
  });

  describe("Reservation Schemas", () => {
    it("should validate General Admission reservation within 1-6 limit", () => {
      expect(
        reserveGeneralAdmissionSchema.safeParse({
          sectorId: "sec-1",
          quantity: 4,
        }).success
      ).toBe(true);

      expect(
        reserveGeneralAdmissionSchema.safeParse({
          sectorId: "sec-1",
          quantity: 0,
        }).success
      ).toBe(false);

      expect(
        reserveGeneralAdmissionSchema.safeParse({
          sectorId: "sec-1",
          quantity: 7,
        }).success
      ).toBe(false);
    });

    it("should validate Numbered Seats reservation within 1-6 limit", () => {
      expect(
        reserveSeatsSchema.safeParse({
          eventId: "ev-1",
          sectorId: "sec-1",
          seatIds: ["seat-1", "seat-2"],
        }).success
      ).toBe(true);

      expect(
        reserveSeatsSchema.safeParse({
          eventId: "ev-1",
          sectorId: "sec-1",
          seatIds: [],
        }).success
      ).toBe(false);

      expect(
        reserveSeatsSchema.safeParse({
          eventId: "ev-1",
          sectorId: "sec-1",
          seatIds: ["s1", "s2", "s3", "s4", "s5", "s6", "s7"],
        }).success
      ).toBe(false);
    });
  });
});

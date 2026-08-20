import { describe, it, expect } from "vitest";
import {
  EventCategoryEnum,
  EVENT_CATEGORY_LABELS,
  EVENT_CATEGORY_PLURAL_LABELS,
  getEventCategoryLabel,
  getEventCategoryPluralLabel,
  EVENT_CATEGORIES_OPTIONS,
} from "@/lib/constants/event-categories";

describe("event-categories", () => {
  it("should have correct enum values", () => {
    expect(EventCategoryEnum.SHOW).toBe("SHOW");
    expect(EventCategoryEnum.MOVIE).toBe("MOVIE");
    expect(EventCategoryEnum.THEATER).toBe("THEATER");
    expect(EventCategoryEnum.FESTIVAL).toBe("FESTIVAL");
  });

  it("should have correct singular labels", () => {
    expect(EVENT_CATEGORY_LABELS[EventCategoryEnum.SHOW]).toBe("Show");
    expect(EVENT_CATEGORY_LABELS[EventCategoryEnum.MOVIE]).toBe("Cinema");
    expect(EVENT_CATEGORY_LABELS[EventCategoryEnum.THEATER]).toBe("Teatro");
    expect(EVENT_CATEGORY_LABELS[EventCategoryEnum.FESTIVAL]).toBe("Festival");
  });

  it("should have correct plural labels", () => {
    expect(EVENT_CATEGORY_PLURAL_LABELS[EventCategoryEnum.SHOW]).toBe("Shows");
    expect(EVENT_CATEGORY_PLURAL_LABELS[EventCategoryEnum.MOVIE]).toBe("Cinema");
    expect(EVENT_CATEGORY_PLURAL_LABELS[EventCategoryEnum.THEATER]).toBe("Teatro");
    expect(EVENT_CATEGORY_PLURAL_LABELS[EventCategoryEnum.FESTIVAL]).toBe("Festivais");
  });

  it("should return correct label using getEventCategoryLabel", () => {
    expect(getEventCategoryLabel("SHOW")).toBe("Show");
    expect(getEventCategoryLabel("MOVIE")).toBe("Cinema");
    expect(getEventCategoryLabel("THEATER")).toBe("Teatro");
    expect(getEventCategoryLabel("FESTIVAL")).toBe("Festival");
    expect(getEventCategoryLabel("UNKNOWN")).toBe("UNKNOWN");
    expect(getEventCategoryLabel(null)).toBe("");
    expect(getEventCategoryLabel(undefined)).toBe("");
    expect(getEventCategoryLabel("")).toBe("");
  });

  it("should return correct plural label using getEventCategoryPluralLabel", () => {
    expect(getEventCategoryPluralLabel("SHOW")).toBe("Shows");
    expect(getEventCategoryPluralLabel("MOVIE")).toBe("Cinema");
    expect(getEventCategoryPluralLabel("THEATER")).toBe("Teatro");
    expect(getEventCategoryPluralLabel("FESTIVAL")).toBe("Festivais");
    expect(getEventCategoryPluralLabel("UNKNOWN")).toBe("UNKNOWN");
    expect(getEventCategoryPluralLabel(null)).toBe("");
    expect(getEventCategoryPluralLabel(undefined)).toBe("");
    expect(getEventCategoryPluralLabel("")).toBe("");
  });

  it("should export options array for form selects", () => {
    expect(EVENT_CATEGORIES_OPTIONS).toHaveLength(4);
    expect(EVENT_CATEGORIES_OPTIONS[0]).toEqual({ value: "SHOW", label: "Show" });
    expect(EVENT_CATEGORIES_OPTIONS[1]).toEqual({ value: "MOVIE", label: "Cinema" });
    expect(EVENT_CATEGORIES_OPTIONS[2]).toEqual({ value: "THEATER", label: "Teatro" });
    expect(EVENT_CATEGORIES_OPTIONS[3]).toEqual({ value: "FESTIVAL", label: "Festival" });
  });
});

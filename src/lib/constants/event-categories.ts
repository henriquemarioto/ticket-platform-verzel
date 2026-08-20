export enum EventCategoryEnum {
  SHOW = "SHOW",
  MOVIE = "MOVIE",
  THEATER = "THEATER",
  FESTIVAL = "FESTIVAL",
}

export const EVENT_CATEGORY_LABELS: Record<string, string> = {
  [EventCategoryEnum.SHOW]: "Show",
  [EventCategoryEnum.MOVIE]: "Cinema",
  [EventCategoryEnum.THEATER]: "Teatro",
  [EventCategoryEnum.FESTIVAL]: "Festival",
};

export const EVENT_CATEGORY_PLURAL_LABELS: Record<string, string> = {
  [EventCategoryEnum.SHOW]: "Shows",
  [EventCategoryEnum.MOVIE]: "Cinema",
  [EventCategoryEnum.THEATER]: "Teatro",
  [EventCategoryEnum.FESTIVAL]: "Festivais",
};

export function getEventCategoryLabel(category?: string | null): string {
  if (!category) return "";
  return EVENT_CATEGORY_LABELS[category] || category;
}

export function getEventCategoryPluralLabel(category?: string | null): string {
  if (!category) return "";
  return EVENT_CATEGORY_PLURAL_LABELS[category] || category;
}

export const EVENT_CATEGORIES_OPTIONS = [
  { value: EventCategoryEnum.SHOW, label: EVENT_CATEGORY_LABELS[EventCategoryEnum.SHOW] },
  { value: EventCategoryEnum.MOVIE, label: EVENT_CATEGORY_LABELS[EventCategoryEnum.MOVIE] },
  { value: EventCategoryEnum.THEATER, label: EVENT_CATEGORY_LABELS[EventCategoryEnum.THEATER] },
  { value: EventCategoryEnum.FESTIVAL, label: EVENT_CATEGORY_LABELS[EventCategoryEnum.FESTIVAL] },
];

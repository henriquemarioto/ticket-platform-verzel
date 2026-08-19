export interface GatekeeperEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  bannerUrl?: string | null;
  locationName: string;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city: string;
  eventDate: string;
  endDate?: string | null;
  entryStartTime: string;
  isEntryOpen: boolean;
  isEnded: boolean;
  isSelectable: boolean;
  status: string;
  totalSold: number;
  totalCheckedIn: number;
}

export interface EventMetrics {
  totalSold: number;
  totalCheckedIn: number;
}

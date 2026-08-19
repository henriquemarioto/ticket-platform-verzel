export interface GatekeeperEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  bannerUrl?: string | null;
  locationName: string;
  city: string;
  eventDate: string;
  endDate?: string | null;
  entryStartTime: string;
  isEntryOpen: boolean;
  status: string;
  totalSold: number;
  totalCheckedIn: number;
}

export interface EventMetrics {
  totalSold: number;
  totalCheckedIn: number;
}

export interface GatekeeperEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  bannerUrl?: string | null;
  locationName: string;
  city: string;
  eventDate: string;
  status: string;
  totalSold: number;
  totalCheckedIn: number;
}

export type NoiseLevel = "quiet" | "chatter" | "loud";
export type OutletLevel = "every-table" | "few" | "none";
export type WifiSpeed = "slow" | "med" | "fast";

export interface StudySpot {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  image: string;
  rating: number;
  noise: NoiseLevel;
  outlets: OutletLevel;
  wifi: WifiSpeed;
  seating: number;
  price: "$" | "$$" | "$$$";
  vibe: string;
  hours: string;
  tags: string[];
}

export interface SpotFilters {
  query: string;
  wifi: WifiSpeed | "any";
  outlets: OutletLevel | "any";
  noise: NoiseLevel | "any";
  minSeating: number;
}

export interface FriendActivity {
  id: string;
  name: string;
  avatar: string;
  spotId: string;
  spotName: string;
  status: string;
  durationHours: number;
  spotifyTrack?: string;
  spotifyArtist?: string;
  checkedInAt: string;
}

export interface StudySession {
  id: string;
  spotId: string;
  spotName: string;
  startedAt: string;
  durationMinutes: number;
  note: string;
  photoUri?: string;
}

export interface SpotRating {
  spotId: string;
  stars: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "cat";
  text: string;
  recommendedSpotId?: string;
}

export type TabKey = "map" | "friends" | "sessions";

export interface Location {
  lat: number;
  lng: number;
  accuracy_meters?: number;
  altitude_meters?: number;
}

export interface Movement {
  speed_kmh: number;
  heading_degrees: number;
  moving: boolean;
}

export interface Device {
  battery_level: number;
  charging: boolean;
}

export interface Event {
  event_id: string;
  event_type: string;
  timestamp: string;
  vehicle_id: string;
  trip_id: string;
  device_id?: string;
  location: Location;
  movement?: Movement;
  distance_travelled_km?: number;
  signal_quality?: string;
  device?: Device;
  overspeed?: boolean;
  [key: string]: any; // For event-specific fields
}

export interface TripRuntime {
  id: string;
  name: string;
  vehicle_id: string;
  events: Event[];
  startTime: number; // epoch ms
  endTime: number; // epoch ms
  status: "in_progress" | "completed" | "cancelled" | "technical_issues";
  totalDistance?: number;
  plannedDistance?: number;
}

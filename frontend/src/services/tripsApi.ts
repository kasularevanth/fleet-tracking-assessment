import apiClient from './apiClient';

export interface Trip {
  id: string;
  name: string;
  vehicle_id: string;
  status: string;
  startTime: string;
  endTime: string;
  totalDistance?: number;
  plannedDistance?: number;
  eventCount: number;
}

export interface TripMetrics {
  tripId: string;
  name: string;
  status: string;
  completionPercentage: number;
  totalDistance: number;
  plannedDistance: number;
  distanceRemaining: number;
  averageSpeed: number;
  currentSpeed: number;
  totalAlerts: number;
  signalIssues: number;
  deviceErrors: number;
  startTime: string;
  endTime?: string;
  duration: number;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}

export interface FleetMetrics {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  technicalIssuesTrips: number;
  completionRanges: {
    '0-25%': number;
    '25-50%': number;
    '50-80%': number;
    '80-100%': number;
  };
  totalDistance: number;
  averageSpeed: number;
  totalAlerts: number;
}

export const tripsApi = {
  getAllTrips: async (): Promise<Trip[]> => {
    const response = await apiClient.get('/trips');
    return response.data;
  },

  getTripById: async (id: string): Promise<Trip> => {
    const response = await apiClient.get(`/trips/${id}`);
    return response.data;
  },

  getTripEvents: async (tripId: string, upTo?: number, limit?: number): Promise<any[]> => {
    const params: any = {};
    if (upTo) params.upTo = upTo;
    if (limit) params.limit = limit;
    const response = await apiClient.get(`/events/trips/${tripId}/events`, { params });
    return response.data;
  },

  getTripMetrics: async (tripId: string, simTime?: number): Promise<TripMetrics> => {
    const params: any = {};
    if (simTime) params.simTime = simTime;
    const response = await apiClient.get(`/trips/${tripId}/metrics`, { params });
    return response.data;
  },

  getFleetMetrics: async (simTime?: number): Promise<FleetMetrics> => {
    const params: any = {};
    if (simTime) params.simTime = simTime;
    const response = await apiClient.get('/metrics/fleet', { params });
    return response.data;
  },
};


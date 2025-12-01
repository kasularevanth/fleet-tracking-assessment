import { TripRuntime, Event } from "../models/Event";
import { getTrips, getTripById } from "./eventLoaderService";

export interface FleetMetrics {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  technicalIssuesTrips: number;
  completionRanges: {
    "0-25%": number;
    "25-50%": number;
    "50-80%": number;
    "80-100%": number;
  };
  totalDistance: number;
  averageSpeed: number;
  totalAlerts: number;
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

export const calculateFleetMetrics = (simTime?: number): FleetMetrics => {
  const trips = getTrips();
  const currentTime = simTime || Date.now();

  let totalDistance = 0;
  let totalSpeed = 0;
  let speedCount = 0;
  let totalAlerts = 0;
  let activeTrips = 0;
  let completedTrips = 0;
  let cancelledTrips = 0;
  let technicalIssuesTrips = 0;
  const completionRanges = {
    "0-25%": 0,
    "25-50%": 0,
    "50-80%": 0,
    "80-100%": 0,
  };

  trips.forEach((trip) => {
    const tripStartTime = trip.startTime;
    const tripEndTime = trip.endTime;

    // Skip trips that haven't started yet
    if (currentTime < tripStartTime) {
      return;
    }

    // Filter events up to current time
    const relevantEvents = trip.events.filter(
      (e) => new Date(e.timestamp).getTime() <= currentTime
    );
    const lastEvent = relevantEvents[relevantEvents.length - 1];

    // Determine trip status based on current simulation time
    let tripStatusAtTime:
      | "in_progress"
      | "completed"
      | "cancelled"
      | "technical_issues" = "in_progress";

    // Check for trip_cancelled event
    const cancelledEvent = relevantEvents.find(
      (e) => e.event_type === "trip_cancelled"
    );
    if (cancelledEvent) {
      tripStatusAtTime = "cancelled";
    }
    // Check if trip has completed
    else if (currentTime >= tripEndTime) {
      const completedEvent = relevantEvents.find(
        (e) => e.event_type === "trip_completed"
      );
      if (completedEvent) {
        tripStatusAtTime = "completed";
      } else {
        // Trip ended but wasn't completed - check for technical issues
        const technicalIssueEvents = relevantEvents.filter(
          (e) => e.event_type === "device_error"
        );
        if (technicalIssueEvents.length > 3) {
          tripStatusAtTime = "technical_issues";
        } else {
          // Use original status if trip ended
          tripStatusAtTime = trip.status as any;
        }
      }
    }
    // Trip is in progress - check for technical issues
    else {
      const technicalIssueEvents = relevantEvents.filter(
        (e) => e.event_type === "device_error"
      );
      if (technicalIssueEvents.length > 5) {
        tripStatusAtTime = "technical_issues";
      } else {
        tripStatusAtTime = "in_progress";
      }
    }

    // Count status based on current time
    if (tripStatusAtTime === "completed") {
      completedTrips++;
    } else if (tripStatusAtTime === "cancelled") {
      cancelledTrips++;
    } else if (tripStatusAtTime === "technical_issues") {
      technicalIssuesTrips++;
    } else if (tripStatusAtTime === "in_progress") {
      activeTrips++;
    }

    // Calculate completion based on current time - only use events up to simTime
    let currentDistance = 0;

    // Only use distance from events up to current time, not final trip distance
    if (lastEvent) {
      if (lastEvent.distance_travelled_km !== undefined) {
        currentDistance = lastEvent.distance_travelled_km;
      } else if ((lastEvent as any).total_distance_km !== undefined) {
        // Only use total_distance_km if it's from a trip_completed event at current time
        if (
          lastEvent.event_type === "trip_completed" &&
          currentTime >= tripEndTime
        ) {
          currentDistance = (lastEvent as any).total_distance_km;
        }
      }
    }

    // Completion percentage - always calculate if trip has started
    if (trip.plannedDistance && trip.plannedDistance > 0) {
      const completion = (currentDistance / trip.plannedDistance) * 100;

      // Categorize into ranges
      if (completion <= 25) {
        completionRanges["0-25%"]++;
      } else if (completion <= 50) {
        completionRanges["25-50%"]++;
      } else if (completion <= 80) {
        completionRanges["50-80%"]++;
      } else {
        completionRanges["80-100%"]++;
      }

      totalDistance += currentDistance;
    }

    // Speed and alerts from relevant events only
    relevantEvents.forEach((event) => {
      if (event.movement?.speed_kmh) {
        totalSpeed += event.movement.speed_kmh;
        speedCount++;
      }

      // Count alerts
      if (
        event.event_type === "speed_violation" ||
        event.event_type === "battery_low" ||
        event.event_type === "fuel_level_low" ||
        event.event_type === "device_error"
      ) {
        totalAlerts++;
      }
    });
  });

  return {
    totalTrips: trips.length,
    activeTrips,
    completedTrips,
    cancelledTrips,
    technicalIssuesTrips,
    completionRanges,
    totalDistance: Math.round(totalDistance * 100) / 100,
    averageSpeed:
      speedCount > 0 ? Math.round((totalSpeed / speedCount) * 100) / 100 : 0,
    totalAlerts,
  };
};

export const calculateTripMetrics = (
  tripId: string,
  simTime?: number
): TripMetrics | null => {
  const trip = getTripById(tripId);
  if (!trip) return null;

  const currentTime = simTime || Date.now();
  const relevantEvents = trip.events.filter(
    (e) => new Date(e.timestamp).getTime() <= currentTime
  );
  const lastEvent = relevantEvents[relevantEvents.length - 1] || trip.events[0];

  // Calculate completion
  const completionPercentage =
    trip.plannedDistance && trip.totalDistance
      ? Math.min(
          100,
          Math.round((trip.totalDistance / trip.plannedDistance) * 100)
        )
      : trip.status === "completed"
      ? 100
      : 0;

  // Calculate average speed
  let totalSpeed = 0;
  let speedCount = 0;
  relevantEvents.forEach((e) => {
    if (e.movement?.speed_kmh) {
      totalSpeed += e.movement.speed_kmh;
      speedCount++;
    }
  });
  const averageSpeed =
    speedCount > 0 ? Math.round((totalSpeed / speedCount) * 100) / 100 : 0;

  // Current speed
  const currentSpeed = lastEvent.movement?.speed_kmh || 0;

  // Count alerts
  const totalAlerts = relevantEvents.filter(
    (e) =>
      e.event_type === "speed_violation" ||
      e.event_type === "battery_low" ||
      e.event_type === "fuel_level_low" ||
      e.event_type === "device_error"
  ).length;

  const signalIssues = relevantEvents.filter(
    (e) => e.event_type === "signal_lost"
  ).length;

  const deviceErrors = relevantEvents.filter(
    (e) => e.event_type === "device_error"
  ).length;

  return {
    tripId: trip.id,
    name: trip.name,
    status: trip.status,
    completionPercentage,
    totalDistance: trip.totalDistance || 0,
    plannedDistance: trip.plannedDistance || 0,
    distanceRemaining: Math.max(
      0,
      (trip.plannedDistance || 0) - (trip.totalDistance || 0)
    ),
    averageSpeed,
    currentSpeed,
    totalAlerts,
    signalIssues,
    deviceErrors,
    startTime: new Date(trip.startTime).toISOString(),
    endTime:
      trip.status === "completed"
        ? new Date(trip.endTime).toISOString()
        : undefined,
    duration: Math.round((currentTime - trip.startTime) / (1000 * 60)), // minutes
    currentLocation: lastEvent.location
      ? {
          lat: lastEvent.location.lat,
          lng: lastEvent.location.lng,
        }
      : undefined,
  };
};

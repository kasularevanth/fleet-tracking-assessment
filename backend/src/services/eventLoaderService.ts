import fs from 'fs';
import path from 'path';
import { Event, TripRuntime } from '../models/Event';
import { getTripsDataPath } from '../config/env';

const tripsById: Record<string, TripRuntime> = {};

export const loadTripsData = (): Record<string, TripRuntime> => {
  const tripsDataDir = getTripsDataPath();
  
  if (!fs.existsSync(tripsDataDir)) {
    throw new Error(`Trips data directory not found: ${tripsDataDir}`);
  }

  const tripFiles = fs.readdirSync(tripsDataDir).filter(file => file.endsWith('.json'));

  tripFiles.forEach((file) => {
    const filePath = path.join(tripsDataDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const events: Event[] = JSON.parse(fileContent);

    if (events.length === 0) return;

    // Sort events by timestamp
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    
    const tripId = firstEvent.trip_id;
    const vehicleId = firstEvent.vehicle_id;

    // Determine trip name from filename
    const tripName = getTripNameFromFile(file);

    // Determine status
    const status = determineTripStatus(events);

    // Calculate distances
    const plannedDistance = firstEvent.planned_distance_km;
    const totalDistance = lastEvent.distance_travelled_km || 
      events.find(e => e.total_distance_km)?.total_distance_km;

    tripsById[tripId] = {
      id: tripId,
      name: tripName,
      vehicle_id: vehicleId,
      events,
      startTime: new Date(firstEvent.timestamp).getTime(),
      endTime: new Date(lastEvent.timestamp).getTime(),
      status,
      totalDistance,
      plannedDistance,
    };
  });

  console.log(`✅ Loaded ${Object.keys(tripsById).length} trips`);
  return tripsById;
};

const getTripNameFromFile = (filename: string): string => {
  const nameMap: Record<string, string> = {
    'trip_1_cross_country.json': 'Cross-Country Long Haul',
    'trip_2_urban_dense.json': 'Urban Dense Delivery',
    'trip_3_mountain_cancelled.json': 'Mountain Route Cancelled',
    'trip_4_southern_technical.json': 'Southern Technical Issues',
    'trip_5_regional_logistics.json': 'Regional Logistics',
  };
  return nameMap[filename] || filename.replace('.json', '').replace(/_/g, ' ');
};

const determineTripStatus = (events: Event[]): TripRuntime['status'] => {
  const hasCancelled = events.some(e => e.event_type === 'trip_cancelled');
  const hasCompleted = events.some(e => e.event_type === 'trip_completed');
  const hasDeviceError = events.some(e => e.event_type === 'device_error');
  const hasSignalLost = events.some(e => e.event_type === 'signal_lost');

  if (hasCancelled) return 'cancelled';
  if (hasCompleted) return 'completed';
  if (hasDeviceError || hasSignalLost) return 'technical_issues';
  return 'in_progress';
};

export const getTrips = (): TripRuntime[] => {
  return Object.values(tripsById);
};

export const getTripById = (tripId: string): TripRuntime | undefined => {
  return tripsById[tripId];
};

export const getTripEvents = (tripId: string): Event[] => {
  const trip = tripsById[tripId];
  return trip?.events || [];
};

// Initialize on module load
loadTripsData();


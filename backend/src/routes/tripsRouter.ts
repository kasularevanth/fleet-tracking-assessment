import { Router } from 'express';
import { getTrips, getTripById } from '../services/eventLoaderService';
import { calculateTripMetrics } from '../services/tripMetricsService';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/trips - Get all trips
router.get('/', (req, res) => {
  try {
    const trips = getTrips();
    const tripsSummary = trips.map(trip => ({
      id: trip.id,
      name: trip.name,
      vehicle_id: trip.vehicle_id,
      status: trip.status,
      startTime: new Date(trip.startTime).toISOString(),
      endTime: new Date(trip.endTime).toISOString(),
      totalDistance: trip.totalDistance,
      plannedDistance: trip.plannedDistance,
      eventCount: trip.events.length,
    }));
    res.json(tripsSummary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/trips/:id - Get trip details
router.get('/:id', (req, res) => {
  try {
    const trip = getTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json({
      id: trip.id,
      name: trip.name,
      vehicle_id: trip.vehicle_id,
      status: trip.status,
      startTime: new Date(trip.startTime).toISOString(),
      endTime: new Date(trip.endTime).toISOString(),
      totalDistance: trip.totalDistance,
      plannedDistance: trip.plannedDistance,
      eventCount: trip.events.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/trips/:id/metrics - Get trip metrics
router.get('/:id/metrics', (req, res) => {
  try {
    const { id } = req.params;
    const simTime = req.query.simTime ? parseInt(req.query.simTime as string) : undefined;
    const metrics = calculateTripMetrics(id, simTime);
    if (!metrics) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


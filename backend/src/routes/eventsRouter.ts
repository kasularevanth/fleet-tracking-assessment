import { Router } from 'express';
import { getTripEvents, getTripById } from '../services/eventLoaderService';
import { Event } from '../models/Event';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// GET /api/trips/:id/events - Get all events for a trip
router.get('/trips/:id/events', (req, res) => {
  try {
    const { id } = req.params;
    const { upTo, limit } = req.query;

    let events = getTripEvents(id);

    // Filter events up to a specific timestamp
    if (upTo) {
      const upToTime = parseInt(upTo as string);
      events = events.filter(e => new Date(e.timestamp).getTime() <= upToTime);
    }

    // Limit results
    if (limit) {
      const limitNum = parseInt(limit as string);
      events = events.slice(0, limitNum);
    }

    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/current - Get current events for all trips at a specific time
router.get('/current', (req, res) => {
  try {
    const { simTime } = req.query;
    if (!simTime) {
      return res.status(400).json({ error: 'simTime query parameter is required' });
    }

    const simTimeNum = parseInt(simTime as string);
    const { getTrips } = require('../services/eventLoaderService');
    const trips = getTrips();

    const currentEvents: Record<string, Event> = {};

    trips.forEach(trip => {
      const relevantEvents = trip.events.filter(e => 
        new Date(e.timestamp).getTime() <= simTimeNum
      );
      if (relevantEvents.length > 0) {
        currentEvents[trip.id] = relevantEvents[relevantEvents.length - 1];
      }
    });

    res.json(currentEvents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


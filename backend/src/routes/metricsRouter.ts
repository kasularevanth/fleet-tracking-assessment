import { Router } from "express";
import {
  calculateFleetMetrics,
  calculateTripMetrics,
} from "../services/tripMetricsService";
import { authMiddleware, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// GET /api/metrics/fleet - Get fleet-wide metrics
router.get("/fleet", (req, res) => {
  try {
    const simTime = req.query.simTime
      ? parseInt(req.query.simTime as string)
      : undefined;
    const metrics = calculateFleetMetrics(simTime);
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/metrics/trip/:id - Get metrics for a specific trip
router.get("/trip/:id", (req, res) => {
  try {
    const { id } = req.params;
    const simTime = req.query.simTime
      ? parseInt(req.query.simTime as string)
      : undefined;
    const metrics = calculateTripMetrics(id, simTime);
    if (!metrics) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

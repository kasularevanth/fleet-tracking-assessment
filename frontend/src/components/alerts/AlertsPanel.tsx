import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { tripsApi } from "../../services/tripsApi";

interface Event {
  event_id: string;
  event_type: string;
  timestamp: string;
  vehicle_id: string;
  trip_id: string;
  location: { lat: number; lng: number };
  movement?: { speed_kmh: number; heading_degrees?: number; moving: boolean };
  device?: { battery_level: number; charging: boolean };
  signal_quality?: string;
  [key: string]: any;
}

interface Alert {
  id: string;
  type: "speed_violation" | "battery_low" | "fuel_level_low" | "device_error";
  severity: "moderate" | "severe" | "critical" | "warning";
  message: string;
  vehicleId: string;
  tripId: string;
  tripName: string;
  timestamp: string;
  location?: { lat: number; lng: number };
  details: any;
}

interface Props {
  trips: any[];
  simTime: number | null;
  onAlertClick?: (alert: Alert) => void;
}

const AlertsPanel = ({ trips, simTime, onAlertClick }: Props) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<"all" | Alert["type"]>("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!simTime || trips.length === 0) {
      setAlerts([]);
      return;
    }

    loadAlerts();
  }, [trips, simTime, filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const allAlerts: Alert[] = [];

      for (const trip of trips) {
        try {
          // Get all events up to simTime
          const events = await tripsApi.getTripEvents(
            trip.id,
            simTime || undefined
          );
          const tripName = trip.name;

          // Filter events that are alerts and within simTime
          const alertEvents = events.filter((event: Event) => {
            const eventTime = new Date(event.timestamp).getTime();
            return (
              eventTime <= (simTime || 0) &&
              (event.event_type === "speed_violation" ||
                event.event_type === "battery_low" ||
                event.event_type === "fuel_level_low" ||
                event.event_type === "device_error")
            );
          });

          alertEvents.forEach((event: Event) => {
            const alert = createAlertFromEvent(event, tripName);
            if (alert && (filter === "all" || alert.type === filter)) {
              allAlerts.push(alert);
            }
          });
        } catch (error) {
          console.error(`Failed to load events for trip ${trip.id}:`, error);
        }
      }

      // Sort by timestamp (newest first)
      allAlerts.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setAlerts(allAlerts);
    } catch (error) {
      console.error("Failed to load alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const createAlertFromEvent = (
    event: Event,
    tripName: string
  ): Alert | null => {
    const baseAlert = {
      id: event.event_id,
      vehicleId: event.vehicle_id,
      tripId: event.trip_id,
      tripName,
      timestamp: event.timestamp,
      location: event.location,
    };

    switch (event.event_type) {
      case "speed_violation":
        return {
          ...baseAlert,
          type: "speed_violation",
          severity: (event as any).severity || "moderate",
          message: `Speed violation: ${
            event.movement?.speed_kmh
          } km/h (limit: ${(event as any).speed_limit_kmh} km/h)`,
          details: {
            speed: event.movement?.speed_kmh,
            limit: (event as any).speed_limit_kmh,
            violation: (event as any).violation_amount_kmh,
            severity: (event as any).severity,
          },
        };
      case "battery_low":
        return {
          ...baseAlert,
          type: "battery_low",
          severity: "warning",
          message: `Low battery: ${
            (event as any).battery_level_percent
          }% (threshold: ${(event as any).threshold_percent}%)`,
          details: {
            level: (event as any).battery_level_percent,
            threshold: (event as any).threshold_percent,
            remaining: (event as any).estimated_remaining_hours,
          },
        };
      case "fuel_level_low":
        return {
          ...baseAlert,
          type: "fuel_level_low",
          severity: "warning",
          message: `Low fuel: ${
            (event as any).fuel_level_percent
          }% (threshold: ${(event as any).threshold_percent}%)`,
          details: {
            level: (event as any).fuel_level_percent,
            threshold: (event as any).threshold_percent,
            range: (event as any).estimated_range_km,
          },
        };
      case "device_error":
        return {
          ...baseAlert,
          type: "device_error",
          severity: (event as any).severity || "moderate",
          message: `Device error: ${
            (event as any).error_message || (event as any).error_type
          }`,
          details: {
            type: (event as any).error_type,
            code: (event as any).error_code,
            message: (event as any).error_message,
            severity: (event as any).severity,
          },
        };
      default:
        return null;
    }
  };

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "speed_violation":
        return "⚡";
      case "battery_low":
        return "🔋";
      case "fuel_level_low":
        return "⛽";
      case "device_error":
        return "⚠️";
    }
  };

  const filterOptions: {
    value: "all" | Alert["type"];
    label: string;
    icon: string;
  }[] = [
    { value: "all", label: "All Alerts", icon: "🔔" },
    { value: "speed_violation", label: "Speed", icon: "⚡" },
    { value: "battery_low", label: "Battery", icon: "🔋" },
    { value: "fuel_level_low", label: "Fuel", icon: "⛽" },
    { value: "device_error", label: "Device", icon: "⚠️" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>🚨</span>
          Alerts
          {alerts.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          )}
        </h2>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filterOptions.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(option.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === option.value
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="mr-1">{option.icon}</span>
            {option.label}
          </motion.button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-sm font-medium">No alerts at this time</p>
          </div>
        ) : (
          alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => onAlertClick?.(alert)}
              className="bg-white border-2 border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        alert.severity === "critical"
                          ? "bg-red-100 text-red-800"
                          : alert.severity === "severe"
                          ? "bg-orange-100 text-orange-800"
                          : alert.severity === "moderate"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <span>Trip: {alert.tripName}</span>
                    <span>•</span>
                    <span>Vehicle: {alert.vehicleId}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;

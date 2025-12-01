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

interface Props {
  tripId: string | null;
  simTime: number | null;
}

const VehicleTelemetry = ({ tripId, simTime }: Props) => {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tripId || !simTime) {
      setTelemetry(null);
      return;
    }
    loadTelemetry();
  }, [tripId, simTime]);

  const loadTelemetry = async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const events = await tripsApi.getTripEvents(tripId, simTime || undefined);
      const telemetryEvent = events
        .filter((e: Event) => e.event_type === "vehicle_telemetry")
        .sort(
          (a: Event, b: Event) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

      const lastEvent = events[events.length - 1];

      if (telemetryEvent) {
        setTelemetry({
          ...(telemetryEvent as any).telemetry,
          battery: lastEvent.device?.battery_level || 0,
          speed: lastEvent.movement?.speed_kmh || 0,
          signal: lastEvent.signal_quality || "unknown",
        });
      } else if (lastEvent) {
        setTelemetry({
          battery: lastEvent.device?.battery_level || 0,
          speed: lastEvent.movement?.speed_kmh || 0,
          signal: lastEvent.signal_quality || "unknown",
        });
      }
    } catch (error) {
      console.error("Failed to load telemetry:", error);
    } finally {
      setLoading(false);
    }
  };

  const Gauge = ({
    label,
    value,
    max,
    unit,
    color = "blue",
  }: {
    label: string;
    value: number;
    max: number;
    unit: string;
    color?: string;
  }) => {
    const percentage = Math.min(100, (value / max) * 100);
    const colorClasses = {
      blue: "from-blue-500 to-indigo-600",
      green: "from-green-500 to-emerald-600",
      yellow: "from-yellow-500 to-amber-600",
      red: "from-red-500 to-rose-600",
      purple: "from-purple-500 to-pink-600",
    };

    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
        <div className="text-xs font-medium text-gray-600 mb-2">{label}</div>
        <div className="relative h-24 mb-2">
          <div className="absolute inset-0 bg-gray-200 rounded-full"></div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${
              colorClasses[color as keyof typeof colorClasses]
            } rounded-full shadow-lg`}
          ></motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-900">
              {value.toFixed(1)}
              <span className="text-xs text-gray-500 ml-1">{unit}</span>
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-500 text-center">
          {percentage.toFixed(0)}%
        </div>
      </div>
    );
  };

  const MetricCard = ({
    icon,
    label,
    value,
    unit,
    color = "blue",
  }: {
    icon: string;
    label: string;
    value: number | string;
    unit?: string;
    color?: string;
  }) => {
    const colorClasses = {
      blue: "from-blue-500 to-indigo-600",
      green: "from-green-500 to-emerald-600",
      yellow: "from-yellow-500 to-amber-600",
      red: "from-red-500 to-rose-600",
      purple: "from-purple-500 to-pink-600",
    };

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`bg-gradient-to-br ${
          colorClasses[color as keyof typeof colorClasses]
        } rounded-xl p-4 text-white shadow-lg`}
      >
        <div className="text-2xl mb-2">{icon}</div>
        <div className="text-xs font-medium opacity-90 mb-1">{label}</div>
        <div className="text-2xl font-bold">
          {value}
          {unit && <span className="text-sm ml-1 opacity-80">{unit}</span>}
        </div>
      </motion.div>
    );
  };

  if (!tripId) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm font-medium">Select a trip to view telemetry</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!telemetry) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm font-medium">No telemetry data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>📊</span>
        Vehicle Telemetry
      </h2>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Gauges */}
        <div className="grid grid-cols-2 gap-4">
          {telemetry.fuel_level_percent !== undefined && (
            <Gauge
              label="Fuel Level"
              value={telemetry.fuel_level_percent}
              max={100}
              unit="%"
              color={
                telemetry.fuel_level_percent < 20
                  ? "red"
                  : telemetry.fuel_level_percent < 30
                  ? "yellow"
                  : "green"
              }
            />
          )}
          {telemetry.battery !== undefined && (
            <Gauge
              label="Device Battery"
              value={telemetry.battery}
              max={100}
              unit="%"
              color={
                telemetry.battery < 20
                  ? "red"
                  : telemetry.battery < 30
                  ? "yellow"
                  : "green"
              }
            />
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {telemetry.odometer_km !== undefined && (
            <MetricCard
              icon="📏"
              label="Odometer"
              value={telemetry.odometer_km.toLocaleString()}
              unit="km"
              color="blue"
            />
          )}
          {telemetry.engine_hours !== undefined && (
            <MetricCard
              icon="⏱️"
              label="Engine Hours"
              value={telemetry.engine_hours.toLocaleString()}
              color="purple"
            />
          )}
          {telemetry.coolant_temp_celsius !== undefined && (
            <MetricCard
              icon="🌡️"
              label="Coolant Temp"
              value={telemetry.coolant_temp_celsius}
              unit="°C"
              color={telemetry.coolant_temp_celsius > 95 ? "red" : "yellow"}
            />
          )}
          {telemetry.oil_pressure_kpa !== undefined && (
            <MetricCard
              icon="💧"
              label="Oil Pressure"
              value={telemetry.oil_pressure_kpa}
              unit="kPa"
              color={telemetry.oil_pressure_kpa < 200 ? "red" : "green"}
            />
          )}
          {telemetry.battery_voltage !== undefined && (
            <MetricCard
              icon="🔋"
              label="Battery Voltage"
              value={telemetry.battery_voltage}
              unit="V"
              color={telemetry.battery_voltage < 12 ? "red" : "green"}
            />
          )}
          {telemetry.speed !== undefined && (
            <MetricCard
              icon="⚡"
              label="Current Speed"
              value={telemetry.speed.toFixed(1)}
              unit="km/h"
              color="blue"
            />
          )}
        </div>

        {/* Signal Quality */}
        {telemetry.signal && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">
                  Signal Quality
                </div>
                <div className="text-lg font-bold text-gray-900 capitalize">
                  {telemetry.signal}
                </div>
              </div>
              <div className="text-3xl">
                {telemetry.signal === "excellent"
                  ? "📶"
                  : telemetry.signal === "good"
                  ? "📡"
                  : "📴"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleTelemetry;

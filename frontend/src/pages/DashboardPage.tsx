import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { tripsApi, Trip, FleetMetrics } from "../services/tripsApi";
import FleetMap from "../components/map/FleetMap";
import FleetSummaryCards from "../components/charts/FleetSummaryCards";
import TripProgressChart from "../components/charts/TripProgressChart";
import FleetCompletionChart from "../components/charts/FleetCompletionChart";
import TimeControls from "../components/controls/TimeControls";
import TripListTable from "../components/tables/TripListTable";
import AlertsPanel from "../components/alerts/AlertsPanel";
import EventTimeline from "../components/events/EventTimeline";
import VehicleTelemetry from "../components/telemetry/VehicleTelemetry";
import TripDetailModal from "../components/trips/TripDetailModal";
import TripFilters from "../components/filters/TripFilters";
import Snackbar, { useSnackbarStore } from "../components/common/Snackbar";
import { Avatar } from "../components/common/Avatar";

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

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const showSnackbar = useSnackbarStore((state) => state.show);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [fleetMetrics, setFleetMetrics] = useState<FleetMetrics | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [simTime, setSimTime] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");

  // UI State
  const [showTripDetail, setShowTripDetail] = useState(false);
  const [activeView, setActiveView] = useState<
    "map" | "alerts" | "timeline" | "telemetry"
  >("map");

  const previousAlertsRef = useRef<Set<string>>(new Set());
  const previousEventsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    loadData();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    filterTrips();
  }, [trips, searchQuery, statusFilter, vehicleFilter]);

  useEffect(() => {
    if (isPlaying && simTime) {
      const interval = setInterval(() => {
        setSimTime((prev) => {
          if (!prev) return null;
          const increment = speed * 60000; // minutes to milliseconds
          return prev + increment;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, speed]);

  useEffect(() => {
    if (simTime && isPlaying) {
      checkForNewAlerts();
      checkForNewEvents();
    }
  }, [simTime, isPlaying, trips]);

  // Update fleet metrics when simTime changes
  useEffect(() => {
    if (simTime && trips.length > 0) {
      tripsApi
        .getFleetMetrics(simTime)
        .then(setFleetMetrics)
        .catch(console.error);
    }
  }, [simTime, trips.length]);

  const loadData = async () => {
    try {
      const tripsData = await tripsApi.getAllTrips();
      setTrips(tripsData);

      // Load initial metrics
      if (tripsData.length > 0) {
        const earliestStart = Math.min(
          ...tripsData.map((t) => new Date(t.startTime).getTime())
        );
        setSimTime(earliestStart);
        const metricsData = await tripsApi.getFleetMetrics(earliestStart);
        setFleetMetrics(metricsData);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      showSnackbar("Failed to load fleet data", "error");
    } finally {
      setLoading(false);
    }
  };

  const filterTrips = () => {
    let filtered = [...trips];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (trip) =>
          trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          trip.vehicle_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((trip) => trip.status === statusFilter);
    }

    // Vehicle filter
    if (vehicleFilter !== "all") {
      filtered = filtered.filter((trip) => trip.vehicle_id === vehicleFilter);
    }

    setFilteredTrips(filtered);
  };

  const checkForNewAlerts = async () => {
    if (!simTime) return;

    try {
      for (const trip of trips) {
        const events = await tripsApi.getTripEvents(trip.id, simTime);
        const alertEvents = events.filter(
          (e: Event) =>
            e.event_type === "speed_violation" ||
            e.event_type === "battery_low" ||
            e.event_type === "fuel_level_low" ||
            e.event_type === "device_error"
        );

        alertEvents.forEach((event: Event) => {
          if (!previousAlertsRef.current.has(event.event_id)) {
            previousAlertsRef.current.add(event.event_id);

            const alertType =
              event.event_type === "speed_violation"
                ? "Speed Violation"
                : event.event_type === "battery_low"
                ? "Low Battery"
                : event.event_type === "fuel_level_low"
                ? "Low Fuel"
                : "Device Error";

            showSnackbar(`${alertType} detected: ${trip.name}`, "warning");
          }
        });
      }
    } catch (error) {
      console.error("Failed to check alerts:", error);
    }
  };

  const checkForNewEvents = async () => {
    if (!simTime || !selectedTrip) return;

    try {
      const events = await tripsApi.getTripEvents(selectedTrip, simTime);
      const newEvents = events.filter(
        (e: Event) => !previousEventsRef.current.has(e.event_id)
      );

      newEvents.forEach((event: Event) => {
        previousEventsRef.current.add(event.event_id);

        if (event.event_type === "trip_completed") {
          showSnackbar(
            `Trip completed: ${
              trips.find((t) => t.id === event.trip_id)?.name
            }`,
            "success"
          );
        } else if (event.event_type === "signal_lost") {
          showSnackbar(`Signal lost: ${event.vehicle_id}`, "warning");
        } else if (event.event_type === "signal_recovered") {
          showSnackbar(`Signal recovered: ${event.vehicle_id}`, "info");
        }
      });
    } catch (error) {
      console.error("Failed to check events:", error);
    }
  };

  const handleTripClick = (tripId: string) => {
    setSelectedTrip(tripId);
    setShowTripDetail(true);
  };

  const handleAlertClick = (alert: any) => {
    setSelectedTrip(alert.tripId);
    setShowTripDetail(true);
    setActiveView("timeline");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Snackbar />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Fleet Tracking Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time vehicle monitoring
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right mr-2">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/settings")}
                  className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Settings"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </motion.button>
                <div className="relative">
                  <Avatar size="lg" onClick={() => navigate("/profile")} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Fleet Summary Cards */}
        {fleetMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FleetSummaryCards metrics={fleetMetrics} />
          </motion.div>
        )}

        {/* Time Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <TimeControls
            simTime={simTime}
            setSimTime={setSimTime}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            speed={speed}
            setSpeed={setSpeed}
            trips={filteredTrips}
          />
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-700 font-medium">
                Live simulation running - All trips updating in real-time
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-6"
        >
          <TripFilters
            trips={trips}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            vehicleFilter={vehicleFilter}
            onSearchChange={setSearchQuery}
            onStatusFilterChange={setStatusFilter}
            onVehicleFilterChange={setVehicleFilter}
          />
        </motion.div>

        {/* View Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex gap-2"
        >
          {[
            { id: "map", label: "Map", icon: "🗺️" },
            { id: "alerts", label: "Alerts", icon: "🚨" },
            { id: "timeline", label: "Timeline", icon: "📅" },
            { id: "telemetry", label: "Telemetry", icon: "📊" },
          ].map((view) => (
            <motion.button
              key={view.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveView(view.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeView === view.id
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <span className="mr-2">{view.icon}</span>
              {view.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Panel - 2 columns */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            {activeView === "map" && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 h-[600px]">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Fleet Map
                </h2>
                <FleetMap
                  trips={filteredTrips}
                  selectedTrip={selectedTrip}
                  simTime={simTime}
                  onTripClick={handleTripClick}
                />
              </div>
            )}

            {activeView === "alerts" && (
              <div className="h-[600px]">
                <AlertsPanel
                  trips={filteredTrips}
                  simTime={simTime}
                  onAlertClick={handleAlertClick}
                />
              </div>
            )}

            {activeView === "timeline" && (
              <div className="h-[600px]">
                <EventTimeline tripId={selectedTrip} simTime={simTime} />
              </div>
            )}

            {activeView === "telemetry" && (
              <div className="h-[600px]">
                <VehicleTelemetry tripId={selectedTrip} simTime={simTime} />
              </div>
            )}
          </motion.div>

          {/* Sidebar - 1 column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            {/* Trip List */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Trips
              </h2>
              <TripListTable
                trips={filteredTrips}
                selectedTrip={selectedTrip}
                onSelectTrip={(id) => {
                  setSelectedTrip(id);
                  setShowTripDetail(true);
                }}
              />
            </div>

            {/* Quick Stats or Additional Info */}
            {selectedTrip && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Selected Trip
                </h3>
                <p className="text-sm text-gray-700">
                  {trips.find((t) => t.id === selectedTrip)?.name}
                </p>
                <button
                  onClick={() => setShowTripDetail(true)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Details →
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Charts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Trip Progress Chart */}
          <TripProgressChart
            trips={filteredTrips}
            simTime={simTime}
            fleetMetrics={fleetMetrics}
          />

          {/* Fleet Completion Chart */}
          {fleetMetrics && <FleetCompletionChart metrics={fleetMetrics} />}
        </motion.div>
      </div>

      {/* Trip Detail Modal */}
      <TripDetailModal
        tripId={selectedTrip}
        isOpen={showTripDetail}
        onClose={() => setShowTripDetail(false)}
        simTime={simTime}
      />
    </div>
  );
};

export default DashboardPage;

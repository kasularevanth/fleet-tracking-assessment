import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Trip, tripsApi } from "../../services/tripsApi";

interface Props {
  trips: Trip[];
  simTime: number | null;
  fleetMetrics?: { completionRanges: { [key: string]: number } } | null;
}

interface TripProgress {
  tripId: string;
  progress: number;
  distanceTravelled: number;
  plannedDistance: number;
  status: "in_progress" | "completed" | "cancelled" | "technical_issues";
  isLoading: boolean;
}

const TripProgressChart = ({ trips, simTime }: Props) => {
  const [tripProgresses, setTripProgresses] = useState<
    Map<string, TripProgress>
  >(new Map());
  const loadingTripsRef = useRef<Set<string>>(new Set());
  const previousSimTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!simTime || trips.length === 0) {
      setTripProgresses(new Map());
      return;
    }

    // Only update trips that need updating (new simTime or new trips)
    updateProgresses();
  }, [trips, simTime]);

  const updateProgresses = async () => {
    if (!simTime) return;

    const newProgresses = new Map(tripProgresses);
    const tripsToUpdate: Trip[] = [];

    // Determine which trips need updating
    trips.forEach((trip) => {
      const existing = tripProgresses.get(trip.id);
      const tripStartTime = new Date(trip.startTime).getTime();

      // Skip trips that haven't started
      if (simTime < tripStartTime) {
        if (!existing || existing.progress !== 0) {
          newProgresses.set(trip.id, {
            tripId: trip.id,
            progress: 0,
            distanceTravelled: 0,
            plannedDistance: trip.plannedDistance || 1,
            status: "in_progress",
            isLoading: false,
          });
        }
        return;
      }

      // If simTime changed or trip is new, update it
      if (!existing || previousSimTimeRef.current !== simTime) {
        tripsToUpdate.push(trip);
        loadingTripsRef.current.add(trip.id);
        // Keep existing progress while loading
        if (existing) {
          newProgresses.set(trip.id, { ...existing, isLoading: true });
        }
      } else {
        // Keep existing progress
        newProgresses.set(trip.id, { ...existing, isLoading: false });
      }
    });

    previousSimTimeRef.current = simTime;
    setTripProgresses(newProgresses);

    // Update only trips that need updating
    if (tripsToUpdate.length > 0) {
      await Promise.all(
        tripsToUpdate.map(async (trip) => {
          try {
            const events = await tripsApi.getTripEvents(trip.id, simTime);
            const relevantEvents = events.filter(
              (e: any) => new Date(e.timestamp).getTime() <= simTime
            );

            let distanceTravelled = 0;
            let status:
              | "in_progress"
              | "completed"
              | "cancelled"
              | "technical_issues" = "in_progress";

            if (relevantEvents.length > 0) {
              const lastEvent = relevantEvents[relevantEvents.length - 1];
              distanceTravelled = lastEvent.distance_travelled_km || 0;

              // Determine status based on events
              const cancelledEvent = relevantEvents.find(
                (e: any) => e.event_type === "trip_cancelled"
              );
              const completedEvent = relevantEvents.find(
                (e: any) => e.event_type === "trip_completed"
              );
              const tripEndTime = new Date(trip.endTime).getTime();

              if (cancelledEvent) {
                status = "cancelled";
              } else if (
                completedEvent ||
                (simTime >= tripEndTime && completedEvent)
              ) {
                status = "completed";
                // If completed, ensure progress is 100%
                const plannedDistance = trip.plannedDistance || 1;
                if (distanceTravelled < plannedDistance) {
                  distanceTravelled = plannedDistance;
                }
              } else if (simTime >= tripEndTime) {
                // Trip ended but not completed - check for technical issues
                const technicalIssues = relevantEvents.filter(
                  (e: any) => e.event_type === "device_error"
                );
                if (technicalIssues.length > 3) {
                  status = "technical_issues";
                } else {
                  status = trip.status as any;
                }
              }
            }

            const plannedDistance = trip.plannedDistance || 1;
            let progress = Math.min(
              100,
              (distanceTravelled / plannedDistance) * 100
            );

            // Only show 100% if actually completed
            if (status === "completed") {
              progress = 100;
            }

            setTripProgresses((prev) => {
              const updated = new Map(prev);
              updated.set(trip.id, {
                tripId: trip.id,
                progress,
                distanceTravelled,
                plannedDistance,
                status,
                isLoading: false,
              });
              return updated;
            });

            loadingTripsRef.current.delete(trip.id);
          } catch (error) {
            console.error(
              `Failed to load progress for trip ${trip.id}:`,
              error
            );
            loadingTripsRef.current.delete(trip.id);
            setTripProgresses((prev) => {
              const updated = new Map(prev);
              const existing = prev.get(trip.id);
              if (existing) {
                updated.set(trip.id, { ...existing, isLoading: false });
              }
              return updated;
            });
          }
        })
      );
    }
  };

  const getTripProgress = (trip: Trip): TripProgress | null => {
    return tripProgresses.get(trip.id) || null;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>📈</span>
          Real-Time Trip Progress
        </h2>
        {simTime && (
          <span className="text-xs text-gray-500">
            {new Date(simTime).toLocaleTimeString()}
          </span>
        )}
      </div>
      <div className="space-y-4">
        {trips.map((trip, index) => {
          const progressData = getTripProgress(trip);
          const isLoading = progressData?.isLoading || false;
          const progress = progressData?.progress ?? 0;
          const status = progressData?.status || trip.status;
          const distanceTravelled = progressData?.distanceTravelled ?? 0;
          const plannedDistance =
            progressData?.plannedDistance || trip.plannedDistance || 1;

          return (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {trip.name}
                  </span>
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        status === "completed"
                          ? "bg-green-100 text-green-800"
                          : status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : status === "technical_issues"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {status.replace("_", " ")}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {progress.toFixed(1)}%
                  </span>
                  {!isLoading && (
                    <div className="text-xs text-gray-500">
                      {distanceTravelled.toFixed(1)} /{" "}
                      {plannedDistance.toFixed(1)} km
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                <motion.div
                  key={`${trip.id}-${progress}`}
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  className={`h-full rounded-full shadow-sm ${
                    status === "completed"
                      ? "bg-gradient-to-r from-green-500 to-emerald-600"
                      : progress >= 80
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                      : progress >= 50
                      ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                      : progress >= 25
                      ? "bg-gradient-to-r from-yellow-500 to-amber-600"
                      : "bg-gradient-to-r from-red-500 to-rose-600"
                  }`}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Color Legend */}
      <div className="mt-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 border border-gray-200">
        <h3 className="text-xs font-semibold text-gray-700 mb-2">
          Progress Colors:
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Red: 0-25%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-600">Yellow: 25-50%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Blue: 50-80%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-600">Green: 80-100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripProgressChart;

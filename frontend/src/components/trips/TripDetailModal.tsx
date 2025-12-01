import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tripsApi, Trip, TripMetrics } from '../../services/tripsApi';
import EventTimeline from '../events/EventTimeline';
import VehicleTelemetry from '../telemetry/VehicleTelemetry';

interface Props {
  tripId: string | null;
  isOpen: boolean;
  onClose: () => void;
  simTime: number | null;
}

const TripDetailModal = ({ tripId, isOpen, onClose, simTime }: Props) => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [metrics, setMetrics] = useState<TripMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'telemetry'>('overview');

  useEffect(() => {
    if (isOpen && tripId) {
      loadTripData();
    }
  }, [isOpen, tripId, simTime]);

  const loadTripData = async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const [tripData, metricsData] = await Promise.all([
        tripsApi.getTripById(tripId),
        tripsApi.getTripMetrics(tripId, simTime || undefined),
      ]);
      setTrip(tripData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Failed to load trip data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'technical_issues':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              {loading ? (
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">{trip?.name || 'Trip Details'}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {trip?.vehicle_id} • {trip && new Date(trip.startTime).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'events', label: 'Events', icon: '📅' },
              { id: 'telemetry', label: 'Telemetry', icon: '🔧' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && trip && metrics && (
                  <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Trip Status</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(trip.status)}`}>
                          {trip.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Completion</div>
                          <div className="text-2xl font-bold text-gray-900">{metrics.completionPercentage}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Distance</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {metrics.totalDistance.toFixed(1)} km
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Avg Speed</div>
                          <div className="text-2xl font-bold text-gray-900">
                            {metrics.averageSpeed.toFixed(1)} km/h
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Alerts</div>
                          <div className="text-2xl font-bold text-red-600">{metrics.totalAlerts}</div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-2">Duration</div>
                        <div className="text-xl font-bold text-gray-900">
                          {Math.floor(metrics.duration / 60)}h {metrics.duration % 60}m
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-2">Current Speed</div>
                        <div className="text-xl font-bold text-gray-900">{metrics.currentSpeed.toFixed(1)} km/h</div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-2">Signal Issues</div>
                        <div className="text-xl font-bold text-yellow-600">{metrics.signalIssues}</div>
                      </div>
                    </div>

                    {/* Location */}
                    {metrics.currentLocation && (
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="text-sm text-gray-600 mb-2">Current Location</div>
                        <div className="text-sm font-mono text-gray-900">
                          {metrics.currentLocation.lat.toFixed(4)}, {metrics.currentLocation.lng.toFixed(4)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'events' && (
                  <div className="h-[500px]">
                    <EventTimeline tripId={tripId} simTime={simTime} />
                  </div>
                )}

                {activeTab === 'telemetry' && (
                  <div className="h-[500px]">
                    <VehicleTelemetry tripId={tripId} simTime={simTime} />
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TripDetailModal;


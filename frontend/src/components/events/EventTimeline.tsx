import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { tripsApi } from '../../services/tripsApi';

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
  distance_travelled_km?: number;
  [key: string]: any;
}

interface Props {
  tripId: string | null;
  simTime: number | null;
  eventTypeFilter?: string;
}

const EventTimeline = ({ tripId, simTime, eventTypeFilter }: Props) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!tripId || !simTime) {
      setEvents([]);
      return;
    }
    loadEvents();
  }, [tripId, simTime, eventTypeFilter]);

  const loadEvents = async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      const allEvents = await tripsApi.getTripEvents(tripId, simTime || undefined);
      let filtered = allEvents;
      
      if (eventTypeFilter && eventTypeFilter !== 'all') {
        filtered = allEvents.filter((e) => e.event_type === eventTypeFilter);
      }

      setEvents(filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      trip_started: '🚀',
      trip_completed: '✅',
      trip_cancelled: '❌',
      location_ping: '📍',
      signal_lost: '📡',
      signal_recovered: '📶',
      vehicle_stopped: '🛑',
      vehicle_moving: '🚗',
      speed_violation: '⚡',
      vehicle_telemetry: '📊',
      device_error: '⚠️',
      battery_low: '🔋',
      fuel_level_low: '⛽',
      refueling_started: '⛽',
      refueling_completed: '✅',
    };
    return icons[type] || '📌';
  };

  const getEventColor = (type: string) => {
    if (type.includes('violation') || type.includes('error')) return 'border-red-500 bg-red-50';
    if (type.includes('low') || type.includes('warning')) return 'border-yellow-500 bg-yellow-50';
    if (type.includes('completed') || type.includes('recovered')) return 'border-green-500 bg-green-50';
    if (type.includes('started') || type.includes('moving')) return 'border-blue-500 bg-blue-50';
    return 'border-gray-500 bg-gray-50';
  };

  const formatEventDetails = (event: Event) => {
    const details: string[] = [];
    
    if (event.movement) {
      details.push(`Speed: ${event.movement.speed_kmh} km/h`);
      if (event.movement.heading_degrees) {
        details.push(`Heading: ${event.movement.heading_degrees}°`);
      }
    }
    
    if (event.distance_travelled_km) {
      details.push(`Distance: ${event.distance_travelled_km.toFixed(2)} km`);
    }
    
    if (event.signal_quality) {
      details.push(`Signal: ${event.signal_quality}`);
    }
    
    if (event.device?.battery_level) {
      details.push(`Battery: ${event.device.battery_level}%`);
    }

    // Event-specific details
    if ((event as any).speed_limit_kmh) {
      details.push(`Speed Limit: ${(event as any).speed_limit_kmh} km/h`);
    }
    if ((event as any).fuel_level_percent) {
      details.push(`Fuel: ${(event as any).fuel_level_percent}%`);
    }
    if ((event as any).error_message) {
      details.push(`Error: ${(event as any).error_message}`);
    }

    return details;
  };

  if (!tripId) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-sm font-medium">Select a trip to view events</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full flex flex-col">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>📅</span>
        Event Timeline
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-sm font-medium">No events found</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-pink-200"></div>

            <div className="space-y-4">
              {events.map((event, index) => (
                <motion.div
                  key={event.event_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="relative flex items-start gap-4"
                >
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-12 h-12 rounded-full ${getEventColor(event.event_type)} border-2 flex items-center justify-center text-xl flex-shrink-0`}>
                    {getEventIcon(event.event_type)}
                  </div>

                  {/* Event card */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedEvent(selectedEvent?.event_id === event.event_id ? null : event)}
                    className={`flex-1 ${getEventColor(event.event_type)} border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {event.event_type.replace(/_/g, ' ')}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs bg-white px-2 py-1 rounded-full font-medium text-gray-700">
                        {event.vehicle_id}
                      </span>
                    </div>

                    {selectedEvent?.event_id === event.event_id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-gray-300"
                      >
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Location:</span>
                              <p className="font-mono text-xs">
                                {event.location.lat.toFixed(4)}, {event.location.lng.toFixed(4)}
                              </p>
                            </div>
                            {formatEventDetails(event).map((detail, i) => (
                              <div key={i} className="text-sm text-gray-700">
                                {detail}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventTimeline;


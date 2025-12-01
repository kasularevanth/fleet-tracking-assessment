import { motion } from 'framer-motion';
import { Trip } from '../../services/tripsApi';

interface Props {
  trips: Trip[];
  selectedTrip: string | null;
  onSelectTrip: (tripId: string) => void;
}

const TripListTable = ({ trips, selectedTrip, onSelectTrip }: Props) => {
  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto">
      {trips.map((trip, index) => (
        <motion.div
          key={trip.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => onSelectTrip(trip.id)}
          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
            selectedTrip === trip.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900">{trip.name}</h3>
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <p>Vehicle: {trip.vehicle_id}</p>
            {trip.totalDistance && (
              <p>Distance: {trip.totalDistance.toFixed(1)} km</p>
            )}
            <p>Events: {trip.eventCount.toLocaleString()}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TripListTable;


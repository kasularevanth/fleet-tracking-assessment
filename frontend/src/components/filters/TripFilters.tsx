import { motion } from 'framer-motion';
import { Trip } from '../../services/tripsApi';

interface Props {
  trips: Trip[];
  searchQuery: string;
  statusFilter: string;
  vehicleFilter: string;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  onVehicleFilterChange: (vehicle: string) => void;
}

const TripFilters = ({
  trips,
  searchQuery,
  statusFilter,
  vehicleFilter,
  onSearchChange,
  onStatusFilterChange,
  onVehicleFilterChange,
}: Props) => {
  const uniqueVehicles = Array.from(new Set(trips.map(t => t.vehicle_id))).sort();
  const statusOptions = [
    { value: 'all', label: 'All Status', icon: '📋' },
    { value: 'in_progress', label: 'In Progress', icon: '🚗' },
    { value: 'completed', label: 'Completed', icon: '✅' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌' },
    { value: 'technical_issues', label: 'Technical Issues', icon: '⚠️' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search trips by name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStatusFilterChange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                statusFilter === option.value
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{option.icon}</span>
              {option.label}
            </motion.button>
          ))}
        </div>

        {/* Vehicle Filter */}
        <div className="min-w-[200px]">
          <select
            value={vehicleFilter}
            onChange={(e) => onVehicleFilterChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
          >
            <option value="all">All Vehicles</option>
            {uniqueVehicles.map((vehicle) => (
              <option key={vehicle} value={vehicle}>
                {vehicle}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TripFilters;


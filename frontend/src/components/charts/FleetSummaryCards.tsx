import { motion } from 'framer-motion';
import { FleetMetrics } from '../../services/tripsApi';

interface Props {
  metrics: FleetMetrics;
}

const FleetSummaryCards = ({ metrics }: Props) => {
  const cards = [
    {
      title: 'Total Trips',
      value: metrics.totalTrips,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      description: 'All trips in fleet',
    },
    {
      title: 'Active Trips',
      value: metrics.activeTrips,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: 'from-green-500 via-emerald-500 to-teal-600',
      bgGradient: 'from-green-50 to-emerald-50',
      description: 'Currently in progress',
      pulse: metrics.activeTrips > 0,
    },
    {
      title: 'Completed',
      value: metrics.completedTrips,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-purple-500 via-violet-500 to-purple-600',
      bgGradient: 'from-purple-50 to-violet-50',
      description: 'Successfully finished',
    },
    {
      title: 'Total Distance',
      value: `${metrics.totalDistance.toLocaleString()} km`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      gradient: 'from-orange-500 via-amber-500 to-orange-600',
      bgGradient: 'from-orange-50 to-amber-50',
      description: 'Total distance traveled',
    },
    {
      title: 'Avg Speed',
      value: `${metrics.averageSpeed.toFixed(1)} km/h`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: 'from-pink-500 via-rose-500 to-pink-600',
      bgGradient: 'from-pink-50 to-rose-50',
      description: 'Average fleet speed',
    },
    {
      title: 'Alerts',
      value: metrics.totalAlerts,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      gradient: 'from-red-500 via-rose-500 to-red-600',
      bgGradient: 'from-red-50 to-rose-50',
      description: 'Total alerts detected',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className={`bg-white rounded-xl shadow-md border border-gray-200 p-5 relative overflow-hidden ${
            (card as any).pulse ? 'ring-2 ring-green-200' : ''
          }`}
        >
          {/* Background gradient accent */}
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${card.gradient} opacity-5 rounded-bl-full`}></div>
          
          {(card as any).pulse && (
            <div className="absolute top-3 right-3 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          )}
          
          <div className="relative">
            <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center text-white shadow-lg mb-3`}>
              {card.icon}
            </div>
            
            <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
            <p className="text-sm font-semibold text-gray-700 mb-1">{card.title}</p>
            {(card as any).description && (
              <p className="text-xs text-gray-500">{card.description}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default FleetSummaryCards;


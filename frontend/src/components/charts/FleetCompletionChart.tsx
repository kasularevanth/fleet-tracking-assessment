import { motion } from 'framer-motion';
import { FleetMetrics } from '../../services/tripsApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  metrics: FleetMetrics;
}

const FleetCompletionChart = ({ metrics }: Props) => {
  const data = [
    {
      name: '0-25%',
      value: metrics.completionRanges['0-25%'],
      color: '#ef4444', // red
      description: 'Early Stage',
    },
    {
      name: '25-50%',
      value: metrics.completionRanges['25-50%'],
      color: '#f59e0b', // amber/yellow
      description: 'Quarter Way',
    },
    {
      name: '50-80%',
      value: metrics.completionRanges['50-80%'],
      color: '#3b82f6', // blue
      description: 'Halfway+',
    },
    {
      name: '80-100%',
      value: metrics.completionRanges['80-100%'],
      color: '#10b981', // green
      description: 'Near Complete',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <span>📊</span>
        Fleet Completion Distribution
      </h2>
      <div className="space-y-4">
        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                stroke="#e5e7eb"
              />
              <YAxis 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                stroke="#e5e7eb"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number) => [`${value} trips`, 'Count']}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Color Legend */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700 mb-3">Progress Colors:</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">Red: 0-25% (Early)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-600">Yellow: 25-50% (Quarter)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600">Blue: 50-80% (Halfway+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Green: 80-100% (Near Complete)</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {data.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <div className="text-sm font-semibold text-gray-900">{item.value}</div>
                <div className="text-xs text-gray-500">{item.name}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FleetCompletionChart;

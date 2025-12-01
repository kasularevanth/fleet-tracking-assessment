import { motion } from 'framer-motion';
import { Trip } from '../../services/tripsApi';

interface Props {
  simTime: number | null;
  setSimTime: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  trips: Trip[];
}

const TimeControls = ({ simTime, setSimTime, isPlaying, setIsPlaying, speed, setSpeed, trips }: Props) => {
  const getTimeRange = () => {
    if (trips.length === 0) return { min: 0, max: 0 };
    const starts = trips.map(t => new Date(t.startTime).getTime());
    const ends = trips.map(t => new Date(t.endTime).getTime());
    return {
      min: Math.min(...starts),
      max: Math.max(...ends),
    };
  };

  const { min, max } = getTimeRange();
  const currentTime = simTime || min;
  const progress = max > min ? ((currentTime - min) / (max - min)) * 100 : 0;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setSimTime(min);
    setIsPlaying(false);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Simulation Controls</h3>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <span>🚛</span>
            Simulating all {trips.length} trips simultaneously
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Speed:</span>
          {[1, 5, 10].map((s) => (
            <motion.button
              key={s}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSpeedChange(s)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                speed === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s}x
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Time Slider */}
        <div>
          <input
            type="range"
            min={min}
            max={max}
            value={currentTime}
            onChange={(e) => setSimTime(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatTime(min)}</span>
            <span>{formatTime(max)}</span>
          </div>
        </div>

        {/* Current Time Display */}
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{formatTime(currentTime)}</p>
          <p className="text-sm text-gray-500 mt-1">Progress: {progress.toFixed(1)}%</p>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Reset
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlayPause}
            className="px-8 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors font-medium flex items-center gap-2"
          >
            {isPlaying ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default TimeControls;


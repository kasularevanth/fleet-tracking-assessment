import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";

export type SnackbarType = "success" | "error" | "warning" | "info";

interface SnackbarMessage {
  id: string;
  message: string;
  type: SnackbarType;
  duration?: number;
}

interface SnackbarStore {
  messages: SnackbarMessage[];
  show: (message: string, type?: SnackbarType, duration?: number) => void;
  remove: (id: string) => void;
}

export const useSnackbarStore = create<SnackbarStore>((set) => ({
  messages: [],
  show: (message, type = "info", duration = 3000) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => {
      // Limit to 3 snackbars at a time
      const newMessages = [...state.messages, { id, message, type, duration }];
      if (newMessages.length > 3) {
        // Remove oldest message
        return { messages: newMessages.slice(-3) };
      }
      return { messages: newMessages };
    });
  },
  remove: (id) => {
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    }));
  },
}));

const Snackbar = () => {
  const { messages, remove } = useSnackbarStore();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full">
      <AnimatePresence>
        {messages.map((msg) => (
          <SnackbarItem
            key={msg.id}
            message={msg}
            onClose={() => remove(msg.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface SnackbarItemProps {
  message: SnackbarMessage;
  onClose: () => void;
}

const SnackbarItem = ({ message, onClose }: SnackbarItemProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeout(onClose, 300);
    }, message.duration || 3000);

    return () => clearTimeout(timer);
  }, [message.duration, onClose]);

  const getStyles = () => {
    switch (message.type) {
      case "success":
        return {
          bg: "bg-white border-green-500",
          icon: "✓",
          text: "text-green-700",
          iconBg: "bg-green-100",
        };
      case "error":
        return {
          bg: "bg-white border-red-500",
          icon: "✕",
          text: "text-red-700",
          iconBg: "bg-red-100",
        };
      case "warning":
        return {
          bg: "bg-white border-yellow-500",
          icon: "⚠",
          text: "text-yellow-700",
          iconBg: "bg-yellow-100",
        };
      default:
        return {
          bg: "bg-white border-blue-500",
          icon: "ℹ",
          text: "text-blue-700",
          iconBg: "bg-blue-100",
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`${styles.bg} border-2 rounded-lg shadow-xl p-3 ${styles.text} backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-6 h-6 rounded-full ${styles.iconBg} flex items-center justify-center text-xs font-bold ${styles.text}`}
        >
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-relaxed">
            {message.message}
          </p>
        </div>
        <button
          onClick={() => {
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-xs font-bold text-gray-600"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
};

export default Snackbar;

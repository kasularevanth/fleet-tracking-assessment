import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../../store/authStore";

interface AvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  showLogout?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export const Avatar = ({ size = "md", showLogout = false, className = "", onClick }: AvatarProps) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  if (!user) {
    return null;
  }

  const getInitials = (name: string): string => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(user.name);
  const sizeClass = sizeClasses[size];

  const handleLogout = () => {
    logout();
    setShowMenu(false);
  };

  const handleClick = () => {
    if (showLogout) {
      setShowMenu(!showMenu);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-br from-blue-500 to-indigo-600 cursor-pointer hover:opacity-80 transition-opacity ${
          showLogout && showMenu ? "ring-2 ring-offset-2 ring-blue-500" : ""
        }`}
        onClick={showLogout || onClick ? handleClick : undefined}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {showLogout && showMenu && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[120px] z-50">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function to get user initials (can be used anywhere)
export const getUserInitials = (name: string): string => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Helper function to get avatar URL or initials
export const getUserAvatar = (user: { name: string; avatar_url?: string }): string | null => {
  return user.avatar_url || null;
};


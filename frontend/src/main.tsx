import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useAuthStore } from "./store/authStore";
import "./styles/globals.css";

// Component to handle token refresh on app initialization
const AppInitializer = () => {
  const refreshAccessToken = useAuthStore((state) => state.refreshAccessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    // Handle redirect from 404.html fallback (if rewrite rule isn't working)
    const redirectPath = sessionStorage.getItem("redirectPath");
    if (redirectPath && redirectPath !== window.location.pathname) {
      sessionStorage.removeItem("redirectPath");
      // Navigate to the stored path - React Router will handle it
      window.history.replaceState(
        {},
        "",
        redirectPath + window.location.search + window.location.hash
      );
      // Force a reload to let React Router handle the route
      window.location.reload();
      return;
    }

    // Check if we have tokens and refresh if needed on app load
    if (refreshToken && accessToken) {
      // Try to refresh token on app load to ensure it's valid
      refreshAccessToken().catch(() => {
        // If refresh fails, user will be logged out automatically
        console.log("Token refresh failed on app load");
      });
    }
  }, [refreshToken, accessToken, refreshAccessToken]); // Only run once on mount

  return <RouterProvider router={router} />;
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppInitializer />
  </React.StrictMode>
);

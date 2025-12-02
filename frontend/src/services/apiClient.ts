import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // 60 seconds timeout for Render free tier cold starts
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle auth errors and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
            {
              refreshToken,
            }
          );

          const { accessToken } = response.data;
          localStorage.setItem("accessToken", accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }

    // Handle timeout, network errors, and cancelled requests
    if (
      error.code === "ECONNABORTED" ||
      error.message === "Network Error" ||
      error.message?.includes("canceled") ||
      error.name === "CanceledError"
    ) {
      console.error(
        "Request timeout, network error, or cancelled. This may be due to Render free tier cold start."
      );
      const timeoutError = new Error(
        "Request timeout or cancelled. The server may be starting up. Please try again."
      );
      (timeoutError as any).code = error.code || "ECONNABORTED";
      return Promise.reject(timeoutError);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

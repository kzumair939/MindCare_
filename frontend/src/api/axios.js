import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

export const getWsUrl = (path) => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && apiUrl.startsWith("http")) {
    const wsProto = apiUrl.startsWith("https") ? "wss" : "ws";
    const host = apiUrl.replace(/^https?:\/\//, "").replace(/\/api\/?$/, "");
    return `${wsProto}://${host}${path}`;
  } else {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${window.location.host}${path}`;
  }
};

api.interceptors.request.use(config => {
  const token = localStorage.getItem("mc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  r => r,
  async err => {
    const originalRequest = err.config;
    const url = originalRequest?.url || "";
    const isAuthUrl = url.includes("/auth/login") || 
                      url.includes("/auth/register") || 
                      url.includes("/auth/verify-otp") || 
                      url.includes("/auth/resend-otp") || 
                      url.includes("/auth/forgot-password") || 
                      url.includes("/auth/reset-password") ||
                      url.includes("/auth/refresh");

    if (err.response?.status === 401 && !originalRequest._retry && !isAuthUrl) {
      const refreshToken = localStorage.getItem("mc_refresh_token");

      if (refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }).catch(e => Promise.reject(e));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshUrl = (import.meta.env.VITE_API_URL || "/api") + "/auth/refresh";
          const res = await axios.post(refreshUrl, { refreshToken });
          const newAccessToken = res.data.token;
          const newRefreshToken = res.data.refreshToken;

          localStorage.setItem("mc_token", newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem("mc_refresh_token", newRefreshToken);
          }

          api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return api(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          localStorage.removeItem("mc_token");
          localStorage.removeItem("mc_refresh_token");
          localStorage.removeItem("mc_user");

          const currentPath = window.location.pathname;
          const isPublicPage = currentPath === "/login" || 
                               currentPath.startsWith("/signup") || 
                               currentPath.startsWith("/forgot-password") || 
                               currentPath.startsWith("/reset-password") || 
                               currentPath.startsWith("/verify-otp") ||
                               currentPath === "/" ||
                               currentPath.startsWith("/services") ||
                               currentPath.startsWith("/about");

          if (!isPublicPage) {
            window.location.href = "/login";
          }
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }

      // No refresh token present
      localStorage.removeItem("mc_token");
      localStorage.removeItem("mc_refresh_token");
      localStorage.removeItem("mc_user");
      
      const currentPath = window.location.pathname;
      const isPublicPage = currentPath === "/login" || 
                           currentPath.startsWith("/signup") || 
                           currentPath.startsWith("/forgot-password") || 
                           currentPath.startsWith("/reset-password") || 
                           currentPath.startsWith("/verify-otp") ||
                           currentPath === "/" ||
                           currentPath.startsWith("/services") ||
                           currentPath.startsWith("/about");

      if (!isPublicPage) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;

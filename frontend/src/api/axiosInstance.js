
//E:\DigitalCertificateSystem\frontend\src\api\axiosInstance.js
import axios from "axios";

// Backend Base URL (from .env)
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// Create axios instance
const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: false, // we use JWT, not cookies
});

// Attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");   // 🔥 KEEPING EXACT KEY YOU USE
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handler
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn("⚠️ Token invalid or expired");
      // We will add auto-logout later (in AuthContext)
    }
    return Promise.reject(error);
  }
);

export default API;

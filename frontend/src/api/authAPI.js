//E:\DigitalCertificateSystem\frontend\src\api\authAPI.js
import API from "./axiosInstance";

/**
 * Register user
 * payload: { name, email, password }
 * returns backend response object
 */
export const registerUser = async (payload) => {
  try {
    const res = await API.post("/auth/register", payload);
    return res.data;
  } catch (err) {
    // normalize error shape
    throw err?.response?.data || { message: "Registration failed" };
  }
};

/**
 * Login user
 * payload: { email, password }
 * On success stores token and user in localStorage (keys: "token", "user")
 * returns backend response object (should contain { token, user })
 */
export const loginUser = async (payload) => {
  try {
    const res = await API.post("/auth/login", payload);

    // Save JWT token and user in localStorage (consistent with other files)
    if (res.data?.token) {
      localStorage.setItem("token", res.data.token);
    }
    if (res.data?.user) {
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }

    return res.data;
  } catch (err) {
    throw err?.response?.data || { message: "Login failed" };
  }
};

/**
 * Get current user from localStorage (client-side)
 * returns parsed user object or null
 */
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

/**
 * Logout - clear stored token & user
 */
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Optional helper to read token (not strictly needed everywhere)
 */
export const getToken = () => localStorage.getItem("token") || null;

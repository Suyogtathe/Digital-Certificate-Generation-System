//E:\DigitalCertificateSystem\frontend\src\context\AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser
} from "../api/authAPI";
import API from "../api/axiosInstance";

const AuthContext = createContext();

// --------------------------------------------------
// AUTH PROVIDER
// --------------------------------------------------
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-load user from localStorage
  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

   

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------
  const login = async (payload) => {
    const res = await loginUser(payload);
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  // --------------------------------------------------
  // REGISTER
  // --------------------------------------------------
  const register = async (payload) => {
    return await registerUser(payload);
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------
  const logout = () => {
    logoutUser();
    setUser(null);
  };

  // --------------------------------------------------
  // REFRESH USER (CRITICAL FOR PAYMENTS)
  // --------------------------------------------------
 const refreshUser = async () => {
  try {
    const res = await API.get("/auth/me");

    // Backend is the single source of truth
    setUser(res.data);
    localStorage.setItem("user", JSON.stringify(res.data));
  } catch (err) {
    console.error("Failed to refresh user", err);
  }
};



  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// --------------------------------------------------
// CUSTOM HOOK
// --------------------------------------------------
export const useAuth = () => {
  return useContext(AuthContext);
};

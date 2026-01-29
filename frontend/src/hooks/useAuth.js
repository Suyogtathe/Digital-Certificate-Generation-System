//E:\DigitalCertificateSystem\frontend\src\hooks\useAuth.js
import { useContext } from "react";
import { useAuth as useAuthContext } from "../context/AuthContext";

// Simple wrapper hook for cleaner imports
export default function useAuth() {
  return useAuthContext();
}

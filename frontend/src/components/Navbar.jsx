//E:\DigitalCertificateSystem\frontend\src\components\Navbar.jsx

import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "My Certificates", path: "/dashboard/my-certificates" },
    { label: "Issue New", path: "/dashboard/generate" }
  ];

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    // "Issue New" covers generate, bulk-generate, and templates
    if (path === "/dashboard/generate") {
      return ["/dashboard/generate", "/dashboard/bulk-generate", "/dashboard/templates"].some(p => location.pathname.startsWith(p));
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
        {/* Left: Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <div className="flex items-center justify-center text-orange-600">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className="text-2xl font-black text-orange-600 tracking-wide">DCS</span>
        </div>

        {/* Center: Navigation Tabs */}
        <div className="flex gap-10">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative pb-2 px-1 font-bold transition-colors duration-200 group ${isActive(item.path)
                ? "text-orange-500"
                : "text-gray-900"
                }`}
            >
              {item.label}
              {/* Animated underline */}
              <span
                className={`absolute bottom-0 left-0 h-1 bg-orange-400 rounded-full transition-all duration-300 ease-out ${isActive(item.path) ? "w-full" : "w-0 group-hover:w-full"
                  }`}
              />
            </button>
          ))}
        </div>

        {/* Right: User Info & Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="text-right hidden md:block">
              <div className="text-sm font-bold text-gray-900">{user?.organizationName || "Cdac-Banglore"}</div>
              <div className="text-xs text-gray-400 font-medium">{user?.email || "jituchaudhary201997@gmail.com"}</div>
            </div>
            <div
              className="w-10 h-10 bg-orange-600 hover:bg-orange-700 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm transition-all border-2 border-white ring-1 ring-orange-100"
            >
              {(user?.organizationName || "C").charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-4 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in-down">
              {/* Dropdown Header */}
              <div className="bg-gray-50 p-4 border-b border-gray-100">
                <p className="font-bold text-gray-900 text-sm">
                  {user?.organizationName || "Cdac-Banglore"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {user?.email || "jituchaudhary201997@gmail.com"}
                </p>
              </div>

              {/* Dropdown Items */}
              <div className="p-2 flex flex-col gap-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/dashboard/my-certificates');
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  My Certificates
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">

      {/* Organization Info Card */}
      <div className="bg-white rounded-3xl shadow-sm p-8 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* Left: Info */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {user?.organizationName || user?.name}
          </h2>
          <div className="flex items-center gap-4 text-gray-600 mb-4">
            <span className="font-medium">Issuer Code:</span>
            <span className="font-mono text-gray-800 font-semibold tracking-wide">
              {user?.issuerCode}
            </span>
          </div>

          {/* Verification Badge */}
          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verified Organization
          </span>
        </div>

        {/* Right: Signature */}
        <div className="flex items-center gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="text-right">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Authorized by</p>
            <p className="text-lg font-bold text-gray-800">Digital Signature</p>
          </div>

          <div className="w-px h-12 bg-gray-200"></div>

          {user?.signatureUrl ? (
            <div className="relative group cursor-pointer">
              <img
                src={`${import.meta.env.VITE_API_URL}${user.signatureUrl}`}
                alt="Signature"
                className="h-16 w-auto object-contain"
              />
              <button
                onClick={() => document.getElementById('sig-upload').click()}
                className="absolute inset-0 bg-white bg-opacity-90 text-orange-600 text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-orange-200 rounded"
              >
                CHANGE
              </button>
            </div>
          ) : (
            <button
              onClick={() => document.getElementById('sig-upload').click()}
              className="flex flex-col items-center justify-center w-24 h-16 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:text-orange-500 hover:border-orange-300 transition-colors"
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="text-xs font-bold">UPLOAD</span>
            </button>
          )}

          <input
            type="file"
            id="sig-upload"
            className="hidden"
            accept="image/*.png"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const formData = new FormData();
              formData.append('signature', file);
              try {
                await API.post('/auth/upload-signature', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
                await refreshUser();
              } catch (err) {
                alert("Failed to upload signature");
              }
            }}
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Bulk Issue */}
        <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col items-start h-80 relative overflow-hidden group">
          {/* Radiant Background Effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100 to-transparent rounded-bl-full opacity-50 transition-opacity group-hover:opacity-100"></div>

          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-orange-200 shadow-lg flex items-center justify-center mb-8 z-10">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-4 z-10">Bulk Issue</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow z-10 max-w-xs">
            Upload CSV and generate 100+ certificates instantly. Ideal for large batches.
          </p>

          <button
            onClick={() => navigate('/dashboard/bulk-generate')}
            className="px-6 py-3 bg-orange-50 text-orange-700 font-bold rounded-full flex items-center gap-2 transition-all duration-300 z-10 group-hover:bg-orange-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md"
          >
            Start Batch
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>

        {/* Single Issue */}
        <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col items-start h-80 group">
          <div className="w-16 h-16 bg-white border-2 border-orange-100 rounded-2xl flex items-center justify-center mb-8 text-orange-500 shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-4">Single Issue</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow max-w-xs">
            Best for individual certificates or manual corrections.
          </p>

          <button
            onClick={() => navigate('/dashboard/generate')}
            className="text-gray-900 font-bold flex items-center gap-2 hover:gap-3 transition-all group-hover:text-orange-600"
          >
            Create One
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Issued Certificates */}
        <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-start h-80 group">
          <div className="w-16 h-16 bg-white border-2 border-purple-100 group-hover:bg-purple-600 group-hover:border-purple-600 rounded-2xl flex items-center justify-center mb-8 text-purple-500 group-hover:text-white shadow-sm transition-colors duration-300">
            <svg className="w-8 h-8 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-4">Issued Certificates</h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow max-w-xs">
            Access history, download PDFs, and track status.
          </p>

          <button
            onClick={() => navigate('/dashboard/my-certificates')}
            className="text-purple-600 font-bold flex items-center gap-2 transition-all duration-300 group-hover:scale-105 group-hover:origin-left"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}

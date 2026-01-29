import { useEffect, useState } from "react";
import API from "../api/axiosInstance";

export default function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const res = await API.get("/certificates/my");
      if (res.data.success) {
        setCertificates(res.data.list);
      }
    } catch (err) {
      console.error("Failed to load certificates", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certId) => {
    try {
      const res = await API.get(`/certificates/download/${certId}`, {
        responseType: 'blob', // Important for files
      });

      // Create a link to download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${certId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Download failed");
    }
  };

  // Filter certificates based on search term
  const filteredCertificates = certificates.filter((cert) =>
    cert.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.certificateId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2 font-display">
            Issued Certificates
          </h1>
          <p className="text-gray-500 text-lg">
            View, download, and manage all certificates issued by your organization.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-10 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 rounded-xl border border-transparent bg-white shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 placeholder-gray-400 outline-none transition-all"
            placeholder="Search by student name, course, or certificate ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Results Info */}
        <div className="mb-6 text-gray-500 font-medium">
          {filteredCertificates.length} Certificates Found
        </div>

        {/* Certificates List */}
        <div className="space-y-4">
          {filteredCertificates.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-500">
              No certificates found matching your search.
            </div>
          ) : (
            filteredCertificates.map((cert) => (
              <div
                key={cert._id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Left Side: Info */}
                <div className="flex items-start gap-5">
                  {/* Avatar Icon */}
                  <div className="h-16 w-16 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 text-white text-2xl font-bold uppercase shadow-orange-200 shadow-lg">
                    {cert.studentName ? cert.studentName.charAt(0) : "U"}
                  </div>

                  {/* Text Details */}
                  <div className="flex flex-col gap-1">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                      {cert.studentName || "Unknown Student"}
                    </h3>
                    <p className="text-gray-500 font-medium">
                      {cert.courseName || "Course Name"}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-md">
                        <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(cert.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>

                      <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md font-mono text-xs border border-gray-200">
                        {cert.certificateId}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Actions */}
                <div className="flex items-center gap-4 self-end md:self-center">
                  <button
                    onClick={() => handleDownload(cert.certificateId)}
                    className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 active:scale-95"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>

                  <a
                    href={`/verify/${cert.certificateId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 bg-white border border-gray-200 hover:border-green-500 hover:text-green-600 text-gray-700 font-semibold py-2.5 px-6 rounded-lg transition-all transform hover:-translate-y-1 shadow-sm hover:shadow-md"
                  >
                    <svg className="h-5 w-5 text-gray-500 group-hover:text-green-600 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verify
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

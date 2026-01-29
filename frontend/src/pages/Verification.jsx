import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axiosInstance';

export default function Verification() {
    const { id } = useParams(); // For /verify/:id
    const [certId, setCertId] = useState(id || "");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const verify = async (targetId) => {
        if (!targetId) return;
        setLoading(true);
        setResult(null);
        setError("");

        try {
            // Use the instance that points to backend
            // Note: axiosInstance might have interceptors, but public get should be fine.
            const res = await API.get(`/certificates/verify/${targetId}`);
            setResult(res.data.cert);
        } catch (err) {
            setResult({ valid: false });
            if (err.response?.status === 404) {
                setError("Certificate not found. Please check the ID.");
            } else {
                setError("Verification failed. Please try again.");
            }
        }
        setLoading(false);
    };

    // Auto-verify if ID is in URL
    useEffect(() => {
        if (id) {
            verify(id);
        }
    }, [id]);

    const handleSearch = (e) => {
        e.preventDefault();
        verify(certId);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex flex-col items-center justify-center p-4">

            {/* Search Box */}
            <div className="bg-white shadow-xl rounded-2xl w-full max-w-lg p-8">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Verify Certificate</h1>
                <p className="text-center text-gray-500 mb-6">Enter the Certificate ID to check authenticity.</p>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={certId}
                        onChange={(e) => setCertId(e.target.value)}
                        placeholder="e.g. CDAC-1234-ABCD"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none uppercase font-mono tracking-wide"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-lg font-bold transition shadow-md"
                    >
                        {loading ? "..." : "Check"}
                    </button>
                </form>
            </div>

            {/* Result Card */}
            {result && result.valid && (
                <div className="mt-8 bg-white shadow-2xl rounded-2xl w-full max-w-2xl p-0 overflow-hidden animate-fade-in border-t-8 border-green-500">
                    <div className="bg-green-50 p-6 flex items-center justify-center gap-3">
                        <div className="bg-green-100 p-2 rounded-full">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-green-800">Verified & Authentic</h2>
                    </div>

                    <div className="p-8 space-y-6">
                        {/* Student Info */}
                        <div className="text-center pb-6 border-b border-dashed border-gray-200">
                            <p className="text-gray-500 uppercase text-sm font-semibold tracking-wider">Certifies That</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-2">{result.studentName}</h3>
                            <p className="text-gray-600 mt-2">has successfully completed</p>
                            <h4 className="text-xl font-bold text-blue-800 mt-1">{result.courseName}</h4>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-gray-500 text-sm">Issued By</p>
                                <p className="font-semibold text-lg flex items-center gap-2">
                                    {result.organization?.organizationName}
                                    {result.organization?.verified && (
                                        <span className="text-blue-500" title="Verified Issuer">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-400 font-mono">Issuer: {result.organization?.issuerCode}</p>
                            </div>
                            <div className="md:text-right">
                                <p className="text-gray-500 text-sm">Issue Date</p>
                                <p className="font-semibold text-lg">{result.issueDate}</p>
                                <p className="text-xs text-gray-400 font-mono mt-1">ID: {result.certificateId}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invalid Card */}
            {error && !loading && (
                <div className="mt-8 bg-white shadow-xl rounded-2xl w-full max-w-lg p-8 border-t-8 border-red-500 animate-shake">
                    <div className="text-center">
                        <div className="inline-block bg-red-100 p-3 rounded-full mb-4">
                            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-red-700 mb-2">Invalid Certificate</h2>
                        <p className="text-gray-600">{error}</p>
                    </div>
                </div>
            )}

            <div className="mt-12 text-center text-gray-400 text-sm">
                <Link to="/" className="hover:text-orange-500 transition">Organization Login</Link>
                <span className="mx-2">•</span>
                <span>Digital Certificate System</span>
            </div>

        </div>
    );
}

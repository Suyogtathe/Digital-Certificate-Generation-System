import { useState, useEffect } from 'react';
import API from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

export default function BulkGeneration() {
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState(null); // { validRows, invalidRows, ... }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Template State
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loadingTemplates, setLoadingTemplates] = useState(true);

    const navigate = useNavigate();

    // 0. Load Templates on Mount
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await API.get('/templates'); // Public route for now, or auth wrapped
                if (res.data.success) {
                    setTemplates(res.data.templates);
                    // Select first one by default if available
                    if (res.data.templates.length > 0) {
                        setSelectedTemplate(res.data.templates[0]._id);
                    }
                }
            } catch (err) {
                console.error("Failed to load templates", err);
            } finally {
                setLoadingTemplates(false);
            }
        };
        fetchTemplates();
    }, []);

    // 1. Handle File Selection & Upload
    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setFile(selectedFile);
        setError("");
        setPreviewData(null);

        // Auto-upload for preview
        const formData = new FormData();
        formData.append('file', selectedFile);

        setLoading(true);
        try {
            const res = await API.post('/bulk-certificates/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPreviewData(res.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to parse CSV");
            setFile(null); // Reset
        }
        setLoading(false);
    };

    // 2. Handle Generation (Pay & Commit)
    const handleGenerate = async () => {
        if (!previewData || previewData.validRows.length === 0) return;
        if (!selectedTemplate) {
            setError("Please select a certificate template.");
            return;
        }

        if (!window.confirm(`Generate ${previewData.validRows.length} certificates? Total Cost: ₹${previewData.validRows.length * 50}`)) {
            return;
        }

        setLoading(true);

        try {
            // A. Load Script
            const isLoaded = await loadRazorpay();
            if (!isLoaded) {
                setError("Razorpay SDK failed to load. Check internet connection.");
                setLoading(false);
                return;
            }

            // B. Create Order on Backend
            // NOTE: We pass templateId so backend knows what we are buying/using
            const orderRes = await API.post('/payments/create-order', {
                purchaseType: 'bulk_certificate',
                quantity: previewData.validRows.length,
                templateId: selectedTemplate
            });

            if (!orderRes.data.success) {
                throw new Error(orderRes.data.error || "Order creation failed");
            }

            const { order, purchaseId, keyId } = orderRes.data;

            // C. Open Razorpay
            const options = {
                key: keyId,
                amount: order.amount,
                currency: order.currency,
                name: "Digital Certificate System",
                description: `Issuing ${previewData.validRows.length} Certificates`,
                order_id: order.id,
                handler: async function (response) {
                    // Payment Success! Now Commit.
                    try {
                        // Mark success on backend (Optional but good for tracking status)
                        await API.post('/payments/mark-success', {
                            purchaseId,
                            paymentId: response.razorpay_payment_id
                        });

                        // Commit Generation
                        const commitRes = await API.post('/bulk-certificates/commit', {
                            rows: previewData.validRows,
                            paymentId: response.razorpay_payment_id,
                            templateId: selectedTemplate
                        });

                        setSuccessMsg(`Success! ${commitRes.data.message}`);
                        setPreviewData(null);
                        setFile(null);

                        // Redirect
                        setTimeout(() => {
                            navigate('/dashboard/my-certificates');
                        }, 3000);

                    } catch (commitErr) {
                        console.error(commitErr);
                        setError("Payment successful but generation failed. Contact support.");
                    }
                },
                prefill: {
                    name: "Organization Admin",
                    email: "admin@org.com",
                },
                theme: {
                    color: "#2563EB",
                },
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                setError(`Payment Failed: ${response.error.description}`);
            });

            rzp1.open();

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Process failed");
        }
        setLoading(false);
    };

    // Helper to load Razorpay
    const loadRazorpay = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Bulk Certificate Generation</h1>
            <p className="text-gray-600 mb-8">Upload a customized CSV to issue certificates in batch.</p>

            {/* ERROR */}
            {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

            {/* SUCCESS */}
            {successMsg && <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">{successMsg}</div>}

            {/* UPLOAD SECTION (Submit implicitly via File Select) */}
            {!previewData && !successMsg && (
                <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
                    <div className="border-2 border-dashed hover:border-dotted border-gray-300 hover:border-orange-500 rounded-lg p-12 text-center transition-all relative">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept=".csv"
                            onChange={handleFileChange}
                        />
                        <div className="pointer-events-none">
                            <p className="text-4xl mb-2">📂</p>
                            <p className="text-gray-700 text-lg font-medium">Click or Drag CSV file here</p>
                            <p className="text-sm text-gray-500 mt-2">Required: name, course, issuedate, email</p>
                            <p className="text-xs text-gray-400 mt-1">Optional: title (e.g. "Certificate of Excellence")</p>
                        </div>
                    </div>
                </div>
            )}

            {/* LOADING */}
            {loading && (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Processing...</p>
                </div>
            )}

            {/* PREVIEW + SELECT TEMPLATE SECTION */}
            {previewData && !loading && (
                <div className="space-y-8 animate-fade-in">

                    {/* 1. TABLE PREVIEW */}
                    <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
                        <div className="p-4 bg-gray-50 border-b">
                            <h3 className="font-bold text-gray-700">1. Verify Data</h3>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {previewData.preview.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.course}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic">{row.title || "Default"}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.issuedate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Valid
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="bg-gray-50 px-6 py-3 border-t text-sm text-gray-500 flex justify-between">
                            <span>Total Valid: {previewData.validCount}</span>
                            <span>Invalid: {previewData.invalidCount}</span>
                        </div>
                    </div>

                    {/* 2. TEMPLATE SELECTION (NEW) */}
                    <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200 p-6">
                        <h3 className="font-bold text-xl text-gray-800 mb-4">2. Select Certificate Template</h3>
                        {loadingTemplates ? (
                            <div className="text-center py-4">Loading Templates...</div>
                        ) : templates.length === 0 ? (
                            <div className="text-red-500">No templates found. Please contact admin.</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {templates.map(tpl => (
                                    <div
                                        key={tpl._id}
                                        onClick={() => setSelectedTemplate(tpl._id)}
                                        className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all transform hover:scale-105 ${selectedTemplate === tpl._id
                                            ? 'border-blue-600 ring-2 ring-blue-200 shadow-xl'
                                            : 'border-gray-200 hover:border-blue-400'
                                            }`}
                                    >
                                        <div className="aspect-w-16 aspect-h-12 bg-gray-100 relative">
                                            {/* Image Preview */}
                                            {(tpl.previewUrl || tpl.bgImageUrl) ? (
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL}${tpl.previewUrl || tpl.bgImageUrl}`}
                                                    alt={tpl.name}
                                                    className="w-full h-40 object-cover"
                                                    onError={(e) => {
                                                        e.target.src = `${import.meta.env.VITE_API_URL}${tpl.bgImageUrl}`;
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-40 flex items-center justify-center text-gray-400">No Image</div>
                                            )}
                                            {selectedTemplate === tpl._id && (
                                                <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <h4 className="font-bold text-gray-800 truncate">{tpl.name}</h4>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className={`text-xs px-2 py-1 rounded font-bold ${tpl.type === 'premium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                                    {tpl.type === 'premium' ? 'PREMIUM' : 'FREE'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 3. ACTION BAR */}
                    <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm border sticky bottom-4 z-10">
                        <div>
                            <h3 className="font-bold text-lg">Summary</h3>
                            <p className="text-gray-600 text-sm">
                                {previewData.validRows.length} Certificates × ₹50 = <span className="font-bold text-gray-900">₹{previewData.validRows.length * 50}</span>
                            </p>
                            {!selectedTemplate && <p className="text-red-500 text-xs mt-1">* Select a template to proceed</p>}
                        </div>
                        <div className="space-x-4">
                            <button
                                onClick={() => { setPreviewData(null); setFile(null); }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={previewData.validCount === 0 || !selectedTemplate}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <span>Pay & Generate Certificates</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            </button>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
}

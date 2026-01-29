//E:\DigitalCertificateSystem\frontend\src\pages\GenerateCertificate.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API from "../api/axiosInstance";

export default function GenerateCertificate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const templateId = searchParams.get("templateId");

  const [form, setForm] = useState({
    certificateTitle: "",
    recipientName: "",
    courseName: "",
    description: "",
    date: "",
    email: "",
  });

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [purchaseId, setPurchaseId] = useState(null);

  // -----------------------------
  // SAFETY + LOAD TEMPLATE
  // -----------------------------
  useEffect(() => {
    if (!templateId) {
      navigate("/dashboard/templates");
      return;
    }

    const loadTemplate = async () => {
      try {
        const res = await API.get("/templates");
        const found = res.data.templates.find(t => t._id === templateId);
        if (!found) return navigate("/dashboard/templates");
        setTemplate(found);
      } catch {
        navigate("/dashboard/templates");
      }
    };

    loadTemplate();
  }, [templateId, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // -----------------------------
  // PAYMENT
  // -----------------------------
  const handlePayment = async () => {
    if (!template) return;

    setLoading(true);

    try {
      const user =
        JSON.parse(localStorage.getItem("user")) ||
        JSON.parse(localStorage.getItem("authUser"));

      if (!user?._id) {
        alert("User not logged in");
        setLoading(false);
        return;
      }

      const CERTIFICATE_PRICE = 50;
      const amount = CERTIFICATE_PRICE;

      if (!template?._id) {
        alert("Template not loaded correctly. Please refresh.");
        setLoading(false);
        return;
      }

      const res = await API.post("/payments/create-order", {
        amount,
        purchaseType: "certificate",
        userId: user._id,
        templateId: template._id, // Explicitly use this ID
        studentData: form,
      });

      // FREE TEMPLATE
      if (amount === 0) {
        setPurchaseId(res.data.purchaseId);
        alert("Free certificate ready");
        setLoading(false);
        return;
      }

      // PAID TEMPLATE
      const loaded = await loadRazorpay();
      if (!loaded) {
        alert("Razorpay failed to load");
        setLoading(false);
        return;
      }

      const { order, purchaseId } = res.data;
      setPurchaseId(purchaseId);

      new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        order_id: order.id,
        name: "Digital Certificate System",
        description: "Certificate Generation",
        handler: async (response) => {
          try {
            const res = await API.post("/payments/mark-success", {
              purchaseId,
              paymentId: response.razorpay_payment_id,
            });

            if (!res.data?.success) {
              alert("Payment confirmation failed. Please retry.");
              return;
            }

            alert("Payment successful. Now generate certificate.");
          } catch (err) {
            alert("Payment saved failed. Please contact support.");
            return;
          }
        }
      }).open();

    } catch (err) {
      alert(
        err?.response?.data?.error ||
        "This payment is already used. Please make a new payment."
      );
    }

    setLoading(false);
  };

  // -----------------------------
  // GENERATE CERTIFICATE
  // -----------------------------
  const handleGenerate = async () => {
    if (!purchaseId) {
      alert("Please complete payment first");
      return;
    }

    setLoading(true);

    try {
      await API.post("/certificates/generate-by-purchase", { purchaseId });
      alert("Certificate generated successfully! Check your email.");
      navigate("/dashboard/my-certificates");
    } catch (err) {
      alert(
        err?.response?.data?.error ||
        "Certificate generation failed"
      );
    }

    setLoading(false);
  };

  if (!template) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* Left: Template Preview */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <span className="inline-block px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider mb-4">
                Selected Template
              </span>
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-inner">
                {template.bgImageUrl ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${template.bgImageUrl}`}
                    alt={template.name}
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 font-medium">No Preview</div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mt-6">{template.name}</h2>
              <p className="text-gray-500 mt-2 leading-relaxed">{template.description}</p>
            </div>
          </div>

          {/* Right: Input Form */}
          <div className="bg-white p-8 lg:p-10 rounded-3xl shadow-xl border border-gray-100 relative overflow-hidden">

            {/* Decorative Background Blob */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -z-0 opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>

            <div className="relative z-10">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-8 font-display">
                Certificate Details
              </h1>

              <div className="space-y-5">

                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Certificate Title</label>
                  <input
                    name="certificateTitle"
                    placeholder="Certificate of Appreciation"
                    onChange={handleChange}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-medium placeholder-gray-400"
                  />
                </div>

                {/* Recipient Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Recipient Name</label>
                  <input
                    name="recipientName"
                    placeholder="e.g. John Doe"
                    onChange={handleChange}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-medium"
                  />
                </div>

                {/* Course Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Course / Event Name</label>
                  <input
                    name="courseName"
                    placeholder="e.g. Advanced Web Development"
                    onChange={handleChange}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-medium"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Description (Optional)</label>
                  <textarea
                    name="description"
                    placeholder="Successfully completed the course..."
                    rows="3"
                    onChange={handleChange}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-medium resize-none"
                  />
                </div>

                {/* Date & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Issue Date</label>
                    <input
                      type="date"
                      name="date"
                      onChange={handleChange}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-medium text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Recipient Email</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="john@example.com"
                      onChange={handleChange}
                      className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  {!purchaseId ? (
                    <>
                      <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          "Processing..."
                        ) : (
                          <>
                            Proceed to Payment <span className="text-orange-200 text-sm font-normal ml-1">(₹50)</span>
                          </>
                        )}
                      </button>
                      <p className="text-center text-xs text-gray-400 mt-3 font-medium">
                        Secure payment via Razorpay
                      </p>
                    </>
                  ) : (
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-green-200 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {loading ? "Generating..." : "Generate Certificate Now"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

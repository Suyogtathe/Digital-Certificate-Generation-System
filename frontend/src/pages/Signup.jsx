//E:\DigitalCertificateSystem\frontend\src\pages\Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    organizationName: "",
    issuerCode: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Password Validation
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!pwdRegex.test(form.password)) {
      setError("Password must be at least 8 characters, include one uppercase, one lowercase, one number and one special character.");
      return;
    }

    setLoading(true);

    try {
      await register(form);
      navigate("/"); // redirect to login after signup
    } catch (err) {
      setError(err.message || "Signup failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-xl bg-white shadow-xl rounded-xl p-8 border border-gray-200">

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
          Register your <span className="text-blue-600">Organization</span>
        </h1>

        {/* Error */}
        {error && (
          <div className="mb-4 text-red-600 text-center font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Org Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Organization Name
            </label>
            <input
              type="text"
              name="organizationName"
              placeholder="e.g. Acme University"
              value={form.organizationName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Issuer Code */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Issuer Code (Unique ID)
            </label>
            <input
              type="text"
              name="issuerCode"
              placeholder="e.g. ACME-2024"
              value={form.issuerCode}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Official Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="admin@acme.edu"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-all duration-200"
          >
            {loading ? "Registering..." : "Register Organization"}
          </button>

        </form>

        {/* Login link */}
        <p className="text-center text-gray-600 mt-5">
          Already registered?{" "}
          <Link to="/" className="text-blue-600 font-medium hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

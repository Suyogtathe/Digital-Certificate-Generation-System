//E:\DigitalCertificateSystem\frontend\src\App.jsx


import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import TemplatePreview from "./pages/TemplatePreview";
import GenerateCertificate from "./pages/GenerateCertificate";
import BulkGeneration from "./pages/BulkGeneration";
import MyCertificates from "./pages/MyCertificates";

import AdminDashboard from "./pages/AdminDashboard";
import PurchaseSuccess from "./pages/PurchaseSuccess";
import Verification from "./pages/Verification";

function App() {
  return (
    <Routes>

      {/* ---------- Public Routes ---------- */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify/:id" element={<Verification />} />
      <Route path="/verify" element={<Verification />} />

      {/* ---------- User Dashboard (Nested) ---------- */}
      <Route path="/dashboard" element={<DashboardLayout />}>

        {/* Default dashboard page */}
        <Route index element={<Dashboard />} />

        {/* Dashboard pages */}
        <Route path="templates" element={<Templates />} />
        <Route path="templates/:id" element={<TemplatePreview />} />

        <Route path="generate" element={<GenerateCertificate />} />
        <Route path="bulk-generate" element={<BulkGeneration />} />
        <Route path="my-certificates" element={<MyCertificates />} />
      </Route>

      {/* ---------- Payment ---------- */}
      <Route path="/purchase-success" element={<PurchaseSuccess />} />

      {/* ---------- Admin ---------- */}
      <Route path="/admin" element={<AdminDashboard />} />

      {/* ---------- Fallback ---------- */}
      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
  );
}

export default App;

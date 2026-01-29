//E:\DigitalCertificateSystem\frontend\src\layouts\DashboardLayout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">

      {/* Top Navigation */}
      <Navbar />

      {/* Page Content */}
      <main>
        <Outlet />
      </main>

    </div>
  );
}

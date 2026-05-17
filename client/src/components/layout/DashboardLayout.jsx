import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import ApifyOnboardingModal from "@/components/ApifyOnboardingModal";

const pageTitles = {
  "/app": "Dashboard",
  "/app/jobs": "Jobs",
  "/app/applications": "Applications",
  "/app/analytics": "Analytics",
  "/app/settings": "Settings",
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Jobs365";

  return (
    <div className="min-h-screen bg-background">
      <ApifyOnboardingModal />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="md:pl-56">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
        />
        <main className="p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

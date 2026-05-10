import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const pageTitles = {
  "/": "Dashboard",
  "/jobs": "Jobs",
  "/applications": "Applications",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || "Jobs365";

  return (
    <div className="min-h-screen bg-background">
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

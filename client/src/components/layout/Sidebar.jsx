import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Send,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/jobs", label: "Jobs", icon: Briefcase },
  { to: "/app/applications", label: "Applications", icon: Send },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-56 flex-col border-r border-border bg-sidebar transition-transform duration-200 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo / Brand */}
        <div className="flex h-14 items-center border-b border-border px-5">
          <span className="text-base font-semibold tracking-tight text-foreground">
            Jobs365
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-sidebar-active"
                    : "text-sidebar-foreground hover:bg-accent hover:text-sidebar-active"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-3 py-3">
          <button
            onClick={async () => { await logout(); navigate("/signin", { replace: true }); }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-accent hover:text-sidebar-active"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}

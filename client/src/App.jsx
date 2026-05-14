import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import RedirectIfAuthed from "@/components/RedirectIfAuthed";
import Dashboard from "@/pages/Dashboard";
import Jobs from "@/pages/Jobs";
import Applications from "@/pages/Applications";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import Landing from "@/pages/Landing";
import SignIn from "@/pages/SignIn";
import Register from "@/pages/Register";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/signin"
          element={
            <RedirectIfAuthed>
              <SignIn />
            </RedirectIfAuthed>
          }
        />
        <Route
          path="/register"
          element={
            <RedirectIfAuthed>
              <Register />
            </RedirectIfAuthed>
          }
        />
        {/* Back-compat alias for any existing OAuth redirects pointing at /login */}
        <Route path="/login" element={<Navigate to="/signin" replace />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="applications" element={<Applications />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

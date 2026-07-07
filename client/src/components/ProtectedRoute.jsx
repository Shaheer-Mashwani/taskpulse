import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  requireRole = true,
  requireCompany = true,
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Session check still in progress — render nothing
  // (the spinner in main.jsx covers the screen during this time)
  if (loading) return null;

  // Not logged in — save intended destination and redirect to login
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Logged in but role not selected yet
  if (requireRole && user.role === "pending") {
    return <Navigate to="/select-role" replace />;
  }

  // Role selected but no company yet
  if (requireCompany && !user.company) {
    return <Navigate to="/company-setup" replace />;
  }

  return children;
}
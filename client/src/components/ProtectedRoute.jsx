import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  requireRole = true,
  requireCompany = true,
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While session is being verified, render nothing
  // (Root in main.jsx already shows the spinner during this time)
  if (loading) return null;

  // Not logged in at all
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Logged in but hasn't picked a role yet
  if (requireRole && user.role === "pending") {
    return <Navigate to="/select-role" replace />;
  }

  // Role picked but no company yet
  if (requireCompany && !user.company) {
    return <Navigate to="/company-setup" replace />;
  }

  return children;
}
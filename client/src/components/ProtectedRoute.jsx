import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireRole = true, requireCompany = true }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (requireRole && user.role === "pending") return <Navigate to="/select-role" replace />;
  if (requireCompany && !user.company) return <Navigate to="/company-setup" replace />;

  return children;
}
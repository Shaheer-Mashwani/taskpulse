import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireRole = true }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  if (requireRole && user.role === "pending") {
    return <Navigate to="/select-role" replace />;
  }

  return children;
}
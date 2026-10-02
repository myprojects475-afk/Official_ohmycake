import { Navigate, Outlet } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function ProtectedAdmin({ adminOnly = false }) {
  const { session } = useApp();
  if (!session) return <Navigate to="/admin/login" replace />;
  if (adminOnly && session.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

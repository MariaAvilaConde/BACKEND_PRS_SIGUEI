import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import LoadingScreen from "@/shared/components/feedback/LoadingScreen";

export default function ProtectedRoute({ allowedRoles, children }) {
     const { isAuthenticated, role, loading } = useAuth();

     if (loading) {
          return <LoadingScreen />;
     }

     if (!isAuthenticated) {
          return <Navigate to="/login" replace />;
     }

     if (allowedRoles && !allowedRoles.includes(role)) {
          return <Navigate to="/login" replace />;
     }

     return children;
}

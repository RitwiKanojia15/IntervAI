import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="app-bg min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center"
               style={{ background: "linear-gradient(135deg,#0d9488,#14b8a6)" }}>
            <Spinner size="sm" />
          </div>
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>Loading...</p>
        </div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};
export default ProtectedRoute;
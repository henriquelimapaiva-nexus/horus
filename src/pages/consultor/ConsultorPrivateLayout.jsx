// src/pages/consultor/ConsultorPrivateLayout.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useConsultorAuth } from "../../context/ConsultorAuthContext";

export default function ConsultorPrivateLayout() {
  const { isAuthenticated, carregando } = useConsultorAuth();

  if (carregando) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "#0f172a",
        color: "white"
      }}>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/consultor/login" replace />;
  }

  return <Outlet />;
}
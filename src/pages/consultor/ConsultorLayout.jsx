// src/pages/consultor/ConsultorLayout.jsx
import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useConsultorAuth } from "../../context/ConsultorAuthContext";
import Botao from "../../components/ui/Botao";
import logo from "../../assets/logo.png";

const coresConsultor = {
  primary: "#0f172a",
  secondary: "#334155",
  accent: "#7c3aed",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#dc2626",
  background: "#f8fafc"
};

export default function ConsultorLayout() {
  const { usuario, logout } = useConsultorAuth();
  const navigate = useNavigate();
  const [sidebarAberta, setSidebarAberta] = useState(true);

  const handleLogout = () => {
    logout();
    navigate("/consultor/login");
  };

  const handleVoltar = () => {
    navigate("/dashboard");
  };

  const menuItems = [
    { path: "/consultor", icon: "", label: "Dashboard" },
    { path: "/consultor/clientes", icon: "", label: "Clientes" },
    { path: "/consultor/relatorios", icon: "", label: "Relatórios" },
    { path: "/consultor/configuracoes", icon: "", label: "Configurações" },
    { path: "/consultor/ias/precificacao", icon: "", label: "Proposta de Implementação" },
    { path: "/consultor/ias/precificacao-pre-contrato", icon: "", label: "Proposta Diagnóstico Inicial" },
    { path: "/consultor/ias/sugestoes", icon: "", label: "IA de Sugestões" },
    { path: "/consultor/checklist", icon: "", label: "Checklist" }
  ];

  return (
    <div style={{ 
      display: "flex", 
      minHeight: "100vh",
      backgroundColor: coresConsultor.background,
      fontFamily: "Arial, sans-serif"
    }}>
      
      {/* SIDEBAR */}
      <aside style={{
        width: sidebarAberta ? "280px" : "80px",
        backgroundColor: coresConsultor.primary,
        color: "white",
        transition: "width 0.3s ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "2px 0 8px rgba(0,0,0,0.1)"
      }}>
        
        {/* Logo e Nome da Empresa */}
        <div style={{
          padding: sidebarAberta ? "25px 20px" : "25px 10px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: sidebarAberta ? "flex-start" : "center",
          gap: "15px"
        }}>
          <img 
            src={logo} 
            alt="Nexus Engenharia Aplicada" 
            style={{ 
              width: sidebarAberta ? "60px" : "40px",
              height: "auto",
              transition: "width 0.3s ease"
            }} 
          />
          
          {sidebarAberta && (
            <div style={{ 
              display: "flex", 
              flexDirection: "column",
              lineHeight: 1.2
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: "18px", 
                fontWeight: "700"
              }}>
                NEXUS
              </h2>
              <p style={{ 
                margin: "3px 0 0", 
                fontSize: "11px", 
                opacity: 0.8,
                letterSpacing: "0.5px"
              }}>
                ENGENHARIA APLICADA
              </p>
            </div>
          )}
        </div>

        {/* Botão toggle sidebar */}
        <button
          onClick={() => setSidebarAberta(!sidebarAberta)}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            padding: "10px",
            cursor: "pointer",
            fontSize: "18px",
            textAlign: "center"
          }}
        >
          {sidebarAberta ? "◀" : "▶"}
        </button>

        {/* Menu de navegação */}
        <nav style={{ flex: 1, padding: "10px 0" }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: sidebarAberta ? "12px" : "0",
                padding: sidebarAberta ? "12px 20px" : "12px 0",
                color: "white",
                textDecoration: "none",
                transition: "background 0.2s",
                justifyContent: sidebarAberta ? "flex-start" : "center"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              {sidebarAberta && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Usuário e Logout */}
        <div style={{
          padding: sidebarAberta ? "20px" : "20px 5px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          textAlign: sidebarAberta ? "left" : "center"
        }}>
          {sidebarAberta ? (
            <>
              <div style={{ marginBottom: "15px" }}>
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                  {usuario?.nome || "Consultor"}
                </div>
                <div style={{ fontSize: "11px", opacity: 0.7, wordBreak: "break-all" }}>
                  {usuario?.email || ""}
                </div>
              </div>
              <Botao
                variant="danger"
                size="sm"
                fullWidth
                onClick={handleLogout}
              >
                Sair
              </Botao>
            </>
          ) : (
            <Botao
              variant="danger"
              size="sm"
              fullWidth
              onClick={handleLogout}
              style={{ padding: "8px" }}
            >
              🚪
            </Botao>
          )}
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main style={{
        flex: 1,
        overflow: "auto",
        backgroundColor: coresConsultor.background
      }}>
        {/* Header superior */}
        <header style={{
          backgroundColor: "white",
          padding: "15px 25px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <h1 style={{ fontSize: "20px", color: coresConsultor.primary, margin: 0 }}>
            Olá, {usuario?.nome || "Consultor"}
          </h1>
          
          <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
            <span style={{ color: "#666" }}>
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            
            <button
              onClick={handleVoltar}
              style={{
                padding: "8px 16px",
                backgroundColor: coresConsultor.accent,
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#6d28d9"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = coresConsultor.accent}
            >
              <span>◀</span> Voltar ao Sistema
            </button>
          </div>
        </header>

        {/* Área de conteúdo */}
        <div style={{ padding: "25px" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
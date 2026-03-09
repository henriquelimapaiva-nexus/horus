// src/layouts/PrivateLayout.jsx
import { Link, Outlet, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import api from "../api/api";
import logo from "../assets/logo.png";

// Função auxiliar para truncar texto
const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

function PrivateLayout() {
  const { isAuthenticated, carregando, logout } = useAuth();
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [clienteAtual, setClienteAtual] = useState("");
  const [tamanhoLogo, setTamanhoLogo] = useState(40);
  const [menuAberto, setMenuAberto] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    api.get("/empresas")
      .then((res) => setClientes(res.data))
      .catch((err) => console.error("Erro ao carregar clientes:", err));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("clienteAtual");
    if (stored) {
      setClienteAtual(stored);
    }
  }, []);

  useEffect(() => {
    function atualizarTamanho() {
      const altura = window.innerHeight;
      let novo = Math.min(Math.max(altura * 0.05, 30), 60);
      setTamanhoLogo(novo);
    }

    window.addEventListener('resize', atualizarTamanho);
    atualizarTamanho();
    return () => window.removeEventListener('resize', atualizarTamanho);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAberto(null);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (carregando) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "#1E3A8A",
        color: "white"
      }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(18px, 4vw, 24px)" }}>Carregando...</h2>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const toggleMenu = (menu, event) => {
    event.stopPropagation();
    setMenuAberto(menuAberto === menu ? null : menu);
  };

  const handleClienteChange = (e) => {
    const valor = e.target.value;
    setClienteAtual(valor);
    localStorage.setItem("clienteAtual", valor);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Estilos responsivos
  const linkStyle = {
    color: "white",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "4px",
    transition: "background-color 0.2s",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "clamp(13px, 2vw, 14px)",
    whiteSpace: "nowrap"
  };

  const menuItemStyle = {
    ...linkStyle,
    position: "relative"
  };

  const submenuStyle = {
    position: "absolute",
    top: "100%",
    left: 0,
    backgroundColor: "#1E3A8A",
    minWidth: "200px",
    borderRadius: "4px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    zIndex: 1000,
    marginTop: "4px"
  };

  const submenuItemStyle = {
    ...linkStyle,
    borderRadius: 0,
    padding: "10px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.1)"
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* MENU SUPERIOR RESPONSIVO */}
      <header style={{ 
        minHeight: "60px",
        backgroundColor: "#1E3A8A", 
        color: "white", 
        display: "flex", 
        flexDirection: window.innerWidth < 768 ? "column" : "row",
        alignItems: window.innerWidth < 768 ? "stretch" : "center",
        justifyContent: "space-between",
        padding: window.innerWidth < 768 ? "10px 20px" : "0 20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        gap: "10px"
      }}>
        {/* Logo e Navegação */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          width: window.innerWidth < 768 ? "100%" : "auto"
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img 
              src={logo} 
              alt="Nexus Engenharia Aplicada" 
              style={{ 
                height: `${tamanhoLogo}px`, 
                width: "auto",
                marginRight: "10px"
              }} 
            />
            <h2 style={{ 
              margin: 0, 
              fontSize: `${tamanhoLogo * 0.6}px`, 
              fontWeight: "600" 
            }}>
              HÓRUS
            </h2>
          </div>
          
          {/* Botão menu mobile */}
          {window.innerWidth < 768 && (
            <button
              onClick={toggleMobileMenu}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "4px",
                color: "white",
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          )}
        </div>

        {/* Navegação - visível em desktop ou quando menu mobile aberto */}
        {(window.innerWidth >= 768 || mobileMenuOpen) && (
          <nav style={{ 
            display: "flex", 
            gap: window.innerWidth < 768 ? "5px" : "10px", 
            position: "relative",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            width: window.innerWidth < 768 ? "100%" : "auto",
            padding: window.innerWidth < 768 ? "10px 0" : "0"
          }} ref={menuRef}>
            
            {/* 👇 CONSULTOR - AGORA VAI PARA O LOGIN! */}
            <Link 
              to="/consultor/login"  // 👈 ÚNICA MUDANÇA!
              style={{
                ...linkStyle,
                backgroundColor: "#7c3aed",
                fontWeight: "bold"
              }}
              onClick={() => setMobileMenuOpen(false)}
            >
              👤 Consultor
            </Link>

            <Link to="/dashboard" style={linkStyle} onClick={() => setMobileMenuOpen(false)}>
              Dashboard
            </Link>

            {/* Análises */}
            <div style={{ position: "relative", width: window.innerWidth < 768 ? "100%" : "auto" }}>
              <div 
                style={{...menuItemStyle, width: window.innerWidth < 768 ? "100%" : "auto"}}
                onClick={(e) => toggleMenu('analises', e)}
              >
                Análises {menuAberto === 'analises' ? '▼' : '▶'}
              </div>
              {menuAberto === 'analises' && (
                <div style={{
                  ...submenuStyle,
                  position: window.innerWidth < 768 ? "static" : "absolute",
                  marginTop: window.innerWidth < 768 ? "5px" : "4px",
                  width: window.innerWidth < 768 ? "100%" : "auto"
                }}>
                  <Link to="/painel" style={submenuItemStyle} onClick={() => { setMenuAberto(null); setMobileMenuOpen(false); }}>
                    Painel Executivo
                  </Link>
                  <Link to="/financeiro" style={submenuItemStyle} onClick={() => { setMenuAberto(null); setMobileMenuOpen(false); }}>
                    Financeiro
                  </Link>
                  <Link to="/relatorios" style={submenuItemStyle} onClick={() => { setMenuAberto(null); setMobileMenuOpen(false); }}>
                    Relatórios
                  </Link>
                </div>
              )}
            </div>

            {/* Operação */}
            <div style={{ position: "relative", width: window.innerWidth < 768 ? "100%" : "auto" }}>
              <div 
                style={{...menuItemStyle, width: window.innerWidth < 768 ? "100%" : "auto"}}
                onClick={(e) => toggleMenu('operacao', e)}
              >
                Operação {menuAberto === 'operacao' ? '▼' : '▶'}
              </div>
              {menuAberto === 'operacao' && (
                <div style={{
                  ...submenuStyle,
                  position: window.innerWidth < 768 ? "static" : "absolute",
                  marginTop: window.innerWidth < 768 ? "5px" : "4px",
                  width: window.innerWidth < 768 ? "100%" : "auto"
                }}>
                  <Link to="/linhas" style={submenuItemStyle} onClick={() => { setMenuAberto(null); setMobileMenuOpen(false); }}>
                    Linhas
                  </Link>
                  <Link to="/postos" style={submenuItemStyle} onClick={() => { setMenuAberto(null); setMobileMenuOpen(false); }}>
                    Postos
                  </Link>
                </div>
              )}
            </div>

            {/* Cadastros */}
            <div style={{ position: "relative", width: window.innerWidth < 768 ? "100%" : "auto" }}>
              <div 
                style={{...menuItemStyle, width: window.innerWidth < 768 ? "100%" : "auto"}}
                onClick={(e) => toggleMenu('cadastros', e)}
              >
                Cadastros {menuAberto === 'cadastros' ? '▼' : '▶'}
              </div>
              {menuAberto === 'cadastros' && (
                <div style={{
                  ...submenuStyle,
                  position: window.innerWidth < 768 ? "static" : "absolute",
                  marginTop: window.innerWidth < 768 ? "5px" : "4px",
                  width: window.innerWidth < 768 ? "100%" : "auto"
                }}>
                  <Link to="/empresas" style={submenuItemStyle} onClick={() => { setMenuAberto(null); setMobileMenuOpen(false); }}>
                    Empresas
                  </Link>
                  <Link to="/produtos" style={submenuItemStyle} onClick={() => { setMenuAberto(null); setMobileMenuOpen(false); }}>
                    Produtos
                  </Link>
                  <Link to="/cargos" style={submenuItemStyle} onClick={() => { setMenuAberto(null); setMobileMenuOpen(false); }}>
                    Cargos
                  </Link>
                  <Link to="/colaboradores" style={submenuItemStyle} onClick={() => { setMenuAberto(null); setMobileMenuOpen(false); }}>
                    Colaboradores
                  </Link>
                </div>
              )}
            </div>

            <Link to="/perdas" style={linkStyle} onClick={() => setMobileMenuOpen(false)}>Perdas</Link>
            <Link to="/proposta" style={linkStyle} onClick={() => setMobileMenuOpen(false)}>Proposta</Link>
            <Link to="/conhecimento" style={linkStyle} onClick={() => setMobileMenuOpen(false)}>Conhecimento</Link>

          </nav>
        )}

        {/* Área direita: Seletor de cliente + Logout */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: window.innerWidth < 768 ? "10px" : "20px",
          flexDirection: window.innerWidth < 768 ? "column" : "row",
          width: window.innerWidth < 768 ? "100%" : "auto",
          marginTop: window.innerWidth < 768 && (window.innerWidth >= 768 || mobileMenuOpen) ? "10px" : "0"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            width: window.innerWidth < 768 ? "100%" : "auto"
          }}>
            <span style={{ 
              fontSize: "clamp(12px, 2vw, 14px)", 
              opacity: 0.9,
              whiteSpace: "nowrap"
            }}>
              Cliente:
            </span>
            <select
              value={clienteAtual}
              onChange={handleClienteChange}
              style={{
                padding: "6px 10px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "rgba(255,255,255,0.15)",
                color: "white",
                fontSize: "clamp(12px, 2vw, 14px)",
                cursor: "pointer",
                outline: "none",
                minWidth: window.innerWidth < 768 ? "100%" : "180px",
                maxWidth: "250px"
              }}
            >
              <option value="" style={{ color: "#333" }}>Selecione...</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id} style={{ color: "#333" }}>
                  {truncarTexto(cliente.nome, 20)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: "6px 16px",
              backgroundColor: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "4px",
              color: "white",
              fontWeight: "500",
              fontSize: "clamp(12px, 2vw, 14px)",
              cursor: "pointer",
              width: window.innerWidth < 768 ? "100%" : "auto",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#ef4444";
              e.target.style.borderColor = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "rgba(255,255,255,0.15)";
              e.target.style.borderColor = "rgba(255,255,255,0.3)";
            }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* ÁREA DO CONTEÚDO */}
      <main style={{ 
        flex: 1, 
        display: "flex", 
        backgroundColor: "#f5f7fa",
        overflow: "auto"
      }}>
        <Outlet context={{ clienteAtual }} />
      </main>
    </div>
  );
}

export default PrivateLayout;
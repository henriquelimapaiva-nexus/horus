// src/layouts/PrivateLayout.jsx
import { Link, Outlet, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import api from "../api/api";
import logo from "../assets/logo.png";

function PrivateLayout() {
  const { isAuthenticated, carregando, logout } = useAuth();
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [clienteAtual, setClienteAtual] = useState("");
  const [tamanhoLogo, setTamanhoLogo] = useState(40);
  const [menuAberto, setMenuAberto] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // 🛠️ AJUSTE: Carregar empresas para o seletor
  useEffect(() => {
    const carregarClientes = async () => {
      try {
        const res = await api.get("/empresas"); 
        if (res.data && Array.isArray(res.data)) {
          setClientes(res.data);
        }
      } catch (err) {
        console.error("❌ Erro ao buscar empresas:", err.message);
      }
    };

    if (isAuthenticated) {
      carregarClientes();
    }
  }, [isAuthenticated]);

  // Recuperar cliente do localStorage
  useEffect(() => {
    const stored = localStorage.getItem("clienteAtual");
    if (stored) {
      setClienteAtual(stored);
    }
  }, []);

  // ✅ NOVO: Encontrar o objeto da empresa selecionada para pegar o NOME
  const empresaSelecionada = clientes.find(c => String(c.id) === String(clienteAtual));

  // Ajuste responsivo do logo
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
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1E3A8A", color: "white" }}>
        <h2 style={{ fontSize: "clamp(18px, 4vw, 24px)" }}>Carregando...</h2>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

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

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const linkStyle = { color: "white", textDecoration: "none", padding: "8px 12px", borderRadius: "4px", transition: "background-color 0.2s", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "clamp(13px, 2vw, 14px)", whiteSpace: "nowrap" };
  const menuItemStyle = { ...linkStyle, position: "relative" };
  const submenuStyle = { position: "absolute", top: "100%", left: 0, backgroundColor: "#1E3A8A", minWidth: "200px", borderRadius: "4px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", zIndex: 1000, marginTop: "4px" };
  const submenuItemStyle = { ...linkStyle, borderRadius: 0, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ 
        minHeight: "60px", backgroundColor: "#1E3A8A", color: "white", 
        display: "flex", flexDirection: window.innerWidth < 768 ? "column" : "row",
        alignItems: window.innerWidth < 768 ? "stretch" : "center",
        justifyContent: "space-between", padding: "0 20px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", gap: "10px" 
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src={logo} alt="Hórus" style={{ height: `${tamanhoLogo}px`, marginRight: "10px" }} />
            <h2 style={{ margin: 0, fontSize: `${tamanhoLogo * 0.6}px` }}>HÓRUS</h2>
          </div>
          {window.innerWidth < 768 && (
            <button onClick={toggleMobileMenu} style={{ background: "transparent", color: "white", border: "1px solid white", borderRadius: "4px" }}>
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          )}
        </div>

        {(window.innerWidth >= 768 || mobileMenuOpen) && (
          <nav style={{ display: "flex", gap: "10px", flexDirection: window.innerWidth < 768 ? "column" : "row" }} ref={menuRef}>
            <Link to="/consultor/login" style={{ ...linkStyle, backgroundColor: "#7c3aed" }}>👤 Consultor</Link>
            <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
            
            {/* Menus Dropdown (Mantidos como seu original) */}
            <div style={{ position: "relative" }}>
              <div style={menuItemStyle} onClick={(e) => toggleMenu('analises', e)}>Análises ▼</div>
              {menuAberto === 'analises' && (
                <div style={submenuStyle}>
                  <Link to="/painel" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Painel Executivo</Link>
                  <Link to="/financeiro" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Financeiro</Link>
                </div>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <div style={menuItemStyle} onClick={(e) => toggleMenu('operacao', e)}>Operação ▼</div>
              {menuAberto === 'operacao' && (
                <div style={submenuStyle}>
                  <Link to="/linhas" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Linhas</Link>
                  <Link to="/postos" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Postos</Link>
                </div>
              )}
            </div>

            <div style={{ position: "relative" }}>
              <div style={menuItemStyle} onClick={(e) => toggleMenu('cadastros', e)}>Cadastros ▼</div>
              {menuAberto === 'cadastros' && (
                <div style={submenuStyle}>
                  <Link to="/empresas" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Empresas</Link>
                  <Link to="/produtos" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Produtos</Link>
                </div>
              )}
            </div>
            
            <Link to="/perdas" style={linkStyle}>Perdas</Link>
          </nav>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <select value={clienteAtual} onChange={handleClienteChange} style={{ padding: "6px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.15)", color: "white", border: "none" }}>
            <option value="" style={{ color: "#333" }}>Selecione...</option>
            {clientes.map(c => <option key={c.id} value={c.id} style={{ color: "#333" }}>{c.nome}</option>)}
          </select>
          <button onClick={handleLogout} style={{ background: "none", color: "white", border: "1px solid white", borderRadius: "4px", padding: "5px 10px", cursor: "pointer" }}>Sair</button>
        </div>
      </header>

      <main style={{ flex: 1, backgroundColor: "#f5f7fa", overflow: "auto" }}>
        {/* ✅ AJUSTE: Enviando ID e NOME para as páginas filhas */}
        <Outlet context={{ 
          clienteAtual, 
          nomeCliente: empresaSelecionada ? empresaSelecionada.nome : "Selecione uma empresa" 
        }} />
      </main>
    </div>
  );
}

export default PrivateLayout;
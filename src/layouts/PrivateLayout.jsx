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
  // Puxando o que é necessário do contexto
  const { isAuthenticated, carregando, logout, selecionarCliente } = useAuth();
  const navigate = useNavigate();

  const [clientes, setClientes] = useState([]);
  const [clienteAtual, setClienteAtual] = useState("");
  const [nomeCliente, setNomeCliente] = useState("Selecione um Cliente");
  const [tamanhoLogo, setTamanhoLogo] = useState(40);
  const [menuAberto, setMenuAberto] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Carregar empresas - SEM CACHE E SEM LOOP
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let isMounted = true;
    
    const carregarClientes = async () => {
      try {
        console.log("📡 Carregando clientes...");
        const res = await api.get("/companies");
        
        if (!isMounted) return;
        
        if (res.data && Array.isArray(res.data)) {
          setClientes(res.data);
          console.log(`✅ ${res.data.length} clientes carregados`);
          
          const storedId = localStorage.getItem("clienteAtual");
          if (storedId) {
            const cliente = res.data.find(c => c.id === parseInt(storedId));
            if (cliente) {
              setNomeCliente(cliente.nome);
              setClienteAtual(storedId);
              // ⚠️ NÃO chamar selecionarCliente aqui para evitar loop
            }
          }
        }
      } catch (err) {
        console.error("Erro ao carregar clientes:", err);
      }
    };

    carregarClientes();

    const handleEmpresasAtualizadas = () => {
      console.log("📢 Evento recebido - recarregando seletor");
      carregarClientes();
    };

    window.addEventListener('empresasAtualizadas', handleEmpresasAtualizadas);

    return () => {
      isMounted = false;
      window.removeEventListener('empresasAtualizadas', handleEmpresasAtualizadas);
    };
  }, [isAuthenticated]);

  // Recuperar cliente do localStorage
  useEffect(() => {
    const stored = localStorage.getItem("clienteAtual");
    if (stored) {
      setClienteAtual(stored);
    }
  }, []);

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

  // Fechar menus ao clicar fora
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
    
    const cliente = clientes.find(c => c.id === parseInt(valor));
    if (cliente) {
      setNomeCliente(cliente.nome);
      selecionarCliente(cliente);
    }
    
    window.location.reload();
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Estilos
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

  const menuItemStyle = { ...linkStyle, position: "relative" };

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
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: window.innerWidth < 768 ? "100%" : "auto"
        }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={logo}
              alt="Hórus Engenharia"
              style={{ height: `${tamanhoLogo}px`, width: "auto", marginRight: "10px" }}
            />
            <h2 style={{ margin: 0, fontSize: `${tamanhoLogo * 0.6}px`, fontWeight: "600" }}>
              HÓRUS
            </h2>
          </div>
          
          {window.innerWidth < 768 && (
            <button onClick={toggleMobileMenu} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "4px", color: "white", padding: "8px 12px" }}>
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          )}
        </div>

        {(window.innerWidth >= 768 || mobileMenuOpen) && (
          <nav style={{
            display: "flex",
            gap: "10px",
            flexDirection: window.innerWidth < 768 ? "column" : "row",
            width: window.innerWidth < 768 ? "100%" : "auto"
          }} ref={menuRef}>
            
            <Link to="/consultor/login" style={{ ...linkStyle, backgroundColor: "#7c3aed", fontWeight: "bold" }}>👤 Consultor</Link>
            <Link to="/dashboard" style={linkStyle} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>

            {/* Menu Análises */}
            <div style={{ position: "relative" }}>
              <div style={menuItemStyle} onClick={(e) => toggleMenu('analises', e)}>
                Análises {menuAberto === 'analises' ? '▼' : '▶'}
              </div>
              {menuAberto === 'analises' && (
                <div style={submenuStyle}>
                  <Link to="/painel" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Painel Executivo</Link>
                  <Link to="/financeiro" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Financeiro</Link>
                  <Link to="/relatorios" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Relatórios</Link>
                </div>
              )}
            </div>

            {/* ✅ Menu Operação COM TODOS OS MÓDULOS */}
            <div style={{ position: "relative" }}>
              <div style={menuItemStyle} onClick={(e) => toggleMenu('operacao', e)}>
                Operação {menuAberto === 'operacao' ? '▼' : '▶'}
              </div>
              {menuAberto === 'operacao' && (
                <div style={submenuStyle}>
                  <Link to="/linhas" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Linhas</Link>
                  <Link to="/postos" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Postos</Link>
                  <Link to="/coleta-dados" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Coleta de Dados</Link>
                  <Link to="/oee" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>OEE em Tempo Real</Link>
                  <Link to="/spc" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>SPC - Controle de Qualidade</Link>
                  <Link to="/tpm" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>TPM - Manutenção</Link>
                  <Link to="/rh" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>RH - Treinamento</Link>
                </div>
              )}
            </div>

            {/* Menu Cadastros */}
            <div style={{ position: "relative" }}>
              <div style={menuItemStyle} onClick={(e) => toggleMenu('cadastros', e)}>
                Cadastros {menuAberto === 'cadastros' ? '▼' : '▶'}
              </div>
              {menuAberto === 'cadastros' && (
                <div style={submenuStyle}>
                  <Link to="/empresas" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Empresas</Link>
                  <Link to="/produtos" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Produtos</Link>
                  <Link to="/cargos" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Cargos</Link>
                  <Link to="/colaboradores" style={submenuItemStyle} onClick={() => setMenuAberto(null)}>Colaboradores</Link>
                </div>
              )}
            </div>

            <Link to="/perdas" style={linkStyle}>Perdas</Link>
            <Link to="/proposta" style={linkStyle}>Proposta</Link>
            <Link to="/conhecimento" style={linkStyle}>Conhecimento</Link>
          </nav>
        )}

        {/* Seletor de Cliente e Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "14px", opacity: 0.9 }}>Cliente:</span>
            <select
              value={clienteAtual}
              onChange={handleClienteChange}
              style={{
                padding: "6px 10px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "rgba(255,255,255,0.15)",
                color: "white",
                cursor: "pointer",
                outline: "none",
                minWidth: "180px",
                maxWidth: "250px"
              }}
            >
              <option value="" style={{ color: "#333" }}>Selecione...</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id} style={{ color: "#333" }}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>

          <button onClick={handleLogout} style={{ padding: "6px 16px", backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "4px", color: "white", cursor: "pointer" }}>
            Sair
          </button>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", backgroundColor: "#f5f7fa", overflow: "auto" }}>
        <Outlet context={{ clienteAtual, nomeCliente }} />
      </main>
    </div>
  );
}

export default PrivateLayout;
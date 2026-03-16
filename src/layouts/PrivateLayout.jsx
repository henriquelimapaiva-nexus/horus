import React, { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Factory, 
  Building2, 
  Package, 
  Users, 
  UserSquare2, 
  FileText, 
  BookOpen, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown,
  TrendingDown,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  MonitorDot
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

export default function PrivateLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [clienteAtual, setClienteAtual] = useState(localStorage.getItem("clienteSelecionado") || "");
  const [nomeCliente, setNomeCliente] = useState("Selecione um Cliente");
  const [empresas, setEmpresas] = useState([]);
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const response = await api.get("/empresas");
        setEmpresas(response.data);
        const atual = response.data.find(e => e.id === parseInt(clienteAtual));
        if (atual) setNomeCliente(atual.nome);
      } catch (error) {
        console.error("Erro ao carregar empresas no layout:", error);
      }
    };
    fetchEmpresas();
  }, [clienteAtual]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenus({});
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMudarCliente = (id) => {
    localStorage.setItem("clienteSelecionado", id);
    setClienteAtual(id);
    const atual = empresas.find(e => e.id === parseInt(id));
    if (atual) setNomeCliente(atual.nome);
    window.location.reload();
  };

  const toggleSubmenu = (menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { path: "/linhas", label: "Linhas", icon: <Factory size={18} /> },
    { path: "/empresas", label: "Empresas", icon: <Building2 size={18} /> },
    { path: "/produtos", label: "Produtos", icon: <Package size={18} /> },
    { path: "/cargos", label: "Cargos", icon: <UserSquare2 size={18} /> },
    { path: "/colaboradores", label: "Colaboradores", icon: <Users size={18} /> },
    { path: "/relatorios", label: "Relatórios", icon: <FileText size={18} /> },
    { path: "/proposta", label: "Proposta", icon: <FileSpreadsheet size={18} /> },
    { path: "/conhecimento", label: "Conhecimento", icon: <BookOpen size={18} /> },
  ];

  const analysisItems = [
    { path: "/painel", label: "Painel Executivo", icon: <MonitorDot size={18} /> },
    { path: "/financeiro", label: "Financeiro", icon: <DollarSign size={18} /> },
    { path: "/perdas", label: "Perdas", icon: <TrendingDown size={18} /> },
    { path: "/postos", label: "Postos", icon: <PieChart size={18} /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-[#1E3A8A] text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-wider">HÓRUS</span>
              <span className="text-[10px] opacity-70 font-light">CONSULTORIA ESTRATÉGICA</span>
            </div>

            <nav className="hidden lg:flex items-center gap-1" ref={menuRef}>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all ${
                    isActive(item.path) ? "bg-white/20 font-bold" : "hover:bg-white/10"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}

              <div className="relative ml-2">
                <button
                  onClick={() => toggleSubmenu('analises')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all hover:bg-white/10 ${
                    analysisItems.some(i => isActive(i.path)) ? "bg-white/20 font-bold" : ""
                  }`}
                >
                  Análises <ChevronDown size={14} />
                </button>
                {openMenus.analises && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-xl py-2 text-gray-800 animate-in fade-in slide-in-from-top-2">
                    {analysisItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setOpenMenus({})}
                        className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100 ${
                          isActive(item.path) ? "text-[#1E3A8A] font-bold bg-blue-50" : ""
                        }`}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] opacity-70 font-bold uppercase">Cliente Atual</span>
              <select
                value={clienteAtual}
                onChange={(e) => handleMudarCliente(e.target.value)}
                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs font-bold outline-none cursor-pointer hover:bg-white/20 transition-all"
              >
                <option value="" className="text-gray-800">Selecione...</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id} className="text-gray-800">{e.nome}</option>
                ))}
              </select>
            </div>

            <button
              onClick={logout}
              className="hidden md:flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm font-bold transition-all shadow-md"
            >
              <LogOut size={16} /> Sair
            </button>

            <button 
              className="lg:hidden p-2 hover:bg-white/10 rounded-md"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#1E3A8A] border-t border-white/10 p-4 space-y-1 animate-in slide-in-from-top">
            <div className="mb-4 pb-4 border-bottom border-white/10">
               <select
                value={clienteAtual}
                onChange={(e) => handleMudarCliente(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded p-2 text-sm"
              >
                <option value="">Selecione um Cliente</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-md text-sm ${
                  isActive(item.path) ? "bg-white/20 font-bold" : "hover:bg-white/10"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
            <hr className="my-2 border-white/10" />
            <div className="text-[10px] px-3 font-bold opacity-50 uppercase tracking-widest">Análises</div>
            {analysisItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-md text-sm ${
                  isActive(item.path) ? "bg-white/20 font-bold" : "hover:bg-white/10"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 bg-red-600 p-3 rounded-md text-sm font-bold mt-4"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 p-4 lg:p-8">
        <Outlet context={{ clienteAtual, nomeCliente }} />
      </main>

      <footer className="bg-white border-t py-4 px-8 text-center text-xs text-gray-500">
        HÓRUS - Gestão Estratégica Industrial &copy; {new Date().getFullYear()} - Todos os direitos reservados.
      </footer>
    </div>
  );
}
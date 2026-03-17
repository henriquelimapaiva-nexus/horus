import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [clienteSelecionado, setClienteSelecionado] = useState(null); // Estado para o Hórus
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Recupera tudo do localStorage ao iniciar
    const token = localStorage.getItem("token");
    const usuarioSalvo = localStorage.getItem("usuario");
    const clienteSalvo = localStorage.getItem("clienteSelecionado");
    
    if (token && usuarioSalvo) {
      setIsAuthenticated(true);
      setUsuario(JSON.parse(usuarioSalvo));
      
      if (clienteSalvo) {
        setClienteSelecionado(JSON.parse(clienteSalvo));
      }
    }
    
    setCarregando(false);
  }, []);

  function login(token, usuarioData) {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuarioData));
    setIsAuthenticated(true);
    setUsuario(usuarioData);
  }

  function selecionarCliente(cliente) {
    localStorage.setItem("clienteSelecionado", JSON.stringify(cliente));
    setClienteSelecionado(cliente);
  }

  function logout() {
    localStorage.clear(); // Limpa tudo de uma vez (token, usuario, cliente)
    setIsAuthenticated(false);
    setUsuario(null);
    setClienteSelecionado(null);
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      usuario, 
      clienteSelecionado,
      selecionarCliente,
      login, 
      logout,
      carregando
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
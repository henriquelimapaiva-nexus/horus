// src/context/ConsultorAuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const ConsultorAuthContext = createContext();

export function ConsultorAuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Verificar se já existe um usuário logado
  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuarioSalvo = localStorage.getItem("usuario");
    
    // Se tiver token e usuário, considera autenticado
    if (token && usuarioSalvo) {
      setIsAuthenticated(true);
      setUsuario(JSON.parse(usuarioSalvo));
    }
    
    setCarregando(false);
  }, []);

  // Função de login
  function login(token, usuarioData) {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuarioData));
    setIsAuthenticated(true);
    setUsuario(usuarioData);
  }

  // Função de logout
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setIsAuthenticated(false);
    setUsuario(null);
  }

  return (
    <ConsultorAuthContext.Provider value={{ 
      isAuthenticated, 
      usuario, 
      login, 
      logout,
      carregando
    }}>
      {children}
    </ConsultorAuthContext.Provider>
  );
}

// Hook personalizado para usar o contexto
export function useConsultorAuth() {
  return useContext(ConsultorAuthContext);
}
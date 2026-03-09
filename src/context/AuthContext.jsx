// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Verifica se já existe token e usuário no localStorage ao iniciar app
    const token = localStorage.getItem("token");
    const usuarioSalvo = localStorage.getItem("usuario");
    
    if (token && usuarioSalvo) {
      setIsAuthenticated(true);
      setUsuario(JSON.parse(usuarioSalvo));
    }
    
    // Marca que a verificação terminou
    setCarregando(false);
  }, []);

  function login(token, usuarioData) {
    localStorage.setItem("token", token);
    localStorage.setItem("usuario", JSON.stringify(usuarioData));
    setIsAuthenticated(true);
    setUsuario(usuarioData);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setIsAuthenticated(false);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      usuario, 
      login, 
      logout,
      carregando
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
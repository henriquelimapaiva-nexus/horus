// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';
import logo from "../assets/logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    senha: ""
  });
  const [carregando, setCarregando] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.email || !form.senha) {
      toast.error("Preencha todos os campos");
      return;
    }

    setCarregando(true);

    try {
      const response = await api.post("/auth/login", {
        email: form.email,
        senha: form.senha
      });

      const { token, usuario } = response.data;
      
      login(token, usuario);
      toast.success("Login realizado com sucesso! ✅");
      
      navigate("/dashboard");

    } catch (error) {
      console.error("Erro no login:", error);
      
      if (error.response?.status === 401) {
        toast.error("Email ou senha incorretos");
      } else if (error.response?.status === 404) {
        toast.error("Rota de login não encontrada. Verifique se o backend está rodando.");
      } else {
        toast.error("Erro ao fazer login. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#1E3A8A",
      padding: "clamp(10px, 3vw, 20px)",
      boxSizing: "border-box"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "clamp(20px, 5vw, 40px)",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px",
        boxSizing: "border-box"
      }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(20px, 4vw, 30px)" }}>
          <img 
            src={logo} 
            alt="Nexus Engenharia Aplicada" 
            style={{ 
              width: "min(180px, 80%)", 
              height: "auto",
              marginBottom: "clamp(10px, 2vw, 15px)"
            }}
          />
          <h1 style={{ 
            color: "#1E3A8A", 
            fontSize: "clamp(20px, 6vw, 24px)", 
            marginBottom: "5px" 
          }}>
            NEXUS
          </h1>
          <p style={{ 
            color: "#666", 
            fontSize: "clamp(12px, 3vw, 14px)" 
          }}>
            ENGENHARIA APLICADA
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "clamp(15px, 3vw, 20px)" }}>
            <label style={labelStyleResponsivo}>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              style={inputStyleResponsivo}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div style={{ marginBottom: "clamp(20px, 4vw, 30px)" }}>
            <label style={labelStyleResponsivo}>Senha</label>
            <input
              type="password"
              name="senha"
              value={form.senha}
              onChange={handleChange}
              style={inputStyleResponsivo}
              placeholder="********"
              required
            />
          </div>

          <Botao
            type="submit"
            variant="primary"
            size="lg"
            fullWidth={true}
            loading={carregando}
            disabled={carregando}
          >
            Entrar
          </Botao>
        </form>

        <div style={{ 
          marginTop: "clamp(15px, 3vw, 20px)", 
          textAlign: "center" 
        }}>
          <Link 
            to="/" 
            style={{ 
              color: "#1E3A8A", 
              textDecoration: "none", 
              fontSize: "clamp(12px, 3vw, 14px)" 
            }}
          >
            ← Voltar para página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}

// Estilos responsivos
const labelStyleResponsivo = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "clamp(12px, 3vw, 14px)",
  fontWeight: "500"
};

const inputStyleResponsivo = {
  width: "100%",
  padding: "clamp(8px, 2vw, 10px) clamp(10px, 2.5vw, 12px)",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  fontSize: "clamp(13px, 3.5vw, 14px)",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box"
};
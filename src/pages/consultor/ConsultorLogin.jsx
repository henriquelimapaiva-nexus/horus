// src/pages/consultor/ConsultorLogin.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useConsultorAuth } from "../../context/ConsultorAuthContext";
import api from "../../api/api";
import Botao from "../../components/ui/Botao";
import toast from 'react-hot-toast';
import logo from "../../assets/logo.png";

const coresConsultor = {
  primary: "#0f172a",
  secondary: "#334155",
  accent: "#7c3aed",
  background: "#f8fafc"
};

export default function ConsultorLogin() {
  const navigate = useNavigate();
  const { login } = useConsultorAuth();

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
      // 🔧 CORREÇÃO: mudar de /consultant/login para /auth/login
      const response = await api.post("/auth/login", {
        email: form.email,
        senha: form.senha
      });

      const { token, usuario } = response.data;
      
      // Adaptar para o formato esperado pelo contexto
      const usuarioData = { 
        nome: usuario?.nome || "Consultor",
        email: usuario?.email || form.email
      };
      
      login(token, usuarioData);
      
      toast.success("Login realizado com sucesso! ✅");
      navigate("/consultor");

    } catch (error) {
      console.error("Erro no login:", error);
      
      if (error.response?.status === 401) {
        toast.error("Email ou senha incorretos");
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
      backgroundColor: coresConsultor.primary,
      padding: "20px",
      boxSizing: "border-box"
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px",
        boxSizing: "border-box"
      }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <img 
            src={logo} 
            alt="Nexus Engenharia Aplicada" 
            style={{ 
              width: "120px", 
              height: "auto",
              marginBottom: "15px"
            }} 
          />
          <h1 style={{ 
            color: coresConsultor.primary, 
            fontSize: "24px", 
            marginBottom: "5px" 
          }}>
            ÁREA DO CONSULTOR
          </h1>
          <p style={{ 
            color: "#666", 
            fontSize: "14px" 
          }}>
            Acesso restrito
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>E-mail</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              style={inputStyle}
              placeholder="consultor@nexus.com"
              required
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label style={labelStyle}>Senha</label>
            <input
              type="password"
              name="senha"
              value={form.senha}
              onChange={handleChange}
              style={inputStyle}
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
            style={{ backgroundColor: coresConsultor.accent }}
          >
            Entrar
          </Botao>
        </form>

        <div style={{ 
          marginTop: "20px", 
          textAlign: "center" 
        }}>
          <Link 
            to="/login" 
            style={{ 
              color: coresConsultor.accent, 
              textDecoration: "none", 
              fontSize: "14px" 
            }}
          >
            ← Acessar área de clientes
          </Link>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "14px",
  fontWeight: "500"
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box"
};
// src/pages/Splash.jsx
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useState, useEffect } from "react";
import Botao from "../components/ui/Botao";

function Splash() {
  const navigate = useNavigate();
  
  const [tamanho, setTamanho] = useState(390);

  useEffect(() => {
    function atualizarTamanho() {
      const largura = window.innerWidth;
      const altura = window.innerHeight;
      const menorLado = Math.min(largura, altura);
      let novoTamanho = Math.min(Math.max(menorLado * 0.6, 250), 600);
      setTamanho(novoTamanho);
    }

    window.addEventListener('resize', atualizarTamanho);
    atualizarTamanho();

    return () => window.removeEventListener('resize', atualizarTamanho);
  }, []);

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <div
        style={{
          height: "100vh",
          backgroundColor: "#1E3A8A",
          display: "flex",
          flexDirection: "column",
          color: "white",
          overflow: "hidden"
        }}
      >
        {/* Header Superior responsivo */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            padding: "clamp(10px, 3vw, 20px) clamp(15px, 5vw, 40px)",
            boxSizing: "border-box"
          }}
        >
          <Botao
            variant="custom"
            size="lg"
            onClick={() => navigate("/login")}
            style={{
              backgroundColor: "white",
              color: "#1E3A8A",
              border: "none",
              borderRadius: "8px",
              padding: "clamp(8px, 2vw, 12px) clamp(16px, 4vw, 32px)",
              fontSize: "clamp(14px, 3vw, 16px)",
              fontWeight: "600",
              zIndex: 10,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "all 0.3s ease",
              whiteSpace: "nowrap"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Acessar Plataforma
          </Botao>
        </div>

        {/* Conteúdo Central responsivo */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "0 clamp(10px, 3vw, 20px)",
            marginTop: window.innerHeight < 600 ? "-40px" : "-80px", // Ajuste para telas pequenas
            width: "100%",
            boxSizing: "border-box"
          }}
        >
          {/* LOGO responsivo (já estava) */}
          <img
            src={logo}
            alt="Nexus Engenharia Aplicada"
            style={{
              width: `${tamanho}px`,
              height: "auto",
              maxWidth: "90vw",
              marginBottom: `${tamanho * 0.08}px`,
              opacity: 0,
              animation: "fadeInUp 1.2s ease forwards"
            }}
          />

          {/* TÍTULO responsivo (já estava) */}
          <h1
            style={{
              margin: 0,
              fontSize: `${tamanho * 0.18}px`,
              fontWeight: "700",
              letterSpacing: `${tamanho * 0.02}px`,
              opacity: 0,
              animation: "fadeInUp 1.2s ease forwards",
              animationDelay: "0.3s",
              lineHeight: 1.2,
              maxWidth: "90vw",
              wordBreak: "break-word"
            }}
          >
            NEXUS
          </h1>

          {/* SUBTÍTULO responsivo (já estava) */}
          <p
            style={{
              marginTop: `${tamanho * 0.03}px`,
              fontSize: `${tamanho * 0.07}px`,
              fontWeight: "300",
              letterSpacing: `${tamanho * 0.015}px`,
              opacity: 0,
              animation: "fadeInUp 1.2s ease forwards",
              animationDelay: "0.6s",
              maxWidth: "90vw",
              wordBreak: "break-word"
            }}
          >
            ENGENHARIA APLICADA
          </p>
        </div>
      </div>
    </>
  );
}

export default Splash;
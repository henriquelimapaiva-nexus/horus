// src/pages/Linhas.jsx
import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Função auxiliar para truncar texto
const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function Linhas() {
  let clienteAtual = null;
  try {
    const context = useOutletContext() || {};
    clienteAtual = context.clienteAtual;
  } catch (e) {
    // Ignora erro
  }

  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!clienteAtual) {
      setLinhas([]);
      return;
    }

    setCarregando(true);
    api.get(`/linhas/${clienteAtual}`)
      .then((res) => setLinhas(res.data))
      .catch((err) => {
        console.error("Erro ao carregar linhas:", err);
        toast.error("Erro ao carregar linhas");
      })
      .finally(() => setCarregando(false));
  }, [clienteAtual]);

  if (!clienteAtual) {
    return (
      <div style={{ 
        padding: "clamp(20px, 5vw, 60px) clamp(15px, 3vw, 40px)", 
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        textAlign: "center",
        minHeight: "50vh",
        boxSizing: "border-box"
      }}>
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(20px, 4vw, 40px)", 
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          maxWidth: "500px",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <h2 style={{ 
            color: "#1E3A8A", 
            marginBottom: "clamp(15px, 2vw, 20px)", 
            fontSize: "clamp(20px, 4vw, 24px)" 
          }}>
            Nenhum cliente selecionado
          </h2>
          <p style={{ 
            color: "#666", 
            marginBottom: "clamp(20px, 3vw, 30px)", 
            lineHeight: "1.6",
            fontSize: "clamp(14px, 2vw, 16px)"
          }}>
            As linhas de produção são específicas de cada cliente.
            Selecione um cliente no menu superior para visualizar as linhas cadastradas.
          </p>
          <Link to="/empresas" style={{ textDecoration: "none" }}>
            <Botao variant="primary" size="lg">
              Ir para Empresas
            </Botao>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "clamp(15px, 3vw, 30px)", 
      width: "100%",
      maxWidth: "1400px",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      
      {/* Cabeçalho responsivo */}
      <div style={{ 
        marginBottom: "clamp(20px, 3vw, 30px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <div>
          <h1 style={{ 
            color: "#1E3A8A", 
            marginBottom: "5px", 
            fontSize: "clamp(20px, 4vw, 28px)" 
          }}>
            Linhas de Produção
          </h1>
          <p style={{ 
            color: "#666", 
            fontSize: "clamp(12px, 2vw, 14px)" 
          }}>
            Cliente selecionado: <strong>{truncarTexto(clienteAtual, 30)}</strong>
          </p>
        </div>
        
        <Link to="/linhas/novo" style={{ textDecoration: "none" }}>
          <Botao variant="success" size="md">
            + Nova Linha
          </Botao>
        </Link>
      </div>

      {carregando ? (
        <div style={{ 
          textAlign: "center", 
          padding: "clamp(20px, 4vw, 40px)" 
        }}>
          <Botao 
            variant="primary" 
            size="lg" 
            loading={true}
            disabled={true}
          >
            Carregando linhas...
          </Botao>
        </div>
      ) : linhas.length === 0 ? (
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(20px, 4vw, 40px)", 
          borderRadius: "8px",
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <p style={{ 
            marginBottom: "clamp(15px, 2vw, 20px)", 
            color: "#666",
            fontSize: "clamp(14px, 2vw, 16px)"
          }}>
            Nenhuma linha cadastrada para este cliente.
          </p>
          <Link to="/linhas/novo" style={{ textDecoration: "none" }}>
            <Botao variant="primary" size="lg">
              Cadastrar primeira linha
            </Botao>
          </Link>
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))",
          gap: "clamp(15px, 2vw, 20px)"
        }}>
          {linhas.map((linha) => (
            <Link
              key={linha.id}
              to={`/linhas/${linha.id}`}
              style={{ textDecoration: "none" }}
            >
              <div style={{
                backgroundColor: "white",
                padding: "clamp(15px, 2vw, 20px)",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #1E3A8A",
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer",
                height: "100%",
                width: "100%",
                boxSizing: "border-box"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              }}
              >
                <h3 style={{ 
                  color: "#1E3A8A", 
                  marginBottom: "clamp(8px, 1.5vw, 10px)", 
                  fontSize: "clamp(16px, 2.5vw, 18px)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }} title={linha.nome}>
                  {truncarTexto(linha.nome, 25)}
                </h3>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  marginBottom: "5px",
                  fontSize: "clamp(12px, 1.8vw, 14px)"
                }}>
                  <span style={{ color: "#666" }}>Takt time:</span>
                  <span style={{ fontWeight: "bold", color: "#1E3A8A" }}>
                    {linha.takt_time_segundos || 0}s
                  </span>
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  fontSize: "clamp(12px, 1.8vw, 14px)"
                }}>
                  <span style={{ color: "#666" }}>Meta diária:</span>
                  <span style={{ fontWeight: "bold", color: "#16a34a" }}>
                    {linha.meta_diaria || 0} peças
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
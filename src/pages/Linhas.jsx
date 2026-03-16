// src/pages/Linhas.jsx
import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom"; // Importado context corretamente
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function Linhas() {
  // ✅ AJUSTE: Pegando o nomeCliente que enviamos do PrivateLayout
  const { clienteAtual, nomeCliente } = useOutletContext();

  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!clienteAtual) {
      setLinhas([]);
      return;
    }

    setCarregando(true);
    // 📡 Note que o endpoint usa o ID (clienteAtual), mas a tela usará o nomeCliente
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
      <div style={{ padding: "60px 40px", textAlign: "center", width: "100%" }}>
        <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", margin: "0 auto", maxWidth: "500px" }}>
          <h2 style={{ color: "#1E3A8A" }}>Nenhum cliente selecionado</h2>
          <p style={{ color: "#666", marginBottom: "30px" }}>Selecione um cliente no menu superior para visualizar as linhas.</p>
          <Link to="/empresas"><Botao variant="primary" size="lg">Ir para Empresas</Botao></Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "clamp(15px, 3vw, 30px)", width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
      
      <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1 style={{ color: "#1E3A8A", marginBottom: "5px", fontSize: "clamp(20px, 4vw, 28px)" }}>
            Linhas de Produção
          </h1>
          <p style={{ color: "#666", fontSize: "14px" }}>
            {/* ✅ AGORA TRADUZIDO: Mostra o nome da empresa, não o ID */}
            Cliente selecionado: <strong style={{ color: "#1E3A8A" }}>{nomeCliente}</strong>
          </p>
        </div>
        
        <Link to="/linhas/novo" style={{ textDecoration: "none" }}>
          <Botao variant="success" size="md">+ Nova Linha</Botao>
        </Link>
      </div>

      {carregando ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Botao variant="primary" loading={true} disabled={true}>Carregando linhas...</Botao>
        </div>
      ) : linhas.length === 0 ? (
        <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px", textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#666", marginBottom: "20px" }}>Nenhuma linha cadastrada para {nomeCliente}.</p>
          <Link to="/linhas/novo"><Botao variant="primary">Cadastrar primeira linha</Botao></Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {linhas.map((linha) => (
            <Link key={linha.id} to={`/linhas/${linha.id}`} style={{ textDecoration: "none" }}>
              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", borderLeft: "4px solid #1E3A8A", transition: "transform 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                
                <h3 style={{ color: "#1E3A8A", marginBottom: "10px" }}>{truncarTexto(linha.nome, 25)}</h3>
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "5px" }}>
                  <span style={{ color: "#666" }}>Takt time:</span>
                  <span style={{ fontWeight: "bold" }}>{linha.takt_time_segundos}s</span>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                  <span style={{ color: "#666" }}>Meta diária:</span>
                  <span style={{ fontWeight: "bold", color: "#16a34a" }}>{linha.meta_diaria} pçs</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
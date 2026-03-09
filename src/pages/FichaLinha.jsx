// src/pages/FichaLinha.jsx
import { useState, useEffect } from "react";
import { useParams, useOutletContext, Link } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Importar componentes de gráficos
import GraficoOEE from "../components/graficos/GraficoOEE";
import GraficoBarras from "../components/graficos/GraficoBarras";
import GraficoPizza from "../components/graficos/GraficoPizza";
import GraficoLinha from "../components/graficos/GraficoLinha";
import { coresNexus } from "../components/graficos/GraficoBase";
import AlocacaoModal from "../components/AlocacaoModal";

// Função auxiliar para truncar texto
const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

// ========================================
// ABA 1 - VISÃO GERAL (COM GRÁFICOS)
// ========================================
function VisaoGeral({ linha, linhaId }) {
  const [dadosSimulacao, setDadosSimulacao] = useState(null);
  const [dadosHistoricos, setDadosHistoricos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!linhaId) return;
    
    setCarregando(true);
    Promise.all([
      api.get(`/simulacao-linha/${linhaId}`).catch(() => ({ data: {} })),
      api.get(`/historico-linha/${linhaId}`).catch(() => ({ data: [] }))
    ])
      .then(([simulacao, historico]) => {
        if (simulacao.data.produtos && simulacao.data.produtos.length > 0) {
          setDadosSimulacao(simulacao.data.produtos[0]);
        }
        setDadosHistoricos(historico.data);
      })
      .catch((err) => {
        console.error("Erro ao carregar dados:", err);
        toast.error("Erro ao carregar dados da visão geral");
      })
      .finally(() => setCarregando(false));
  }, [linhaId]);

  const getEficienciaCor = (valor) => {
    if (valor >= 80) return "#16a34a";
    if (valor >= 60) return "#f59e0b";
    return "#dc2626";
  };

  const dadosOEE = {
    disponibilidade: dadosSimulacao?.disponibilidade_percentual || 0,
    performance: dadosSimulacao?.performance_percentual || 0,
    qualidade: dadosSimulacao?.qualidade_percentual || 0,
    oee: linha.eficiencia_percentual || 0
  };

  const meses = dadosHistoricos.map(d => {
    const data = new Date(d.mes);
    return data.toLocaleDateString('pt-BR', { month: 'short' });
  });
  const valoresOEE = dadosHistoricos.map(d => d.oee);

  return (
    <div>
      <h2 style={{ 
        color: "#1E3A8A", 
        marginBottom: "clamp(15px, 2vw, 20px)", 
        fontSize: "clamp(18px, 3vw, 22px)" 
      }}>
        Visão Geral da Linha
      </h2>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 3vw, 30px)" 
      }}>
        <Card 
          titulo="Eficiência Global (OEE)" 
          valor={`${linha.eficiencia_percentual || 0}%`}
          cor={getEficienciaCor(linha.eficiencia_percentual || 0)}
        />
        <Card 
          titulo="Gargalo" 
          valor={truncarTexto(linha.gargalo || "Não identificado", 20)}
          cor="#1E3A8A"
        />
        <Card 
          titulo="Capacidade Estimada" 
          valor={`${linha.capacidade_estimada_dia || 0} pç/dia`}
          cor="#0f172a"
        />
        <Card 
          titulo="Takt Time" 
          valor={`${linha.takt_time_segundos || 0}s`}
          cor="#6b7280"
        />
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 3vw, 30px)" 
      }}>
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden"
        }}>
          <GraficoOEE dados={dadosOEE} titulo="Componentes do OEE" />
        </div>

        {dadosHistoricos.length > 0 && (
          <div style={{ 
            backgroundColor: "white", 
            padding: "clamp(15px, 2vw, 20px)", 
            borderRadius: "8px", 
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            width: "100%",
            boxSizing: "border-box",
            overflow: "hidden"
          }}>
            <GraficoLinha 
              labels={meses.slice(-6)}
              valores={valoresOEE.slice(-6)}
              titulo="Evolução do OEE (6 meses)"
              cor={coresNexus.primary}
              formato="percentual"
            />
          </div>
        )}
      </div>

      {linha.maior_tempo_ciclo_real_segundos && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginTop: "clamp(15px, 2vw, 20px)",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <h3 style={{ 
            color: "#1E3A8A", 
            marginBottom: "clamp(10px, 1.5vw, 15px)", 
            fontSize: "clamp(16px, 2.5vw, 18px)" 
          }}>
            Detalhes da Análise
          </h3>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", 
            gap: "clamp(10px, 1.5vw, 15px)" 
          }}>
            <div>
              <span style={{ color: "#666", fontSize: "clamp(12px, 1.5vw, 14px)" }}>Maior ciclo real:</span>
              <p style={{ fontSize: "clamp(16px, 2vw, 18px)", fontWeight: "bold", margin: "5px 0" }}>
                {linha.maior_tempo_ciclo_real_segundos}s
              </p>
            </div>
            <div>
              <span style={{ color: "#666", fontSize: "clamp(12px, 1.5vw, 14px)" }}>Meta diária:</span>
              <p style={{ fontSize: "clamp(16px, 2vw, 18px)", fontWeight: "bold", margin: "5px 0" }}>
                {linha.meta_diaria_planejada || 0} pç
              </p>
            </div>
            <div>
              <span style={{ color: "#666", fontSize: "clamp(12px, 1.5vw, 14px)" }}>Postos:</span>
              <p style={{ fontSize: "clamp(16px, 2vw, 18px)", fontWeight: "bold", margin: "5px 0" }}>
                {linha.postos?.length || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente Card auxiliar responsivo
function Card({ titulo, valor, cor }) {
  return (
    <div style={{ 
      background: "white", 
      padding: "clamp(12px, 2vw, 20px)", 
      borderRadius: "8px", 
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      borderLeft: `4px solid ${cor}`,
      transition: "transform 0.2s",
      width: "100%",
      boxSizing: "border-box",
      minWidth: 0,
      overflow: "hidden"
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <h3 style={{ 
        color: "#666", 
        marginBottom: "5px", 
        fontSize: "clamp(12px, 1.8vw, 14px)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }} title={titulo}>
        {titulo}
      </h3>
      <p style={{ 
        fontSize: "clamp(18px, 3vw, 24px)", 
        fontWeight: "bold", 
        color: cor, 
        margin: "5px 0",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }} title={valor}>
        {valor}
      </p>
    </div>
  );
}

// ========================================
// ABA 2 - MAPA DA LINHA
// ========================================
function Mapa({ linha, linhaId }) {
  const [postos, setPostos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!linhaId) return;
    
    setCarregando(true);
    api.get(`/postos/${linhaId}`)
      .then((res) => setPostos(res.data))
      .catch((err) => {
        console.error("Erro ao carregar postos:", err);
        toast.error("Erro ao carregar postos");
      })
      .finally(() => setCarregando(false));
  }, [linhaId]);

  const maiorCiclo = Math.max(...postos.map(p => p.tempo_ciclo_segundos || 0), 1);

  function getCorPorEficiencia(disponibilidade) {
    if (disponibilidade >= 95) return "#16a34a";
    if (disponibilidade >= 85) return "#f59e0b";
    return "#dc2626";
  }

  if (carregando) {
    return <div style={{ padding: "clamp(20px, 5vw, 40px)", textAlign: "center" }}>Carregando mapa...</div>;
  }

  if (postos.length === 0) {
    return (
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(20px, 5vw, 40px)", 
        borderRadius: "8px", 
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        margin: "clamp(10px, 2vw, 20px)"
      }}>
        <p style={{ color: "#666", marginBottom: "clamp(15px, 3vw, 20px)" }}>
          Nenhum posto cadastrado para esta linha.
        </p>
        <Botao
          variant="primary"
          size="md"
          onClick={() => window.location.href = `/postos/novo/${linhaId}`}
        >
          Cadastrar Posto
        </Botao>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ 
        color: "#1E3A8A", 
        marginBottom: "clamp(15px, 2vw, 20px)", 
        fontSize: "clamp(18px, 3vw, 22px)" 
      }}>
        Mapa da Linha
      </h2>
      
      <div style={{ 
        display: "flex", 
        gap: "clamp(10px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 3vw, 30px)",
        padding: "clamp(10px, 2vw, 15px)",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#16a34a" }}></div>
          <span style={{ fontSize: "clamp(12px, 1.5vw, 14px)" }}>Disponibilidade ≥ 95%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#f59e0b" }}></div>
          <span style={{ fontSize: "clamp(12px, 1.5vw, 14px)" }}>Disponibilidade 85-94%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#dc2626" }}></div>
          <span style={{ fontSize: "clamp(12px, 1.5vw, 14px)" }}>Disponibilidade {"<"} 85%</span>
        </div>
      </div>

      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 30px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        overflowX: "auto",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <div style={{ 
          display: "flex", 
          gap: "clamp(20px, 3vw, 40px)", 
          justifyContent: "center",
          alignItems: "flex-end",
          minWidth: "max-content",
          padding: "clamp(10px, 2vw, 20px) 0"
        }}>
          {postos.map((posto, index) => {
            const tamanho = 30 + (posto.tempo_ciclo_segundos / maiorCiclo) * 40;
            const cor = getCorPorEficiencia(posto.disponibilidade_percentual || 100);
            
            return (
              <div key={posto.id} style={{ textAlign: "center", position: "relative" }}>
                {index < postos.length - 1 && (
                  <div style={{
                    position: "absolute",
                    top: "30%",
                    right: "-20px",
                    width: "20px",
                    height: "2px",
                    backgroundColor: "#ccc",
                    zIndex: 1
                  }} />
                )}
                
                <div
                  style={{
                    width: `${tamanho}px`,
                    height: `${tamanho}px`,
                    borderRadius: "50%",
                    backgroundColor: cor,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "clamp(10px, 1.2vw, 12px)",
                    marginBottom: "10px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    border: posto.id === linha.gargalo ? "4px solid #000" : "none",
                    position: "relative",
                    zIndex: 2,
                    cursor: "pointer",
                    transition: "transform 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                  onClick={() => toast.info(`Posto: ${posto.nome}\nCiclo: ${posto.tempo_ciclo_segundos}s\nDisponibilidade: ${posto.disponibilidade_percentual}%`)}
                >
                  <span>{index + 1}</span>
                  <span style={{ fontSize: "8px" }}>{posto.tempo_ciclo_segundos}s</span>
                </div>
                
                <div style={{ 
                  fontWeight: "500", 
                  fontSize: "clamp(10px, 1.2vw, 12px)", 
                  maxWidth: "80px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }} title={posto.nome}>
                  {truncarTexto(posto.nome, 10)}
                </div>
                
                {posto.id === linha.gargalo && (
                  <div style={{
                    marginTop: "5px",
                    backgroundColor: "#000",
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "12px",
                    fontSize: "8px",
                    fontWeight: "bold"
                  }}>
                    GARGALO
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: "clamp(20px, 3vw, 30px)" }}>
        <h3 style={{ 
          color: "#1E3A8A", 
          marginBottom: "clamp(10px, 1.5vw, 15px)", 
          fontSize: "clamp(16px, 2.5vw, 18px)" 
        }}>
          Resumo dos Postos
        </h3>
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse", 
            backgroundColor: "white",
            minWidth: "600px",
            tableLayout: "fixed"
          }}>
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                <th style={thResponsivo}>Ordem</th>
                <th style={thResponsivo}>Posto</th>
                <th style={thResponsivo}>Ciclo (s)</th>
                <th style={thResponsivo}>Disponibilidade</th>
                <th style={thResponsivo}>Setup (min)</th>
                <th style={thResponsivo}>Status</th>
              </tr>
            </thead>
            <tbody>
              {postos.map((posto, index) => (
                <tr key={posto.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdResponsivo}>{index + 1}º</td>
                  <td style={tdResponsivo} title={posto.nome}>{truncarTexto(posto.nome, 15)}</td>
                  <td style={tdResponsivo}>{posto.tempo_ciclo_segundos || 0}s</td>
                  <td style={tdResponsivo}>
                    <span style={{ 
                      color: getCorPorEficiencia(posto.disponibilidade_percentual || 100),
                      fontWeight: "bold"
                    }}>
                      {posto.disponibilidade_percentual || 100}%
                    </span>
                  </td>
                  <td style={tdResponsivo}>{posto.tempo_setup_minutos || 0} min</td>
                  <td style={tdResponsivo}>
                    {posto.id === linha.gargalo ? (
                      <span style={badgeStyle}>🔴 Gargalo</span>
                    ) : (
                      <span style={{ ...badgeStyle, backgroundColor: "#16a34a" }}>✅ Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ========================================
// ABA 3 - POSTOS (TABELA COMPLETA)
// ========================================
function Postos({ linha, linhaId }) {
  const [postos, setPostos] = useState(linha.postos || []);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!linhaId) return;
    
    setCarregando(true);
    api.get(`/postos/${linhaId}`)
      .then((res) => setPostos(res.data))
      .catch((err) => {
        console.error("Erro ao carregar postos:", err);
        toast.error("Erro ao carregar postos");
      })
      .finally(() => setCarregando(false));
  }, [linhaId]);

  if (carregando) {
    return <div style={{ padding: "clamp(15px, 3vw, 20px)", textAlign: "center" }}>Carregando postos...</div>;
  }

  return (
    <div>
      <h2 style={{ 
        color: "#1E3A8A", 
        marginBottom: "clamp(15px, 2vw, 20px)", 
        fontSize: "clamp(18px, 3vw, 22px)" 
      }}>
        Detalhamento dos Postos
      </h2>
      
      {postos.length === 0 ? (
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(20px, 5vw, 40px)", 
          borderRadius: "8px", 
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <p style={{ color: "#666", marginBottom: "clamp(15px, 3vw, 20px)" }}>
            Nenhum posto cadastrado para esta linha.
          </p>
          <Botao
            variant="primary"
            size="md"
            onClick={() => window.location.href = `/postos/novo/${linhaId}`}
          >
            Cadastrar Posto
          </Botao>
        </div>
      ) : (
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse", 
            backgroundColor: "white", 
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            borderRadius: "8px",
            minWidth: "700px",
            tableLayout: "fixed"
          }}>
            <colgroup>
              <col style={{ width: "25%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "15%" }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                <th style={thResponsivo}>Posto</th>
                <th style={thResponsivo}>Ciclo (s)</th>
                <th style={thResponsivo}>Disponibilidade</th>
                <th style={thResponsivo}>Setup (min)</th>
                <th style={thResponsivo}>Cargo</th>
                <th style={thResponsivo}>Ordem</th>
              </tr>
            </thead>
            <tbody>
              {postos.map((posto, index) => (
                <tr key={posto.id || index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdResponsivo} title={posto.nome}>{truncarTexto(posto.nome, 20)}</td>
                  <td style={tdResponsivo}>{posto.tempo_ciclo_segundos || 0}s</td>
                  <td style={tdResponsivo}>
                    <span style={{ 
                      color: (posto.disponibilidade_percentual || 0) >= 90 ? "#16a34a" : "#dc2626",
                      fontWeight: "bold"
                    }}>
                      {posto.disponibilidade_percentual || 0}%
                    </span>
                  </td>
                  <td style={tdResponsivo}>{posto.tempo_setup_minutos || 0} min</td>
                  <td style={tdResponsivo} title={posto.cargo_id || "-"}>{truncarTexto(posto.cargo_id || "-", 15)}</td>
                  <td style={tdResponsivo}>{posto.ordem_fluxo || index + 1}º</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ========================================
// ABA 5 - BALANCEAMENTO (COM GRÁFICOS)
// ========================================
function Balanceamento({ linha, linhaId }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!linhaId) return;
    
    setCarregando(true);
    api.get(`/balanceamento/${linhaId}`)
      .then((res) => {
        setDados(res.data);
        setErro("");
      })
      .catch((err) => {
        console.error("Erro ao carregar balanceamento:", err);
        setErro("Erro ao carregar dados de balanceamento");
        toast.error("Erro ao carregar dados de balanceamento");
      })
      .finally(() => setCarregando(false));
  }, [linhaId]);

  if (carregando) {
    return <div style={{ padding: "clamp(20px, 5vw, 40px)", textAlign: "center" }}>Carregando balanceamento...</div>;
  }

  if (erro) {
    return (
      <div style={{ 
        backgroundColor: "#fee2e2", 
        color: "#dc2626", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "4px",
        textAlign: "center"
      }}>
        {erro}
      </div>
    );
  }

  if (!dados || dados.quantidade_postos === 0) {
    return (
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(20px, 5vw, 40px)", 
        borderRadius: "8px", 
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <p style={{ color: "#666" }}>Dados de balanceamento não disponíveis.</p>
      </div>
    );
  }

  const getBalanceamentoCor = (indice) => {
    if (indice >= 90) return "#16a34a";
    if (indice >= 75) return "#f59e0b";
    return "#dc2626";
  };

  const nomesPostos = dados.postos.map(p => p.posto);
  const temposPostos = dados.postos.map(p => parseFloat(p.ciclo_real));

  return (
    <div>
      <h2 style={{ 
        color: "#1E3A8A", 
        marginBottom: "clamp(15px, 2vw, 20px)", 
        fontSize: "clamp(18px, 3vw, 22px)" 
      }}>
        Análise de Balanceamento
      </h2>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 3vw, 30px)" 
      }}>
        <Card 
          titulo="Índice de Balanceamento" 
          valor={`${dados.indice_balanceamento_percentual}%`}
          cor={getBalanceamentoCor(parseFloat(dados.indice_balanceamento_percentual))}
        />
        <Card 
          titulo="Tempo Médio" 
          valor={`${dados.tempo_medio_segundos}s`}
          cor="#1E3A8A"
        />
        <Card 
          titulo="Maior Tempo" 
          valor={`${dados.maior_tempo_segundos}s`}
          cor="#dc2626"
        />
        <Card 
          titulo="Menor Tempo" 
          valor={`${dados.menor_tempo_segundos}s`}
          cor="#16a34a"
        />
      </div>

      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)",
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden"
      }}>
        <GraficoBarras 
          labels={nomesPostos.map(l => truncarTexto(l, 12))}
          valores={temposPostos}
          titulo="Tempos de Ciclo por Posto (segundos)"
          cor={coresNexus.primary}
          formato="numero"
        />
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 3vw, 30px)" 
      }}>
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden"
        }}>
          <GraficoPizza 
            labels={['Abaixo', 'Na média', 'Acima']}
            valores={[
              dados.postos.filter(p => parseFloat(p.ciclo_real) < parseFloat(dados.tempo_medio_segundos) * 0.95).length,
              dados.postos.filter(p => {
                const tempo = parseFloat(p.ciclo_real);
                const media = parseFloat(dados.tempo_medio_segundos);
                return tempo >= media * 0.95 && tempo <= media * 1.05;
              }).length,
              dados.postos.filter(p => parseFloat(p.ciclo_real) > parseFloat(dados.tempo_medio_segundos) * 1.05).length
            ]}
            titulo="Distribuição dos Postos"
            cores={[coresNexus.success, coresNexus.primary, coresNexus.warning]}
          />
        </div>

        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}>
          <h3 style={{ 
            color: "#1E3A8A", 
            marginBottom: "clamp(10px, 1.5vw, 15px)", 
            fontSize: "clamp(16px, 2.5vw, 18px)" 
          }}>
            Gargalo em Destaque
          </h3>
          <div style={{ textAlign: "center" }}>
            <div style={{ 
              fontSize: "clamp(28px, 5vw, 48px)", 
              fontWeight: "bold", 
              color: "#dc2626",
              marginBottom: "5px"
            }}>
              {truncarTexto(dados.postos.find(p => parseFloat(p.ciclo_real) === parseFloat(dados.maior_tempo_segundos))?.posto, 15)}
            </div>
            <div style={{ fontSize: "clamp(18px, 3vw, 24px)", color: "#666" }}>
              {dados.maior_tempo_segundos}s
            </div>
            <div style={{ 
              marginTop: "clamp(15px, 2vw, 20px)",
              padding: "clamp(8px, 1.5vw, 10px)",
              backgroundColor: "#fee2e2",
              borderRadius: "4px",
              color: "#dc2626"
            }}>
              ⚠️ {((parseFloat(dados.maior_tempo_segundos) / parseFloat(dados.tempo_medio_segundos) - 1) * 100).toFixed(1)}% acima da média
            </div>
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto", width: "100%" }}>
        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse", 
          backgroundColor: "white",
          minWidth: "500px",
          tableLayout: "fixed"
        }}>
          <colgroup>
            <col style={{ width: "30%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "30%" }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
              <th style={thResponsivo}>Posto</th>
              <th style={thResponsivo}>Tempo (s)</th>
              <th style={thResponsivo}>Desvio</th>
              <th style={thResponsivo}>Status</th>
            </tr>
          </thead>
          <tbody>
            {dados.postos.map((posto, index) => {
              const tempo = parseFloat(posto.ciclo_real);
              const media = parseFloat(dados.tempo_medio_segundos);
              const desvio = ((tempo - media) / media * 100).toFixed(1);
              const isGargalo = tempo === parseFloat(dados.maior_tempo_segundos);
              
              return (
                <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdResponsivo} title={posto.posto}>{truncarTexto(posto.posto, 15)}</td>
                  <td style={tdResponsivo}>{posto.ciclo_real}s</td>
                  <td style={{ 
                    ...tdResponsivo, 
                    color: desvio > 0 ? "#dc2626" : "#16a34a",
                    fontWeight: "bold"
                  }}>
                    {desvio > 0 ? `+${desvio}%` : `${desvio}%`}
                  </td>
                  <td style={tdResponsivo}>
                    {isGargalo ? (
                      <span style={badgeStyle}>🔴 Gargalo</span>
                    ) : tempo > media * 1.1 ? (
                      <span style={{ ...badgeStyle, backgroundColor: "#f59e0b" }}>🟡 Sobrecarregado</span>
                    ) : (
                      <span style={{ ...badgeStyle, backgroundColor: "#16a34a" }}>✅ Ok</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========================================
// ABA 6 - VARIABILIDADE (COM GRÁFICOS)
// ========================================
function Variabilidade({ linha, linhaId }) {
  const [postos, setPostos] = useState(linha.postos || []);
  const [dadosVariabilidade, setDadosVariabilidade] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [postoSelecionado, setPostoSelecionado] = useState("");
  const [dadosMedicoes, setDadosMedicoes] = useState([]);

  useEffect(() => {
    if (!linhaId) return;
    
    setCarregando(true);
    api.get(`/postos/${linhaId}`)
      .then((res) => setPostos(res.data))
      .catch((err) => {
        console.error("Erro ao carregar postos:", err);
        toast.error("Erro ao carregar postos");
      })
      .finally(() => setCarregando(false));
  }, [linhaId]);

  useEffect(() => {
    if (!postoSelecionado) return;
    
    setCarregando(true);
    Promise.all([
      api.get(`/variabilidade/${postoSelecionado}`),
      api.get(`/medicoes/${postoSelecionado}?tipo=ciclo`)
    ])
      .then(([variabilidade, medicoes]) => {
        setDadosVariabilidade({
          ...dadosVariabilidade,
          [postoSelecionado]: variabilidade.data
        });
        setDadosMedicoes(medicoes.data);
      })
      .catch((err) => {
        console.error("Erro ao carregar dados:", err);
        toast.error("Erro ao carregar dados de variabilidade");
      })
      .finally(() => setCarregando(false));
  }, [postoSelecionado]);

  const getClassificacaoCor = (classificacao) => {
    if (classificacao.includes("muito estável")) return "#16a34a";
    if (classificacao.includes("estável")) return "#16a34a";
    if (classificacao.includes("instável")) return "#f59e0b";
    return "#dc2626";
  };

  const valoresCiclo = dadosMedicoes.map(m => m.valor_numerico).filter(v => v > 0);
  const histograma = {};
  valoresCiclo.forEach(v => {
    const faixa = Math.floor(v / 2) * 2;
    histograma[faixa] = (histograma[faixa] || 0) + 1;
  });

  const labelsHistograma = Object.keys(histograma).map(k => `${k}-${parseInt(k) + 2}s`);
  const valoresHistograma = Object.values(histograma);

  if (postos.length === 0) {
    return (
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(20px, 5vw, 40px)", 
        borderRadius: "8px", 
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <p style={{ color: "#666" }}>Nenhum posto cadastrado para análise de variabilidade.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ 
        color: "#1E3A8A", 
        marginBottom: "clamp(15px, 2vw, 20px)", 
        fontSize: "clamp(18px, 3vw, 22px)" 
      }}>
        Análise de Variabilidade
      </h2>
      
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <label style={{ 
          display: "block", 
          marginBottom: "10px", 
          fontWeight: "500",
          fontSize: "clamp(13px, 1.8vw, 14px)"
        }}>
          Selecione um posto para análise detalhada:
        </label>
        <select
          value={postoSelecionado}
          onChange={(e) => setPostoSelecionado(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "clamp(6px, 1vw, 8px)",
            borderRadius: "4px",
            border: "1px solid #d1d5db",
            fontSize: "clamp(13px, 1.8vw, 14px)"
          }}
        >
          <option value="">Selecione...</option>
          {postos.map((posto) => (
            <option key={posto.id} value={posto.id}>{posto.nome}</option>
          ))}
        </select>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)",
        marginBottom: "clamp(20px, 3vw, 30px)"
      }}>
        {postos.map((posto) => {
          const dado = dadosVariabilidade[posto.id];
          
          return (
            <div key={posto.id} style={{ 
              backgroundColor: "white", 
              padding: "clamp(12px, 1.5vw, 15px)", 
              borderRadius: "8px", 
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              borderLeft: dado ? `4px solid ${getClassificacaoCor(dado.classificacao)}` : "4px solid #ccc",
              width: "100%",
              boxSizing: "border-box"
            }}>
              <h3 style={{ 
                color: "#1E3A8A", 
                marginBottom: "10px", 
                fontSize: "clamp(14px, 2vw, 16px)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }} title={posto.nome}>
                {truncarTexto(posto.nome, 20)}
              </h3>
              
              {dado ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <span style={{ color: "#666", fontSize: "clamp(11px, 1.3vw, 12px)" }}>Média:</span>
                      <p style={{ fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: "bold", margin: "2px 0" }}>
                        {dado.media_segundos}s
                      </p>
                    </div>
                    <div>
                      <span style={{ color: "#666", fontSize: "clamp(11px, 1.3vw, 12px)" }}>Desvio:</span>
                      <p style={{ fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: "bold", margin: "2px 0" }}>
                        {dado.desvio_padrao_segundos}s
                      </p>
                    </div>
                    <div>
                      <span style={{ color: "#666", fontSize: "clamp(11px, 1.3vw, 12px)" }}>CV:</span>
                      <p style={{ fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: "bold", margin: "2px 0" }}>
                        {dado.coeficiente_variacao_percentual}%
                      </p>
                    </div>
                    <div>
                      <span style={{ color: "#666", fontSize: "clamp(11px, 1.3vw, 12px)" }}>Medições:</span>
                      <p style={{ fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: "bold", margin: "2px 0" }}>
                        {dado.quantidade_medicoes}
                      </p>
                    </div>
                  </div>
                  <div style={{ 
                    marginTop: "8px", 
                    padding: "4px", 
                    backgroundColor: getClassificacaoCor(dado.classificacao) + "20",
                    borderRadius: "4px",
                    textAlign: "center"
                  }}>
                    <span style={{ color: getClassificacaoCor(dado.classificacao), fontWeight: "bold", fontSize: "clamp(11px, 1.3vw, 12px)" }}>
                      {dado.classificacao}
                    </span>
                  </div>
                </>
              ) : (
                <p style={{ color: "#666", fontSize: "clamp(12px, 1.5vw, 14px)" }}>
                  {postoSelecionado === String(posto.id) && carregando ? "Carregando..." : "Selecione para análise"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {postoSelecionado && dadosVariabilidade[postoSelecionado] && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))", 
          gap: "clamp(15px, 2vw, 20px)",
          marginBottom: "clamp(20px, 3vw, 30px)"
        }}>
          {valoresHistograma.length > 0 && (
            <div style={{ 
              backgroundColor: "white", 
              padding: "clamp(15px, 2vw, 20px)", 
              borderRadius: "8px", 
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              width: "100%",
              boxSizing: "border-box",
              overflow: "hidden"
            }}>
              <GraficoBarras 
                labels={labelsHistograma.slice(0, 8)}
                valores={valoresHistograma.slice(0, 8)}
                titulo="Distribuição dos Ciclos"
                cor={coresNexus.secondary}
                formato="numero"
              />
            </div>
          )}

          <div style={{ 
            backgroundColor: "white", 
            padding: "clamp(15px, 2vw, 20px)", 
            borderRadius: "8px", 
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            width: "100%",
            boxSizing: "border-box"
          }}>
            <h3 style={{ 
              color: "#1E3A8A", 
              marginBottom: "clamp(10px, 1.5vw, 15px)", 
              fontSize: "clamp(16px, 2.5vw, 18px)" 
            }}>
              Análise Estatística
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <span style={{ color: "#666", fontSize: "clamp(12px, 1.5vw, 13px)" }}>Capabilidade:</span>
                <div style={{ 
                  marginTop: "5px",
                  height: "20px",
                  backgroundColor: "#e5e7eb",
                  borderRadius: "10px",
                  overflow: "hidden"
                }}>
                  <div style={{ 
                    width: `${Math.min(100, (1 - dadosVariabilidade[postoSelecionado].coeficiente_variacao_percentual / 100) * 100)}%`,
                    height: "100%",
                    backgroundColor: dadosVariabilidade[postoSelecionado].coeficiente_variacao_percentual < 10 ? "#16a34a" :
                                   dadosVariabilidade[postoSelecionado].coeficiente_variacao_percentual < 20 ? "#f59e0b" : "#dc2626"
                  }} />
                </div>
              </div>
              <div>
                <span style={{ color: "#666", fontSize: "clamp(12px, 1.5vw, 13px)" }}>IC 95%:</span>
                <p style={{ fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: "bold" }}>
                  {dadosVariabilidade[postoSelecionado].media_segundos} ± {(dadosVariabilidade[postoSelecionado].desvio_padrao_segundos * 1.96).toFixed(2)}s
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// ABA 7 - SIMULAÇÃO (COM GRÁFICOS)
// ========================================
function Simulacao({ linha, linhaId }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!linhaId) return;
    
    setCarregando(true);
    api.get(`/simulacao-linha/${linhaId}`)
      .then((res) => {
        setDados(res.data);
        setErro("");
      })
      .catch((err) => {
        console.error("Erro ao carregar simulação:", err);
        setErro("Erro ao carregar dados de simulação");
        toast.error("Erro ao carregar dados de simulação");
      })
      .finally(() => setCarregando(false));
  }, [linhaId]);

  if (carregando) {
    return <div style={{ padding: "clamp(20px, 5vw, 40px)", textAlign: "center" }}>Carregando simulação...</div>;
  }

  if (erro) {
    return (
      <div style={{ 
        backgroundColor: "#fee2e2", 
        color: "#dc2626", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "4px",
        textAlign: "center"
      }}>
        {erro}
      </div>
    );
  }

  if (!dados || !dados.produtos || dados.produtos.length === 0) {
    return (
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(20px, 5vw, 40px)", 
        borderRadius: "8px", 
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <p style={{ color: "#666" }}>Dados de simulação não disponíveis.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ 
        color: "#1E3A8A", 
        marginBottom: "clamp(15px, 2vw, 20px)", 
        fontSize: "clamp(18px, 3vw, 22px)" 
      }}>
        Simulação de Melhorias e ROI
      </h2>
      
      {dados.produtos.map((prod, index) => {
        const oeeAtual = parseFloat(prod.oee_percentual);
        const deficitAtual = prod.deficit_pecas_dia;
        const capacidadeAtual = prod.capacidade_bruta_dia;
        const cicloGargalo = parseFloat(prod.tempo_ciclo_real_gargalo);
        
        const cenarios = [
          { nome: "Redução 10%", fator: 0.9 },
          { nome: "Redução 20%", fator: 0.8 },
          { nome: "Redução 30%", fator: 0.7 }
        ];

        const resultadosCenarios = cenarios.map(c => {
          const novoCiclo = cicloGargalo * c.fator;
          const novaCapacidade = Math.floor(capacidadeAtual * (cicloGargalo / novoCiclo));
          const novoOEE = oeeAtual * (cicloGargalo / novoCiclo);
          const ganho = novaCapacidade - capacidadeAtual;
          const ganhoFinanceiro = ganho * 50 * 22;
          
          return {
            ...c,
            novoCiclo,
            novaCapacidade,
            novoOEE,
            ganho,
            ganhoFinanceiro
          };
        });

        return (
          <div key={index} style={{ 
            backgroundColor: "white", 
            padding: "clamp(15px, 2vw, 20px)", 
            borderRadius: "8px", 
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            marginBottom: "20px",
            width: "100%",
            boxSizing: "border-box"
          }}>
            <h3 style={{ 
              color: "#1E3A8A", 
              marginBottom: "clamp(10px, 1.5vw, 15px)", 
              fontSize: "clamp(16px, 2.5vw, 18px)" 
            }}>
              {truncarTexto(prod.produto, 30)}
            </h3>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", 
              gap: "clamp(15px, 2vw, 20px)", 
              marginBottom: "20px" 
            }}>
              <div style={{ 
                backgroundColor: "#f9fafb", 
                padding: "clamp(12px, 1.5vw, 15px)", 
                borderRadius: "8px"
              }}>
                <GraficoBarras 
                  labels={['Atual', 'Potencial']}
                  valores={[oeeAtual, oeeAtual * 1.2]}
                  titulo="OEE Atual vs Potencial"
                  cor={[coresNexus.primary, coresNexus.success]}
                  formato="percentual"
                />
              </div>

              <div style={{ 
                backgroundColor: "#f9fafb", 
                padding: "clamp(12px, 1.5vw, 15px)", 
                borderRadius: "8px"
              }}>
                <GraficoBarras 
                  labels={['Atual', 'Potencial']}
                  valores={[prod.producao_boa_dia, prod.capacidade_bruta_dia]}
                  titulo="Produção (peças/dia)"
                  cor={[coresNexus.warning, coresNexus.success]}
                  formato="numero"
                />
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ 
                color: "#666", 
                marginBottom: "10px", 
                fontSize: "clamp(14px, 2vw, 16px)" 
              }}>
                OEE Atual
              </h4>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 100px), 1fr))", 
                gap: "10px" 
              }}>
                <div>
                  <span style={{ color: "#666", fontSize: "clamp(11px, 1.3vw, 12px)" }}>Disponibilidade:</span>
                  <p style={{ fontSize: "clamp(16px, 2vw, 18px)", fontWeight: "bold", margin: "2px 0" }}>
                    {prod.disponibilidade_percentual}%
                  </p>
                </div>
                <div>
                  <span style={{ color: "#666", fontSize: "clamp(11px, 1.3vw, 12px)" }}>Performance:</span>
                  <p style={{ fontSize: "clamp(16px, 2vw, 18px)", fontWeight: "bold", margin: "2px 0" }}>
                    {prod.performance_percentual}%
                  </p>
                </div>
                <div>
                  <span style={{ color: "#666", fontSize: "clamp(11px, 1.3vw, 12px)" }}>Qualidade:</span>
                  <p style={{ fontSize: "clamp(16px, 2vw, 18px)", fontWeight: "bold", margin: "2px 0" }}>
                    {prod.qualidade_percentual}%
                  </p>
                </div>
              </div>
              <div style={{ 
                marginTop: "10px", 
                padding: "clamp(8px, 1.5vw, 10px)", 
                backgroundColor: "#1E3A8A20", 
                borderRadius: "4px",
                textAlign: "center"
              }}>
                <span style={{ color: "#1E3A8A", fontWeight: "bold", fontSize: "clamp(16px, 2.5vw, 20px)" }}>
                  OEE: {prod.oee_percentual}%
                </span>
              </div>
            </div>

            <div style={{ marginTop: "20px" }}>
              <h4 style={{ 
                color: "#1E3A8A", 
                marginBottom: "clamp(10px, 1.5vw, 15px)", 
                fontSize: "clamp(14px, 2vw, 16px)" 
              }}>
                Simulação de Cenários
              </h4>
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", 
                gap: "clamp(10px, 1.5vw, 15px)",
                marginBottom: "20px"
              }}>
                {resultadosCenarios.map((cenario, i) => (
                  <div key={i} style={{ 
                    backgroundColor: i === 1 ? "#16a34a20" : "#f9fafb",
                    padding: "clamp(12px, 1.5vw, 15px)", 
                    borderRadius: "8px",
                    border: i === 1 ? `2px solid ${coresNexus.success}` : "none"
                  }}>
                    <h5 style={{ 
                      color: "#1E3A8A", 
                      marginBottom: "8px", 
                      fontSize: "clamp(13px, 1.8vw, 14px)" 
                    }}>
                      {cenario.nome}
                    </h5>
                    <p style={{ fontSize: "clamp(12px, 1.5vw, 13px)" }}>
                      <strong>Novo OEE:</strong> {cenario.novoOEE.toFixed(1)}%
                    </p>
                    <p style={{ fontSize: "clamp(12px, 1.5vw, 13px)" }}>
                      <strong>Ganho:</strong> <span style={{ color: "#16a34a", fontWeight: "bold" }}>+{cenario.ganho} pç/dia</span>
                    </p>
                    <p style={{ fontSize: "clamp(12px, 1.5vw, 13px)" }}>
                      <strong>ROI:</strong> <span style={{ color: "#16a34a", fontWeight: "bold" }}>R$ {Math.round(cenario.ganhoFinanceiro).toLocaleString('pt-BR')}</span>
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ 
                backgroundColor: "white", 
                padding: "clamp(15px, 2vw, 20px)", 
                borderRadius: "8px", 
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                width: "100%",
                boxSizing: "border-box",
                overflow: "hidden"
              }}>
                <GraficoLinha 
                  labels={['Mês 1', 'Mês 2', 'Mês 3', 'Mês 4', 'Mês 5', 'Mês 6']}
                  valores={[0, 15000, 32000, 51000, 72000, 95000]}
                  titulo="ROI Acumulado (R$) - Cenário Médio"
                  cor={coresNexus.success}
                  formato="moeda"
                />
              </div>
            </div>

            <div style={{ 
              marginTop: "20px", 
              padding: "clamp(12px, 1.5vw, 15px)", 
              backgroundColor: "#f9fafb", 
              borderRadius: "4px" 
            }}>
              <h4 style={{ 
                color: "#1E3A8A", 
                marginBottom: "10px", 
                fontSize: "clamp(14px, 2vw, 16px)" 
              }}>
                Resumo Financeiro
              </h4>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", 
                gap: "10px" 
              }}>
                <div>
                  <span style={{ color: "#666", fontSize: "clamp(11px, 1.3vw, 12px)" }}>Perda atual/mês:</span>
                  <p style={{ fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: "bold", color: "#dc2626" }}>
                    R$ {(deficitAtual * 50 * 22).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span style={{ color: "#666", fontSize: "clamp(11px, 1.3vw, 12px)" }}>Ganho potencial:</span>
                  <p style={{ fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: "bold", color: "#16a34a" }}>
                    R$ {(resultadosCenarios[1].ganho * 50 * 22).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span style={{ color: "#666", fontSize: "clamp(11px, 1.3vw, 12px)" }}>Investimento:</span>
                  <p style={{ fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: "bold" }}>R$ 50.000</p>
                </div>
                <div>
                  <span style={{ color: "#666", fontSize: "clamp(11px, 1.3vw, 12px)" }}>Payback:</span>
                  <p style={{ fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: "bold", color: "#16a34a" }}>
                    {Math.ceil(50000 / (resultadosCenarios[1].ganhoFinanceiro))} meses
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ========================================
// ABA 4 - AÇÕES (COM BACKEND)
// ========================================
function Acoes({ linha, linhaId }) {
  const [acoes, setAcoes] = useState([]);
  const [novaAcao, setNovaAcao] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!linhaId) return;
    carregarAcoes();
  }, [linhaId]);

  async function carregarAcoes() {
    setCarregando(true);
    try {
      const response = await api.get(`/acoes/${linhaId}`);
      setAcoes(response.data);
      setErro("");
    } catch (error) {
      console.error("Erro ao carregar ações:", error);
      setErro("Erro ao carregar ações");
      toast.error("Erro ao carregar ações");
    } finally {
      setCarregando(false);
    }
  }

  async function adicionarAcao() {
    if (!novaAcao.trim()) return;
    
    try {
      const response = await api.post("/acoes", {
        linha_id: parseInt(linhaId),
        texto: novaAcao,
        prioridade: "media"
      });
      
      setAcoes([response.data, ...acoes]);
      setNovaAcao("");
      setErro("");
      toast.success("Ação adicionada com sucesso! ✅");
    } catch (error) {
      console.error("Erro ao adicionar ação:", error);
      setErro("Erro ao salvar ação");
      toast.error("Erro ao salvar ação ❌");
    }
  }

  async function toggleConcluida(acao) {
    try {
      const response = await api.put(`/acoes/${acao.id}`, {
        concluida: !acao.concluida
      });
      
      setAcoes(acoes.map(a => 
        a.id === acao.id ? response.data : a
      ));
      
      toast.success(acao.concluida ? "Ação reaberta" : "Ação concluída! ✅");
    } catch (error) {
      console.error("Erro ao atualizar ação:", error);
      setErro("Erro ao atualizar ação");
      toast.error("Erro ao atualizar ação ❌");
    }
  }

  async function excluirAcao(id) {
    if (!window.confirm("Excluir esta ação?")) return;
    
    try {
      await api.delete(`/acoes/${id}`);
      setAcoes(acoes.filter(a => a.id !== id));
      setErro("");
      toast.success("Ação excluída com sucesso ✅");
    } catch (error) {
      console.error("Erro ao excluir ação:", error);
      setErro("Erro ao excluir ação");
      toast.error("Erro ao excluir ação ❌");
    }
  }

  const acoesFiltradas = acoes.filter(a => {
    if (filtro === "pendentes") return !a.concluida;
    if (filtro === "concluidas") return a.concluida;
    return true;
  });

  const formatarData = (dataString) => {
    if (!dataString) return "";
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <div>
      <h2 style={{ 
        color: "#1E3A8A", 
        marginBottom: "clamp(15px, 2vw, 20px)", 
        fontSize: "clamp(18px, 3vw, 22px)" 
      }}>
        Ações do Consultor
      </h2>
      
      {erro && (
        <div style={{ 
          backgroundColor: "#fee2e2", 
          color: "#dc2626", 
          padding: "clamp(8px, 1.5vw, 10px)", 
          borderRadius: "4px",
          marginBottom: "15px"
        }}>
          {erro}
        </div>
      )}
      
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "20px",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            value={novaAcao}
            onChange={(e) => setNovaAcao(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && adicionarAcao()}
            placeholder="Nova ação..."
            style={{ 
              flex: "1 1 200px",
              padding: "clamp(8px, 1.5vw, 10px)", 
              borderRadius: "4px", 
              border: "1px solid #d1d5db",
              fontSize: "clamp(13px, 1.8vw, 14px)"
            }}
            disabled={carregando}
          />
          <Botao
            variant="primary"
            size="md"
            onClick={adicionarAcao}
            disabled={carregando}
          >
            {carregando ? "..." : "Adicionar"}
          </Botao>
        </div>
      </div>

      {acoes.length > 0 && (
        <div style={{ 
          marginBottom: "15px", 
          display: "flex", 
          gap: "10px", 
          flexWrap: "wrap" 
        }}>
          {["todas", "pendentes", "concluidas"].map((opcao) => (
            <Botao
              key={opcao}
              variant={filtro === opcao ? "primary" : "outline"}
              size="sm"
              onClick={() => setFiltro(opcao)}
            >
              {opcao === "todas" ? "Todas" : 
               opcao === "pendentes" ? "Pendentes" : "Concluídas"}
            </Botao>
          ))}
        </div>
      )}

      {carregando && acoes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "clamp(20px, 4vw, 30px)", color: "#666" }}>
          Carregando ações...
        </div>
      ) : acoesFiltradas.length === 0 ? (
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(20px, 4vw, 30px)", 
          borderRadius: "8px", 
          textAlign: "center",
          color: "#666"
        }}>
          Nenhuma ação {filtro !== "todas" ? filtro : ""} encontrada.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {acoesFiltradas.map((acao) => (
            <div key={acao.id} style={{ 
              padding: "clamp(12px, 1.5vw, 15px)", 
              background: "white", 
              borderRadius: "8px", 
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              borderLeft: `4px solid ${acao.concluida ? "#16a34a" : "#f59e0b"}`,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              boxSizing: "border-box",
              flexWrap: "wrap"
            }}>
              <input 
                type="checkbox" 
                checked={acao.concluida}
                onChange={() => toggleConcluida(acao)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <div style={{ flex: "1 1 200px", minWidth: "150px" }}>
                <span style={{ 
                  textDecoration: acao.concluida ? "line-through" : "none",
                  color: acao.concluida ? "#9ca3af" : "#1f2937",
                  fontSize: "clamp(13px, 1.8vw, 14px)"
                }}>
                  {truncarTexto(acao.texto, 50)}
                </span>
                <div style={{ 
                  fontSize: "clamp(11px, 1.3vw, 12px)", 
                  color: "#666", 
                  marginTop: "4px",
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap"
                }}>
                  <span>📅 {formatarData(acao.data_criacao)}</span>
                  {acao.prioridade && (
                    <span>⚡ {acao.prioridade}</span>
                  )}
                </div>
              </div>
              <Botao
                variant="danger"
                size="sm"
                onClick={() => excluirAcao(acao.id)}
              >
                Excluir
              </Botao>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========================================
// ABA 8 - HISTÓRICO (COM GRÁFICOS)
// ========================================
function Historico({ linha, linhaId }) {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!linhaId) return;
    
    carregarHistorico();
  }, [linhaId]);

  async function carregarHistorico() {
    setCarregando(true);
    try {
      const response = await api.get(`/historico-linha/${linhaId}`);
      setDados(response.data);
      setErro("");
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      setErro("Erro ao carregar dados históricos");
      toast.error("Erro ao carregar dados históricos");
    } finally {
      setCarregando(false);
    }
  }

  const getOEECor = (oee) => {
    if (oee >= 80) return "#16a34a";
    if (oee >= 60) return "#f59e0b";
    return "#dc2626";
  };

  const formatarMes = (dataString) => {
    if (!dataString) return "";
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  };

  const calcularTendencia = () => {
    if (dados.length < 2) return { direcao: "estavel", valor: 0 };
    
    const primeiro = dados[dados.length - 1]?.oee || 0;
    const ultimo = dados[0]?.oee || 0;
    const variacao = ultimo - primeiro;
    
    return {
      direcao: variacao > 2 ? "subindo" : variacao < -2 ? "descendo" : "estavel",
      valor: Math.abs(variacao).toFixed(1)
    };
  };

  const tendencia = calcularTendencia();

  const meses = dados.map(d => {
    const data = new Date(d.mes);
    return data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  });
  const valoresOEE = dados.map(d => d.oee);
  const valoresDesvio = dados.map(d => parseFloat(d.desvio_padrao));

  if (carregando) {
    return <div style={{ padding: "clamp(20px, 5vw, 40px)", textAlign: "center" }}>Carregando histórico...</div>;
  }

  if (erro) {
    return (
      <div style={{ 
        backgroundColor: "#fee2e2", 
        color: "#dc2626", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "4px",
        textAlign: "center"
      }}>
        {erro}
      </div>
    );
  }

  if (dados.length === 0) {
    return (
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(20px, 5vw, 40px)", 
        borderRadius: "8px", 
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <p style={{ color: "#666", marginBottom: "clamp(15px, 3vw, 20px)" }}>
          Nenhum dado histórico disponível.
        </p>
        <Link to={`/coleta/${linhaId}`}>
          <Botao variant="success" size="md">
            Iniciar Coleta
          </Botao>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ 
        color: "#1E3A8A", 
        marginBottom: "clamp(15px, 2vw, 20px)", 
        fontSize: "clamp(18px, 3vw, 22px)" 
      }}>
        Histórico e Evolução
      </h2>
      
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)",
        display: "flex",
        alignItems: "center",
        gap: "clamp(15px, 2vw, 20px)",
        flexWrap: "wrap",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <div style={{ flex: "1 1 200px" }}>
          <span style={{ color: "#666", fontSize: "clamp(12px, 1.5vw, 14px)" }}>Tendência do OEE</span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "clamp(20px, 3vw, 24px)", fontWeight: "bold" }}>
              {tendencia.direcao === "subindo" && "📈"}
              {tendencia.direcao === "descendo" && "📉"}
              {tendencia.direcao === "estavel" && "📊"}
            </span>
            <span style={{ 
              fontSize: "clamp(16px, 2vw, 18px)",
              color: tendencia.direcao === "subindo" ? "#16a34a" :
                     tendencia.direcao === "descendo" ? "#dc2626" : "#f59e0b"
            }}>
              {tendencia.direcao === "subindo" && `+${tendencia.valor}%`}
              {tendencia.direcao === "descendo" && `-${tendencia.valor}%`}
              {tendencia.direcao === "estavel" && "Estável"}
            </span>
          </div>
        </div>
        
        <div style={{ flex: "2 1 300px" }}>
          <span style={{ color: "#666", fontSize: "clamp(12px, 1.5vw, 14px)" }}>Resumo</span>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 80px), 1fr))", 
            gap: "10px", 
            marginTop: "5px" 
          }}>
            <div>
              <span style={{ fontSize: "clamp(11px, 1.3vw, 12px)", color: "#666" }}>Melhor:</span>
              <p style={{ fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: "bold", color: "#16a34a", margin: 0 }}>
                {Math.max(...dados.map(d => d.oee))}%
              </p>
            </div>
            <div>
              <span style={{ fontSize: "clamp(11px, 1.3vw, 12px)", color: "#666" }}>Pior:</span>
              <p style={{ fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: "bold", color: "#dc2626", margin: 0 }}>
                {Math.min(...dados.map(d => d.oee))}%
              </p>
            </div>
            <div>
              <span style={{ fontSize: "clamp(11px, 1.3vw, 12px)", color: "#666" }}>Média:</span>
              <p style={{ fontSize: "clamp(14px, 1.8vw, 16px)", fontWeight: "bold", margin: 0 }}>
                {(dados.reduce((acc, d) => acc + d.oee, 0) / dados.length).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 3vw, 30px)" 
      }}>
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden"
        }}>
          <GraficoLinha 
            labels={meses.slice(-6)}
            valores={valoresOEE.slice(-6)}
            titulo="Evolução do OEE"
            cor={coresNexus.primary}
            formato="percentual"
          />
        </div>

        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden"
        }}>
          <GraficoLinha 
            labels={meses.slice(-6)}
            valores={valoresDesvio.slice(-6)}
            titulo="Variabilidade"
            cor={coresNexus.warning}
            formato="numero"
          />
        </div>
      </div>

      {dados.length >= 6 && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "clamp(20px, 3vw, 30px)",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden"
        }}>
          <GraficoBarras 
            labels={['Ano Anterior', 'Ano Atual']}
            valores={[
              dados.slice(-6, -3).reduce((acc, d) => acc + d.oee, 0) / 3,
              dados.slice(-3).reduce((acc, d) => acc + d.oee, 0) / 3
            ]}
            titulo="Comparativo Semestral"
            cor={[coresNexus.secondary, coresNexus.primary]}
            formato="percentual"
          />
        </div>
      )}

      <div style={{ overflowX: "auto", width: "100%" }}>
        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse", 
          backgroundColor: "white",
          minWidth: "600px",
          tableLayout: "fixed"
        }}>
          <colgroup>
            <col style={{ width: "25%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
              <th style={thResponsivo}>Período</th>
              <th style={thResponsivo}>OEE</th>
              <th style={thResponsivo}>Média</th>
              <th style={thResponsivo}>Desvio</th>
              <th style={thResponsivo}>Medições</th>
              <th style={thResponsivo}>Status</th>
            </tr>
          </thead>
          <tbody>
            {dados.slice(0, 5).map((item, index) => (
              <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={tdResponsivo}>{formatarMes(item.mes)}</td>
                <td style={tdResponsivo}>
                  <span style={{ 
                    color: getOEECor(item.oee),
                    fontWeight: "bold"
                  }}>
                    {item.oee}%
                  </span>
                </td>
                <td style={tdResponsivo}>{item.media_ciclo}s</td>
                <td style={tdResponsivo}>{item.desvio_padrao}s</td>
                <td style={tdResponsivo}>{item.medicoes}</td>
                <td style={tdResponsivo}>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "clamp(10px, 1.2vw, 12px)",
                    backgroundColor: getOEECor(item.oee) + "20",
                    color: getOEECor(item.oee)
                  }}>
                    {item.oee >= 80 ? "Excelente" :
                     item.oee >= 60 ? "Regular" : "Crítico"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dados.length >= 2 && (
        <div style={{ 
          marginTop: "clamp(20px, 3vw, 30px)", 
          padding: "clamp(15px, 2vw, 20px)", 
          backgroundColor: "#f9fafb", 
          borderRadius: "8px" 
        }}>
          <h3 style={{ 
            color: "#1E3A8A", 
            marginBottom: "clamp(10px, 1.5vw, 15px)", 
            fontSize: "clamp(16px, 2.5vw, 18px)" 
          }}>
            Comparativo
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "15px" }}>
            <div>
              <span style={{ color: "#666", fontSize: "clamp(12px, 1.5vw, 13px)" }}>
                {formatarMes(dados[dados.length - 1]?.mes)} vs {formatarMes(dados[0]?.mes)}
              </span>
              <p style={{ fontSize: "clamp(16px, 2vw, 18px)", fontWeight: "bold", marginTop: "5px" }}>
                {dados[0]?.oee > dados[dados.length - 1]?.oee ? (
                  <span style={{ color: "#16a34a" }}>
                    ↑ +{(dados[0]?.oee - dados[dados.length - 1]?.oee).toFixed(1)}%
                  </span>
                ) : (
                  <span style={{ color: "#dc2626" }}>
                    ↓ -{(dados[dados.length - 1]?.oee - dados[0]?.oee).toFixed(1)}%
                  </span>
                )}
              </p>
            </div>
            
            <div>
              <span style={{ color: "#666", fontSize: "clamp(12px, 1.5vw, 13px)" }}>Melhoria acumulada</span>
              <p style={{ fontSize: "clamp(16px, 2vw, 18px)", fontWeight: "bold", marginTop: "5px" }}>
                {dados[0]?.oee - dados[dados.length - 1]?.oee > 0 ? (
                  <span style={{ color: "#16a34a" }}>
                    +{(dados[0]?.oee - dados[dados.length - 1]?.oee).toFixed(1)}%
                  </span>
                ) : (
                  <span style={{ color: "#666" }}>
                    {(dados[0]?.oee - dados[dados.length - 1]?.oee).toFixed(1)}%
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// ABA 9 - FINANCEIRO
// ========================================
function Financeiro({ linha, linhaId }) {
  const [postos, setPostos] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [perdas, setPerdas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [empresaId, setEmpresaId] = useState(null);

  useEffect(() => {
    if (!linhaId) return;
    carregarDadosFinanceiros();
  }, [linhaId]);

  async function carregarDadosFinanceiros() {
    setCarregando(true);
    try {
      const postosRes = await api.get(`/postos/${linhaId}`);
      setPostos(postosRes.data);

      if (postosRes.data.length > 0) {
        const linhaRes = await api.get(`/linhas/${linhaId}`);
        if (linhaRes.data && linhaRes.data.length > 0) {
          const empresaId = linhaRes.data[0].empresa_id;
          setEmpresaId(empresaId);
          
          const cargosRes = await api.get(`/cargos/${empresaId}`);
          setCargos(cargosRes.data);
        }
      }

      const produtosRes = await api.get(`/linha-produto/${linhaId}`).catch(() => ({ data: [] }));
      setProdutos(produtosRes.data);

      const perdasRes = await api.get(`/perdas/${linhaId}`).catch(() => ({ data: [] }));
      setPerdas(perdasRes.data);

    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
      toast.error("Erro ao carregar dados financeiros");
    } finally {
      setCarregando(false);
    }
  }

  const getCargo = (cargoId) => {
    return cargos.find(c => c.id === cargoId);
  };

  const calcularCustoPosto = (posto) => {
    if (!posto.cargo_id) return 0;
    const cargo = getCargo(posto.cargo_id);
    if (!cargo) return 0;
    
    const salario = parseFloat(cargo.salario_base) || 0;
    const encargos = parseFloat(cargo.encargos_percentual) || 70;
    return salario * (1 + encargos / 100);
  };

  const calcularCustoTotalMaoObra = () => {
    return postos.reduce((acc, posto) => acc + calcularCustoPosto(posto), 0);
  };

  const calcularCustoPorMinuto = () => {
    const custoMensal = calcularCustoTotalMaoObra();
    const minutosMes = 22 * 8 * 60;
    return minutosMes > 0 ? custoMensal / minutosMes : 0;
  };

  const calcularPerdasFinanceiras = () => {
    const custoMinuto = calcularCustoPorMinuto();
    let perdasSetup = 0;
    let perdasMicro = 0;
    let perdasRefugo = 0;

    postos.forEach(posto => {
      if (posto.tempo_setup_minutos) {
        perdasSetup += parseFloat(posto.tempo_setup_minutos) * custoMinuto;
      }
    });

    produtos.forEach(prod => {
      const perda = perdas.find(p => p.linha_produto_id === prod.id);
      if (perda) {
        perdasMicro += (perda.microparadas_minutos || 0) * custoMinuto;
        
        const valorPeca = prod.valor_unitario || 50;
        perdasRefugo += (perda.refugo_pecas || 0) * valorPeca;
      }
    });

    return {
      setup: perdasSetup * 22,
      microparadas: perdasMicro * 22,
      refugo: perdasRefugo * 22,
      total: (perdasSetup + perdasMicro + perdasRefugo) * 22
    };
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const perdasFinanceiras = calcularPerdasFinanceiras();
  const custoTotalMaoObra = calcularCustoTotalMaoObra();
  const custoMinuto = calcularCustoPorMinuto();

  if (carregando) {
    return <div style={{ padding: "clamp(20px, 5vw, 40px)", textAlign: "center" }}>Carregando dados financeiros...</div>;
  }

  return (
    <div>
      <h2 style={{ 
        color: "#1E3A8A", 
        marginBottom: "clamp(15px, 2vw, 20px)", 
        fontSize: "clamp(18px, 3vw, 22px)" 
      }}>
        Análise Financeira
      </h2>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 3vw, 30px)" 
      }}>
        <Card 
          titulo="Custo Mão de Obra" 
          valor={formatarMoeda(custoTotalMaoObra)}
          cor="#1E3A8A"
        />
        <Card 
          titulo="Custo/minuto" 
          valor={formatarMoeda(custoMinuto)}
          cor="#0f172a"
        />
        <Card 
          titulo="Perdas Totais" 
          valor={formatarMoeda(perdasFinanceiras.total)}
          cor="#dc2626"
        />
        <Card 
          titulo="Oportunidade" 
          valor={formatarMoeda(perdasFinanceiras.total * 0.3)}
          cor="#16a34a"
        />
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 3vw, 30px)" 
      }}>
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <h3 style={{ color: "#1E3A8A", marginBottom: "15px", fontSize: "clamp(16px, 2.5vw, 18px)" }}>
            Perdas por Tipo
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "clamp(12px, 1.5vw, 13px)" }}>Setup</span>
                <span style={{ fontWeight: "bold", color: "#f59e0b" }}>{formatarMoeda(perdasFinanceiras.setup)}</span>
              </div>
              <div style={{ height: "6px", backgroundColor: "#e5e7eb", borderRadius: "4px" }}>
                <div style={{ 
                  width: `${(perdasFinanceiras.setup / perdasFinanceiras.total) * 100}%`, 
                  height: "100%", 
                  backgroundColor: "#f59e0b",
                  borderRadius: "4px"
                }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "clamp(12px, 1.5vw, 13px)" }}>Microparadas</span>
                <span style={{ fontWeight: "bold", color: "#f59e0b" }}>{formatarMoeda(perdasFinanceiras.microparadas)}</span>
              </div>
              <div style={{ height: "6px", backgroundColor: "#e5e7eb", borderRadius: "4px" }}>
                <div style={{ 
                  width: `${(perdasFinanceiras.microparadas / perdasFinanceiras.total) * 100}%`, 
                  height: "100%", 
                  backgroundColor: "#f59e0b",
                  borderRadius: "4px"
                }} />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "clamp(12px, 1.5vw, 13px)" }}>Refugo</span>
                <span style={{ fontWeight: "bold", color: "#dc2626" }}>{formatarMoeda(perdasFinanceiras.refugo)}</span>
              </div>
              <div style={{ height: "6px", backgroundColor: "#e5e7eb", borderRadius: "4px" }}>
                <div style={{ 
                  width: `${(perdasFinanceiras.refugo / perdasFinanceiras.total) * 100}%`, 
                  height: "100%", 
                  backgroundColor: "#dc2626",
                  borderRadius: "4px"
                }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <h3 style={{ color: "#1E3A8A", marginBottom: "15px", fontSize: "clamp(16px, 2.5vw, 18px)" }}>
            Simulação de ROI
          </h3>
          <div style={{ marginBottom: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ fontSize: "clamp(12px, 1.5vw, 13px)" }}>Investimento:</span>
              <span style={{ fontWeight: "bold" }}>R$ 50.000</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ fontSize: "clamp(12px, 1.5vw, 13px)" }}>Ganho mensal:</span>
              <span style={{ fontWeight: "bold", color: "#16a34a" }}>{formatarMoeda(perdasFinanceiras.total * 0.3)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ fontSize: "clamp(12px, 1.5vw, 13px)" }}>Payback:</span>
              <span style={{ fontWeight: "bold", color: "#16a34a" }}>
                {Math.ceil(50000 / (perdasFinanceiras.total * 0.3))} meses
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "clamp(12px, 1.5vw, 13px)" }}>ROI anual:</span>
              <span style={{ fontWeight: "bold", color: "#16a34a" }}>
                {((perdasFinanceiras.total * 0.3 * 12 / 50000) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <h3 style={{ 
        color: "#1E3A8A", 
        marginBottom: "clamp(10px, 1.5vw, 15px)", 
        fontSize: "clamp(16px, 2.5vw, 18px)" 
      }}>
        Custos por Posto
      </h3>
      <div style={{ overflowX: "auto", marginBottom: "clamp(20px, 3vw, 30px)", width: "100%" }}>
        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse", 
          backgroundColor: "white",
          minWidth: "700px",
          tableLayout: "fixed"
        }}>
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "15%" }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
              <th style={thResponsivo}>Posto</th>
              <th style={thResponsivo}>Cargo</th>
              <th style={thResponsivo}>Salário</th>
              <th style={thResponsivo}>Encargos</th>
              <th style={thResponsivo}>Custo Mensal</th>
              <th style={thResponsivo}>Setup</th>
              <th style={thResponsivo}>Custo Setup/dia</th>
            </tr>
          </thead>
          <tbody>
            {postos.map((posto) => {
              const cargo = getCargo(posto.cargo_id);
              const custoMensal = calcularCustoPosto(posto);
              const custoMinuto = custoMensal / (22 * 8 * 60);
              const custoSetupDia = (posto.tempo_setup_minutos || 0) * custoMinuto;
              
              return (
                <tr key={posto.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdResponsivo} title={posto.nome}>{truncarTexto(posto.nome, 15)}</td>
                  <td style={tdResponsivo} title={cargo?.nome || "-"}>{truncarTexto(cargo?.nome || "-", 12)}</td>
                  <td style={tdResponsivo}>{cargo ? formatarMoeda(cargo.salario_base) : "-"}</td>
                  <td style={tdResponsivo}>{cargo ? `${cargo.encargos_percentual}%` : "-"}</td>
                  <td style={tdResponsivo}>{formatarMoeda(custoMensal)}</td>
                  <td style={tdResponsivo}>{posto.tempo_setup_minutos || 0} min</td>
                  <td style={tdResponsivo}>{formatarMoeda(custoSetupDia)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {produtos.length > 0 && (
        <>
          <h3 style={{ 
            color: "#1E3A8A", 
            marginBottom: "clamp(10px, 1.5vw, 15px)", 
            fontSize: "clamp(16px, 2.5vw, 18px)" 
          }}>
            Perdas por Produto
          </h3>
          <div style={{ overflowX: "auto", marginBottom: "clamp(20px, 3vw, 30px)", width: "100%" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse", 
              backgroundColor: "white",
              minWidth: "800px",
              tableLayout: "fixed"
            }}>
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                  <th style={thResponsivo}>Produto</th>
                  <th style={thResponsivo}>Valor Unit.</th>
                  <th style={thResponsivo}>Micro (min)</th>
                  <th style={thResponsivo}>Custo Micro</th>
                  <th style={thResponsivo}>Refugo</th>
                  <th style={thResponsivo}>Custo Refugo</th>
                  <th style={thResponsivo}>Total/dia</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((prod) => {
                  const perda = perdas.find(p => p.linha_produto_id === prod.id);
                  const custoMinuto = calcularCustoPorMinuto();
                  const custoMicro = (perda?.microparadas_minutos || 0) * custoMinuto;
                  const custoRefugo = (perda?.refugo_pecas || 0) * (prod.valor_unitario || 50);
                  
                  return (
                    <tr key={prod.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={tdResponsivo} title={prod.produto_nome || prod.nome}>
                        {truncarTexto(prod.produto_nome || prod.nome, 15)}
                      </td>
                      <td style={tdResponsivo}>{formatarMoeda(prod.valor_unitario)}</td>
                      <td style={tdResponsivo}>{perda?.microparadas_minutos || 0} min</td>
                      <td style={tdResponsivo}>{formatarMoeda(custoMicro)}</td>
                      <td style={tdResponsivo}>{perda?.refugo_pecas || 0} pç</td>
                      <td style={tdResponsivo}>{formatarMoeda(custoRefugo)}</td>
                      <td style={tdResponsivo}>
                        <span style={{ fontWeight: "bold", color: "#dc2626" }}>
                          {formatarMoeda(custoMicro + custoRefugo)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div style={{ 
        marginTop: "clamp(20px, 3vw, 30px)", 
        padding: "clamp(15px, 2vw, 20px)", 
        backgroundColor: "#f9fafb", 
        borderRadius: "8px" 
      }}>
        <h3 style={{ 
          color: "#1E3A8A", 
          marginBottom: "clamp(10px, 1.5vw, 15px)", 
          fontSize: "clamp(16px, 2.5vw, 18px)" 
        }}>
          Resumo Financeiro
        </h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", 
          gap: "clamp(15px, 2vw, 20px)" 
        }}>
          <div>
            <span style={{ color: "#666", fontSize: "clamp(12px, 1.5vw, 13px)" }}>Custo Operacional</span>
            <p style={{ fontSize: "clamp(18px, 2.5vw, 20px)", fontWeight: "bold", color: "#1E3A8A", margin: "5px 0" }}>
              {formatarMoeda(custoTotalMaoObra)}
            </p>
          </div>
          <div>
            <span style={{ color: "#666", fontSize: "clamp(12px, 1.5vw, 13px)" }}>Perdas Mensais</span>
            <p style={{ fontSize: "clamp(18px, 2.5vw, 20px)", fontWeight: "bold", color: "#dc2626", margin: "5px 0" }}>
              {formatarMoeda(perdasFinanceiras.total)}
            </p>
          </div>
          <div>
            <span style={{ color: "#666", fontSize: "clamp(12px, 1.5vw, 13px)" }}>Potencial de Ganho</span>
            <p style={{ fontSize: "clamp(18px, 2.5vw, 20px)", fontWeight: "bold", color: "#16a34a", margin: "5px 0" }}>
              {formatarMoeda(perdasFinanceiras.total * 0.3)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// ABA 10 - EFICIÊNCIA GLOBAL
// ========================================
function EficienciaGlobal({ linha, linhaId }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!linhaId) return;
    
    carregarDados();
  }, [linhaId]);

  async function carregarDados() {
    setCarregando(true);
    try {
      const response = await api.get(`/eficiencia-global/${linhaId}`);
      setDados(response.data);
      setErro("");
    } catch (error) {
      console.error("Erro ao carregar eficiência global:", error);
      setErro("Erro ao carregar dados de eficiência global");
      toast.error("Erro ao carregar dados de eficiência global");
    } finally {
      setCarregando(false);
    }
  }

  if (carregando) {
    return <div style={{ padding: "clamp(20px, 5vw, 40px)", textAlign: "center" }}>Carregando eficiência global...</div>;
  }

  if (erro) {
    return (
      <div style={{ 
        backgroundColor: "#fee2e2", 
        color: "#dc2626", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "4px",
        textAlign: "center"
      }}>
        {erro}
      </div>
    );
  }

  if (!dados || dados.mensagem) {
    return (
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(20px, 5vw, 40px)", 
        borderRadius: "8px", 
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <p style={{ color: "#666" }}>{dados?.mensagem || "Dados não disponíveis"}</p>
      </div>
    );
  }

  const capacidadeRealPercent = (dados.capacidade_real / dados.meta_planejada) * 100;
  const ocupacaoPercent = parseFloat(dados.taxa_ocupacao_linha_percentual);

  return (
    <div>
      <h2 style={{ 
        color: "#1E3A8A", 
        marginBottom: "clamp(15px, 2vw, 20px)", 
        fontSize: "clamp(18px, 3vw, 22px)" 
      }}>
        Eficiência Global da Linha
      </h2>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 3vw, 30px)" 
      }}>
        <Card 
          titulo="Meta Planejada" 
          valor={`${dados.meta_planejada} pç/dia`}
          cor="#1E3A8A"
        />
        <Card 
          titulo="Capacidade Teórica" 
          valor={`${dados.capacidade_teorica_maxima} pç/dia`}
          cor="#0f172a"
        />
        <Card 
          titulo="Capacidade Real" 
          valor={`${dados.capacidade_real} pç/dia`}
          cor={capacidadeRealPercent >= 90 ? "#16a34a" : capacidadeRealPercent >= 70 ? "#f59e0b" : "#dc2626"}
        />
        <Card 
          titulo="Eficiência Global" 
          valor={`${dados.eficiencia_global_percentual}%`}
          cor={dados.eficiencia_global_percentual >= 80 ? "#16a34a" : dados.eficiencia_global_percentual >= 60 ? "#f59e0b" : "#dc2626"}
        />
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 3vw, 30px)" 
      }}>
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <h3 style={{ color: "#1E3A8A", marginBottom: "15px", fontSize: "clamp(16px, 2.5vw, 18px)" }}>
            Capacidade vs Meta
          </h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", height: "150px" }}>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ 
                height: `${(dados.capacidade_real / dados.meta_planejada) * 120}px`, 
                backgroundColor: "#1E3A8A",
                borderRadius: "4px 4px 0 0",
                maxHeight: "120px",
                minHeight: "20px"
              }} />
              <span style={{ fontSize: "clamp(11px, 1.3vw, 12px)", marginTop: "5px", display: "block" }}>
                Real: {dados.capacidade_real}
              </span>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ 
                height: "120px", 
                backgroundColor: "#6b7280",
                borderRadius: "4px 4px 0 0"
              }} />
              <span style={{ fontSize: "clamp(11px, 1.3vw, 12px)", marginTop: "5px", display: "block" }}>
                Meta: {dados.meta_planejada}
              </span>
            </div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          textAlign: "center",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <h3 style={{ color: "#1E3A8A", marginBottom: "15px", fontSize: "clamp(16px, 2.5vw, 18px)" }}>
            Taxa de Ocupação
          </h3>
          <div style={{ 
            width: "120px", 
            height: "120px", 
            borderRadius: "50%",
            background: `conic-gradient(${ocupacaoPercent >= 80 ? "#16a34a" : ocupacaoPercent >= 60 ? "#f59e0b" : "#dc2626"} ${ocupacaoPercent * 3.6}deg, #e5e7eb 0deg)`,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={{ 
              width: "90px", 
              height: "90px", 
              borderRadius: "50%", 
              backgroundColor: "white",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <span style={{ fontSize: "18px", fontWeight: "bold", color: "#1E3A8A" }}>
                {dados.taxa_ocupacao_linha_percentual}%
              </span>
            </div>
          </div>
          <p style={{ marginTop: "15px", color: "#666", fontSize: "clamp(12px, 1.5vw, 14px)" }}>
            {ocupacaoPercent >= 80 ? "✅ Excelente" : 
             ocupacaoPercent >= 60 ? "🟡 Regular" : "🔴 Crítico"}
          </p>
        </div>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)",
        marginTop: "clamp(15px, 2vw, 20px)"
      }}>
        <DetalheCard 
          titulo="Perda de Capacidade"
          valor={`${dados.meta_planejada - dados.capacidade_real} pç/dia`}
          descricao="Diferença entre meta e real"
          cor="#dc2626"
        />
        <DetalheCard 
          titulo="Oportunidade Mensal"
          valor={`+${(dados.meta_planejada - dados.capacidade_real) * 22} pç`}
          descricao="Produção adicional possível"
          cor="#16a34a"
        />
        <DetalheCard 
          titulo="Índice de Utilização"
          valor={`${((dados.capacidade_real / dados.capacidade_teorica_maxima) * 100).toFixed(1)}%`}
          descricao="vs capacidade teórica"
          cor="#1E3A8A"
        />
      </div>
    </div>
  );
}

// Componente de card de detalhamento responsivo
function DetalheCard({ titulo, valor, descricao, cor }) {
  return (
    <div style={{ 
      backgroundColor: "white", 
      padding: "clamp(12px, 1.5vw, 15px)", 
      borderRadius: "8px", 
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      borderLeft: `4px solid ${cor}`,
      width: "100%",
      boxSizing: "border-box",
      minWidth: 0
    }}>
      <h4 style={{ 
        color: "#666", 
        marginBottom: "5px", 
        fontSize: "clamp(12px, 1.5vw, 14px)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }} title={titulo}>
        {titulo}
      </h4>
      <p style={{ 
        fontSize: "clamp(16px, 2.5vw, 20px)", 
        fontWeight: "bold", 
        color: cor, 
        margin: "5px 0",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }} title={valor}>
        {valor}
      </p>
      <p style={{ 
        color: "#999", 
        fontSize: "clamp(10px, 1.3vw, 12px)", 
        margin: 0,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }} title={descricao}>
        {descricao}
      </p>
    </div>
  );
}

// ========================================
// ABA 11 - PRODUTOS DA LINHA
// ========================================
function ProdutosLinha({ linha, linhaId }) {
  const [produtos, setProdutos] = useState([]);
  const [perdas, setPerdas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!linhaId) return;
    carregarDados();
  }, [linhaId]);

  async function carregarDados() {
    setCarregando(true);
    try {
      const produtosRes = await api.get(`/linha-produto/${linhaId}`);
      setProdutos(produtosRes.data);

      const perdasRes = await api.get(`/perdas/${linhaId}`).catch(() => ({ data: [] }));
      setPerdas(perdasRes.data);

      setErro("");
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setErro("Erro ao carregar dados de produtos");
      toast.error("Erro ao carregar dados de produtos");
    } finally {
      setCarregando(false);
    }
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const calcularPerdasProduto = (produtoId) => {
    const perdasProduto = perdas.filter(p => p.linha_produto_id === produtoId);
    return perdasProduto.reduce((acc, p) => ({
      micro: acc.micro + (p.microparadas_minutos || 0),
      retrabalho: acc.retrabalho + (p.retrabalho_pecas || 0),
      refugo: acc.refugo + (p.refugo_pecas || 0)
    }), { micro: 0, retrabalho: 0, refugo: 0 });
  };

  if (carregando) {
    return <div style={{ padding: "clamp(20px, 5vw, 40px)", textAlign: "center" }}>Carregando produtos...</div>;
  }

  if (erro) {
    return (
      <div style={{ 
        backgroundColor: "#fee2e2", 
        color: "#dc2626", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "4px",
        textAlign: "center"
      }}>
        {erro}
      </div>
    );
  }

  if (produtos.length === 0) {
    return (
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(20px, 5vw, 40px)", 
        borderRadius: "8px", 
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <p style={{ color: "#666", marginBottom: "clamp(15px, 3vw, 20px)" }}>
          Nenhum produto vinculado a esta linha.
        </p>
        <Link to={`/produtos`}>
          <Botao variant="primary" size="md">
            Gerenciar Produtos
          </Botao>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ 
        color: "#1E3A8A", 
        marginBottom: "clamp(15px, 2vw, 20px)", 
        fontSize: "clamp(18px, 3vw, 22px)" 
      }}>
        Produtos da Linha
      </h2>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 3vw, 30px)" 
      }}>
        <Card 
          titulo="Total de Produtos" 
          valor={produtos.length}
          cor="#1E3A8A"
        />
        <Card 
          titulo="Valor Médio" 
          valor={formatarMoeda(produtos.reduce((acc, p) => acc + (p.valor_unitario || 0), 0) / produtos.length)}
          cor="#16a34a"
        />
        <Card 
          titulo="Maior Takt" 
          valor={`${Math.max(...produtos.map(p => p.takt_time_segundos || 0))}s`}
          cor="#f59e0b"
        />
        <Card 
          titulo="Maior Meta" 
          valor={`${Math.max(...produtos.map(p => p.meta_diaria || 0))} pç`}
          cor="#dc2626"
        />
      </div>

      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)",
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden"
      }}>
        <GraficoBarras 
          labels={produtos.map(p => truncarTexto(p.produto_nome || p.nome, 12))}
          valores={produtos.map(p => p.meta_diaria || 0)}
          titulo="Meta Diária por Produto"
          cor={coresNexus.primary}
          formato="numero"
        />
      </div>

      <div style={{ overflowX: "auto", marginBottom: "clamp(20px, 3vw, 30px)", width: "100%" }}>
        <table style={{ 
          width: "100%", 
          borderCollapse: "collapse", 
          backgroundColor: "white",
          minWidth: "700px",
          tableLayout: "fixed"
        }}>
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "15%" }} />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
              <th style={thResponsivo}>Produto</th>
              <th style={thResponsivo}>Takt</th>
              <th style={thResponsivo}>Meta</th>
              <th style={thResponsivo}>Valor Unit.</th>
              <th style={thResponsivo}>Faturamento</th>
              <th style={thResponsivo}>Perdas</th>
              <th style={thResponsivo}>Refugo</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((prod) => {
              const perdasProd = calcularPerdasProduto(prod.id);
              const faturamento = (prod.meta_diaria || 0) * (prod.valor_unitario || 0);
              
              return (
                <tr key={prod.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdResponsivo} title={prod.produto_nome || prod.nome}>
                    {truncarTexto(prod.produto_nome || prod.nome, 15)}
                  </td>
                  <td style={tdResponsivo}>{prod.takt_time_segundos || 0}s</td>
                  <td style={tdResponsivo}>{prod.meta_diaria || 0}</td>
                  <td style={tdResponsivo}>{formatarMoeda(prod.valor_unitario)}</td>
                  <td style={tdResponsivo}>
                    <span style={{ fontWeight: "bold", color: "#16a34a" }}>
                      {formatarMoeda(faturamento)}
                    </span>
                  </td>
                  <td style={tdResponsivo}>{perdasProd.micro} min</td>
                  <td style={tdResponsivo}>{perdasProd.refugo} pç</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {perdas.length > 0 && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ 
            color: "#1E3A8A", 
            marginBottom: "clamp(10px, 1.5vw, 15px)", 
            fontSize: "clamp(16px, 2.5vw, 18px)" 
          }}>
            Histórico de Perdas
          </h3>
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              minWidth: "500px",
              tableLayout: "fixed"
            }}>
              <colgroup>
                <col style={{ width: "25%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                  <th style={thResponsivo}>Data</th>
                  <th style={thResponsivo}>Produto</th>
                  <th style={thResponsivo}>Microparadas</th>
                  <th style={thResponsivo}>Retrabalho</th>
                  <th style={thResponsivo}>Refugo</th>
                </tr>
              </thead>
              <tbody>
                {perdas.slice(0, 5).map((perda, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={tdResponsivo}>{new Date(perda.data_medicao).toLocaleDateString('pt-BR')}</td>
                    <td style={tdResponsivo} title={perda.produto_nome}>{truncarTexto(perda.produto_nome, 15)}</td>
                    <td style={tdResponsivo}>{perda.microparadas_minutos || 0} min</td>
                    <td style={tdResponsivo}>{perda.retrabalho_pecas || 0} pç</td>
                    <td style={tdResponsivo}>{perda.refugo_pecas || 0} pç</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// ABA 12 - COLABORADORES DA LINHA
// ========================================
function ColaboradoresLinha({ linha, linhaId }) {
  const [colaboradores, setColaboradores] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [postos, setPostos] = useState([]);
  const [alocacoes, setAlocacoes] = useState([]);
  const [empresaId, setEmpresaId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [postoSelecionado, setPostoSelecionado] = useState(null);

  useEffect(() => {
    if (!linhaId) return;
    carregarDados();
  }, [linhaId]);

  async function carregarDados() {
    setCarregando(true);
    try {
      const linhaRes = await api.get(`/linhas/${linhaId}`);
      if (linhaRes.data && linhaRes.data.length > 0) {
        const empresaId = linhaRes.data[0].empresa_id;
        setEmpresaId(empresaId);

        const colaboradoresRes = await api.get(`/colaboradores/${empresaId}`);
        setColaboradores(colaboradoresRes.data);

        const cargosRes = await api.get(`/cargos/${empresaId}`);
        setCargos(cargosRes.data);

        const postosRes = await api.get(`/postos/${linhaId}`);
        setPostos(postosRes.data);

        const alocacoesPromises = postosRes.data.map(posto => 
          api.get(`/alocacoes/posto/${posto.id}?ativo=true`).catch(() => ({ data: [] }))
        );
        const alocacoesResults = await Promise.all(alocacoesPromises);
        const todasAlocacoes = alocacoesResults.flatMap(res => res.data);
        setAlocacoes(todasAlocacoes);
      }

      setErro("");
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setErro("Erro ao carregar dados de colaboradores");
      toast.error("Erro ao carregar dados de colaboradores");
    } finally {
      setCarregando(false);
    }
  }

  const getCargo = (cargoId) => {
    return cargos.find(c => c.id === cargoId);
  };

  const getPosto = (postoId) => {
    return postos.find(p => p.id === postoId);
  };

  const calcularCustoColaborador = (cargoId) => {
    const cargo = getCargo(cargoId);
    if (!cargo) return 0;
    
    const salario = parseFloat(cargo.salario_base) || 0;
    const encargos = parseFloat(cargo.encargos_percentual) || 70;
    return salario * (1 + encargos / 100);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const getColaboradoresAlocados = (postoId, turno) => {
    return alocacoes
      .filter(a => a.posto_id === postoId && a.turno === turno)
      .map(a => colaboradores.find(c => c.id === a.colaborador_id))
      .filter(c => c);
  };

  const desalocar = async (alocacaoId) => {
    if (!window.confirm("Remover esta alocação?")) return;
    
    try {
      await api.put(`/alocacoes/${alocacaoId}`, { ativo: false });
      carregarDados();
      toast.success("Colaborador desalocado com sucesso!");
    } catch (error) {
      console.error("Erro ao desalocar:", error);
      toast.error("Erro ao desalocar colaborador");
    }
  };

  if (carregando) {
    return <div style={{ padding: "clamp(20px, 5vw, 40px)", textAlign: "center" }}>Carregando colaboradores...</div>;
  }

  if (erro) {
    return (
      <div style={{ 
        backgroundColor: "#fee2e2", 
        color: "#dc2626", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "4px",
        textAlign: "center"
      }}>
        {erro}
      </div>
    );
  }

  const custoTotalMaoObra = colaboradores.reduce((acc, col) => 
    acc + calcularCustoColaborador(col.cargo_id), 0
  );

  return (
    <div>
      <h2 style={{ 
        color: "#1E3A8A", 
        marginBottom: "clamp(15px, 2vw, 20px)", 
        fontSize: "clamp(18px, 3vw, 22px)" 
      }}>
        Alocação de Colaboradores
      </h2>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 3vw, 30px)" 
      }}>
        <Card 
          titulo="Total Colaboradores" 
          valor={colaboradores.length}
          cor="#1E3A8A"
        />
        <Card 
          titulo="Alocações Ativas" 
          valor={alocacoes.length}
          cor="#16a34a"
        />
        <Card 
          titulo="Postos Alocados" 
          valor={new Set(alocacoes.map(a => a.posto_id)).size}
          cor="#f59e0b"
        />
        <Card 
          titulo="Custo Mensal" 
          valor={formatarMoeda(custoTotalMaoObra)}
          cor="#dc2626"
        />
      </div>

      {postos.map(posto => (
        <div key={posto.id} style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "20px",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "15px",
            flexWrap: "wrap",
            gap: "10px"
          }}>
            <h3 style={{ 
              color: "#1E3A8A", 
              fontSize: "clamp(16px, 2.5vw, 18px)",
              margin: 0
            }}>
              {truncarTexto(posto.nome, 20)}
            </h3>
            <Botao
              variant="success"
              size="sm"
              onClick={() => {
                setPostoSelecionado(posto);
                setModalAberto(true);
              }}
            >
              + Alocar
            </Botao>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", 
            gap: "clamp(10px, 1.5vw, 15px)" 
          }}>
            {[1, 2, 3].map(turno => {
              const alocados = getColaboradoresAlocados(posto.id, turno);
              
              return (
                <div key={turno} style={{
                  backgroundColor: "#f9fafb",
                  padding: "clamp(10px, 1.5vw, 15px)",
                  borderRadius: "6px"
                }}>
                  <h4 style={{ 
                    color: "#1E3A8A", 
                    marginBottom: "10px",
                    fontSize: "clamp(13px, 1.8vw, 14px)",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: "5px"
                  }}>
                    Turno {turno}
                  </h4>
                  
                  {alocados.length === 0 ? (
                    <p style={{ color: "#666", fontSize: "clamp(12px, 1.5vw, 13px)", fontStyle: "italic" }}>
                      Nenhum colaborador
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {alocados.map(col => {
                        const aloc = alocacoes.find(a => 
                          a.colaborador_id === col.id && 
                          a.posto_id === posto.id && 
                          a.turno === turno
                        );
                        
                        return (
                          <div key={col.id} style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "clamp(12px, 1.5vw, 13px)"
                          }}>
                            <span title={col.nome}>{truncarTexto(col.nome, 12)}</span>
                            {aloc && (
                              <Botao
                                variant="danger"
                                size="sm"
                                onClick={() => desalocar(aloc.id)}
                                style={{ padding: "2px 4px", fontSize: "10px" }}
                              >
                                ✕
                              </Botao>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <AlocacaoModal
        isOpen={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setPostoSelecionado(null);
        }}
        posto={postoSelecionado}
        colaboradores={colaboradores}
        onAlocacaoCriada={carregarDados}
      />
    </div>
  );
}

// Estilos responsivos da tabela
const thResponsivo = {
  padding: "clamp(8px, 1vw, 12px) clamp(4px, 0.8vw, 8px)",
  border: "1px solid #e5e7eb",
  textAlign: "center",
  fontSize: "clamp(11px, 1.5vw, 13px)",
  fontWeight: "500",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};

const tdResponsivo = {
  padding: "clamp(6px, 0.8vw, 10px) clamp(4px, 0.6vw, 8px)",
  border: "1px solid #e5e7eb",
  textAlign: "center",
  fontSize: "clamp(11px, 1.5vw, 13px)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};

const badgeStyle = {
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "clamp(10px, 1.2vw, 12px)",
  fontWeight: "500",
  backgroundColor: "#dc2626",
  color: "white",
  display: "inline-block"
};

// ========================================
// COMPONENTE PRINCIPAL
// ========================================
export default function FichaLinha() {
  const { id } = useParams();
  const { clienteAtual } = useOutletContext();
  const [linha, setLinha] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState("visao");
  const [carregando, setCarregando] = useState(true);
  const [nomeLinha, setNomeLinha] = useState("");

  useEffect(() => {
    setCarregando(true);
    
    Promise.all([
      api.get(`/analise-linha/${id}`).catch(() => ({ data: {} })),
      api.get(`/postos/${id}`).catch(() => ({ data: [] })),
      api.get(`/linhas/${clienteAtual}`).catch(() => ({ data: [] }))
    ])
      .then(([analise, postos, linhas]) => {
        const linhaAtual = Array.isArray(linhas.data) 
          ? linhas.data.find(l => l.id === parseInt(id))
          : null;
        
        setNomeLinha(linhaAtual?.nome || "Linha de Produção");
        
        setLinha({
          ...analise.data,
          postos: postos.data,
          id: id
        });
      })
      .catch((err) => {
        console.error("Erro ao carregar linha:", err);
        toast.error("Erro ao carregar dados da linha");
      })
      .finally(() => setCarregando(false));
  }, [id, clienteAtual]);

  const abas = [
    { id: "visao", nome: "Visão Geral", componente: VisaoGeral },
    { id: "mapa", nome: "Mapa da Linha", componente: Mapa },
    { id: "postos", nome: "Postos", componente: Postos },
    { id: "balanceamento", nome: "Balanceamento", componente: Balanceamento },
    { id: "variabilidade", nome: "Variabilidade", componente: Variabilidade },
    { id: "simulacao", nome: "Simulação", componente: Simulacao },
    { id: "acoes", nome: "Ações", componente: Acoes },
    { id: "historico", nome: "Histórico", componente: Historico },
    { id: "financeiro", nome: "Financeiro", componente: Financeiro },
    { id: "eficiencia", nome: "Eficiência", componente: EficienciaGlobal },
    { id: "produtos", nome: "Produtos", componente: ProdutosLinha },
    { id: "colaboradores", nome: "Colaboradores", componente: ColaboradoresLinha }
  ];

  if (carregando) {
    return (
      <div style={{ 
        padding: "clamp(20px, 5vw, 60px)", 
        textAlign: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <div style={{ color: "#1E3A8A", fontSize: "clamp(14px, 2vw, 18px)" }}>
          Carregando linha...
        </div>
      </div>
    );
  }

  if (!linha) {
    return (
      <div style={{ 
        padding: "clamp(20px, 5vw, 60px)", 
        textAlign: "center",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        margin: "clamp(10px, 3vw, 30px)"
      }}>
        <h2 style={{ color: "#dc2626", marginBottom: "clamp(10px, 2vw, 20px)" }}>Linha não encontrada</h2>
        <p style={{ color: "#666" }}>
          Verifique se a linha existe ou se você tem permissão para acessá-la.
        </p>
      </div>
    );
  }

  const ComponenteAtivo = abas.find(a => a.id === abaAtiva).componente;

  return (
    <div style={{ 
      padding: "clamp(15px, 3vw, 30px)", 
      width: "100%",
      maxWidth: "1600px",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      {/* Cabeçalho da linha */}
      <div style={{ 
        marginBottom: "clamp(20px, 3vw, 30px)",
        backgroundColor: "white",
        padding: "clamp(15px, 2vw, 20px)",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <div style={{ 
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
              fontSize: "clamp(20px, 4vw, 24px)" 
            }}>
              {truncarTexto(nomeLinha, 30)}
            </h1>
            <p style={{ color: "#666", fontSize: "clamp(12px, 1.8vw, 14px)" }}>
              Cliente: {clienteAtual} • ID: {id}
            </p>
          </div>
          <Link to={`/coleta/${id}`}>
            <Botao
              variant="success"
              size="md"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              📊 Iniciar Coleta
            </Botao>
          </Link>
        </div>
      </div>

      {/* Abas responsivas */}
      <div style={{ 
        display: "flex", 
        gap: "5px", 
        borderBottom: "2px solid #e5e7eb",
        marginBottom: "clamp(20px, 3vw, 25px)",
        overflowX: "auto",
        paddingBottom: "2px",
        WebkitOverflowScrolling: "touch"
      }}>
        {abas.map((aba) => (
          <Botao
            key={aba.id}
            variant={abaAtiva === aba.id ? "primary" : "outline"}
            size="sm"
            onClick={() => setAbaAtiva(aba.id)}
            style={{
              borderBottom: "none",
              borderRadius: "4px 4px 0 0",
              whiteSpace: "nowrap"
            }}
          >
            {aba.nome}
          </Botao>
        ))}
      </div>

      {/* Conteúdo da aba ativa */}
      <div style={{ minHeight: "400px", width: "100%" }}>
        <ComponenteAtivo linha={linha} linhaId={id} />
      </div>
    </div>
  );
}
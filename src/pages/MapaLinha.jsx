// src/pages/MapaLinha.jsx
import { useEffect, useState, useCallback } from "react";
import SideMenu from "./SideMenu";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Função auxiliar para truncar texto
const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function MapaLinha() {
  const [dadosMapa, setDadosMapa] = useState([]);
  const [filtroSetor, setFiltroSetor] = useState("Todos");
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [filtros, setFiltros] = useState({
    empresaId: null,
    periodo: "mes",
  });

  const handleFiltroChange = useCallback((novosFiltros) => {
    setFiltros(novosFiltros);
  }, []);

  useEffect(() => {
    api.get("/mapa-linha")
      .then((res) => {
        const dadosConvertidos = res.data.map((item) => {
          const horas = Number(item.horas_impactadas) || 0;
          const custoHora = 35;

          return {
            ...item,
            pontos_impacto: Number(item.pontos_impacto) || 0,
            horas_impactadas: horas,
            custo_total: horas * custoHora,
            custo_hora: custoHora,
            data: item.data ? new Date(item.data) : new Date(),
          };
        });

        setDadosMapa(dadosConvertidos);
      })
      .catch((err) => {
        console.error("Erro ao buscar dados:", err);
        toast.error("Erro ao carregar dados do mapa");
      });
  }, []);

  const dadosFiltrados = dadosMapa.filter((f) => {
    const filtroEmpresa = filtros.empresaId ? f.empresa_id === filtros.empresaId : true;

    const agora = new Date();
    let filtroPeriodo = true;

    if (f.data instanceof Date && !isNaN(f.data.getTime())) {
      if (filtros.periodo === "mes") {
        filtroPeriodo = f.data.getMonth() === agora.getMonth() &&
                        f.data.getFullYear() === agora.getFullYear();
      } else if (filtros.periodo === "ano") {
        filtroPeriodo = f.data.getFullYear() === agora.getFullYear();
      }
    }

    return filtroEmpresa && filtroPeriodo;
  });

  const setoresUnicos = ["Todos", ...new Set(dadosFiltrados.map((f) => f.setor))];

  const dadosFiltradosSetor =
    filtroSetor === "Todos"
      ? dadosFiltrados
      : dadosFiltrados.filter((f) => f.setor === filtroSetor);

  const custoTotalGeral = dadosFiltradosSetor.reduce(
    (acc, f) => acc + f.custo_total,
    0
  );

  const horasTotais = dadosFiltradosSetor.reduce(
    (acc, f) => acc + f.horas_impactadas,
    0
  );

  const ranking = [...dadosFiltradosSetor].sort(
    (a, b) => b.custo_total - a.custo_total
  );

  const gargalo = ranking.length > 0 ? ranking[0] : null;

  function corCirculo(pontos) {
    if (pontos >= 7) return "#dc2626";
    if (pontos >= 3) return "#facc15";
    return "#16a34a";
  }

  return (
    <div style={{ 
      display: "flex", 
      width: "100%", 
      fontFamily: "Arial",
      flexDirection: window.innerWidth < 768 ? "column" : "row"
    }}>
      <SideMenu onFiltroChange={handleFiltroChange} />

      <div style={{ 
        flex: 1, 
        padding: "clamp(15px, 2vw, 20px)",
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        boxSizing: "border-box"
      }}>
        <h2 style={{ 
          fontSize: "clamp(20px, 4vw, 24px)",
          marginBottom: "clamp(15px, 2vw, 20px)"
        }}>
          Mapa Executivo da Linha
        </h2>

        {/* KPIs responsivos */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", 
          gap: "clamp(15px, 2vw, 20px)", 
          marginBottom: "clamp(20px, 3vw, 25px)" 
        }}>
          <CardResponsivo titulo="Custo Total">
            R$ {custoTotalGeral.toFixed(2).replace(".", ",")}
          </CardResponsivo>

          <CardResponsivo titulo="Horas Impactadas">
            {horasTotais.toFixed(2)}
          </CardResponsivo>

          <CardResponsivo titulo="Maior Gargalo">
            {gargalo ? truncarTexto(gargalo.funcionario, 15) : "-"}
          </CardResponsivo>
        </div>

        {/* FILTRO POR SETOR responsivo */}
        <div style={{ 
          marginBottom: "clamp(15px, 2vw, 20px)", 
          display: "flex", 
          gap: "clamp(8px, 1.5vw, 10px)", 
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          {setoresUnicos.map((setor, i) => (
            <Botao
              key={i}
              variant={filtroSetor === setor ? "primary" : "outline"}
              size="sm"
              onClick={() => setFiltroSetor(setor)}
            >
              {truncarTexto(setor, 15)}
            </Botao>
          ))}
        </div>

        {/* HEATMAP responsivo */}
        <div style={{ 
          width: "100%", 
          overflowX: "auto",
          marginBottom: "clamp(20px, 3vw, 30px)",
          WebkitOverflowScrolling: "touch"
        }}>
          <svg
            width="1000"
            height="600"
            style={{
              border: "2px solid #0f172a",
              background: "#f1f5f9",
              minWidth: "1000px",
            }}
          >
            {dadosFiltradosSetor.map((f) => (
              <g key={f.id}>
                <circle
                  cx={f.x}
                  cy={f.y}
                  r={20 + f.pontos_impacto * 2}
                  fill={corCirculo(f.pontos_impacto)}
                  opacity="0.8"
                />
                <text
                  x={f.x}
                  y={f.y}
                  textAnchor="middle"
                  dy=".3em"
                  fontSize="11"
                  fill="white"
                  fontWeight="bold"
                >
                  {f.pontos_impacto}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* RESUMO EXECUTIVO responsivo */}
        {gargalo && (
          <div style={{ 
            marginBottom: "clamp(15px, 2vw, 20px)",
            padding: "clamp(10px, 1.5vw, 15px)",
            backgroundColor: "#fee2e2",
            borderRadius: "4px",
            fontSize: "clamp(13px, 1.8vw, 14px)"
          }}>
            🔴 <strong>Gargalo identificado:</strong> {gargalo.funcionario} — Impacto de R$ {gargalo.custo_total.toFixed(2).replace(".", ",")}
          </div>
        )}

        {/* RANKING responsivo */}
        <div style={{ 
          marginBottom: "clamp(20px, 3vw, 30px)",
          fontSize: "clamp(13px, 1.8vw, 14px)"
        }}>
          <h3 style={{ 
            fontSize: "clamp(16px, 2.5vw, 18px)",
            marginBottom: "clamp(10px, 1.5vw, 15px)"
          }}>
            Ranking de Impacto
          </h3>
          {ranking.map((f, i) => (
            <div key={i} style={{
              padding: "5px 0",
              borderBottom: i < ranking.length - 1 ? "1px dashed #e5e7eb" : "none"
            }}>
              <span style={{ fontWeight: "bold", marginRight: "8px" }}>{i + 1}º</span>
              <span>{truncarTexto(f.funcionario, 20)}</span>
              <span style={{ float: "right", color: "#dc2626", fontWeight: "500" }}>
                R$ {f.custo_total.toFixed(2).replace(".", ",")}
              </span>
            </div>
          ))}
        </div>

        {/* BOTÃO DETALHAMENTO */}
        <Botao
          variant="secondary"
          size="md"
          onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
          style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}
        >
          {mostrarDetalhes ? "Ocultar detalhamento técnico" : "Ver detalhamento técnico"}
        </Botao>

        {/* TABELA TÉCNICA responsiva */}
        {mostrarDetalhes && (
          <div style={{ 
            overflowX: "auto",
            width: "100%",
            WebkitOverflowScrolling: "touch"
          }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              minWidth: "600px",
              tableLayout: "fixed"
            }}>
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "25%" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: "#0f172a", color: "white" }}>
                  <th style={thResponsivo}>Funcionário</th>
                  <th style={thResponsivo}>Setor</th>
                  <th style={thResponsivo}>Pontos</th>
                  <th style={thResponsivo}>Horas</th>
                  <th style={thResponsivo}>Custo Hora</th>
                  <th style={thResponsivo}>Custo Total</th>
                </tr>
              </thead>
              <tbody>
                {dadosFiltradosSetor.map((f, i) => (
                  <tr key={i}>
                    <td style={tdResponsivo} title={f.funcionario}>{truncarTexto(f.funcionario, 15)}</td>
                    <td style={tdResponsivo} title={f.setor}>{truncarTexto(f.setor, 12)}</td>
                    <td style={tdResponsivo}>{f.pontos_impacto}</td>
                    <td style={tdResponsivo}>{f.horas_impactadas.toFixed(2)}</td>
                    <td style={tdResponsivo}>R$ {f.custo_hora}</td>
                    <td style={tdResponsivo}>R$ {f.custo_total.toFixed(2).replace(".", ",")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente Card responsivo
function CardResponsivo({ titulo, children }) {
  return (
    <div
      style={{
        background: "#0f172a",
        color: "white",
        padding: "clamp(15px, 2vw, 20px)",
        borderRadius: "10px",
        minWidth: "0",
        width: "100%",
        boxSizing: "border-box"
      }}
    >
      <div style={{ 
        fontSize: "clamp(12px, 1.8vw, 14px)", 
        opacity: 0.8,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }} title={titulo}>
        {titulo}
      </div>
      <div style={{ 
        fontSize: "clamp(18px, 3vw, 22px)", 
        fontWeight: "bold",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }} title={children}>
        {children}
      </div>
    </div>
  );
}

// Estilos responsivos da tabela
const thResponsivo = {
  padding: "clamp(8px, 1vw, 10px) clamp(4px, 0.8vw, 8px)",
  border: "1px solid #ccc",
  textAlign: "center",
  fontSize: "clamp(11px, 1.5vw, 13px)",
  fontWeight: "500",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};

const tdResponsivo = {
  padding: "clamp(6px, 0.8vw, 10px) clamp(4px, 0.6vw, 8px)",
  border: "1px solid #ccc",
  textAlign: "center",
  fontSize: "clamp(11px, 1.5vw, 13px)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};
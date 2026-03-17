// src/pages/Relatorio.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Função auxiliar para truncar texto
const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function Relatorio() {
  const { clienteAtual } = useOutletContext();
  
  const [empresas, setEmpresas] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [relatorio, setRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(false);
  
  const [filtros, setFiltros] = useState({
    empresaId: clienteAtual || "",
    linhaId: "",
    periodo: "mes",
    dataInicio: "",
    dataFim: ""
  });

  useEffect(() => {
    // ✅ CORRIGIDO: /empresas → /companies
    api.get("/companies")
      .then((res) => setEmpresas(res.data))
      .catch((err) => {
        console.error("Erro ao carregar empresas:", err);
        toast.error("Erro ao carregar empresas");
      });
  }, []);

  useEffect(() => {
    if (filtros.empresaId) {
      // ✅ CORRIGIDO: /linhas/${filtros.empresaId} → /lines/${filtros.empresaId}
      api.get(`/lines/${filtros.empresaId}`)
        .then((res) => setLinhas(res.data))
        .catch((err) => {
          console.error("Erro ao carregar linhas:", err);
          toast.error("Erro ao carregar linhas");
        });
    } else {
      setLinhas([]);
    }
  }, [filtros.empresaId]);

  const gerarRelatorio = async () => {
    if (!filtros.empresaId && !filtros.linhaId) {
      toast.error("Selecione pelo menos uma empresa ou linha");
      return;
    }

    setCarregando(true);
    setRelatorio(null);

    try {
      let dados = [];

      if (filtros.linhaId) {
        const [analise, postos] = await Promise.all([
          // ✅ CORRIGIDO: /analise-linha mantido (já corrigido)
          api.get(`/analise-linha/${filtros.linhaId}`).catch(() => ({ data: {} })),
          // ✅ CORRIGIDO: /postos/${filtros.linhaId} → /work-stations/${filtros.linhaId}
          api.get(`/work-stations/${filtros.linhaId}`).catch(() => ({ data: [] }))
        ]);

        dados = [{
          tipo: "linha",
          id: parseInt(filtros.linhaId),
          nome: linhas.find(l => l.id === parseInt(filtros.linhaId))?.nome || "Linha",
          analise: analise.data,
          postos: postos.data
        }];
      } else if (filtros.empresaId) {
        // ✅ CORRIGIDO: /linhas/${filtros.empresaId} → /lines/${filtros.empresaId}
        const linhasDaEmpresa = await api.get(`/lines/${filtros.empresaId}`);
        
        for (const linha of linhasDaEmpresa.data) {
          const [analise, postos] = await Promise.all([
            // ✅ CORRIGIDO: /analise-linha mantido
            api.get(`/analise-linha/${linha.id}`).catch(() => ({ data: {} })),
            // ✅ CORRIGIDO: /postos/${linha.id} → /work-stations/${linha.id}
            api.get(`/work-stations/${linha.id}`).catch(() => ({ data: [] }))
          ]);

          dados.push({
            tipo: "linha",
            id: linha.id,
            nome: linha.nome,
            analise: analise.data,
            postos: postos.data
          });
        }
      }

      setRelatorio({
        geradoEm: new Date().toLocaleString('pt-BR'),
        filtros,
        dados
      });

      toast.success("Relatório gerado com sucesso!");

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório ❌");
    } finally {
      setCarregando(false);
    }
  };

  const exportarPDF = () => {
    window.print();
    toast.success("PDF gerado com sucesso!");
  };

  const exportarExcel = () => {
    if (!relatorio) return;

    let csv = "Linha,Métrica,Valor\n";
    
    relatorio.dados.forEach(item => {
      csv += `${item.nome},Eficiência,${item.analise.eficiencia_percentual || 0}%\n`;
      csv += `${item.nome},Capacidade,${item.analise.capacidade_estimada_dia || 0}\n`;
      csv += `${item.nome},Gargalo,${item.analise.gargalo || "N/A"}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success("Arquivo Excel exportado com sucesso!");
  };

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
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 25px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)"
      }}>
        <h1 style={{ 
          color: "#1E3A8A", 
          marginBottom: "clamp(5px, 1vw, 10px)", 
          fontSize: "clamp(20px, 4vw, 28px)" 
        }}>
          Relatórios
        </h1>
        <p style={{ 
          color: "#666", 
          fontSize: "clamp(12px, 2vw, 14px)" 
        }}>
          Gere relatórios detalhados de desempenho das linhas de produção
        </p>
      </div>

      {/* Filtros responsivos */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 25px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <h2 style={{ 
          color: "#1E3A8A", 
          fontSize: "clamp(16px, 2.5vw, 18px)", 
          marginBottom: "clamp(15px, 2vw, 20px)" 
        }}>
          Filtros do Relatório
        </h2>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", 
          gap: "clamp(15px, 2vw, 20px)" 
        }}>
          <div>
            <label style={labelStyleResponsivo}>Empresa</label>
            <select
              value={filtros.empresaId}
              onChange={(e) => setFiltros({ ...filtros, empresaId: e.target.value, linhaId: "" })}
              style={inputStyleResponsivo}
            >
              <option value="">Todas as empresas</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>{truncarTexto(emp.nome, 25)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyleResponsivo}>Linha</label>
            <select
              value={filtros.linhaId}
              onChange={(e) => setFiltros({ ...filtros, linhaId: e.target.value })}
              style={inputStyleResponsivo}
              disabled={!filtros.empresaId}
            >
              <option value="">Todas as linhas</option>
              {linhas.map((linha) => (
                <option key={linha.id} value={linha.id}>{truncarTexto(linha.nome, 25)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyleResponsivo}>Período</label>
            <select
              value={filtros.periodo}
              onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
              style={inputStyleResponsivo}
            >
              <option value="mes">Último mês</option>
              <option value="ano">Último ano</option>
              <option value="todos">Todo período</option>
            </select>
          </div>
        </div>

        <div style={{ 
          display: "flex", 
          gap: "clamp(8px, 1.5vw, 10px)", 
          marginTop: "clamp(15px, 2vw, 25px)",
          flexWrap: "wrap"
        }}>
          <Botao
            variant="primary"
            size="md"
            onClick={gerarRelatorio}
            disabled={carregando}
            loading={carregando}
          >
            Gerar Relatório
          </Botao>
          
          {relatorio && (
            <>
              <Botao
                variant="success"
                size="md"
                onClick={exportarPDF}
              >
                Exportar PDF
              </Botao>
              <Botao
                variant="secondary"
                size="md"
                onClick={exportarExcel}
              >
                Exportar Excel
              </Botao>
            </>
          )}
        </div>
      </div>

      {/* Resultado do Relatório responsivo */}
      {relatorio && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 25px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          width: "100%",
          boxSizing: "border-box"
        }}>
          
          {/* Cabeçalho do relatório responsivo */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "clamp(15px, 2vw, 25px)",
            paddingBottom: "clamp(10px, 1.5vw, 15px)",
            borderBottom: "2px solid #e5e7eb",
            flexWrap: "wrap",
            gap: "15px"
          }}>
            <div>
              <h2 style={{ 
                color: "#1E3A8A", 
                fontSize: "clamp(18px, 2.5vw, 20px)", 
                marginBottom: "5px" 
              }}>
                Relatório de Desempenho
              </h2>
              <p style={{ 
                color: "#666", 
                fontSize: "clamp(12px, 1.8vw, 14px)" 
              }}>
                Gerado em: {relatorio.geradoEm}
              </p>
            </div>
            <div style={{ 
              backgroundColor: "#1E3A8A", 
              color: "white", 
              padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 2vw, 16px)", 
              borderRadius: "4px",
              fontSize: "clamp(12px, 1.8vw, 14px)",
              whiteSpace: "nowrap"
            }}>
              HÓRUS
            </div>
          </div>

          {/* Cards de resumo responsivos */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", 
            gap: "clamp(10px, 1.5vw, 15px)",
            marginBottom: "clamp(20px, 3vw, 30px)"
          }}>
            <ResumoCardResponsivo 
              titulo="Total de Linhas" 
              valor={relatorio.dados.length} 
            />
            <ResumoCardResponsivo 
              titulo="Eficiência Média" 
              valor={`${calcularMedia(relatorio.dados, 'eficiencia_percentual')}%`} 
            />
            <ResumoCardResponsivo 
              titulo="Capacidade Total" 
              valor={`${calcularSoma(relatorio.dados, 'capacidade_estimada_dia')} pç/dia`} 
            />
            <ResumoCardResponsivo 
              titulo="Postos Ativos" 
              valor={calcularTotalPostos(relatorio.dados)} 
            />
          </div>

          {/* Tabela de linhas responsiva */}
          <h3 style={{ 
            color: "#1E3A8A", 
            marginBottom: "clamp(10px, 1.5vw, 15px)", 
            fontSize: "clamp(16px, 2.5vw, 18px)" 
          }}>
            Detalhamento por Linha
          </h3>
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
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "20%" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  <th style={thResponsivo}>Linha</th>
                  <th style={thResponsivo}>Eficiência</th>
                  <th style={thResponsivo}>Gargalo</th>
                  <th style={thResponsivo}>Capacidade</th>
                  <th style={thResponsivo}>Postos</th>
                  <th style={thResponsivo}>Status</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.dados.map((item, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={tdResponsivo} title={item.nome}>{truncarTexto(item.nome, 15)}</td>
                    <td style={tdResponsivo}>
                      <span style={{ 
                        color: (item.analise.eficiencia_percentual || 0) >= 80 ? "#16a34a" : 
                               (item.analise.eficiencia_percentual || 0) >= 60 ? "#f59e0b" : "#dc2626",
                        fontWeight: "bold"
                      }}>
                        {item.analise.eficiencia_percentual || 0}%
                      </span>
                    </td>
                    <td style={tdResponsivo} title={item.analise.gargalo || "-"}>
                      {truncarTexto(item.analise.gargalo || "-", 10)}
                    </td>
                    <td style={tdResponsivo}>{item.analise.capacidade_estimada_dia || 0}</td>
                    <td style={tdResponsivo}>{item.postos?.length || 0}</td>
                    <td style={tdResponsivo}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "clamp(10px, 1.3vw, 12px)",
                        backgroundColor: (item.analise.eficiencia_percentual || 0) >= 80 ? "#16a34a20" :
                                       (item.analise.eficiencia_percentual || 0) >= 60 ? "#f59e0b20" : "#dc262620",
                        color: (item.analise.eficiencia_percentual || 0) >= 80 ? "#16a34a" :
                               (item.analise.eficiencia_percentual || 0) >= 60 ? "#f59e0b" : "#dc2626",
                        whiteSpace: "nowrap"
                      }}>
                        {(item.analise.eficiencia_percentual || 0) >= 80 ? "Estável" :
                         (item.analise.eficiencia_percentual || 0) >= 60 ? "Atenção" : "Crítico"}
                      </span>
                    </td>
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

// Componentes auxiliares responsivos
function ResumoCardResponsivo({ titulo, valor }) {
  return (
    <div style={{
      backgroundColor: "#f9fafb",
      padding: "clamp(10px, 1.5vw, 15px)",
      borderRadius: "6px",
      borderLeft: "4px solid #1E3A8A",
      width: "100%",
      boxSizing: "border-box",
      minWidth: 0
    }}>
      <div style={{ 
        color: "#666", 
        fontSize: "clamp(11px, 1.5vw, 13px)", 
        marginBottom: "5px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }} title={titulo}>
        {titulo}
      </div>
      <div style={{ 
        fontSize: "clamp(18px, 2.5vw, 22px)", 
        fontWeight: "bold", 
        color: "#1E3A8A",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }} title={valor}>
        {valor}
      </div>
    </div>
  );
}

// Funções auxiliares
function calcularMedia(dados, campo) {
  if (dados.length === 0) return 0;
  const soma = dados.reduce((acc, item) => acc + (parseFloat(item.analise[campo]) || 0), 0);
  return Math.round((soma / dados.length) * 100) / 100;
}

function calcularSoma(dados, campo) {
  return dados.reduce((acc, item) => acc + (parseInt(item.analise[campo]) || 0), 0);
}

function calcularTotalPostos(dados) {
  return dados.reduce((acc, item) => acc + (item.postos?.length || 0), 0);
}

// Estilos responsivos
const labelStyleResponsivo = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "clamp(12px, 1.8vw, 14px)",
  fontWeight: "500"
};

const inputStyleResponsivo = {
  width: "100%",
  padding: "clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 12px)",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  fontSize: "clamp(13px, 1.8vw, 14px)",
  outline: "none",
  boxSizing: "border-box"
};

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
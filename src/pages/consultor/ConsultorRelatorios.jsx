// src/pages/consultor/ConsultorRelatorios.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";

// Cores exclusivas do consultor
const coresConsultor = {
  primary: "#0f172a",
  secondary: "#334155",
  accent: "#7c3aed",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#dc2626",
  info: "#0891b2",
  background: "#f8fafc"
};

// 🔧 CORREÇÃO: CSS de impressão profissional
const printStyles = `
@media print {
  /* Remove toda a interface - filtros, botões, menus */
  .no-print {
    display: none !important;
  }

  /* Reset completo do body e main para eliminar bordas cinzas */
  body, #root, main, .relatorio-container {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    width: 100% !important;
  }

  /* Força o container do relatório a ter largura exata de A4 */
  .pdf-content {
    width: 210mm !important;
    margin: 0 auto !important;
    padding: 8mm !important;
    position: relative !important;
    background: white !important;
    box-shadow: none !important;
    border: none !important;
  }

  /* Cards de resumo - layout em linha para impressão */
  .cards-wrapper {
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: space-between !important;
    gap: 10px !important;
    margin-bottom: 20px !important;
  }
  
  .card-print {
    width: 32% !important;
    display: inline-block !important;
    margin-bottom: 10px !important;
    page-break-inside: avoid !important;
    border-left: 4px solid !important;
    background: #f9fafb !important;
    padding: 10px !important;
    box-sizing: border-box !important;
  }

  /* Gráficos - layout em linha para impressão */
  .charts-wrapper {
    display: flex !important;
    flex-wrap: wrap !important;
    justify-content: space-between !important;
    gap: 15px !important;
    margin-bottom: 20px !important;
  }
  
  .chart-print {
    width: 48% !important;
    display: inline-block !important;
    page-break-inside: avoid !important;
    background: #f9fafb !important;
    padding: 12px !important;
    box-sizing: border-box !important;
  }

  /* Tabela ocupa 100% da largura */
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    page-break-inside: avoid !important;
    font-size: 11px !important;
  }
  
  th, td {
    border: 1px solid #ccc !important;
    padding: 6px !important;
    text-align: center !important;
  }

  /* Redução de fontes para impressão */
  h2, h3, h4 {
    font-size: 14px !important;
    margin: 5px 0 !important;
  }
  
  p, span, div {
    font-size: 11px !important;
  }

  /* Garante cores de fundo no PDF sem precisar de opção extra */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Evita quebras de página indesejadas */
  .no-break {
    page-break-inside: avoid !important;
  }
}
`;

export default function ConsultorRelatorios() {
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState("mes");
  const [tipoRelatorio, setTipoRelatorio] = useState("geral");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [empresaSelecionada, setEmpresaSelecionada] = useState("todas");
  
  const [empresas, setEmpresas] = useState([]);
  const [dadosRelatorio, setDadosRelatorio] = useState(null);
  const [dadosGraficos, setDadosGraficos] = useState({});

  useEffect(() => {
    api.get("/companies")
      .then(res => setEmpresas(res.data))
      .catch(err => console.error("Erro ao carregar empresas:", err));
  }, []);

  useEffect(() => {
    gerarRelatorio();
  }, [periodo, tipoRelatorio, empresaSelecionada, dataInicio, dataFim]);

  async function gerarRelatorio() {
    setCarregando(true);
    
    try {
      const empresasRes = await api.get("/companies");
      const empresasData = empresasRes.data;
      
      const empresasFiltradas = empresaSelecionada === "todas" 
        ? empresasData 
        : empresasData.filter(e => e.id === parseInt(empresaSelecionada));

      let dados = [];
      let totais = {
        empresas: 0,
        linhas: 0,
        postos: 0,
        perdas: 0,
        faturamento: 0,
        oeeMedio: 0
      };

      for (const empresa of empresasFiltradas) {
        try {
          const linhasRes = await api.get(`/lines/${empresa.id}`);
          const linhas = linhasRes.data;

          let totalLinhas = linhas.length;
          let totalPostos = 0;
          let somaOEE = 0;
          let qtdOEE = 0;
          let totalPerdas = 0;
          let faturamentoEstimado = 0;

          for (const linha of linhas) {
            try {
              const postosRes = await api.get(`/work-stations/${linha.id}`);
              totalPostos += postosRes.data.length;

              const analiseRes = await api.get(`/analise-linha/${linha.id}`);
              if (analiseRes.data.eficiencia_percentual) {
                somaOEE += parseFloat(analiseRes.data.eficiencia_percentual);
                qtdOEE++;
              }

              const perdasRes = await api.get(`/losses/${linha.id}`).catch(() => ({ data: [] }));
              perdasRes.data.forEach(perda => {
                totalPerdas += (perda.microparadas_minutos || 0) * 0.5;
                totalPerdas += (perda.refugo_pecas || 0) * 50;
              });

              try {
                const produtosRes = await api.get(`/line-products/${linha.id}`).catch(() => ({ data: [] }));
                const produtosData = produtosRes.data.dados || produtosRes.data || [];
                
                let capacidade = 0;
                if (analiseRes.data.capacidade_estimada_dia) {
                  capacidade = parseFloat(analiseRes.data.capacidade_estimada_dia);
                }
                
                if (produtosData.length > 0 && capacidade > 0) {
                  const valorMedio = produtosData.reduce((acc, p) => acc + (parseFloat(p.valor_unitario) || 50), 0) / produtosData.length;
                  faturamentoEstimado += capacidade * valorMedio * 22;
                } else if (capacidade > 0) {
                  faturamentoEstimado += capacidade * 70 * 22;
                }
              } catch (err) {
                console.error(`Erro ao calcular faturamento da linha ${linha.id}:`, err);
              }

            } catch (err) {
              console.error(`Erro ao processar linha ${linha.id}:`, err);
            }
          }

          const oeeMedio = qtdOEE > 0 ? (somaOEE / qtdOEE).toFixed(1) : 0;
          const faturamentoValido = isNaN(faturamentoEstimado) ? 0 : Math.round(faturamentoEstimado);

          totais.empresas++;
          totais.linhas += totalLinhas;
          totais.postos += totalPostos;
          totais.perdas += totalPerdas;
          totais.faturamento += faturamentoValido;

          dados.push({
            id: empresa.id,
            nome: empresa.nome,
            totalLinhas,
            totalPostos,
            oeeMedio: parseFloat(oeeMedio),
            perdas: Math.round(totalPerdas),
            faturamento: faturamentoValido,
            produtividade: faturamentoValido > 0 ? Math.round(faturamentoValido / (totalPostos || 1)) : 0
          });

        } catch (err) {
          console.error(`Erro ao processar empresa ${empresa.id}:`, err);
        }
      }

      totais.oeeMedio = dados.length > 0 
        ? (dados.reduce((acc, e) => acc + e.oeeMedio, 0) / dados.length).toFixed(1)
        : 0;

      const faturamentoTotalValido = isNaN(totais.faturamento) ? 0 : totais.faturamento;

      const graficos = {
        perdasPorEmpresa: {
          labels: dados.slice(0, 10).map(d => d.nome),
          valores: dados.slice(0, 10).map(d => d.perdas)
        },
        statusDistribuicao: {
          critico: dados.filter(d => d.oeeMedio < 60).length,
          atencao: dados.filter(d => d.oeeMedio >= 60 && d.oeeMedio < 75).length,
          bom: dados.filter(d => d.oeeMedio >= 75).length
        },
        topFaturamento: {
          labels: dados.sort((a, b) => b.faturamento - a.faturamento).slice(0, 5).map(d => d.nome),
          valores: dados.sort((a, b) => b.faturamento - a.faturamento).slice(0, 5).map(d => d.faturamento)
        }
      };

      setDadosRelatorio({
        totais: {
          ...totais,
          faturamento: faturamentoTotalValido
        },
        dados,
        geradoEm: new Date().toLocaleString('pt-BR')
      });

      setDadosGraficos(graficos);

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
    } finally {
      setCarregando(false);
    }
  }

  const exportarCSV = () => {
    if (!dadosRelatorio) return;

    let csv = "Empresa,Linhas,Postos,OEE,Perdas (R$),Faturamento (R$),Produtividade (R$/posto)\n";
    
    dadosRelatorio.dados.forEach(emp => {
      csv += `${emp.nome},${emp.totalLinhas},${emp.totalPostos},${emp.oeeMedio}%,${emp.perdas},${emp.faturamento},${emp.produtividade}\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportarPDF = () => {
    window.print();
  };

  if (carregando && !dadosRelatorio) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "400px" 
      }}>
        <p>Gerando relatório...</p>
      </div>
    );
  }

  return (
    <div className="relatorio-container">
      {/* 🔧 CORREÇÃO: Injeção dos estilos de impressão */}
      <style>{printStyles}</style>

      {/* 🔧 Tudo que é interface recebe classe no-print */}
      <div className="no-print" style={{ marginBottom: "30px" }}>
        <h2 style={{ color: coresConsultor.primary, marginBottom: "5px" }}>
          📈 Relatórios Consolidados
        </h2>
        <p style={{ color: "#666" }}>
          Visualize e exporte dados de todos os seus clientes
        </p>
      </div>

      <div className="no-print" style={{
        backgroundColor: "white",
        padding: "25px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "30px"
      }}>
        <h3 style={{ color: coresConsultor.primary, marginBottom: "20px", fontSize: "16px" }}>
          🔍 Filtros do Relatório
        </h3>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
          marginBottom: "20px"
        }}>
          <div>
            <label style={labelStyle}>Tipo de Relatório</label>
            <select
              value={tipoRelatorio}
              onChange={(e) => setTipoRelatorio(e.target.value)}
              style={inputStyle}
            >
              <option value="geral">Visão Geral</option>
              <option value="empresas">Detalhado por Empresa</option>
              <option value="perdas">Análise de Perdas</option>
              <option value="evolucao">Evolução</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Empresa</label>
            <select
              value={empresaSelecionada}
              onChange={(e) => setEmpresaSelecionada(e.target.value)}
              style={inputStyle}
            >
              <option value="todas">Todas as empresas</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Período</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              style={inputStyle}
            >
              <option value="mes">Último mês</option>
              <option value="trimestre">Último trimestre</option>
              <option value="ano">Último ano</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>

          {periodo === "personalizado" && (
            <>
              <div>
                <label style={labelStyle}>Data Início</label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Data Fim</label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <button
            onClick={exportarCSV}
            style={botaoStyle}
          >
            📥 Exportar CSV
          </button>
          <button
            onClick={exportarPDF}
            style={{ ...botaoStyle, backgroundColor: coresConsultor.success }}
          >
            📄 Exportar PDF
          </button>
        </div>
      </div>

      {/* 🔧 CONTEÚDO DO RELATÓRIO PARA IMPRESSÃO */}
      {dadosRelatorio && (
        <div className="pdf-content">
          
          {/* Cabeçalho do relatório */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            paddingBottom: "10px",
            borderBottom: "2px solid #ccc"
          }}>
            <div>
              <h3 style={{ color: coresConsultor.primary, marginBottom: "5px", fontSize: "16px" }}>
                Relatório {tipoRelatorio === "geral" ? "Geral" :
                          tipoRelatorio === "empresas" ? "por Empresa" :
                          tipoRelatorio === "perdas" ? "de Perdas" : "de Evolução"}
              </h3>
              <p style={{ color: "#666", fontSize: "11px" }}>
                Gerado em: {dadosRelatorio.geradoEm}
              </p>
            </div>
            <div style={{
              backgroundColor: coresConsultor.primary,
              color: "white",
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "11px"
            }}>
              {dadosRelatorio.totais.empresas} empresas
            </div>
          </div>

          {/* 🔧 Cards - wrapper com flex para impressão */}
          <div className="cards-wrapper">
            <div className="card-print" style={{ borderLeftColor: coresConsultor.primary }}>
              <div style={{ fontSize: "11px", color: "#666" }}>Total de Empresas</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: coresConsultor.primary }}>{dadosRelatorio.totais.empresas}</div>
            </div>
            <div className="card-print" style={{ borderLeftColor: coresConsultor.secondary }}>
              <div style={{ fontSize: "11px", color: "#666" }}>Total de Linhas</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: coresConsultor.secondary }}>{dadosRelatorio.totais.linhas}</div>
            </div>
            <div className="card-print" style={{ borderLeftColor: coresConsultor.info }}>
              <div style={{ fontSize: "11px", color: "#666" }}>Total de Postos</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: coresConsultor.info }}>{dadosRelatorio.totais.postos}</div>
            </div>
            <div className="card-print" style={{ borderLeftColor: coresConsultor.danger }}>
              <div style={{ fontSize: "11px", color: "#666" }}>Perdas Totais</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: coresConsultor.danger }}>R$ {(dadosRelatorio.totais.perdas / 1000).toFixed(1)}K</div>
            </div>
            <div className="card-print" style={{ borderLeftColor: coresConsultor.success }}>
              <div style={{ fontSize: "11px", color: "#666" }}>Faturamento Total</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: coresConsultor.success }}>R$ {(dadosRelatorio.totais.faturamento / 1000).toFixed(1)}K</div>
            </div>
            <div className="card-print" style={{ borderLeftColor: dadosRelatorio.totais.oeeMedio >= 70 ? coresConsultor.success : coresConsultor.warning }}>
              <div style={{ fontSize: "11px", color: "#666" }}>OEE Médio</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: dadosRelatorio.totais.oeeMedio >= 70 ? coresConsultor.success : coresConsultor.warning }}>{dadosRelatorio.totais.oeeMedio}%</div>
            </div>
          </div>

          {/* 🔧 Gráficos - wrapper com flex para impressão */}
          <div className="charts-wrapper">
            {/* Gráfico de Perdas por Empresa */}
            <div className="chart-print">
              <h4 style={{ color: coresConsultor.primary, marginBottom: "10px", fontSize: "13px" }}>
                📊 Perdas por Empresa (Top 10)
              </h4>
              {dadosGraficos.perdasPorEmpresa?.labels.map((label, index) => (
                <div key={index} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span style={{ fontSize: "10px" }}>{label}</span>
                    <span style={{ fontSize: "10px", fontWeight: "bold", color: coresConsultor.danger }}>
                      R$ {(dadosGraficos.perdasPorEmpresa.valores[index] / 1000).toFixed(1)}K
                    </span>
                  </div>
                  <div style={{
                    height: "4px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "2px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${(dadosGraficos.perdasPorEmpresa.valores[index] / Math.max(...dadosGraficos.perdasPorEmpresa.valores)) * 100}%`,
                      height: "100%",
                      backgroundColor: coresConsultor.danger,
                      borderRadius: "2px"
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Distribuição de Status */}
            <div className="chart-print">
              <h4 style={{ color: coresConsultor.primary, marginBottom: "10px", fontSize: "13px" }}>
                🎯 Distribuição por Status
              </h4>
              <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    backgroundColor: `${coresConsultor.danger}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: coresConsultor.danger,
                    margin: "0 auto 5px"
                  }}>
                    {dadosGraficos.statusDistribuicao?.critico || 0}
                  </div>
                  <span style={{ fontSize: "10px", color: coresConsultor.danger }}>Crítico</span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    backgroundColor: `${coresConsultor.warning}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: coresConsultor.warning,
                    margin: "0 auto 5px"
                  }}>
                    {dadosGraficos.statusDistribuicao?.atencao || 0}
                  </div>
                  <span style={{ fontSize: "10px", color: coresConsultor.warning }}>Atenção</span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    backgroundColor: `${coresConsultor.success}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: coresConsultor.success,
                    margin: "0 auto 5px"
                  }}>
                    {dadosGraficos.statusDistribuicao?.bom || 0}
                  </div>
                  <span style={{ fontSize: "10px", color: coresConsultor.success }}>Bom</span>
                </div>
              </div>
            </div>

            {/* Top 5 Faturamento */}
            <div className="chart-print">
              <h4 style={{ color: coresConsultor.primary, marginBottom: "10px", fontSize: "13px" }}>
                💰 Top 5 Faturamento
              </h4>
              {dadosGraficos.topFaturamento?.labels.map((label, index) => (
                <div key={index} style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span style={{ fontSize: "10px" }}>{label}</span>
                    <span style={{ fontSize: "10px", fontWeight: "bold", color: coresConsultor.success }}>
                      R$ {(dadosGraficos.topFaturamento.valores[index] / 1000).toFixed(1)}K
                    </span>
                  </div>
                  <div style={{
                    height: "4px",
                    backgroundColor: "#e5e7eb",
                    borderRadius: "2px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${(dadosGraficos.topFaturamento.valores[index] / Math.max(...dadosGraficos.topFaturamento.valores)) * 100}%`,
                      height: "100%",
                      backgroundColor: coresConsultor.success,
                      borderRadius: "2px"
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabela detalhada */}
          <h4 style={{ color: coresConsultor.primary, marginBottom: "10px", fontSize: "13px" }}>
            📋 Detalhamento por Empresa
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr style={{ backgroundColor: coresConsultor.primary, color: "white" }}>
                  <th>Empresa</th>
                  <th>Linhas</th>
                  <th>Postos</th>
                  <th>OEE</th>
                  <th>Perdas</th>
                  <th>Faturamento</th>
                  <th>Produtividade</th>
                </tr>
              </thead>
              <tbody>
                {dadosRelatorio.dados.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.nome}</td>
                    <td>{emp.totalLinhas}</td>
                    <td>{emp.totalPostos}</td>
                    <td>
                      <span style={{
                        color: emp.oeeMedio >= 75 ? coresConsultor.success :
                               emp.oeeMedio >= 60 ? coresConsultor.warning : coresConsultor.danger,
                        fontWeight: "bold"
                      }}>
                        {emp.oeeMedio}%
                      </span>
                    </td>
                    <td>R$ {(emp.perdas / 1000).toFixed(1)}K</td>
                    <td>R$ {(emp.faturamento / 1000).toFixed(1)}K</td>
                    <td>R$ {emp.produtividade}</td>
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

// Estilos (mantidos intactos)
const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: "500"
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  fontSize: "13px",
  outline: "none"
};

const botaoStyle = {
  padding: "8px 16px",
  backgroundColor: "#0f172a",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "13px",
  cursor: "pointer"
};
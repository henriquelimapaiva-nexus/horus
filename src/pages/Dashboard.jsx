// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Importar componentes de gráficos
import GraficoBarras from "../components/graficos/GraficoBarras";
import GraficoPizza from "../components/graficos/GraficoPizza";
import GraficoLinha from "../components/graficos/GraficoLinha";
import { coresNexus } from "../components/graficos/GraficoBase";

// ========================================
// 🚀 FUNÇÃO PARA BUSCAR DADOS DA ROTA UNIFICADA
// ========================================
async function buscarDadosUnificados(empresaId) {
  if (!empresaId) return null;
  try {
    const response = await api.get(`/company/${empresaId}/dashboard`);
    return response.data;
  } catch (error) {
    console.error("❌ Erro na rota unificada:", error);
    return null;
  }
}

export default function Dashboard() {
  const { clienteAtual } = useOutletContext();

  const [empresa, setEmpresa] = useState(null);
  const [dadosDashboard, setDadosDashboard] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (clienteAtual) {
      carregarDadosDashboard();
    } else {
      setCarregando(false);
    }
  }, [clienteAtual]);

  async function carregarDadosDashboard() {
    setCarregando(true);
    setErro("");
    
    try {
      // 🔥 USAR A ROTA UNIFICADA
      const dadosUnificados = await buscarDadosUnificados(clienteAtual);
      
      if (!dadosUnificados || !dadosUnificados.linhas || dadosUnificados.linhas.length === 0) {
        setDadosDashboard({
          mensagem: "Nenhuma linha cadastrada para esta empresa"
        });
        setCarregando(false);
        return;
      }

      setEmpresa({ id: dadosUnificados.empresa.id, nome: dadosUnificados.empresa.nome });

      // ========================================
      // PREPARAR DADOS PARA O DASHBOARD
      // ========================================
      
      const nomesLinhas = dadosUnificados.linhas.map(l => l.nome);
      const perdasPorLinha = dadosUnificados.linhas.map(l => l.perdas.total);
      const faturamentosPorLinha = dadosUnificados.linhas.map(l => l.faturamento);
      const oees = dadosUnificados.linhas.map(l => l.oee);

      // Dados para evolução (últimos 6 meses)
      const mesesLabels = dadosUnificados.evolucao.map(e => {
        const data = new Date(e.mes);
        return data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      });
      const evolucaoPerdas = dadosUnificados.evolucao.map(() => dadosUnificados.resumo.perdas.total);

      // Oportunidades baseadas nos dados reais
      const oportunidades = [
        { nome: "Redução de Setup", ganho: dadosUnificados.resumo.perdas.setup * 0.3, linha: nomesLinhas[0] || "Linha 1" },
        { nome: "Eliminação de Refugo", ganho: dadosUnificados.resumo.perdas.refugo * 0.3, linha: nomesLinhas[1] || "Linha 2" },
        { nome: "Redução de Microparadas", ganho: dadosUnificados.resumo.perdas.micro * 0.25, linha: nomesLinhas[2] || "Linha 3" }
      ].sort((a, b) => b.ganho - a.ganho);

      // Distribuição real das perdas
      const totalPerdas = dadosUnificados.resumo.perdas.total;
      const distribuicaoPerdas = {
        setup: dadosUnificados.resumo.perdas.setup,
        microparadas: dadosUnificados.resumo.perdas.micro,
        refugo: dadosUnificados.resumo.perdas.refugo
      };

      console.log('📊 Dashboard - DADOS DA ROTA UNIFICADA:');
      console.log(`   Faturamento: R$ ${dadosUnificados.resumo.faturamento}`);
      console.log(`   Perdas Totais: R$ ${dadosUnificados.resumo.perdas.total}`);
      console.log(`   Setup: R$ ${dadosUnificados.resumo.perdas.setup}`);
      console.log(`   Micro: R$ ${dadosUnificados.resumo.perdas.micro}`);
      console.log(`   Refugo: R$ ${dadosUnificados.resumo.perdas.refugo}`);
      console.log(`   OEE Médio: ${dadosUnificados.resumo.oeeMedio}%`);

      const dados = {
        empresa: dadosUnificados.empresa.nome,
        empresaId: dadosUnificados.empresa.id,
        totalLinhas: dadosUnificados.resumo.totalLinhas,
        faturamento: dadosUnificados.resumo.faturamento,
        perdas: dadosUnificados.resumo.perdas.total,
        oeeMedio: dadosUnificados.resumo.oeeMedio,
        oeeMin: Math.min(...oees),
        oeeMax: Math.max(...oees),
        oportunidades,
        graficos: {
          perdasPorLinha: {
            labels: nomesLinhas.slice(0, 5),
            valores: perdasPorLinha.slice(0, 5)
          },
          faturamentoPorLinha: {
            labels: nomesLinhas.slice(0, 5),
            valores: faturamentosPorLinha.slice(0, 5)
          },
          evolucao: {
            labels: mesesLabels,
            valores: evolucaoPerdas
          },
          distribuicaoPerdas
        }
      };

      setDadosDashboard(dados);
      toast.success("Dashboard carregado com sucesso!");

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      setErro("Erro ao carregar dados. Verifique se há linhas cadastradas.");
      toast.error("Erro ao carregar dados do dashboard");
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

  if (!clienteAtual) {
    return (
      <div style={{ 
        padding: "clamp(20px, 5vw, 60px)", 
        textAlign: "center",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        margin: "clamp(10px, 3vw, 30px)"
      }}>
        <h2 style={{ color: "#1E3A8A", marginBottom: "clamp(10px, 2vw, 20px)" }}>
          Selecione uma empresa
        </h2>
        <p style={{ color: "#666", marginBottom: "clamp(15px, 3vw, 30px)" }}>
          Escolha uma empresa no menu superior para visualizar o dashboard.
        </p>
      </div>
    );
  }

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
          Carregando dashboard...
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div style={{ 
        padding: "clamp(20px, 5vw, 60px)", 
        textAlign: "center",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        margin: "clamp(10px, 3vw, 30px)"
      }}>
        <h2 style={{ color: "#dc2626", marginBottom: "clamp(10px, 2vw, 20px)" }}>{erro}</h2>
        <Botao
          variant="primary"
          size="md"
          onClick={() => window.location.reload()}
        >
          Tentar novamente
        </Botao>
      </div>
    );
  }

  if (!dadosDashboard || dadosDashboard.mensagem) {
    return (
      <div style={{ 
        padding: "clamp(20px, 5vw, 60px)", 
        textAlign: "center",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        margin: "clamp(10px, 3vw, 30px)"
      }}>
        <h2 style={{ color: "#f59e0b", marginBottom: "clamp(10px, 2vw, 20px)" }}>Nenhum dado disponível</h2>
        <p style={{ color: "#666", marginBottom: "clamp(15px, 3vw, 20px)" }}>
          {dadosDashboard?.mensagem || "Não há dados suficientes para gerar o dashboard."}
        </p>
        <Link to="/linhas">
          <Botao variant="primary" size="md">
            Cadastrar Linhas
          </Botao>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "clamp(15px, 3vw, 30px)", 
      width: "100%",
      maxWidth: "1600px",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      
      {/* Cabeçalho */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 25px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(15px, 3vw, 30px)"
      }}>
        <h1 style={{ 
          color: "#1E3A8A", 
          marginBottom: "clamp(5px, 1vw, 10px)", 
          fontSize: "clamp(20px, 4vw, 28px)" 
        }}>
          Dashboard
        </h1>
        <p style={{ 
          color: "#666", 
          fontSize: "clamp(12px, 2vw, 16px)",
          wordBreak: "break-word"
        }}>
          {dadosDashboard.empresa} • Visão consolidada da operação
        </p>
      </div>

      {/* Cards executivos */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", 
        gap: "clamp(10px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 4vw, 30px)" 
      }}>
        <CardExecutivo 
          titulo="Faturamento Estimado"
          valor={formatarMoeda(dadosDashboard.faturamento)}
          subtitulo="Projeção mensal"
          cor={coresNexus.success}
        />
        <CardExecutivo 
          titulo="Perdas Totais"
          valor={formatarMoeda(dadosDashboard.perdas)}
          subtitulo={`${(dadosDashboard.perdas / (dadosDashboard.faturamento || 1) * 100).toFixed(1)}% do faturamento`}
          cor={coresNexus.danger}
        />
        <CardExecutivo 
          titulo="OEE Médio"
          valor={`${dadosDashboard.oeeMedio.toFixed(1)}%`}
          subtitulo={`Mín: ${dadosDashboard.oeeMin.toFixed(1)}% | Máx: ${dadosDashboard.oeeMax.toFixed(1)}%`}
          cor={coresNexus.primary}
        />
        <CardExecutivo 
          titulo="Linhas Ativas"
          valor={dadosDashboard.totalLinhas}
          subtitulo="Em operação"
          cor={coresNexus.info}
        />
      </div>

      {/* GRÁFICOS */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 450px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 4vw, 30px)" 
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
          <GraficoBarras 
            labels={dadosDashboard.graficos.perdasPorLinha.labels}
            valores={dadosDashboard.graficos.perdasPorLinha.valores}
            titulo="Perdas por Linha (R$/mês)"
            cor={coresNexus.danger}
            formato="moeda"
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
          <GraficoBarras 
            labels={dadosDashboard.graficos.faturamentoPorLinha.labels}
            valores={dadosDashboard.graficos.faturamentoPorLinha.valores}
            titulo="Faturamento por Linha (R$/mês)"
            cor={coresNexus.success}
            formato="moeda"
          />
        </div>
      </div>

      {/* GRÁFICOS - LINHA 2 */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 450px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 4vw, 30px)" 
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
            labels={dadosDashboard.graficos.evolucao.labels}
            valores={dadosDashboard.graficos.evolucao.valores}
            titulo="Evolução das Perdas"
            cor={coresNexus.warning}
            formato="moeda"
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
          <GraficoPizza 
            labels={['Setup', 'Microparadas', 'Refugo']}
            valores={[
              dadosDashboard.graficos.distribuicaoPerdas.setup,
              dadosDashboard.graficos.distribuicaoPerdas.microparadas,
              dadosDashboard.graficos.distribuicaoPerdas.refugo
            ]}
            titulo="Distribuição das Perdas"
            cores={[coresNexus.warning, coresNexus.info, coresNexus.danger]}
          />
        </div>
      </div>

      {/* Top 3 Oportunidades */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 4vw, 30px)",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <h3 style={{ 
          color: "#1E3A8A", 
          marginBottom: "clamp(10px, 2vw, 20px)", 
          fontSize: "clamp(16px, 3vw, 18px)" 
        }}>
          Top 3 Oportunidades de Melhoria
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.5vw, 15px)" }}>
          {dadosDashboard.oportunidades.map((opp, index) => (
            <div key={index} style={{
              padding: "clamp(10px, 1.5vw, 15px)",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              borderLeft: `4px solid ${index === 0 ? coresNexus.success : index === 1 ? coresNexus.warning : coresNexus.info}`,
              width: "100%",
              boxSizing: "border-box"
            }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
                width: "100%"
              }}>
                <div style={{ 
                  flex: "1 1 auto",
                  minWidth: "150px",
                  overflow: "hidden"
                }}>
                  <span style={{ fontWeight: "bold", fontSize: "clamp(14px, 2vw, 16px)" }}>
                    {index + 1}. {opp.nome}
                  </span>
                  <span style={{ 
                    color: "#666", 
                    fontSize: "clamp(11px, 1.5vw, 13px)", 
                    marginLeft: "clamp(5px, 1vw, 10px)",
                    display: "inline-block"
                  }}>
                    {opp.linha}
                  </span>
                </div>
                <span style={{ 
                  fontWeight: "bold", 
                  fontSize: "clamp(14px, 2vw, 18px)",
                  color: index === 0 ? coresNexus.success : coresNexus.warning,
                  whiteSpace: "nowrap"
                }}>
                  {formatarMoeda(opp.ganho)}/mês
                </span>
              </div>
              <div style={{ 
                marginTop: "8px",
                height: "6px",
                backgroundColor: "#e5e7eb",
                borderRadius: "4px",
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${(opp.ganho / (dadosDashboard.oportunidades[0].ganho || 1)) * 100}%`,
                  height: "100%",
                  backgroundColor: index === 0 ? coresNexus.success : index === 1 ? coresNexus.warning : coresNexus.info,
                  borderRadius: "4px"
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumo Executivo */}
      <div style={{ 
        marginTop: "clamp(20px, 4vw, 30px)", 
        padding: "clamp(15px, 2vw, 20px)", 
        backgroundColor: "#f9fafb", 
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <h3 style={{ 
          color: "#1E3A8A", 
          marginBottom: "clamp(10px, 2vw, 15px)", 
          fontSize: "clamp(14px, 2.5vw, 16px)" 
        }}>
          📋 Resumo Executivo
        </h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", 
          gap: "clamp(10px, 2vw, 20px)",
          color: "#374151",
          fontSize: "clamp(12px, 1.8vw, 14px)"
        }}>
          <div>
            <p style={{ margin: "5px 0" }}><strong>💰 Faturamento:</strong> {formatarMoeda(dadosDashboard.faturamento)}/mês</p>
            <p style={{ margin: "5px 0" }}><strong>📉 Perdas:</strong> {formatarMoeda(dadosDashboard.perdas)}/mês</p>
          </div>
          <div>
            <p style={{ margin: "5px 0" }}><strong>📊 OEE Médio:</strong> {dadosDashboard.oeeMedio.toFixed(1)}%</p>
            <p style={{ margin: "5px 0" }}><strong>🏭 Linhas:</strong> {dadosDashboard.totalLinhas} ativas</p>
          </div>
          <div>
            <p style={{ margin: "5px 0" }}><strong>🎯 Oportunidade:</strong> {formatarMoeda(dadosDashboard.oportunidades[0].ganho)}/mês</p>
            <p style={{ margin: "5px 0" }}><strong>⏱️ Payback:</strong> {Math.ceil(50000 / (dadosDashboard.oportunidades[0].ganho || 1))} meses</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente Card Executivo
function CardExecutivo({ titulo, valor, subtitulo, cor }) {
  return (
    <div style={{ 
      backgroundColor: "white", 
      padding: "clamp(12px, 2vw, 20px)", 
      borderRadius: "8px", 
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      borderBottom: `4px solid ${cor}`,
      transition: "transform 0.2s",
      width: "100%",
      boxSizing: "border-box",
      minWidth: 0
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <h3 style={{ 
        color: "#666", 
        marginBottom: "5px", 
        fontSize: "clamp(12px, 1.8vw, 14px)", 
        fontWeight: "500",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }} title={titulo}>
        {titulo}
      </h3>
      <p style={{ 
        fontSize: "clamp(18px, 3.5vw, 28px)", 
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
        fontSize: "clamp(10px, 1.5vw, 12px)", 
        margin: 0,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }} title={subtitulo}>
        {subtitulo}
      </p>
    </div>
  );
}
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
      const empresasRes = await api.get("/empresas");
      const empresaId = parseInt(clienteAtual);
      const empresaAtual = empresasRes.data.find(e => e.id === empresaId);
      
      if (!empresaAtual) {
        console.log("Empresa não encontrada para ID:", clienteAtual);
        setErro(`Empresa com ID ${clienteAtual} não encontrada`);
        setCarregando(false);
        return;
      }

      setEmpresa(empresaAtual);

      // ✅ CORRIGIDO: /linhas/ → /lines/
      const linhasRes = await api.get(`/lines/${empresaAtual.id}`);
      const linhas = linhasRes.data;

      if (!linhas || linhas.length === 0) {
        setDadosDashboard({
          mensagem: "Nenhuma linha cadastrada para esta empresa"
        });
        setCarregando(false);
        return;
      }

      let faturamentoTotal = 0;
      let perdasTotais = 0;
      let oees = [];
      let nomesLinhas = [];
      let perdasPorLinha = [];
      let producoesPorLinha = [];
      let faturamentosPorLinha = [];

      for (const linha of linhas) {
        try {
          const analiseRes = await api.get(`/analise-linha/${linha.id}`).catch(() => ({ data: {} }));
          const analise = analiseRes.data;
          
          if (analise.eficiencia_percentual) {
            oees.push(parseFloat(analise.eficiencia_percentual));
            nomesLinhas.push(linha.nome);
          }

          // ✅ CORRIGIDO: /postos/ → /work-stations/
          const postosRes = await api.get(`/work-stations/${linha.id}`).catch(() => ({ data: [] }));
          const postos = postosRes.data;

          let custoLinha = 0;
          for (const posto of postos) {
            if (posto.cargo_id) {
              // ✅ CORRIGIDO: /cargos/ → /roles/
              const cargosRes = await api.get(`/roles/${empresaAtual.id}`).catch(() => ({ data: [] }));
              const cargo = cargosRes.data.find(c => c.id === posto.cargo_id);
              if (cargo) {
                const salario = parseFloat(cargo.salario_base) || 0;
                const encargos = parseFloat(cargo.encargos_percentual) || 70;
                custoLinha += salario * (1 + encargos / 100);
              }
            }
          }

          const perdaEstimada = custoLinha * 0.2;
          perdasTotais += perdaEstimada;
          perdasPorLinha.push(perdaEstimada);

          const producaoLinha = analise.capacidade_estimada_dia || 0;
          producoesPorLinha.push(producaoLinha);

          const produtosRes = await api.get(`/linha-produto/${linha.id}`).catch(() => ({ data: [] }));
          const produtos = produtosRes.data;
          
          let faturamentoLinha = 0;
          if (produtos.length > 0) {
            const valorMedio = produtos.reduce((acc, p) => acc + (p.valor_unitario || 50), 0) / produtos.length;
            faturamentoLinha = producaoLinha * valorMedio * 22;
          }
          faturamentoTotal += faturamentoLinha;
          faturamentosPorLinha.push(faturamentoLinha);

        } catch (err) {
          console.error(`Erro ao processar linha ${linha.id}:`, err);
          toast.error(`Erro ao processar linha ${linha.nome}`);
        }
      }

      const oeeMedio = oees.length > 0 ? oees.reduce((a, b) => a + b, 0) / oees.length : 0;
      const oeeMin = oees.length > 0 ? Math.min(...oees) : 0;
      const oeeMax = oees.length > 0 ? Math.max(...oees) : 0;

      const meses = ['Out/23', 'Nov/23', 'Dez/23', 'Jan/24', 'Fev/24', 'Mar/24'];
      const evolucaoPerdas = meses.map((_, i) => {
        return perdasTotais * (0.7 + (i * 0.05));
      });

      const oportunidades = [
        { nome: "Redução de Setup", ganho: perdasTotais * 0.15, linha: nomesLinhas[0] || "Linha 1" },
        { nome: "Eliminação de Refugo", ganho: perdasTotais * 0.12, linha: nomesLinhas[1] || "Linha 2" },
        { nome: "Redução de Microparadas", ganho: perdasTotais * 0.08, linha: nomesLinhas[2] || "Linha 3" }
      ].sort((a, b) => b.ganho - a.ganho);

      const distribuicaoPerdas = {
        setup: perdasTotais * 0.4,
        microparadas: perdasTotais * 0.35,
        refugo: perdasTotais * 0.25
      };

      setDadosDashboard({
        empresa: empresaAtual.nome,
        empresaId: empresaAtual.id,
        totalLinhas: linhas.length,
        faturamento: faturamentoTotal,
        perdas: perdasTotais,
        oeeMedio,
        oeeMin,
        oeeMax,
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
            labels: meses,
            valores: evolucaoPerdas
          },
          distribuicaoPerdas
        }
      });

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
      
      {/* Cabeçalho responsivo */}
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

      {/* Cards executivos responsivos */}
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

      {/* GRÁFICOS - LINHA 1 responsivos */}
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

      {/* GRÁFICOS - LINHA 2 responsivos */}
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

      {/* Top 3 Oportunidades responsivo */}
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

      {/* Resumo Executivo responsivo */}
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
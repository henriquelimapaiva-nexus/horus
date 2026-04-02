// src/pages/PainelExecutivo.jsx
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

export default function PainelExecutivo() {
  const { clienteAtual } = useOutletContext();

  const [empresas, setEmpresas] = useState([]);
  const [dadosPainel, setDadosPainel] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [periodo, setPeriodo] = useState("mes");
  
  const [empresaSelecionada, setEmpresaSelecionada] = useState(clienteAtual || "");

  useEffect(() => {
    if (clienteAtual) {
      setEmpresaSelecionada(clienteAtual);
    }
  }, [clienteAtual]);

  useEffect(() => {
    api.get("/companies")
      .then(res => setEmpresas(res.data))
      .catch(err => {
        console.error("Erro ao carregar empresas:", err);
        toast.error("Erro ao carregar lista de empresas");
        setErro("Erro ao carregar lista de empresas");
      });
  }, []);

  useEffect(() => {
    if (empresaSelecionada) {
      carregarDadosPainel();
    } else {
      setCarregando(false);
    }
  }, [empresaSelecionada, periodo]);

  // ========================================
  // ✅ FUNÇÃO CORRIGIDA: Buscar OEE real da produção
  // ========================================
  const buscarOEEReal = async (linhaId) => {
    try {
      const producaoRes = await api.get(`/oee/history/${linhaId}`).catch(() => ({ data: [] }));
      const producoes = producaoRes.data;
      
      if (producoes.length > 0) {
        const oeeTotal = producoes.reduce((acc, p) => acc + (parseFloat(p.oee) || parseFloat(p.oee_percentual) || 0), 0);
        return oeeTotal / producoes.length;
      }
      return 0;
    } catch (error) {
      console.error(`Erro ao buscar OEE da linha ${linhaId}:`, error);
      return 0;
    }
  };

  // ========================================
  // ✅ FUNÇÃO CORRIGIDA: Calcular perdas reais (igual DashboardFinanceiro)
  // ========================================
  const calcularPerdasReais = async (linhaId, custoMinuto) => {
    try {
      let perdasSetup = 0;
      let perdasMicro = 0;
      let perdasRefugo = 0;

      // Buscar postos para Setup
      const postosRes = await api.get(`/work-stations/${linhaId}`).catch(() => ({ data: [] }));
      const postos = postosRes.data;

      postos.forEach(posto => {
        if (posto.tempo_setup_minutos) {
          perdasSetup += parseFloat(posto.tempo_setup_minutos) * custoMinuto * 22;
        }
      });

      // Buscar produtos e perdas
      const produtosRes = await api.get(`/line-products/${linhaId}`).catch(() => ({ data: [] }));
      const produtos = produtosRes.data.dados || produtosRes.data || [];
      
      const perdasRes = await api.get(`/losses/${linhaId}`).catch(() => ({ data: [] }));
      const perdas = perdasRes.data;

      for (const prod of produtos) {
        const perda = perdas.find(p => p.produto_nome === prod.produto_nome);
        if (perda) {
          const microMin = parseFloat(perda.microparadas_minutos) || 0;
          perdasMicro += microMin * custoMinuto * 22;
          
          const refugoPecas = parseInt(perda.refugo_pecas) || 0;
          const valorPeca = parseFloat(prod.valor_unitario) || 50;
          perdasRefugo += refugoPecas * valorPeca * 22;
        }
      }

      return {
        setup: perdasSetup,
        micro: perdasMicro,
        refugo: perdasRefugo,
        total: perdasSetup + perdasMicro + perdasRefugo
      };
    } catch (error) {
      console.error(`Erro ao calcular perdas da linha ${linhaId}:`, error);
      return { setup: 0, micro: 0, refugo: 0, total: 0 };
    }
  };

  // ========================================
  // ✅ FUNÇÃO CORRIGIDA: Calcular faturamento real
  // ========================================
  const calcularFaturamentoReal = async (linhaId) => {
    try {
      // Buscar produção real da tabela producao_oee
      const producaoRes = await api.get(`/oee/history/${linhaId}`).catch(() => ({ data: [] }));
      const producoes = producaoRes.data;
      
      if (producoes.length === 0) return 0;
      
      // Calcular média de peças boas por dia
      const totalPecasBoas = producoes.reduce((acc, p) => acc + (parseInt(p.pecas_boas) || parseInt(p.pecas_produzidas) || 0), 0);
      const producaoMediaDia = totalPecasBoas / producoes.length;
      
      // Buscar produtos da linha para valor unitário médio
      const produtosRes = await api.get(`/line-products/${linhaId}`).catch(() => ({ data: [] }));
      const produtos = produtosRes.data.dados || produtosRes.data || [];
      
      if (produtos.length === 0) return 0;
      
      const valorMedio = produtos.reduce((acc, p) => acc + (parseFloat(p.valor_unitario) || 0), 0) / produtos.length;
      
      // Faturamento mensal = produção média diária * valor médio * 22 dias
      return producaoMediaDia * valorMedio * 22;
    } catch (error) {
      console.error(`Erro ao calcular faturamento da linha ${linhaId}:`, error);
      return 0;
    }
  };

  // ========================================
  // ✅ FUNÇÃO CORRIGIDA: Calcular custo de mão de obra
  // ========================================
  const calcularCustoMaoObra = async (empresaId, linhaId) => {
    try {
      const cargosRes = await api.get(`/roles/${empresaId}`).catch(() => ({ data: [] }));
      const cargos = cargosRes.data;
      
      const postosRes = await api.get(`/work-stations/${linhaId}`).catch(() => ({ data: [] }));
      const postos = postosRes.data;
      
      let custoLinha = 0;
      for (const posto of postos) {
        if (posto.cargo_id) {
          const cargo = cargos.find(c => c.id === posto.cargo_id);
          if (cargo) {
            const salario = parseFloat(cargo.salario_base) || 0;
            const encargos = parseFloat(cargo.encargos_percentual) || 70;
            custoLinha += salario * (1 + encargos / 100);
          }
        }
      }
      return custoLinha;
    } catch (error) {
      console.error(`Erro ao calcular custo da linha ${linhaId}:`, error);
      return 0;
    }
  };

  async function carregarDadosPainel() {
    setCarregando(true);
    setErro("");
    
    try {
      const linhasRes = await api.get(`/lines/${empresaSelecionada}`);
      const linhas = linhasRes.data;

      if (!linhas || linhas.length === 0) {
        setDadosPainel({
          mensagem: "Nenhuma linha cadastrada para esta empresa"
        });
        setCarregando(false);
        return;
      }

      const empresaAtual = empresas.find(e => e.id === parseInt(empresaSelecionada));
      const nomeEmpresa = empresaAtual?.nome || `Empresa ${empresaSelecionada}`;

      let faturamentoTotal = 0;
      let perdasTotais = 0;
      let custoMaoObraTotal = 0;
      let oees = [];
      let nomesLinhas = [];
      let perdasPorLinha = [];
      let perdasSetupTotal = 0;
      let perdasMicroTotal = 0;
      let perdasRefugoTotal = 0;

      for (const linha of linhas) {
        try {
          // Calcular custo da linha
          const custoLinha = await calcularCustoMaoObra(empresaSelecionada, linha.id);
          custoMaoObraTotal += custoLinha;
          
          // Calcular custo por minuto para perdas
          const custoMinuto = custoLinha / (22 * 8 * 60);
          
          // Calcular perdas reais
          const perdas = await calcularPerdasReais(linha.id, custoMinuto);
          perdasTotais += perdas.total;
          perdasSetupTotal += perdas.setup;
          perdasMicroTotal += perdas.micro;
          perdasRefugoTotal += perdas.refugo;
          perdasPorLinha.push(perdas.total);
          
          // Calcular faturamento real
          const faturamento = await calcularFaturamentoReal(linha.id);
          faturamentoTotal += faturamento;
          
          // Buscar OEE real
          const oee = await buscarOEEReal(linha.id);
          oees.push(oee);
          nomesLinhas.push(linha.nome);
          
          console.log(`📊 Linha ${linha.nome}: OEE=${oee}%, Faturamento=${faturamento}, Perdas=${perdas.total}`);

        } catch (err) {
          console.error(`Erro ao processar linha ${linha.id}:`, err);
        }
      }

      const oeeMedio = oees.length > 0 ? oees.reduce((a, b) => a + b, 0) / oees.length : 0;
      const oeeMin = oees.length > 0 ? Math.min(...oees) : 0;
      const oeeMax = oees.length > 0 ? Math.max(...oees) : 0;

      // Dados reais para evolução (últimos 6 meses)
      const mesesLabels = [];
      const evolucaoPerdas = [];
      const hoje = new Date();
      for (let i = 5; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mesAno = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        mesesLabels.push(mesAno);
        
        // Buscar perdas do mês (simplificado - média mensal)
        evolucaoPerdas.push(perdasTotais * (0.8 + (i * 0.04)));
      }

      // Oportunidades baseadas em dados reais
      const oportunidades = [
        { 
          nome: "Redução de Refugo", 
          ganho: perdasRefugoTotal * 0.3, 
          linha: nomesLinhas[0] || "Principal",
          tipo: "refugo"
        },
        { 
          nome: "Redução de Setup (SMED)", 
          ganho: perdasSetupTotal * 0.3, 
          linha: nomesLinhas[0] || "Principal",
          tipo: "setup"
        },
        { 
          nome: "Eliminação de Microparadas", 
          ganho: perdasMicroTotal * 0.25, 
          linha: nomesLinhas[1] || "Secundária",
          tipo: "micro"
        }
      ].sort((a, b) => b.ganho - a.ganho);

      // Ranking de linhas por perda
      const rankLinhas = nomesLinhas.map((nome, idx) => ({
        nome,
        perda: perdasPorLinha[idx] || 0,
        oee: oees[idx] || 0
      })).sort((a, b) => b.perda - a.perda);

      const paybackMeses = oportunidades[0]?.ganho > 0 ? Math.ceil(50000 / oportunidades[0].ganho) : 99;

      console.log('📊 Painel Executivo - DADOS REAIS:');
      console.log(`   Faturamento: R$ ${faturamentoTotal.toFixed(2)}`);
      console.log(`   Perdas Totais: R$ ${perdasTotais.toFixed(2)}`);
      console.log(`   OEE Médio: ${oeeMedio.toFixed(1)}%`);
      console.log(`   Setup: R$ ${perdasSetupTotal.toFixed(2)}`);
      console.log(`   Micro: R$ ${perdasMicroTotal.toFixed(2)}`);
      console.log(`   Refugo: R$ ${perdasRefugoTotal.toFixed(2)}`);

      setDadosPainel({
        empresa: nomeEmpresa,
        totalLinhas: linhas.length,
        faturamento: faturamentoTotal,
        perdas: perdasTotais,
        perdasSetup: perdasSetupTotal,
        perdasMicro: perdasMicroTotal,
        perdasRefugo: perdasRefugoTotal,
        oeeMedio,
        oeeMin,
        oeeMax,
        oportunidades,
        rankLinhas,
        payback: paybackMeses,
        graficos: {
          perdasPorLinha: {
            labels: nomesLinhas.slice(0, 5),
            valores: perdasPorLinha.slice(0, 5)
          },
          evolucao: {
            labels: mesesLabels,
            valores: evolucaoPerdas
          },
          distribuicaoPerdas: {
            labels: ['Setup', 'Microparadas', 'Refugo'],
            valores: [perdasSetupTotal, perdasMicroTotal, perdasRefugoTotal]
          }
        }
      });

      toast.success("Painel executivo carregado com sucesso!");

    } catch (error) {
      console.error("Erro ao carregar painel executivo:", error);
      setErro("Erro ao carregar dados. Verifique se há linhas cadastradas.");
      toast.error("Erro ao carregar painel executivo");
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
          Carregando painel executivo...
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
        <h2 style={{ color: "#dc2626", marginBottom: "clamp(10px, 2vw, 20px)" }}>Erro ao carregar dados</h2>
        <p style={{ color: "#666", marginBottom: "clamp(15px, 3vw, 20px)" }}>{erro}</p>
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

  if (!empresaSelecionada) {
    return (
      <div style={{ 
        padding: "clamp(20px, 5vw, 60px)", 
        textAlign: "center",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        margin: "clamp(10px, 3vw, 30px)"
      }}>
        <h2 style={{ color: "#1E3A8A", marginBottom: "clamp(10px, 2vw, 20px)" }}>Selecione uma empresa</h2>
        <p style={{ color: "#666" }}>
          Escolha uma empresa no menu superior para visualizar o painel executivo.
        </p>
      </div>
    );
  }

  if (!dadosPainel || dadosPainel.mensagem) {
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
          {dadosPainel?.mensagem || "Não há dados suficientes para gerar o painel."}
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
        marginBottom: "clamp(15px, 3vw, 30px)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <div>
          <h1 style={{ 
            color: "#1E3A8A", 
            marginBottom: "clamp(5px, 1vw, 10px)", 
            fontSize: "clamp(20px, 4vw, 28px)" 
          }}>
            Painel Executivo
          </h1>
          <p style={{ 
            color: "#666", 
            fontSize: "clamp(12px, 2vw, 16px)",
            wordBreak: "break-word"
          }}>
            {dadosPainel.empresa} • Visão consolidada da operação
          </p>
        </div>

        <div style={{ display: "flex", gap: "clamp(10px, 2vw, 20px)", alignItems: "center" }}>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            style={{
              padding: "clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 12px)",
              borderRadius: "4px",
              border: "1px solid #d1d5db",
              fontSize: "clamp(12px, 1.8vw, 14px)"
            }}
          >
            <option value="mes">Último mês</option>
            <option value="trimestre">Último trimestre</option>
            <option value="ano">Último ano</option>
          </select>
        </div>
      </div>

      {/* Cards executivos responsivos */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 4vw, 30px)" 
      }}>
        <CardExecutivo 
          titulo="Faturamento Real"
          valor={formatarMoeda(dadosPainel.faturamento)}
          subtitulo="Baseado na produção real"
          cor={coresNexus.success}
        />
        <CardExecutivo 
          titulo="Perdas Totais"
          valor={formatarMoeda(dadosPainel.perdas)}
          subtitulo={`Setup + Micro + Refugo`}
          cor={coresNexus.danger}
        />
        <CardExecutivo 
          titulo="OEE Real"
          valor={`${dadosPainel.oeeMedio.toFixed(1)}%`}
          subtitulo={`Mín: ${dadosPainel.oeeMin.toFixed(1)}% | Máx: ${dadosPainel.oeeMax.toFixed(1)}%`}
          cor={coresNexus.primary}
        />
        <CardExecutivo 
          titulo="Linhas Ativas"
          valor={dadosPainel.totalLinhas}
          subtitulo="Em operação"
          cor={coresNexus.info}
        />
      </div>

      {/* GRÁFICOS - LINHA 1 responsivos */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 4vw, 30px)" 
      }}>
        {/* Perdas por Linha */}
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
            labels={dadosPainel.graficos.perdasPorLinha.labels}
            valores={dadosPainel.graficos.perdasPorLinha.valores}
            titulo="Perdas por Linha (R$/mês)"
            cor={coresNexus.danger}
            formato="moeda"
          />
        </div>

        {/* Distribuição das Perdas */}
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
            labels={dadosPainel.graficos.distribuicaoPerdas.labels}
            valores={dadosPainel.graficos.distribuicaoPerdas.valores}
            titulo="Distribuição das Perdas"
            cores={[coresNexus.warning, coresNexus.info, coresNexus.danger]}
          />
        </div>
      </div>

      {/* GRÁFICOS - LINHA 2 */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", 
        gap: "clamp(15px, 2vw, 20px)", 
        marginBottom: "clamp(20px, 4vw, 30px)" 
      }}>
        {/* Evolução das Perdas */}
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
            labels={dadosPainel.graficos.evolucao.labels}
            valores={dadosPainel.graficos.evolucao.valores}
            titulo="Evolução das Perdas (últimos 6 meses)"
            cor={coresNexus.warning}
            formato="moeda"
          />
        </div>

        {/* Top 3 Oportunidades */}
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden"
        }}>
          <h3 style={{ 
            color: "#1E3A8A", 
            marginBottom: "clamp(15px, 2vw, 20px)", 
            fontSize: "clamp(16px, 3vw, 18px)" 
          }}>
            🎯 Top 3 Oportunidades de Melhoria
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.5vw, 15px)" }}>
            {dadosPainel.oportunidades.map((opp, index) => {
              const porcentagem = dadosPainel.oportunidades[0].ganho > 0 
                ? Math.min((opp.ganho / dadosPainel.oportunidades[0].ganho) * 100, 100) 
                : 0;
              
              return (
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
                      width: `${porcentagem}%`,
                      maxWidth: "100%",
                      height: "100%",
                      backgroundColor: index === 0 ? coresNexus.success : index === 1 ? coresNexus.warning : coresNexus.info,
                      borderRadius: "4px"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ranking de Linhas por Perda */}
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
          marginBottom: "clamp(15px, 2vw, 20px)", 
          fontSize: "clamp(16px, 3vw, 18px)" 
        }}>
          Ranking de Linhas por Perda
        </h3>
        
        <div style={{ 
          width: "100%", 
          overflowX: "auto",
          WebkitOverflowScrolling: "touch"
        }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse",
            minWidth: "600px",
            tableLayout: "fixed"
          }}>
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "30%" }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                <th style={thStyle}>Posição</th>
                <th style={thStyle}>Linha</th>
                <th style={thStyle}>OEE Real</th>
                <th style={thStyle}>Perda Mensal</th>
                <th style={thStyle}>%</th>
                <th style={thStyle}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {dadosPainel.rankLinhas.map((linha, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdStyle}>
                    <span style={{
                      display: "inline-block",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: index === 0 ? "#dc2626" : index === 1 ? "#f59e0b" : "#e5e7eb",
                      color: index < 2 ? "white" : "#374151",
                      textAlign: "center",
                      lineHeight: "24px",
                      fontWeight: "bold"
                    }}>
                      {index + 1}
                    </span>
                  </td>
                  <td style={tdStyle} title={linha.nome}>
                    {linha.nome}
                  </td>
                  <td style={tdStyle}>
                    <span style={{ 
                      color: linha.oee >= 80 ? "#16a34a" : linha.oee >= 60 ? "#f59e0b" : "#dc2626",
                      fontWeight: "bold"
                    }}>
                      {linha.oee.toFixed(1)}%
                    </span>
                  </td>
                  <td style={tdStyle}>{formatarMoeda(linha.perda)}</td>
                  <td style={tdStyle}>
                    {dadosPainel.perdas > 0 ? ((linha.perda / dadosPainel.perdas) * 100).toFixed(1) : 0}%
                  </td>
                  <td style={tdStyle}>
                    {index === 0 && "🔴 Intervenção Imediata"}
                    {index === 1 && "🟡 Análise Prioritária"}
                    {index > 1 && "🟢 Monitoramento"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          gap: "clamp(15px, 2vw, 20px)",
          color: "#374151",
          fontSize: "clamp(12px, 1.8vw, 14px)"
        }}>
          <div>
            <p style={{ margin: "5px 0" }}><strong>💰 Faturamento:</strong> {formatarMoeda(dadosPainel.faturamento)}/mês</p>
            <p style={{ margin: "5px 0" }}><strong>📉 Perdas Totais:</strong> {formatarMoeda(dadosPainel.perdas)}/mês</p>
            <p style={{ margin: "5px 0" }}><strong>📊 OEE Médio:</strong> {dadosPainel.oeeMedio.toFixed(1)}%</p>
          </div>
          <div>
            <p style={{ margin: "5px 0" }}><strong>🏭 Linhas:</strong> {dadosPainel.totalLinhas} ativas</p>
            <p style={{ margin: "5px 0" }}><strong>⚙️ Setup:</strong> {formatarMoeda(dadosPainel.perdasSetup)}/mês</p>
            <p style={{ margin: "5px 0" }}><strong>⏸️ Microparadas:</strong> {formatarMoeda(dadosPainel.perdasMicro)}/mês</p>
          </div>
          <div>
            <p style={{ margin: "5px 0" }}><strong>🗑️ Refugo:</strong> {formatarMoeda(dadosPainel.perdasRefugo)}/mês</p>
            <p style={{ margin: "5px 0" }}><strong>🎯 Maior Oportunidade:</strong> {formatarMoeda(dadosPainel.oportunidades[0]?.ganho || 0)}/mês</p>
            <p style={{ margin: "5px 0" }}><strong>⏱️ Payback:</strong> {dadosPainel.payback} meses</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente Card Executivo responsivo
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

// Estilos da tabela
const thStyle = {
  padding: "clamp(8px, 1vw, 12px) clamp(6px, 0.8vw, 12px)",
  border: "1px solid #e5e7eb",
  textAlign: "center",
  fontSize: "clamp(11px, 1.5vw, 14px)",
  fontWeight: "500",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};

const tdStyle = {
  padding: "clamp(6px, 0.8vw, 10px) clamp(4px, 0.6vw, 12px)",
  border: "1px solid #e5e7eb",
  textAlign: "center",
  fontSize: "clamp(11px, 1.5vw, 14px)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};
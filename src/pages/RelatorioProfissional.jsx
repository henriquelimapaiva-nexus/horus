// src/pages/RelatorioProfissional.jsx
import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import logo from "../assets/logo.png";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Importar componentes de gráficos
import GraficoBarras from "../components/graficos/GraficoBarras";
import GraficoPizza from "../components/graficos/GraficoPizza";
import GraficoLinha from "../components/graficos/GraficoLinha";
import { coresNexus } from "../components/graficos/GraficoBase";

export default function RelatorioProfissional() {
  const { clienteAtual } = useOutletContext();
  const relatorioRef = useRef();

  const [empresas, setEmpresas] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [dadosRelatorio, setDadosRelatorio] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [gerandoIA, setGerandoIA] = useState(false);
  const [relatorioIA, setRelatorioIA] = useState("");
  const [erroIA, setErroIA] = useState("");
  const [tipoRelatorio, setTipoRelatorio] = useState("geral");
  
  // Dados para gráficos de projeção
  const [dadosProjecao, setDadosProjecao] = useState(null);
  // Flag para usar dados simulados
  const [usarSimulacao, setUsarSimulacao] = useState(false);

  const [filtros, setFiltros] = useState({
    empresaId: clienteAtual || "",
    linhaId: ""
  });

  // Carregar empresas
  useEffect(() => {
    api.get("/companies")
      .then(res => {
        setEmpresas(res.data);
        if (res.data.length === 0) {
          setUsarSimulacao(true);
        }
      })
      .catch(err => {
        console.error("Erro ao carregar empresas:", err);
        toast.error("Erro ao carregar empresas");
        setUsarSimulacao(true);
      });
  }, []);

  // Carregar linhas quando empresa mudar
  useEffect(() => {
    if (filtros.empresaId) {
      api.get(`/lines/${filtros.empresaId}`)
        .then(res => {
          setLinhas(res.data);
          if (res.data.length === 0) {
            setUsarSimulacao(true);
          }
        })
        .catch(err => {
          console.error("Erro ao carregar linhas:", err);
          toast.error("Erro ao carregar linhas");
          setUsarSimulacao(true);
        });
    } else {
      setLinhas([]);
    }
  }, [filtros.empresaId]);

  // ========================================
  // FUNÇÕES DE CÁLCULO
  // ========================================

  const calcularCustosMaoObra = async (empresaId, linhas) => {
    let custoTotal = 0;
    const custosPorLinha = [];

    for (const linha of linhas) {
      try {
        const postosRes = await api.get(`/work-stations/${linha.id}`);
        const postos = postosRes.data;
        
        let custoLinha = 0;
        for (const posto of postos) {
          if (posto.cargo_id) {
            const cargosRes = await api.get(`/roles/${empresaId}`);
            const cargo = cargosRes.data.find(c => c.id === posto.cargo_id);
            if (cargo) {
              const salario = parseFloat(cargo.salario_base) || 0;
              const encargos = parseFloat(cargo.encargos_percentual) || 70;
              custoLinha += salario * (1 + encargos / 100);
            }
          }
        }
        
        custoTotal += custoLinha;
        custosPorLinha.push({
          linha: linha.nome,
          custo: custoLinha
        });
      } catch (error) {
        console.error(`Erro ao calcular custos da linha ${linha.id}:`, error);
      }
    }

    return { custoTotal, custosPorLinha };
  };

  const calcularPerdasFinanceiras = async (linhaId, custoMinuto) => {
    try {
      const [postosRes, produtosRes, perdasRes] = await Promise.all([
        api.get(`/work-stations/${linhaId}`).catch(() => ({ data: [] })),
        api.get(`/line-products/${linhaId}`).catch(() => ({ data: [] })),
        api.get(`/losses/${linhaId}`).catch(() => ({ data: [] }))
      ]);

      const postos = postosRes.data;
      const produtos = produtosRes.data.dados || produtosRes.data || [];
      const perdas = perdasRes.data;

      let perdasSetup = 0;
      let perdasMicro = 0;
      let perdasRefugo = 0;

      postos.forEach(posto => {
        if (posto.tempo_setup_minutos) {
          perdasSetup += parseFloat(posto.tempo_setup_minutos) * custoMinuto;
        }
      });

      produtos.forEach(prod => {
        const perda = perdas.find(p => p.linha_produto_id === (prod.vinculo_id || prod.id));
        if (perda) {
          perdasMicro += (perda.microparadas_minutos || 0) * custoMinuto;
          perdasRefugo += (perda.refugo_pecas || 0) * (parseFloat(prod.valor_unitario) || 50);
        }
      });

      return {
        setup: perdasSetup * 22,
        micro: perdasMicro * 22,
        refugo: perdasRefugo * 22,
        total: (perdasSetup + perdasMicro + perdasRefugo) * 22
      };
    } catch (error) {
      console.error("Erro ao calcular perdas:", error);
      return { setup: 0, micro: 0, refugo: 0, total: 0 };
    }
  };

  // ✅ FUNÇÃO: Calcular variabilidade por posto
  const calcularVariabilidadePostos = async (postos, linhaId) => {
    const resultados = [];
    
    for (const posto of postos) {
      try {
        const variabilidadeRes = await api.get(`/variability/${posto.id}`).catch(() => ({ data: null }));
        
        if (variabilidadeRes.data && variabilidadeRes.data.estatisticas) {
          resultados.push({
            posto: posto.nome,
            cicloMedio: variabilidadeRes.data.estatisticas.media_segundos,
            desvio: variabilidadeRes.data.estatisticas.desvio_padrao,
            cv: parseFloat(variabilidadeRes.data.estatisticas.coeficiente_variacao),
            classificacao: variabilidadeRes.data.diagnostico?.classificacao || "Não disponível"
          });
        } else {
          resultados.push({
            posto: posto.nome,
            cicloMedio: posto.tempo_ciclo_segundos || 0,
            desvio: 0,
            cv: 0,
            classificacao: "Sem dados suficientes"
          });
        }
      } catch (error) {
        resultados.push({
          posto: posto.nome,
          cicloMedio: posto.tempo_ciclo_segundos || 0,
          desvio: 0,
          cv: 0,
          classificacao: "Erro ao carregar"
        });
      }
    }
    
    return resultados;
  };

  // ✅ NOVA FUNÇÃO: CALCULAR VPL E TIR
  const calcularVPL_TIR = (investimento, ganhoMensal, anos = 3, taxaDesconto = 0.12) => {
    const ganhoAnual = ganhoMensal * 12;
    
    let vpl = -investimento;
    for (let ano = 1; ano <= anos; ano++) {
      vpl += ganhoAnual / Math.pow(1 + taxaDesconto, ano);
    }
    
    let tir = 0;
    let step = 0.01;
    let vplTir = -investimento;
    
    while (vplTir < 0 && tir < 2) {
      tir += step;
      vplTir = -investimento;
      for (let ano = 1; ano <= anos; ano++) {
        vplTir += ganhoAnual / Math.pow(1 + tir, ano);
      }
    }
    
    return {
      vpl: vpl,
      tir: tir * 100,
      ganhoAnual: ganhoAnual,
      anos: anos,
      taxaDesconto: taxaDesconto * 100
    };
  };

  // ✅ FUNÇÃO: Gerar análise técnica detalhada (com texto corrido)
  const gerarAnaliseTecnicaDetalhada = (dados) => {
    let analise = "";
    
    if (dados.tipo === "geral") {
      analise = gerarAnaliseGeral(dados);
    } else {
      analise = gerarAnaliseEspecifica(dados);
    }
    
    return analise;
  };

  const gerarAnaliseGeral = (dados) => {
    const oeeMedio = dados.resumoFinanceiro.oeeMedio;
    const perdas = dados.resumoFinanceiro.perdas;
    const perdasTotal = dados.resumoFinanceiro.perdasTotais;
    const linhas = dados.linhas;
    const roi = dados.resumoFinanceiro.roi;
    
    // ✅ CALCULAR VPL E TIR
    const vplTir = calcularVPL_TIR(roi.investimento, roi.ganhoMensal, 3, 0.12);
    
    let analise = `
      ==========================================
      ANÁLISE TÉCNICA E RECOMENDAÇÕES
      ==========================================
      
      6.1 DIAGNÓSTICO DA OPERAÇÃO
      ------------------------------------------------------------------------------
      A operação da ${dados.empresa} apresenta um OEE médio de ${oeeMedio.toFixed(1)}%, 
      classificado como ${oeeMedio >= 85 ? "EXCELENTE (WORLD CLASS)" : oeeMedio >= 70 ? "BOM" : oeeMedio >= 60 ? "REGULAR" : "CRÍTICO"}.
      
      O benchmark de classe mundial (World Class) é 85%. A empresa está ${(85 - oeeMedio).toFixed(1)}% abaixo deste patamar,
      representando uma oportunidade de ganho significativa.
      
      6.2 IDENTIFICAÇÃO DOS GARGALOS
      ------------------------------------------------------------------------------
    `;
    
    linhas.forEach((linha, idx) => {
      const gargalo = linha.analise?.gargalo || "Não identificado";
      const oeeLinha = linha.analise?.eficiencia_percentual || 0;
      const classificacao = oeeLinha >= 85 ? "Excelente" : oeeLinha >= 70 ? "Bom" : oeeLinha >= 60 ? "Regular" : "Crítico";
      
      analise += `
      Linha ${idx + 1}: ${linha.nome}
      • Gargalo identificado: ${gargalo}
      • OEE atual: ${oeeLinha}% (${classificacao})
      • Potencial de melhoria: ${Math.max(0, 85 - oeeLinha).toFixed(1)} pontos percentuais
      `;
    });
    
    analise += `
      
      6.3 ANÁLISE DE PERDAS FINANCEIRAS
      ------------------------------------------------------------------------------
      • Setup: ${formatarMoeda(perdas.setup)}/mês (${((perdas.setup / perdasTotal) * 100).toFixed(1)}% do total)
      • Microparadas: ${formatarMoeda(perdas.micro)}/mês (${((perdas.micro / perdasTotal) * 100).toFixed(1)}% do total)
      • Refugo: ${formatarMoeda(perdas.refugo)}/mês (${((perdas.refugo / perdasTotal) * 100).toFixed(1)}% do total)
      • Total de perdas mensais: ${formatarMoeda(perdasTotal)}/mês
      
      O impacto financeiro anual das perdas é de ${formatarMoeda(perdasTotal * 12)}.
      
      6.4 PRIORIZAÇÃO DAS AÇÕES (MATRIZ GUT)
      ------------------------------------------------------------------------------
      A matriz GUT (Gravidade, Urgência, Tendência) foi aplicada para priorizar as ações:
      
    `;
    
    // Criar ações baseadas nos dados reais
    const acoes = [];
    
    if (perdas.setup > 0) {
      acoes.push({
        nome: "Redução de Setup",
        gravidade: 4,
        urgencia: 5,
        tendencia: 4,
        score: 80,
        prioridade: "ALTA"
      });
    }
    
    if (perdas.micro > 0) {
      acoes.push({
        nome: "Eliminação de Microparadas",
        gravidade: 3,
        urgencia: 4,
        tendencia: 3,
        score: 36,
        prioridade: "MÉDIA"
      });
    }
    
    if (perdas.refugo > 0) {
      acoes.push({
        nome: "Redução de Refugo",
        gravidade: 4,
        urgencia: 3,
        tendencia: 4,
        score: 48,
        prioridade: "MÉDIA-ALTA"
      });
    }
    
    // Balanceamento
    acoes.push({
      nome: "Balanceamento de Linhas",
      gravidade: 3,
      urgencia: 3,
      tendencia: 4,
      score: 36,
      prioridade: "MÉDIA"
    });
    
    acoes.forEach(acao => {
      analise += `      • ${acao.nome}: Score ${acao.score} (${acao.prioridade}) - G:${acao.gravidade} | U:${acao.urgencia} | T:${acao.tendencia}\n`;
    });
    
    analise += `
      
      6.5 RECOMENDAÇÕES ESTRATÉGICAS
      ------------------------------------------------------------------------------
      
      CURTO PRAZO (0-3 MESES) - Ações Imediatas:
      • Implementar programa SMED nos postos com maior tempo de setup
      • Realizar treinamento de operadores para redução de microparadas
      • Implantar gestão visual no chão de fábrica
      • Realizar análise de causa raiz dos principais defeitos
      
      MÉDIO PRAZO (3-6 MESES) - Investimentos Moderados:
      • Balanceamento das linhas de produção (Yamazumi)
      • Implantar sistema de manutenção autônoma (TPM)
      • Automatizar inspeções de qualidade
      • Implementar coleta de dados em tempo real
      
      LONGO PRAZO (6-12 MESES) - Transformação Cultural:
      • Estabelecer cultura de melhoria contínua (Kaizen)
      • Implementar sistema de gestão de performance (KPIs)
      • Automatizar processos críticos identificados
      • Certificar operadores em metodologias Lean
      
      6.6 PROJEÇÃO DE RESULTADOS
      ------------------------------------------------------------------------------
      Com a implementação das ações recomendadas, projeta-se:
      
      • Ganho mensal estimado: ${formatarMoeda(perdasTotal * 0.3)}
      • Payback do investimento: ${roi.payback} meses
      • ROI anual projetado: ${roi.roiAnual}%
      • VPL (${vplTir.anos} anos, taxa ${vplTir.taxaDesconto.toFixed(0)}%): ${formatarMoeda(vplTir.vpl)}
      • TIR: ${vplTir.tir.toFixed(1)}% ao ano
      • Novo OEE médio projetado: ${Math.min(85, oeeMedio * 1.2).toFixed(1)}%
      
      ==========================================
    `;
    
    return analise;
  };

  const gerarAnaliseEspecifica = (dados) => {
    const oee = dados.analise?.eficiencia_percentual || 0;
    const gargalo = dados.analise?.gargalo || "Não identificado";
    const perdas = dados.perdasFinanceiras;
    const perdasTotal = perdas.total;
    const roi = dados.roi;
    
    // ✅ CALCULAR VPL E TIR
    const vplTir = calcularVPL_TIR(roi.investimento, roi.ganhoMensal, 3, 0.12);
    
    let analise = `
      ==========================================
      ANÁLISE TÉCNICA E RECOMENDAÇÕES
      ==========================================
      
      6.1 DIAGNÓSTICO DA LINHA
      ------------------------------------------------------------------------------
      Linha: ${dados.linha}
      Empresa: ${dados.empresa}
      OEE Atual: ${oee}% - ${oee >= 85 ? "EXCELENTE" : oee >= 70 ? "BOM" : oee >= 60 ? "REGULAR" : "CRÍTICO"}
      Gargalo Identificado: ${gargalo}
      
      6.2 ANÁLISE DE VARIABILIDADE POR POSTO
      ------------------------------------------------------------------------------
    `;
    
    if (dados.analiseVariabilidade && dados.analiseVariabilidade.length > 0) {
      dados.analiseVariabilidade.forEach(p => {
        analise += `      • ${p.posto}: Ciclo médio ${p.cicloMedio}s | CV ${p.cv}% | ${p.classificacao}\n`;
      });
    } else {
      analise += `      Dados de variabilidade não disponíveis para análise detalhada.\n`;
    }
    
    analise += `
      
      6.3 ANÁLISE DE PERDAS FINANCEIRAS
      ------------------------------------------------------------------------------
      • Setup: ${formatarMoeda(perdas.setup)}/mês (${((perdas.setup / perdasTotal) * 100).toFixed(1)}% do total)
      • Microparadas: ${formatarMoeda(perdas.micro)}/mês (${((perdas.micro / perdasTotal) * 100).toFixed(1)}% do total)
      • Refugo: ${formatarMoeda(perdas.refugo)}/mês (${((perdas.refugo / perdasTotal) * 100).toFixed(1)}% do total)
      • Total de perdas mensais: ${formatarMoeda(perdasTotal)}/mês
      
      6.4 PRIORIZAÇÃO DAS AÇÕES (MATRIZ GUT)
      ------------------------------------------------------------------------------
      A matriz GUT (Gravidade, Urgência, Tendência) foi aplicada para priorizar as ações:
      
    `;
    
    // Ações específicas para linha
    const acoes = [];
    
    if (perdas.setup > 0) {
      acoes.push({
        nome: "Redução de Setup",
        gravidade: 4,
        urgencia: 5,
        tendencia: 4,
        score: 80,
        prioridade: "ALTA"
      });
    }
    if (perdas.micro > 0) {
      acoes.push({
        nome: "Eliminação de Microparadas",
        gravidade: 3,
        urgencia: 4,
        tendencia: 3,
        score: 36,
        prioridade: "MÉDIA"
      });
    }
    if (perdas.refugo > 0) {
      acoes.push({
        nome: "Redução de Refugo",
        gravidade: 4,
        urgencia: 3,
        tendencia: 4,
        score: 48,
        prioridade: "MÉDIA-ALTA"
      });
    }
    
    acoes.push({
      nome: "Balanceamento da Linha",
      gravidade: 3,
      urgencia: 3,
      tendencia: 4,
      score: 36,
      prioridade: "MÉDIA"
    });
    
    acoes.forEach(acao => {
      analise += `      • ${acao.nome}: Score ${acao.score} (${acao.prioridade}) - G:${acao.gravidade} | U:${acao.urgencia} | T:${acao.tendencia}\n`;
    });
    
    analise += `
      
      6.5 RECOMENDAÇÕES ESTRATÉGICAS
      ------------------------------------------------------------------------------
      
      CURTO PRAZO (0-3 MESES):
      • Implementar SMED no posto gargalo para redução de setup
      • Treinar operadores do posto gargalo
      • Padronizar procedimentos operacionais
      
      MÉDIO PRAZO (3-6 MESES):
      • Balancear a linha para equalizar tempos de ciclo
      • Implantar manutenção autônoma no equipamento gargalo
      • Automatizar inspeções de qualidade
      
      LONGO PRAZO (6-12 MESES):
      • Automatizar o posto gargalo (se viável)
      • Estabelecer cultura de melhoria contínua
      • Implementar sistema de gestão visual
      
      6.6 PROJEÇÃO DE RESULTADOS
      ------------------------------------------------------------------------------
      • Ganho mensal estimado: ${formatarMoeda(perdasTotal * 0.3)}
      • Payback do investimento: ${roi.payback} meses
      • ROI anual projetado: ${roi.roiAnual}%
      • VPL (${vplTir.anos} anos, taxa ${vplTir.taxaDesconto.toFixed(0)}%): ${formatarMoeda(vplTir.vpl)}
      • TIR: ${vplTir.tir.toFixed(1)}% ao ano
      • Novo OEE projetado: ${Math.min(85, oee * 1.2).toFixed(1)}%
      
      ==========================================
    `;
    
    return analise;
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const calcularProjecoes = (dados) => {
    let oeeAtual, capacidadeAtual, perdasAtuais;
    
    if (dados.tipo === "geral") {
      oeeAtual = dados.resumoFinanceiro?.oeeMedio || 73.3;
      capacidadeAtual = 3000;
      perdasAtuais = dados.resumoFinanceiro?.perdasTotais || 39700;
    } else {
      oeeAtual = dados.analise?.eficiencia_percentual || 72;
      capacidadeAtual = dados.analise?.capacidade_estimada_dia || 850;
      perdasAtuais = dados.perdasFinanceiras?.total || 39700;
    }
    
    const cenarios = [
      { nome: "Cenário 10%", fator: 1.1 },
      { nome: "Cenário 20%", fator: 1.2 },
      { nome: "Cenário 30%", fator: 1.3 }
    ];

    const oeeProjetado = cenarios.map(c => ({
      nome: c.nome,
      valor: Math.min(100, oeeAtual * c.fator)
    }));

    const capacidadeProjetada = cenarios.map(c => ({
      nome: c.nome,
      valor: Math.floor(capacidadeAtual * c.fator)
    }));

    const perdasProjetadas = cenarios.map(c => ({
      nome: c.nome,
      valor: perdasAtuais * (1 - (c.fator - 1) * 0.5)
    }));

    const ganhosAcumulados = [0];
    for (let i = 1; i <= 6; i++) {
      ganhosAcumulados.push(ganhosAcumulados[i-1] + (perdasAtuais * 0.2));
    }

    return {
      oeeProjetado,
      capacidadeProjetada,
      perdasProjetadas,
      ganhosAcumulados,
      labelsMeses: ['Mês 1', 'Mês 2', 'Mês 3', 'Mês 4', 'Mês 5', 'Mês 6']
    };
  };

  const calcularROI = (perdasTotais) => {
    const investimentoSugerido = 50000;
    const ganhoMensal = perdasTotais * 0.3;
    const payback = investimentoSugerido / ganhoMensal;
    const roiAnual = (ganhoMensal * 12 / investimentoSugerido) * 100;

    return {
      investimento: investimentoSugerido,
      ganhoMensal,
      payback: payback.toFixed(1),
      roiAnual: roiAnual.toFixed(0)
    };
  };

  const exportarExcel = () => {
    if (!dadosRelatorio) return;

    let csv = "";
    
    if (dadosRelatorio.tipo === "geral") {
      csv += "=== RESUMO GERAL DA EMPRESA ===\n";
      csv += `Empresa,${dadosRelatorio.empresa}\n`;
      csv += `Data,${dadosRelatorio.data}\n`;
      csv += `Total de Linhas,${dadosRelatorio.linhas.length}\n`;
      csv += `Custo Mão de Obra,${formatarMoeda(dadosRelatorio.resumoFinanceiro.custoMaoObra)}\n`;
      csv += `Perdas Totais,${formatarMoeda(dadosRelatorio.resumoFinanceiro.perdasTotais)}\n`;
      csv += `Oportunidade (30%),${formatarMoeda(dadosRelatorio.resumoFinanceiro.perdasTotais * 0.3)}\n\n`;

      csv += "=== DETALHAMENTO POR LINHA ===\n";
      csv += "Linha,OEE (%),Gargalo,Custo Mensal,Perdas Estimadas\n";
      
      dadosRelatorio.linhas.forEach((linha, idx) => {
        const custoLinha = dadosRelatorio.resumoFinanceiro.custosPorLinha[idx]?.custo || 0;
        csv += `${linha.nome},${linha.analise?.eficiencia_percentual || 0},${linha.analise?.gargalo || "-"},${formatarMoeda(custoLinha)},${formatarMoeda(custoLinha * 0.2)}\n`;
      });
      
      csv += "\n=== PERDAS DETALHADAS ===\n";
      csv += `Setup,${formatarMoeda(dadosRelatorio.resumoFinanceiro.perdas.setup)}\n`;
      csv += `Microparadas,${formatarMoeda(dadosRelatorio.resumoFinanceiro.perdas.micro)}\n`;
      csv += `Refugo,${formatarMoeda(dadosRelatorio.resumoFinanceiro.perdas.refugo)}\n`;
      csv += `Total,${formatarMoeda(dadosRelatorio.resumoFinanceiro.perdasTotais)}\n\n`;

      csv += "=== ANÁLISE DE RETORNO ===\n";
      csv += `Investimento Sugerido,${formatarMoeda(dadosRelatorio.resumoFinanceiro.roi.investimento)}\n`;
      csv += `Ganho Mensal (30%),${formatarMoeda(dadosRelatorio.resumoFinanceiro.roi.ganhoMensal)}\n`;
      csv += `Payback,${dadosRelatorio.resumoFinanceiro.roi.payback} meses\n`;
      csv += `ROI Anual,${dadosRelatorio.resumoFinanceiro.roi.roiAnual}%\n`;

    } else {
      csv += "=== RELATÓRIO ESPECÍFICO ===\n";
      csv += `Empresa,${dadosRelatorio.empresa}\n`;
      csv += `Linha,${dadosRelatorio.linha}\n`;
      csv += `Data,${dadosRelatorio.data}\n`;
      csv += `OEE,${dadosRelatorio.analise?.eficiencia_percentual || 0}%\n`;
      csv += `Gargalo,${dadosRelatorio.analise?.gargalo || "Não identificado"}\n`;
      csv += `Capacidade,${dadosRelatorio.analise?.capacidade_estimada_dia || 0} peças/dia\n`;
      csv += `Custo Mão Obra,${formatarMoeda(dadosRelatorio.custoMaoObra)}\n\n`;

      csv += "=== POSTOS DE TRABALHO ===\n";
      csv += "Posto,Ciclo (s),Setup (min),Disponibilidade (%)\n";
      
      dadosRelatorio.postos?.forEach((posto) => {
        csv += `${posto.nome},${posto.tempo_ciclo_segundos || 0},${posto.tempo_setup_minutos || 0},${posto.disponibilidade_percentual || 0}\n`;
      });
      
      csv += "\n=== PERDAS FINANCEIRAS ===\n";
      csv += `Setup,${formatarMoeda(dadosRelatorio.perdasFinanceiras.setup)}\n`;
      csv += `Microparadas,${formatarMoeda(dadosRelatorio.perdasFinanceiras.micro)}\n`;
      csv += `Refugo,${formatarMoeda(dadosRelatorio.perdasFinanceiras.refugo)}\n`;
      csv += `Total,${formatarMoeda(dadosRelatorio.perdasFinanceiras.total)}\n\n`;

      csv += "=== ANÁLISE DE RETORNO ===\n";
      csv += `Investimento,${formatarMoeda(dadosRelatorio.roi.investimento)}\n`;
      csv += `Ganho Mensal,${formatarMoeda(dadosRelatorio.roi.ganhoMensal)}\n`;
      csv += `Payback,${dadosRelatorio.roi.payback} meses\n`;
      csv += `ROI Anual,${dadosRelatorio.roi.roiAnual}%\n`;
    }

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_${dadosRelatorio.empresa}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Arquivo Excel exportado com sucesso!");
  };

  const gerarPDF = () => {
    window.print();
  };

  const gerarRelatorioComIA = async (dados) => {
    setGerandoIA(true);
    setErroIA("");

    try {
      const analiseTecnica = gerarAnaliseTecnicaDetalhada(dados);
      setRelatorioIA(analiseTecnica);
      toast.success("Análise técnica gerada com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar análise:", error);
      setErroIA(error.message);
      toast.error("Erro ao gerar análise técnica");
    } finally {
      setGerandoIA(false);
    }
  };

  const gerarDadosSimulados = (tipo) => {
    if (tipo === "geral") {
      return {
        tipo: "geral",
        empresa: "Empresa Teste (Dados Simulados)",
        linhas: [
          { nome: "Linha A", analise: { eficiencia_percentual: 72, gargalo: "Estação 4" } },
          { nome: "Linha B", analise: { eficiencia_percentual: 85, gargalo: "Estação 2" } },
          { nome: "Linha C", analise: { eficiencia_percentual: 63, gargalo: "Estação 1" } }
        ],
        data: new Date().toLocaleDateString('pt-BR'),
        resumoFinanceiro: {
          custoMaoObra: 125000,
          custosPorLinha: [
            { linha: "Linha A", custo: 45000 },
            { linha: "Linha B", custo: 42000 },
            { linha: "Linha C", custo: 38000 }
          ],
          perdas: {
            setup: 18500,
            micro: 12300,
            refugo: 8900,
            total: 39700
          },
          perdasTotais: 39700,
          oeeMedio: 73.3,
          gargalosCriticos: 2,
          roi: {
            investimento: 50000,
            ganhoMensal: 11910,
            payback: "4.2",
            roiAnual: "286"
          }
        }
      };
    } else {
      return {
        tipo: "especifico",
        empresa: "Empresa Teste (Dados Simulados)",
        linha: "Linha de Produção Principal",
        analise: {
          eficiencia_percentual: 72,
          gargalo: "Estação 4",
          capacidade_estimada_dia: 850,
          meta_diaria_planejada: 1000
        },
        postos: [
          { nome: "Estação 1", tempo_ciclo_segundos: 45, tempo_setup_minutos: 12, disponibilidade_percentual: 95 },
          { nome: "Estação 2", tempo_ciclo_segundos: 48, tempo_setup_minutos: 15, disponibilidade_percentual: 92 },
          { nome: "Estação 3", tempo_ciclo_segundos: 52, tempo_setup_minutos: 18, disponibilidade_percentual: 88 },
          { nome: "Estação 4", tempo_ciclo_segundos: 68, tempo_setup_minutos: 25, disponibilidade_percentual: 78 },
          { nome: "Estação 5", tempo_ciclo_segundos: 44, tempo_setup_minutos: 10, disponibilidade_percentual: 96 }
        ],
        balanceamento: {
          indice_balanceamento_percentual: 76,
          tempo_medio_segundos: 51.4,
          maior_tempo_segundos: 68,
          menor_tempo_segundos: 44,
          postos: [
            { posto: "Estação 1", ciclo_real: 45 },
            { posto: "Estação 2", ciclo_real: 48 },
            { posto: "Estação 3", ciclo_real: 52 },
            { posto: "Estação 4", ciclo_real: 68 },
            { posto: "Estação 5", ciclo_real: 44 }
          ]
        },
        data: new Date().toLocaleDateString('pt-BR'),
        custoMaoObra: 125000,
        custoMinuto: 11.84,
        perdasFinanceiras: {
          setup: 18500,
          micro: 12300,
          refugo: 8900,
          total: 39700
        },
        roi: {
          investimento: 50000,
          ganhoMensal: 11910,
          payback: "4.2",
          roiAnual: "286"
        }
      };
    }
  };

  async function gerarRelatorio() {
    if (!filtros.empresaId && !usarSimulacao) {
      toast.error("Selecione uma empresa");
      return;
    }

    if (tipoRelatorio === "especifico" && !filtros.linhaId && !usarSimulacao) {
      toast.error("Selecione uma linha para o relatório específico");
      return;
    }

    setCarregando(true);
    setRelatorioIA("");
    setErroIA("");
    setDadosProjecao(null);

    try {
      let dadosCompletos;
      
      if (usarSimulacao) {
        dadosCompletos = gerarDadosSimulados(tipoRelatorio);
        toast.info("Usando dados simulados para demonstração");
      } else {
        const empresa = empresas.find(e => e.id === parseInt(filtros.empresaId));
        
        if (tipoRelatorio === "geral") {
          const linhasRes = await api.get(`/lines/${filtros.empresaId}`);
          const linhasData = linhasRes.data;
          
          const { custoTotal, custosPorLinha } = await calcularCustosMaoObra(filtros.empresaId, linhasData);
          
          const custoMinuto = custoTotal / (22 * 8 * 60);
          let perdasTotais = { setup: 0, micro: 0, refugo: 0, total: 0 };
          
          for (const linha of linhasData) {
            const perdasLinha = await calcularPerdasFinanceiras(linha.id, custoMinuto);
            perdasTotais.setup += perdasLinha.setup;
            perdasTotais.micro += perdasLinha.micro;
            perdasTotais.refugo += perdasLinha.refugo;
            perdasTotais.total += perdasLinha.total;
          }

          const roi = calcularROI(perdasTotais.total);

          const dadosLinhas = await Promise.all(
            linhasData.map(async (linha) => {
              const [analise] = await Promise.all([
                api.get(`/analise-linha/${linha.id}`).catch(() => ({ data: {} }))
              ]);
              
              return {
                ...linha,
                analise: analise.data
              };
            })
          );

          const oeeMedio = dadosLinhas.reduce((acc, l) => 
            acc + parseFloat(l.analise?.eficiencia_percentual || 0), 0) / dadosLinhas.length;
          
          dadosCompletos = {
            tipo: "geral",
            empresa: empresa.nome,
            linhas: dadosLinhas,
            data: new Date().toLocaleDateString('pt-BR'),
            resumoFinanceiro: {
              custoMaoObra: custoTotal,
              custosPorLinha,
              perdas: perdasTotais,
              perdasTotais: perdasTotais.total,
              oeeMedio,
              roi
            }
          };

        } else {
          const [analise, postos] = await Promise.all([
            api.get(`/analise-linha/${filtros.linhaId}`).catch(() => ({ data: {} })),
            api.get(`/work-stations/${filtros.linhaId}`).catch(() => ({ data: [] }))
          ]);

          const { custoTotal } = await calcularCustosMaoObra(filtros.empresaId, [analise.data]);
          const custoMinuto = custoTotal / (22 * 8 * 60);
          
          const perdasFinanceiras = await calcularPerdasFinanceiras(filtros.linhaId, custoMinuto);
          const roi = calcularROI(perdasFinanceiras.total);
          
          const analiseVariabilidade = await calcularVariabilidadePostos(postos.data, filtros.linhaId);

          const linha = linhas.find(l => l.id === parseInt(filtros.linhaId));

          dadosCompletos = {
            tipo: "especifico",
            empresa: empresa.nome,
            linha: linha?.nome,
            analise: analise.data,
            postos: postos.data,
            analiseVariabilidade,
            data: new Date().toLocaleDateString('pt-BR'),
            custoMaoObra: custoTotal,
            custoMinuto,
            perdasFinanceiras,
            roi
          };
        }
      }

      setDadosRelatorio(dadosCompletos);
      
      const projecoes = calcularProjecoes(dadosCompletos);
      setDadosProjecao(projecoes);
      
      await gerarRelatorioComIA(dadosCompletos);

    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao carregar dados. Verifique o console.");
    } finally {
      setCarregando(false);
    }
  }

  // Componentes auxiliares
  function CardResumo({ titulo, valor, cor = "#1E3A8A" }) {
    return (
      <div style={{ 
        backgroundColor: "white", 
        padding: "15px", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        borderLeft: `4px solid ${cor}`
      }}>
        <div style={{ color: "#666", fontSize: "13px", marginBottom: "5px" }}>{titulo}</div>
        <div style={{ fontSize: "24px", fontWeight: "bold", color: cor }}>{valor}</div>
      </div>
    );
  }

  function CardROI({ titulo, valor, descricao, cor = "#1E3A8A" }) {
    return (
      <div style={{ 
        backgroundColor: "white", 
        padding: "15px", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        textAlign: "center"
      }}>
        <div style={{ color: "#666", fontSize: "12px", marginBottom: "5px" }}>{titulo}</div>
        <div style={{ fontSize: "20px", fontWeight: "bold", color: cor }}>{valor}</div>
        <div style={{ color: "#999", fontSize: "11px", marginTop: "5px" }}>{descricao}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Cabeçalho com logo */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <img src={logo} alt="Nexus Engenharia Aplicada" style={{ width: "200px", marginBottom: "10px" }} />
        <h1 style={{ color: "#1E3A8A", margin: "5px 0", fontSize: "28px" }}>
          NEXUS ENGENHARIA APLICADA
        </h1>
        <h2 style={{ color: "#666", fontWeight: "300", margin: "0", fontSize: "20px" }}>
          Relatório de Diagnóstico
        </h2>
      </div>

      {/* Filtros */}
      <div className="no-print" style={{ 
        backgroundColor: "white", 
        padding: "25px", 
        borderRadius: "8px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "30px"
      }}>
        <h3 style={{ color: "#1E3A8A", marginBottom: "20px" }}>Selecione os dados para o relatório</h3>
        
        <div style={{ marginBottom: "20px" }}>
          <label style={labelStyle}>Tipo de Relatório:</label>
          <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <input
                type="radio"
                checked={tipoRelatorio === "geral"}
                onChange={() => setTipoRelatorio("geral")}
              />
              Relatório Geral (Todas as linhas)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <input
                type="radio"
                checked={tipoRelatorio === "especifico"}
                onChange={() => setTipoRelatorio("especifico")}
              />
              Relatório Específico (Linha única)
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px" }}>
            <label style={labelStyle}>Empresa:</label>
            <select
              value={filtros.empresaId}
              onChange={(e) => setFiltros({ ...filtros, empresaId: e.target.value, linhaId: "" })}
              style={inputStyle}
            >
              <option value="">Selecione uma empresa...</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nome}</option>
              ))}
            </select>
          </div>

          {tipoRelatorio === "especifico" && (
            <div style={{ flex: "1 1 300px" }}>
              <label style={labelStyle}>Linha:</label>
              <select
                value={filtros.linhaId}
                onChange={(e) => setFiltros({ ...filtros, linhaId: e.target.value })}
                style={inputStyle}
                disabled={!filtros.empresaId}
              >
                <option value="">Selecione uma linha...</option>
                {linhas.map(linha => (
                  <option key={linha.id} value={linha.id}>{linha.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
          <Botao
            variant="primary"
            size="md"
            onClick={gerarRelatorio}
            disabled={carregando || gerandoIA}
            loading={carregando}
          >
            {carregando ? "Gerando..." : "Gerar Relatório"}
          </Botao>
          
          {dadosRelatorio && (
            <>
              <Botao
                variant="secondary"
                size="md"
                onClick={exportarExcel}
                disabled={gerandoIA}
              >
                📊 Exportar Excel
              </Botao>
              
              <Botao
                variant="success"
                size="md"
                onClick={gerarPDF}
              >
                📄 Exportar PDF
              </Botao>
            </>
          )}
        </div>
      </div>

      {/* CONTEÚDO DO RELATÓRIO */}
      {(carregando || gerandoIA) && (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          {carregando ? "Carregando dados..." : "Gerando análise... Isso pode levar alguns segundos."}
        </div>
      )}

      {dadosRelatorio && !carregando && !gerandoIA && (
        <div className="relatorio-print" ref={relatorioRef} style={{ position: "relative" }}>
          {/* Marca d'água sutil */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-45deg)",
            opacity: 0.03,
            fontSize: "80px",
            color: "#1E3A8A",
            pointerEvents: "none",
            zIndex: 0,
            whiteSpace: "nowrap",
            fontWeight: "bold"
          }}>
            NEXUS
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            
            {/* DADOS DO CLIENTE */}
            <div style={{ marginBottom: "30px", textAlign: "center" }}>
              <h3 style={{ color: "#1E3A8A", marginBottom: "5px", fontSize: "20px" }}>
                {dadosRelatorio.empresa}
              </h3>
              {dadosRelatorio.tipo === "especifico" && (
                <h4 style={{ color: "#666", fontWeight: "normal", marginBottom: "5px" }}>
                  {dadosRelatorio.linha}
                </h4>
              )}
              <p style={{ color: "#666", fontSize: "14px" }}>Data: {dadosRelatorio.data}</p>
            </div>

            {/* SEÇÃO 1 - RESUMO GERAL/EXECUTIVO */}
            <h2 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "20px" }}>
              1. {dadosRelatorio.tipo === "geral" ? "RESUMO GERAL DA EMPRESA" : "RESUMO EXECUTIVO"}
            </h2>
            
            {dadosRelatorio.tipo === "geral" ? (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                gap: "20px", 
                marginBottom: "30px" 
              }}>
                <CardResumo 
                  titulo="Total de Linhas" 
                  valor={dadosRelatorio.linhas.length} 
                />
                <CardResumo 
                  titulo="Custo Mão de Obra" 
                  valor={formatarMoeda(dadosRelatorio.resumoFinanceiro.custoMaoObra)} 
                />
                <CardResumo 
                  titulo="Perdas Totais" 
                  valor={formatarMoeda(dadosRelatorio.resumoFinanceiro.perdasTotais)} 
                  cor="#dc2626"
                />
                <CardResumo 
                  titulo="Oportunidade" 
                  valor={formatarMoeda(dadosRelatorio.resumoFinanceiro.perdasTotais * 0.3)} 
                  cor="#16a34a"
                />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
                <div>
                  <p><strong>OEE:</strong> {dadosRelatorio.analise?.eficiencia_percentual || 0}%</p>
                  <p><strong>Gargalo:</strong> {dadosRelatorio.analise?.gargalo || "Não identificado"}</p>
                  <p><strong>Capacidade:</strong> {dadosRelatorio.analise?.capacidade_estimada_dia || 0} pç/dia</p>
                </div>
                <div>
                  <p><strong>Custo Mão Obra:</strong> {formatarMoeda(dadosRelatorio.custoMaoObra)}/mês</p>
                  <p><strong>Custo/minuto:</strong> {formatarMoeda(dadosRelatorio.custoMinuto)}</p>
                  <p><strong>Perdas Totais:</strong> {formatarMoeda(dadosRelatorio.perdasFinanceiras.total)}/mês</p>
                </div>
              </div>
            )}

            {/* SEÇÃO 2 - PROJEÇÕES DE MELHORIA */}
            {dadosProjecao && (
              <>
                <h2 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "20px" }}>
                  2. PROJEÇÕES DE MELHORIA
                </h2>
                
                <div style={{ marginBottom: "30px" }}>
                  <GraficoBarras 
                    labels={dadosProjecao.oeeProjetado.map(c => c.nome)}
                    valores={dadosProjecao.oeeProjetado.map(c => c.valor)}
                    titulo="OEE Projetado por Cenário (%)"
                    cor={coresNexus.primary}
                    formato="percentual"
                  />
                </div>

                <div style={{ marginBottom: "30px" }}>
                  <GraficoBarras 
                    labels={dadosProjecao.capacidadeProjetada.map(c => c.nome)}
                    valores={dadosProjecao.capacidadeProjetada.map(c => c.valor)}
                    titulo="Capacidade Projetada (peças/dia)"
                    cor={coresNexus.success}
                    formato="numero"
                  />
                </div>

                <div style={{ marginBottom: "30px" }}>
                  <GraficoLinha 
                    labels={dadosProjecao.perdasProjetadas.map(c => c.nome)}
                    valores={dadosProjecao.perdasProjetadas.map(c => c.valor)}
                    titulo="Redução de Perdas por Cenário (R$/mês)"
                    cor={coresNexus.danger}
                    formato="moeda"
                  />
                </div>

                <div style={{ marginBottom: "30px" }}>
                  <GraficoLinha 
                    labels={dadosProjecao.labelsMeses}
                    valores={dadosProjecao.ganhosAcumulados.slice(1)}
                    titulo="Ganhos Acumulados (R$) - Cenário 20%"
                    cor={coresNexus.warning}
                    formato="moeda"
                  />
                </div>
              </>
            )}

            {/* SEÇÃO 3 - ANÁLISE FINANCEIRA */}
            <h2 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "20px" }}>
              3. ANÁLISE FINANCEIRA
            </h2>
            
            {dadosRelatorio.tipo === "geral" ? (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(3, 1fr)", 
                gap: "20px", 
                marginBottom: "20px" 
              }}>
                <div>
                  <p><strong>Setup:</strong> {formatarMoeda(dadosRelatorio.resumoFinanceiro.perdas.setup)}</p>
                </div>
                <div>
                  <p><strong>Microparadas:</strong> {formatarMoeda(dadosRelatorio.resumoFinanceiro.perdas.micro)}</p>
                </div>
                <div>
                  <p><strong>Refugo:</strong> {formatarMoeda(dadosRelatorio.resumoFinanceiro.perdas.refugo)}</p>
                </div>
              </div>
            ) : (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(3, 1fr)", 
                gap: "20px", 
                marginBottom: "20px" 
              }}>
                <div>
                  <p><strong>Setup:</strong> {formatarMoeda(dadosRelatorio.perdasFinanceiras.setup)}</p>
                </div>
                <div>
                  <p><strong>Microparadas:</strong> {formatarMoeda(dadosRelatorio.perdasFinanceiras.micro)}</p>
                </div>
                <div>
                  <p><strong>Refugo:</strong> {formatarMoeda(dadosRelatorio.perdasFinanceiras.refugo)}</p>
                </div>
              </div>
            )}

            {/* Gráfico de Pizza - Perdas */}
            <div style={{ marginBottom: "30px" }}>
              <GraficoPizza 
                labels={['Setup', 'Microparadas', 'Refugo']}
                valores={dadosRelatorio.tipo === "geral" 
                  ? [
                      dadosRelatorio.resumoFinanceiro.perdas.setup,
                      dadosRelatorio.resumoFinanceiro.perdas.micro,
                      dadosRelatorio.resumoFinanceiro.perdas.refugo
                    ]
                  : [
                      dadosRelatorio.perdasFinanceiras.setup,
                      dadosRelatorio.perdasFinanceiras.micro,
                      dadosRelatorio.perdasFinanceiras.refugo
                    ]
                }
                titulo="Distribuição das Perdas (R$/mês)"
                cores={[coresNexus.warning, coresNexus.info, coresNexus.danger]}
              />
            </div>

            {/* SEÇÃO 4 - DETALHAMENTO POR LINHA (para geral) */}
            {dadosRelatorio.tipo === "geral" && (
              <>
                <h2 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "20px" }}>
                  4. DETALHAMENTO POR LINHA
                </h2>
                
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                      <th style={thStyle}>Linha</th>
                      <th style={thStyle}>OEE (%)</th>
                      <th style={thStyle}>Gargalo</th>
                      <th style={thStyle}>Custo Mensal</th>
                      <th style={thStyle}>Perdas Estimadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosRelatorio.linhas.map((linha, idx) => {
                      const custoLinha = dadosRelatorio.resumoFinanceiro.custosPorLinha[idx]?.custo || 0;
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={tdStyle}>{linha.nome}</td>
                          <td style={tdStyle}>{linha.analise?.eficiencia_percentual || 0}%</td>
                          <td style={tdStyle}>{linha.analise?.gargalo || "-"}</td>
                          <td style={tdStyle}>{formatarMoeda(custoLinha)}</td>
                          <td style={tdStyle}>{formatarMoeda(custoLinha * 0.2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}

            {/* SEÇÃO 5 - ANÁLISE DE RETORNO */}
            <h2 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "20px" }}>
              5. ANÁLISE DE RETORNO
            </h2>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(3, 1fr)", 
              gap: "20px",
              marginBottom: "30px"
            }}>
              <CardROI 
                titulo="Investimento"
                valor={formatarMoeda(dadosRelatorio.tipo === "geral" 
                  ? dadosRelatorio.resumoFinanceiro.roi.investimento
                  : dadosRelatorio.roi.investimento)}
                descricao="Sugerido para melhorias"
              />
              <CardROI 
                titulo="Ganho Mensal"
                valor={formatarMoeda(dadosRelatorio.tipo === "geral"
                  ? dadosRelatorio.resumoFinanceiro.roi.ganhoMensal
                  : dadosRelatorio.roi.ganhoMensal)}
                descricao="30% de redução nas perdas"
                cor="#16a34a"
              />
              <CardROI 
                titulo="Payback"
                valor={`${dadosRelatorio.tipo === "geral"
                  ? dadosRelatorio.resumoFinanceiro.roi.payback
                  : dadosRelatorio.roi.payback} meses`}
                descricao={`ROI Anual: ${dadosRelatorio.tipo === "geral"
                  ? dadosRelatorio.resumoFinanceiro.roi.roiAnual
                  : dadosRelatorio.roi.roiAnual}%`}
                cor="#16a34a"
              />
            </div>

            {/* SEÇÃO 6 - ANÁLISE TÉCNICA E RECOMENDAÇÕES */}
            {relatorioIA && (
              <>
                <h2 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "20px" }}>
                  6. ANÁLISE TÉCNICA E RECOMENDAÇÕES
                </h2>
                
                <div style={{
                  whiteSpace: "pre-line",
                  lineHeight: "1.6",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "14px",
                  color: "#000000",
                  marginBottom: "40px",
                  backgroundColor: "#f9fafb",
                  padding: "20px",
                  borderRadius: "8px",
                  borderLeft: "4px solid #1E3A8A"
                }}>
                  {relatorioIA
                    .replace(/\*\*/g, '')
                    .replace(/\*/g, '')
                    .replace(/#/g, '')
                    .replace(/_/g, '')
                  }
                </div>
              </>
            )}

            {/* MENSAGEM DE ERRO DA IA */}
            {erroIA && (
              <div style={{
                marginTop: "20px",
                padding: "15px",
                backgroundColor: "#fee2e2",
                borderRadius: "4px",
                color: "#dc2626",
                border: "1px solid #dc2626"
              }}>
                <strong>Erro ao gerar análise:</strong> {erroIA}
              </div>
            )}

            {/* SEÇÃO FINAL - ASSINATURA */}
            <div style={{ marginTop: "50px", textAlign: "center" }}>
              <p>____________________________________</p>
              <p style={{ marginTop: "5px" }}><strong>Eng. Henrique de Lima Paiva</strong></p>
              <p style={{ color: "#666", fontSize: "14px" }}>Consultor Sênior - Nexus Engenharia Aplicada</p>
              <p style={{ color: "#666", fontSize: "12px", marginTop: "10px" }}>
                Contato: henrique@nexus.com.br | (11) 99999-9999
              </p>
            </div>

            {/* 🖨️ CSS PARA IMPRESSÃO */}
            <style>{`
              @media print {
                .no-print, 
                button, 
                select, 
                input,
                .btn-container {
                  display: none !important;
                }
                
                @page {
                  size: A4;
                  margin: 2cm;
                }
                
                body {
                  background: white;
                  margin: 0;
                  padding: 0;
                  zoom: 0.8;
                }
                
                .relatorio-print {
                  width: 100%;
                  max-width: 100%;
                  margin: 0;
                  padding: 0;
                  background: white;
                  font-size: 12pt;
                  line-height: 1.5;
                  color: black;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                
                div[style*="background-color"] {
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                
                table {
                  page-break-inside: avoid;
                }
                
                canvas {
                  page-break-inside: avoid;
                  max-width: 100% !important;
                  height: auto !important;
                }
                
                h1, h2, h3 {
                  page-break-after: avoid;
                }
                
                div[style*="opacity: 0.03"] {
                  display: none;
                }
                
                p, li {
                  orphans: 3;
                  widows: 3;
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos
const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "14px",
  fontWeight: "500"
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none"
};

const thStyle = {
  padding: "12px",
  border: "1px solid #e5e7eb",
  textAlign: "center",
  fontSize: "14px",
  fontWeight: "500"
};

const tdStyle = {
  padding: "8px 10px",
  border: "1px solid #e5e7eb",
  textAlign: "center",
  fontSize: "13px"
};
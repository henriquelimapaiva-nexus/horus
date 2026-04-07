// src/pages/ValidacaoResultados.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Card from "../components/ui/Card";
import Botao from "../components/ui/Botao";
import Input from "../components/ui/Input";
import toast from "react-hot-toast";
import logo from "../assets/logo.png";

export default function ValidacaoResultados() {
  const { clienteAtual } = useOutletContext();
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState(null);
  const [empresaNome, setEmpresaNome] = useState("");
  
  const [periodoAntes, setPeriodoAntes] = useState({
    inicio: "",
    fim: ""
  });
  const [periodoDepois, setPeriodoDepois] = useState({
    inicio: "",
    fim: ""
  });

  useEffect(() => {
    if (clienteAtual) {
      const carregarEmpresa = async () => {
        try {
          const res = await api.get(`/companies`);
          const empresa = res.data.find(c => c.id === parseInt(clienteAtual));
          if (empresa) {
            setEmpresaNome(empresa.nome);
          }
        } catch (err) {
          console.error("Erro ao carregar empresa:", err);
        }
      };
      carregarEmpresa();
    }
  }, [clienteAtual]);

  const carregarDados = async () => {
    if (!clienteAtual) {
      toast.error("Selecione uma empresa primeiro");
      return;
    }

    if (!periodoAntes.inicio || !periodoAntes.fim || !periodoDepois.inicio || !periodoDepois.fim) {
      toast.error("Preencha as datas de início e fim para ambos os períodos");
      return;
    }

    setCarregando(true);
    toast.loading("Carregando dados de validação...", { id: "validacao" });

    try {
      const response = await api.get(`/evolution/compare/${clienteAtual}`, {
        params: {
          antes_inicio: periodoAntes.inicio,
          antes_fim: periodoAntes.fim,
          depois_inicio: periodoDepois.inicio,
          depois_fim: periodoDepois.fim
        }
      });
      setDados(response.data);
      toast.success("Dados carregados com sucesso!", { id: "validacao" });
    } catch (error) {
      console.error("Erro ao carregar validação:", error);
      toast.error(error.response?.data?.erro || "Erro ao carregar dados", { id: "validacao" });
    } finally {
      setCarregando(false);
    }
  };

  const handleGerarRelatorio = () => {
    if (!dados) {
      toast.error("Carregue os dados primeiro");
      return;
    }
    
    const relatorioWindow = window.open("", "_blank");
    relatorioWindow.document.write(gerarHTMLRelatorio());
    relatorioWindow.document.close();
  };

  const formatarNumeroHTML = (valor, casas = 1) => {
    if (valor === undefined || valor === null) return "0";
    const num = typeof valor === 'number' ? valor : parseFloat(valor);
    if (isNaN(num)) return "0";
    return num.toFixed(casas);
  };

  const formatarDataMes = (dataISO) => {
    if (!dataISO) return "";
    const partes = dataISO.split("-");
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}`;
    }
    return dataISO;
  };

  const gerarHTMLRelatorio = () => {
    const { indicadores, financeiro, evolucao_mensal_oee, periodo } = dados;
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    
    const fmtNum = (valor, casas = 1) => formatarNumeroHTML(valor, casas);
    const fmtPercent = (valor) => `${fmtNum(valor, 1)}%`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Validação de Resultados - ${empresaNome}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            .no-print { display: none; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 40px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #1E3A8A;
            padding-bottom: 20px;
          }
          .logo {
            max-width: 150px;
            margin-bottom: 10px;
          }
          .titulo-relatorio {
            color: #1E3A8A;
            font-size: 24px;
            margin: 10px 0;
          }
          .subtitulo {
            color: #666;
            font-size: 14px;
          }
          .empresa-nome {
            font-size: 18px;
            font-weight: bold;
            color: #1E3A8A;
            margin: 20px 0 10px;
          }
          .periodo-info {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
            font-size: 14px;
          }
          .cards-container {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .card {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #1E3A8A;
          }
          .card-icon {
            font-size: 32px;
            margin-bottom: 10px;
          }
          .card-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .card-value {
            font-size: 24px;
            font-weight: bold;
            color: #1E3A8A;
          }
          .card-delta {
            font-size: 12px;
            margin-top: 5px;
          }
          .card-delta.positivo { color: #10b981; }
          .card-delta.negativo { color: #ef4444; }
          .tabela {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .tabela th {
            background-color: #1E3A8A;
            color: white;
            padding: 12px;
            text-align: left;
          }
          .tabela td {
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
          }
          .tabela tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .financeiro-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 30px;
          }
          .financeiro-card {
            background-color: #f0fdf4;
            padding: 20px;
            border-radius: 8px;
          }
          .financeiro-card h3 {
            color: #166534;
            margin-top: 0;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #999;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          .grafico-container {
            margin: 30px 0;
          }
          .barra-container {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
          }
          .barra-label {
            width: 60px;
            font-size: 12px;
            color: #666;
          }
          .barra {
            flex: 1;
            height: 30px;
            background-color: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            position: relative;
          }
          .barra-fill {
            height: 100%;
            display: block;
          }
          .barra-texto {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            color: #333;
            font-size: 11px;
            font-weight: bold;
            z-index: 2;
          }
          .barra-fill.alta { background-color: #10b981; }
          .barra-fill.media { background-color: #f59e0b; }
          .barra-fill.baixa { background-color: #ef4444; }
          .pilar-container {
            margin-bottom: 15px;
          }
          .pilar-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 13px;
          }
          .pilar-barras {
            display: flex;
            gap: 4px;
            height: 30px;
          }
          .pilar-barra {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: bold;
            border-radius: 4px;
          }
          .btn-print {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #1E3A8A;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
          }
          .btn-print:hover {
            background-color: #152c6b;
          }
        </style>
      </head>
      <body>
        <button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
        
        <div class="header">
          <img src="${logo}" alt="Nexus Engenharia Aplicada" class="logo" style="max-width: 180px;">
          <h1 class="titulo-relatorio">NEXUS ENGENHARIA APLICADA</h1>
          <h2 class="subtitulo">Validação de Resultados</h2>
        </div>

        <div class="empresa-nome">Empresa: ${empresaNome}</div>
        
        <div class="periodo-info">
          <strong>Período Analisado:</strong><br>
          📅 Antes: ${periodo.antes.inicio} a ${periodo.antes.fim}<br>
          📅 Depois: ${periodo.depois.inicio} a ${periodo.depois.fim}<br>
          📌 Data do Diagnóstico: ${periodo.data_diagnostico} | Implementação: ${periodo.data_implementacao}<br>
          📊 Gerado em: ${dataAtual}
        </div>

        <div class="cards-container">
          <div class="card">
            <div class="card-icon">📊</div>
            <div class="card-label">OEE Global</div>
            <div class="card-value">${fmtPercent(indicadores.oee.depois)}</div>
            <div class="card-delta ${indicadores.oee.delta >= 0 ? 'positivo' : 'negativo'}">
              ${indicadores.oee.delta >= 0 ? '▲' : '▼'} ${Math.abs(indicadores.oee.delta).toFixed(1)}% (${indicadores.oee.percentual >= 0 ? '+' : ''}${fmtNum(indicadores.oee.percentual, 0)}%)
            </div>
            <div style="font-size: 11px; color:#666;">Antes: ${fmtPercent(indicadores.oee.antes)}</div>
          </div>
          <div class="card">
            <div class="card-icon">⏱️</div>
            <div class="card-label">Setup Médio</div>
            <div class="card-value">${fmtNum(indicadores.setup.depois, 0)} min</div>
            <div class="card-delta ${indicadores.setup.delta <= 0 ? 'positivo' : 'negativo'}">
              ${indicadores.setup.delta <= 0 ? '▼' : '▲'} ${Math.abs(indicadores.setup.delta).toFixed(0)} min (${indicadores.setup.percentual <= 0 ? '' : '+'}${fmtNum(indicadores.setup.percentual, 0)}%)
            </div>
            <div style="font-size: 11px; color:#666;">Antes: ${fmtNum(indicadores.setup.antes, 0)} min</div>
          </div>
          <div class="card">
            <div class="card-icon">🔧</div>
            <div class="card-label">Refugo (pç/dia)</div>
            <div class="card-value">${fmtNum(indicadores.refugo_diario.depois, 0)}</div>
            <div class="card-delta ${indicadores.refugo_diario.delta <= 0 ? 'positivo' : 'negativo'}">
              ${indicadores.refugo_diario.delta <= 0 ? '▼' : '▲'} ${Math.abs(indicadores.refugo_diario.delta).toFixed(0)} (${indicadores.refugo_diario.percentual <= 0 ? '' : '+'}${fmtNum(indicadores.refugo_diario.percentual, 0)}%)
            </div>
            <div style="font-size: 11px; color:#666;">Antes: ${fmtNum(indicadores.refugo_diario.antes, 0)}</div>
          </div>
          <div class="card">
            <div class="card-icon">💰</div>
            <div class="card-label">ROI</div>
            <div class="card-value">${fmtNum(financeiro.roi, 0)}%</div>
            <div class="card-delta positivo">
              Payback: ${fmtNum(financeiro.payback_meses, 1)} meses
            </div>
            <div style="font-size: 11px; color:#666;">Economia: R$ ${financeiro.economia_anual.toLocaleString('pt-BR')}/ano</div>
          </div>
        </div>

        <div class="grafico-container">
          <h3>📈 Evolução do OEE</h3>
          ${evolucao_mensal_oee.map(item => `
            <div class="barra-container">
              <div class="barra-label">${formatarDataMes(item.mes)}</div>
              <div class="barra">
                <div class="barra-fill ${item.oee >= 70 ? 'alta' : (item.oee >= 50 ? 'media' : 'baixa')}" style="width: ${Math.min(100, item.oee)}%"></div>
                <span class="barra-texto">${fmtNum(item.oee, 1)}%</span>
              </div>
            </div>
          `).join('')}
        </div>

        <h3>🎯 Pilares do OEE</h3>
        
        <div class="pilar-container">
          <div class="pilar-header">
            <span>Disponibilidade</span>
            <div>
              <span style="color:#ef4444;">${fmtPercent(indicadores.disponibilidade.antes)}</span>
              <span> → </span>
              <span style="color:#10b981; font-weight:bold;">${fmtPercent(indicadores.disponibilidade.depois)}</span>
            </div>
          </div>
          <div class="pilar-barras">
            <div class="pilar-barra" style="width: ${indicadores.disponibilidade.antes}%; background-color: #ef4444;">
              ${indicadores.disponibilidade.antes > 15 ? fmtPercent(indicadores.disponibilidade.antes) : ''}
            </div>
            <div class="pilar-barra" style="width: ${indicadores.disponibilidade.depois}%; background-color: #10b981;">
              ${indicadores.disponibilidade.depois > 15 ? fmtPercent(indicadores.disponibilidade.depois) : ''}
            </div>
          </div>
        </div>

        <div class="pilar-container">
          <div class="pilar-header">
            <span>Performance</span>
            <div>
              <span style="color:#ef4444;">${fmtPercent(indicadores.performance.antes)}</span>
              <span> → </span>
              <span style="color:#10b981; font-weight:bold;">${fmtPercent(indicadores.performance.depois)}</span>
            </div>
          </div>
          <div class="pilar-barras">
            <div class="pilar-barra" style="width: ${indicadores.performance.antes}%; background-color: #ef4444;">
              ${indicadores.performance.antes > 15 ? fmtPercent(indicadores.performance.antes) : ''}
            </div>
            <div class="pilar-barra" style="width: ${indicadores.performance.depois}%; background-color: #10b981;">
              ${indicadores.performance.depois > 15 ? fmtPercent(indicadores.performance.depois) : ''}
            </div>
          </div>
        </div>

        <div class="pilar-container">
          <div class="pilar-header">
            <span>Qualidade</span>
            <div>
              <span style="color:#ef4444;">${fmtPercent(indicadores.qualidade.antes)}</span>
              <span> → </span>
              <span style="color:#10b981; font-weight:bold;">${fmtPercent(indicadores.qualidade.depois)}</span>
            </div>
          </div>
          <div class="pilar-barras">
            <div class="pilar-barra" style="width: ${indicadores.qualidade.antes}%; background-color: #ef4444;">
              ${indicadores.qualidade.antes > 15 ? fmtPercent(indicadores.qualidade.antes) : ''}
            </div>
            <div class="pilar-barra" style="width: ${indicadores.qualidade.depois}%; background-color: #10b981;">
              ${indicadores.qualidade.depois > 15 ? fmtPercent(indicadores.qualidade.depois) : ''}
            </div>
          </div>
        </div>

        <h3>📋 Tabela Comparativa de Indicadores</h3>
        <table class="tabela">
          <thead>
            <tr>
              <th>Indicador</th>
              <th>Antes</th>
              <th>Depois</th>
              <th>Delta</th>
              <th>% Melhoria</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>OEE Global</td>
              <td>${fmtPercent(indicadores.oee.antes)}</td>
              <td>${fmtPercent(indicadores.oee.depois)}</td>
              <td>${indicadores.oee.delta >= 0 ? '+' : ''}${fmtNum(indicadores.oee.delta, 1)}%</td>
              <td>${indicadores.oee.percentual >= 0 ? '+' : ''}${fmtNum(indicadores.oee.percentual, 0)}%</td>
            </tr>
            <tr>
              <td>Disponibilidade</td>
              <td>${fmtPercent(indicadores.disponibilidade.antes)}</td>
              <td>${fmtPercent(indicadores.disponibilidade.depois)}</td>
              <td>${indicadores.disponibilidade.delta >= 0 ? '+' : ''}${fmtNum(indicadores.disponibilidade.delta, 1)}%</td>
              <td>${indicadores.disponibilidade.percentual >= 0 ? '+' : ''}${fmtNum(indicadores.disponibilidade.percentual, 0)}%</td>
            </tr>
            <tr>
              <td>Performance</td>
              <td>${fmtPercent(indicadores.performance.antes)}</td>
              <td>${fmtPercent(indicadores.performance.depois)}</td>
              <td>${indicadores.performance.delta >= 0 ? '+' : ''}${fmtNum(indicadores.performance.delta, 1)}%</td>
              <td>${indicadores.performance.percentual >= 0 ? '+' : ''}${fmtNum(indicadores.performance.percentual, 0)}%</td>
            </tr>
            <tr>
              <td>Qualidade</td>
              <td>${fmtPercent(indicadores.qualidade.antes)}</td>
              <td>${fmtPercent(indicadores.qualidade.depois)}</td>
              <td>${indicadores.qualidade.delta >= 0 ? '+' : ''}${fmtNum(indicadores.qualidade.delta, 1)}%</td>
              <td>${indicadores.qualidade.percentual >= 0 ? '+' : ''}${fmtNum(indicadores.qualidade.percentual, 0)}%</td>
            </tr>
            <tr>
              <td>Setup (min)</td>
              <td>${fmtNum(indicadores.setup.antes, 0)}</td>
              <td>${fmtNum(indicadores.setup.depois, 0)}</td>
              <td>${indicadores.setup.delta >= 0 ? '+' : ''}${fmtNum(indicadores.setup.delta, 0)}</td>
              <td>${indicadores.setup.percentual >= 0 ? '+' : ''}${fmtNum(indicadores.setup.percentual, 0)}%</td>
            </tr>
            <tr>
              <td>Refugo (pç/dia)</td>
              <td>${fmtNum(indicadores.refugo_diario.antes, 0)}</td>
              <td>${fmtNum(indicadores.refugo_diario.depois, 0)}</td>
              <td>${indicadores.refugo_diario.delta >= 0 ? '+' : ''}${fmtNum(indicadores.refugo_diario.delta, 0)}</td>
              <td>${indicadores.refugo_diario.percentual >= 0 ? '+' : ''}${fmtNum(indicadores.refugo_diario.percentual, 0)}%</td>
            </tr>
            <tr>
              <td>Produtividade (pç/dia)</td>
              <td>${fmtNum(indicadores.produtividade.antes, 0)}</td>
              <td>${fmtNum(indicadores.produtividade.depois, 0)}</td>
              <td>${indicadores.produtividade.delta >= 0 ? '+' : ''}${fmtNum(indicadores.produtividade.delta, 0)}</td>
              <td>${indicadores.produtividade.percentual >= 0 ? '+' : ''}${fmtNum(indicadores.produtividade.percentual, 0)}%</td>
            </tr>
          </tbody>
        </table>

        <div class="financeiro-container">
          <div class="financeiro-card">
            <h3>💰 Economia Gerada</h3>
            <div style="display: flex; justify-content: space-between;"><span>Perda mensal antes:</span><span style="color:#ef4444;">R$ ${financeiro.perda_mensal_antes.toLocaleString('pt-BR')}</span></div>
            <div style="display: flex; justify-content: space-between;"><span>Perda mensal depois:</span><span style="color:#10b981;">R$ ${financeiro.perda_mensal_depois.toLocaleString('pt-BR')}</span></div>
            <div style="display: flex; justify-content: space-between; border-top:1px solid #ccc; margin-top:10px; padding-top:10px;"><span><strong>Economia mensal:</strong></span><span style="color:#10b981; font-size:18px;"><strong>R$ ${financeiro.economia_mensal.toLocaleString('pt-BR')}</strong></span></div>
            <div style="display: flex; justify-content: space-between;"><span><strong>Economia anual:</strong></span><span style="color:#10b981; font-size:18px;"><strong>R$ ${financeiro.economia_anual.toLocaleString('pt-BR')}</strong></span></div>
          </div>
          <div class="financeiro-card">
            <h3>📈 Retorno sobre Investimento</h3>
            <div style="display: flex; justify-content: space-between;"><span>Investimento total:</span><span><strong>R$ ${financeiro.investimento_total.toLocaleString('pt-BR')}</strong></span></div>
            <div style="display: flex; justify-content: space-between;"><span>ROI:</span><span style="color:#10b981; font-size:22px;"><strong>${fmtNum(financeiro.roi, 0)}%</strong></span></div>
            <div style="display: flex; justify-content: space-between;"><span>Payback real:</span><span style="color:#10b981; font-size:18px;"><strong>${fmtNum(financeiro.payback_meses, 1)} meses</strong></span></div>
          </div>
        </div>

        <div class="footer">
          <p>📌 Fonte dos dados: Tabelas producao_oee, posto_trabalho, perdas_linha, linha_produto, produtos</p>
          <p>✅ Total de registros considerados: ${dados.metadados?.total_registros_antes || 0} (antes) | ${dados.metadados?.total_registros_depois || 0} (depois)</p>
          <p>© ${new Date().getFullYear()} Nexus Engenharia Aplicada - Todos os direitos reservados</p>
        </div>
      </body>
      </html>
    `;
  };

  const formatarMoeda = (valor) => {
    const num = typeof valor === 'number' ? valor : parseFloat(valor);
    if (isNaN(num)) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatarNumero = (valor, casas = 1) => {
    if (valor === undefined || valor === null) return "0";
    const num = typeof valor === 'number' ? valor : parseFloat(valor);
    if (isNaN(num)) return "0";
    return num.toFixed(casas);
  };

  const formatarPercentual = (valor) => {
    return `${formatarNumero(valor, 1)}%`;
  };

  const getDeltaIcon = (delta) => {
    if (delta > 0) return "📈";
    if (delta < 0) return "📉";
    return "➡️";
  };

  const getDeltaColor = (delta, invert = false) => {
    const isPositive = invert ? delta < 0 : delta > 0;
    if (isPositive) return "#10b981";
    if (delta !== 0) return "#ef4444";
    return "#6b7280";
  };

  const getDeltaSymbol = (delta) => {
    return delta > 0 ? "+" : "";
  };

  if (!clienteAtual) {
    return (
      <div style={{ padding: "30px", textAlign: "center" }}>
        <Card>
          <p>Selecione uma empresa no menu superior para visualizar a validação de resultados.</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "clamp(15px, 3vw, 30px)", maxWidth: "1400px", margin: "0 auto" }}>
      
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ color: "#1E3A8A", marginBottom: "10px", fontSize: "clamp(20px, 4vw, 28px)" }}>
          Validação de Resultados
        </h1>
        <p style={{ color: "#666", fontSize: "clamp(13px, 2vw, 14px)" }}>
          Compare períodos específicos para validar os resultados da consultoria.
        </p>
      </div>

      <Card titulo="📅 Configurar Períodos de Análise" style={{ marginBottom: "25px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
          
          <div>
            <h3 style={{ color: "#ef4444", marginBottom: "15px" }}>Período ANTES da consultoria</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <Input
                label="Data Início"
                type="date"
                value={periodoAntes.inicio}
                onChange={(e) => setPeriodoAntes({...periodoAntes, inicio: e.target.value})}
              />
              <Input
                label="Data Fim"
                type="date"
                value={periodoAntes.fim}
                onChange={(e) => setPeriodoAntes({...periodoAntes, fim: e.target.value})}
              />
            </div>
          </div>

          <div>
            <h3 style={{ color: "#10b981", marginBottom: "15px" }}>Período DEPOIS da consultoria</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
              <Input
                label="Data Início"
                type="date"
                value={periodoDepois.inicio}
                onChange={(e) => setPeriodoDepois({...periodoDepois, inicio: e.target.value})}
              />
              <Input
                label="Data Fim"
                type="date"
                value={periodoDepois.fim}
                onChange={(e) => setPeriodoDepois({...periodoDepois, fim: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "15px", marginTop: "25px", justifyContent: "center" }}>
          <Botao variant="primary" onClick={carregarDados} disabled={carregando} loading={carregando}>
            📊 Carregar Dados
          </Botao>
          <Botao variant="success" onClick={handleGerarRelatorio} disabled={!dados}>
            📄 Gerar Relatório
          </Botao>
        </div>
      </Card>

      {carregando && !dados && (
        <Card>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p>Carregando dados...</p>
          </div>
        </Card>
      )}

      {dados && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
            gap: "clamp(15px, 2vw, 20px)",
            marginBottom: "clamp(25px, 4vw, 35px)"
          }}>
            
            <Card>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(24px, 4vw, 32px)", marginBottom: "10px" }}>📊</div>
                <div style={{ fontSize: "clamp(12px, 1.8vw, 14px)", color: "#666" }}>OEE Global</div>
                <div style={{ fontSize: "clamp(18px, 3vw, 22px)", fontWeight: "bold", color: "#1E3A8A" }}>
                  {formatarPercentual(dados.indicadores.oee.depois)}
                </div>
                <div style={{ fontSize: "clamp(11px, 1.5vw, 12px)", color: "#666" }}>
                  Antes: {formatarPercentual(dados.indicadores.oee.antes)}
                </div>
                <div style={{ 
                  color: getDeltaColor(dados.indicadores.oee.delta),
                  fontSize: "clamp(13px, 2vw, 14px)",
                  fontWeight: "bold",
                  marginTop: "5px"
                }}>
                  {getDeltaIcon(dados.indicadores.oee.delta)} {getDeltaSymbol(dados.indicadores.oee.delta)}{formatarNumero(dados.indicadores.oee.delta, 1)}% ({getDeltaSymbol(dados.indicadores.oee.percentual)}{formatarNumero(dados.indicadores.oee.percentual, 0)}%)
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(24px, 4vw, 32px)", marginBottom: "10px" }}>⏱️</div>
                <div style={{ fontSize: "clamp(12px, 1.8vw, 14px)", color: "#666" }}>Setup Médio</div>
                <div style={{ fontSize: "clamp(18px, 3vw, 22px)", fontWeight: "bold", color: "#1E3A8A" }}>
                  {formatarNumero(dados.indicadores.setup.depois, 0)} min
                </div>
                <div style={{ fontSize: "clamp(11px, 1.5vw, 12px)", color: "#666" }}>
                  Antes: {formatarNumero(dados.indicadores.setup.antes, 0)} min
                </div>
                <div style={{ 
                  color: getDeltaColor(dados.indicadores.setup.delta, true),
                  fontSize: "clamp(13px, 2vw, 14px)",
                  fontWeight: "bold",
                  marginTop: "5px"
                }}>
                  {getDeltaIcon(dados.indicadores.setup.delta)} {dados.indicadores.setup.delta > 0 ? "+" : ""}{formatarNumero(dados.indicadores.setup.delta, 0)} min ({getDeltaSymbol(dados.indicadores.setup.percentual)}{formatarNumero(dados.indicadores.setup.percentual, 0)}%)
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(24px, 4vw, 32px)", marginBottom: "10px" }}>🔧</div>
                <div style={{ fontSize: "clamp(12px, 1.8vw, 14px)", color: "#666" }}>Refugo (peças/dia)</div>
                <div style={{ fontSize: "clamp(18px, 3vw, 22px)", fontWeight: "bold", color: "#1E3A8A" }}>
                  {formatarNumero(dados.indicadores.refugo_diario.depois, 0)}
                </div>
                <div style={{ fontSize: "clamp(11px, 1.5vw, 12px)", color: "#666" }}>
                  Antes: {formatarNumero(dados.indicadores.refugo_diario.antes, 0)}
                </div>
                <div style={{ 
                  color: getDeltaColor(dados.indicadores.refugo_diario.delta, true),
                  fontSize: "clamp(13px, 2vw, 14px)",
                  fontWeight: "bold",
                  marginTop: "5px"
                }}>
                  {getDeltaIcon(dados.indicadores.refugo_diario.delta)} {dados.indicadores.refugo_diario.delta > 0 ? "+" : ""}{formatarNumero(dados.indicadores.refugo_diario.delta, 0)} ({getDeltaSymbol(dados.indicadores.refugo_diario.percentual)}{formatarNumero(dados.indicadores.refugo_diario.percentual, 0)}%)
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(24px, 4vw, 32px)", marginBottom: "10px" }}>💰</div>
                <div style={{ fontSize: "clamp(12px, 1.8vw, 14px)", color: "#666" }}>ROI</div>
                <div style={{ fontSize: "clamp(18px, 3vw, 22px)", fontWeight: "bold", color: "#1E3A8A" }}>
                  {formatarNumero(dados.financeiro.roi, 0)}%
                </div>
                <div style={{ fontSize: "clamp(11px, 1.5vw, 12px)", color: "#666" }}>
                  Payback: {formatarNumero(dados.financeiro.payback_meses, 1)} meses
                </div>
                <div style={{ 
                  color: "#10b981",
                  fontSize: "clamp(13px, 2vw, 14px)",
                  fontWeight: "bold",
                  marginTop: "5px"
                }}>
                  ✅ {formatarMoeda(dados.financeiro.economia_anual)}/ano
                </div>
              </div>
            </Card>
          </div>

          {dados.evolucao_mensal_oee && dados.evolucao_mensal_oee.length > 0 && (
            <Card titulo="Evolução do OEE" style={{ marginBottom: "clamp(25px, 4vw, 35px)" }}>
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: "500px" }}>
                  {dados.evolucao_mensal_oee.map((item, idx) => {
                    const mesFormatado = item.mes.split("-");
                    const mesAno = mesFormatado.length === 2 ? `${mesFormatado[1]}/${mesFormatado[0]}` : item.mes;
                    return (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                        <div style={{ width: "60px", fontSize: "12px", color: "#666" }}>{mesAno}</div>
                        <div style={{ flex: 1, height: "30px", backgroundColor: "#e5e7eb", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
                          <div style={{
                            width: `${Math.min(100, item.oee)}%`,
                            height: "100%",
                            backgroundColor: item.oee >= 70 ? "#10b981" : item.oee >= 50 ? "#f59e0b" : "#ef4444"
                          }}></div>
                          <span style={{
                            position: "absolute",
                            right: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "#333",
                            fontSize: "11px",
                            fontWeight: "bold"
                          }}>
                            {formatarNumero(item.oee, 1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          <Card titulo="Pilares do OEE - Antes x Depois" style={{ marginBottom: "clamp(25px, 4vw, 35px)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "500" }}>Disponibilidade</span>
                  <div>
                    <span style={{ color: "#ef4444" }}>{formatarPercentual(dados.indicadores.disponibilidade.antes)}</span>
                    <span> → </span>
                    <span style={{ color: "#10b981", fontWeight: "bold" }}>{formatarPercentual(dados.indicadores.disponibilidade.depois)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "4px", height: "30px" }}>
                  <div style={{
                    width: `${dados.indicadores.disponibilidade.antes}%`,
                    backgroundColor: "#ef4444",
                    borderRadius: "4px 0 0 4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "11px"
                  }}>
                    {dados.indicadores.disponibilidade.antes > 15 ? formatarPercentual(dados.indicadores.disponibilidade.antes) : ""}
                  </div>
                  <div style={{
                    width: `${dados.indicadores.disponibilidade.depois}%`,
                    backgroundColor: "#10b981",
                    borderRadius: "0 4px 4px 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "11px"
                  }}>
                    {dados.indicadores.disponibilidade.depois > 15 ? formatarPercentual(dados.indicadores.disponibilidade.depois) : ""}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "500" }}>Performance</span>
                  <div>
                    <span style={{ color: "#ef4444" }}>{formatarPercentual(dados.indicadores.performance.antes)}</span>
                    <span> → </span>
                    <span style={{ color: "#10b981", fontWeight: "bold" }}>{formatarPercentual(dados.indicadores.performance.depois)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "4px", height: "30px" }}>
                  <div style={{
                    width: `${dados.indicadores.performance.antes}%`,
                    backgroundColor: "#ef4444",
                    borderRadius: "4px 0 0 4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "11px"
                  }}>
                    {dados.indicadores.performance.antes > 15 ? formatarPercentual(dados.indicadores.performance.antes) : ""}
                  </div>
                  <div style={{
                    width: `${dados.indicadores.performance.depois}%`,
                    backgroundColor: "#10b981",
                    borderRadius: "0 4px 4px 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "11px"
                  }}>
                    {dados.indicadores.performance.depois > 15 ? formatarPercentual(dados.indicadores.performance.depois) : ""}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "500" }}>Qualidade</span>
                  <div>
                    <span style={{ color: "#ef4444" }}>{formatarPercentual(dados.indicadores.qualidade.antes)}</span>
                    <span> → </span>
                    <span style={{ color: "#10b981", fontWeight: "bold" }}>{formatarPercentual(dados.indicadores.qualidade.depois)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "4px", height: "30px" }}>
                  <div style={{
                    width: `${dados.indicadores.qualidade.antes}%`,
                    backgroundColor: "#ef4444",
                    borderRadius: "4px 0 0 4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "11px"
                  }}>
                    {dados.indicadores.qualidade.antes > 15 ? formatarPercentual(dados.indicadores.qualidade.antes) : ""}
                  </div>
                  <div style={{
                    width: `${dados.indicadores.qualidade.depois}%`,
                    backgroundColor: "#10b981",
                    borderRadius: "0 4px 4px 0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "11px"
                  }}>
                    {dados.indicadores.qualidade.depois > 15 ? formatarPercentual(dados.indicadores.qualidade.depois) : ""}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card titulo="Tabela Comparativa de Indicadores" style={{ marginBottom: "clamp(25px, 4vw, 35px)" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#1E3A8A" }}>
                    <th style={{ textAlign: "left", padding: "12px", color: "white" }}>Indicador</th>
                    <th style={{ textAlign: "right", padding: "12px", color: "white" }}>Antes</th>
                    <th style={{ textAlign: "right", padding: "12px", color: "white" }}>Depois</th>
                    <th style={{ textAlign: "right", padding: "12px", color: "white" }}>Delta</th>
                    <th style={{ textAlign: "right", padding: "12px", color: "white" }}>% Melhoria</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px" }}>OEE Global</td>
                    <td style={{ textAlign: "right", padding: "10px" }}>{formatarPercentual(dados.indicadores.oee.antes)}</td>
                    <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(dados.indicadores.oee.depois)}</td>
                    <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(dados.indicadores.oee.delta) }}>{getDeltaSymbol(dados.indicadores.oee.delta)}{formatarNumero(dados.indicadores.oee.delta, 1)}%</td>
                    <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(dados.indicadores.oee.percentual) }}>{getDeltaSymbol(dados.indicadores.oee.percentual)}{formatarNumero(dados.indicadores.oee.percentual, 0)}%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                    <td style={{ padding: "10px" }}>Disponibilidade</td>
                    <td style={{ textAlign: "right", padding: "10px" }}>{formatarPercentual(dados.indicadores.disponibilidade.antes)}</td>
                    <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(dados.indicadores.disponibilidade.depois)}</td>
                    <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(dados.indicadores.disponibilidade.delta) }}>{getDeltaSymbol(dados.indicadores.disponibilidade.delta)}{formatarNumero(dados.indicadores.disponibilidade.delta, 1)}%</td>
                    <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(dados.indicadores.disponibilidade.percentual) }}>{getDeltaSymbol(dados.indicadores.disponibilidade.percentual)}{formatarNumero(dados.indicadores.disponibilidade.percentual, 0)}%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px" }}>Performance</td>
                    <td style={{ textAlign: "right", padding: "10px" }}>{formatarPercentual(dados.indicadores.performance.antes)}</td>
                    <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(dados.indicadores.performance.depois)}</td>
                    <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(dados.indicadores.performance.delta) }}>{getDeltaSymbol(dados.indicadores.performance.delta)}{formatarNumero(dados.indicadores.performance.delta, 1)}%</td>
                    <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(dados.indicadores.performance.percentual) }}>{getDeltaSymbol(dados.indicadores.performance.percentual)}{formatarNumero(dados.indicadores.performance.percentual, 0)}%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                    <td style={{ padding: "10px" }}>Qualidade</td>
                    <td style={{ textAlign: "right", padding: "10px" }}>{formatarPercentual(dados.indicadores.qualidade.antes)}</td>
                    <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(dados.indicadores.qualidade.depois)}</td>
                    <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(dados.indicadores.qualidade.delta) }}>{getDeltaSymbol(dados.indicadores.qualidade.delta)}{formatarNumero(dados.indicadores.qualidade.delta, 1)}%</td>
                    <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(dados.indicadores.qualidade.percentual) }}>{getDeltaSymbol(dados.indicadores.qualidade.percentual)}{formatarNumero(dados.indicadores.qualidade.percentual, 0)}%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px" }}>Setup (minutos)</td>
                    <td style={{ textAlign: "right", padding: "10px" }}>{formatarNumero(dados.indicadores.setup.antes, 0)}</td>
                    <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.setup.depois, 0)}</td>
                    <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(dados.indicadores.setup.delta, true) }}>{dados.indicadores.setup.delta > 0 ? "+" : ""}{formatarNumero(dados.indicadores.setup.delta, 0)}</td>
                    <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(dados.indicadores.setup.percentual, true) }}>{dados.indicadores.setup.percentual > 0 ? "+" : ""}{formatarNumero(dados.indicadores.setup.percentual, 0)}%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                    <td style={{ padding: "10px" }}>Refugo (peças/dia)</td>
                    <td style={{ textAlign: "right", padding: "10px" }}>{formatarNumero(dados.indicadores.refugo_diario.antes, 0)}</td>
                    <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.refugo_diario.depois, 0)}</td>
                    <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(dados.indicadores.refugo_diario.delta, true) }}>{dados.indicadores.refugo_diario.delta > 0 ? "+" : ""}{formatarNumero(dados.indicadores.refugo_diario.delta, 0)}</td>
                    <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(dados.indicadores.refugo_diario.percentual, true) }}>{dados.indicadores.refugo_diario.percentual > 0 ? "+" : ""}{formatarNumero(dados.indicadores.refugo_diario.percentual, 0)}%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px" }}>Produtividade (peças/dia)</td>
                    <td style={{ textAlign: "right", padding: "10px" }}>{formatarNumero(dados.indicadores.produtividade.antes, 0)}</td>
                    <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.produtividade.depois, 0)}</td>
                    <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(dados.indicadores.produtividade.delta) }}>{getDeltaSymbol(dados.indicadores.produtividade.delta)}{formatarNumero(dados.indicadores.produtividade.delta, 0)}</td>
                    <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(dados.indicadores.produtividade.percentual) }}>{getDeltaSymbol(dados.indicadores.produtividade.percentual)}{formatarNumero(dados.indicadores.produtividade.percentual, 0)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: "clamp(15px, 2vw, 20px)",
            marginBottom: "clamp(25px, 4vw, 35px)"
          }}>
            
            <Card titulo="Economia Gerada">
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Perda mensal antes:</span>
                  <span style={{ color: "#ef4444", fontWeight: "bold" }}>{formatarMoeda(dados.financeiro.perda_mensal_antes)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Perda mensal depois:</span>
                  <span style={{ color: "#10b981", fontWeight: "bold" }}>{formatarMoeda(dados.financeiro.perda_mensal_depois)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e5e7eb", paddingTop: "10px", marginTop: "5px" }}>
                  <span style={{ fontWeight: "bold" }}>Economia mensal:</span>
                  <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "18px" }}>{formatarMoeda(dados.financeiro.economia_mensal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "bold" }}>Economia anual:</span>
                  <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "18px" }}>{formatarMoeda(dados.financeiro.economia_anual)}</span>
                </div>
              </div>
            </Card>

            <Card titulo="Retorno sobre Investimento">
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Investimento total:</span>
                  <span style={{ fontWeight: "bold" }}>{formatarMoeda(dados.financeiro.investimento_total)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>ROI:</span>
                  <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "22px" }}>{formatarNumero(dados.financeiro.roi, 0)}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Payback real:</span>
                  <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "18px" }}>{formatarNumero(dados.financeiro.payback_meses, 1)} meses</span>
                </div>
              </div>
            </Card>
          </div>

          <div style={{ fontSize: "11px", color: "#999", textAlign: "center", marginTop: "30px", borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}>
            <p>📌 Fonte dos dados: Tabelas producao_oee, posto_trabalho, perdas_linha, linha_produto, produtos</p>
            <p>✅ Total de registros considerados: {dados.metadados?.total_registros_antes || 0} (antes) | {dados.metadados?.total_registros_depois || 0} (depois)</p>
          </div>
        </>
      )}
    </div>
  );
}
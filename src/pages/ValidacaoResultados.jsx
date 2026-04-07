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
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);
  
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
      // Converter datas para formato YYYY-MM-DD para enviar ao backend
      const formatarParaAPI = (data) => {
        if (!data) return "";
        const partes = data.split("/");
        if (partes.length === 3) {
          return `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
        return data;
      };

      const params = {
        antes_inicio: formatarParaAPI(periodoAntes.inicio),
        antes_fim: formatarParaAPI(periodoAntes.fim),
        depois_inicio: formatarParaAPI(periodoDepois.inicio),
        depois_fim: formatarParaAPI(periodoDepois.fim)
      };

      console.log("Enviando para API:", params);

      const response = await api.get(`/evolution/compare/${clienteAtual}`, { params });
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
    setMostrarRelatorio(true);
  };

  const handleFecharRelatorio = () => {
    setMostrarRelatorio(false);
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
    if (delta > 0) return "▲";
    if (delta < 0) return "▼";
    return "◆";
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
      
      {/* Modal do Relatório */}
      {mostrarRelatorio && dados && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "auto"
        }} onClick={handleFecharRelatorio}>
          <div style={{
            backgroundColor: "white",
            width: "90%",
            maxWidth: "1200px",
            height: "90%",
            overflow: "auto",
            borderRadius: "8px",
            padding: "20px",
            position: "relative"
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleFecharRelatorio}
              style={{
                position: "sticky",
                top: "10px",
                right: "10px",
                float: "right",
                padding: "8px 16px",
                backgroundColor: "#1E3A8A",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                zIndex: 1001
              }}
            >
              Fechar
            </button>
            <button
              onClick={() => window.print()}
              style={{
                position: "sticky",
                top: "10px",
                right: "100px",
                float: "right",
                padding: "8px 16px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
                zIndex: 1001
              }}
            >
              Imprimir / PDF
            </button>
            <div style={{ clear: "both" }}></div>
            
            {/* Conteúdo do Relatório */}
            <div className="relatorio-content" style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
              <div style={{ textAlign: "center", marginBottom: "30px", borderBottom: "2px solid #1E3A8A", paddingBottom: "20px" }}>
                <img src={logo} alt="Nexus" style={{ maxWidth: "150px", marginBottom: "10px" }} />
                <h1 style={{ color: "#1E3A8A", margin: "10px 0" }}>NEXUS ENGENHARIA APLICADA</h1>
                <h2 style={{ color: "#666", fontSize: "18px" }}>Validação de Resultados</h2>
              </div>

              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1E3A8A", margin: "20px 0 10px" }}>
                Empresa: {empresaNome}
              </div>
              
              <div style={{ backgroundColor: "#f3f4f6", padding: "15px", borderRadius: "8px", marginBottom: "30px", fontSize: "14px" }}>
                <strong>Período Analisado:</strong><br />
                Antes: {dados.periodo.antes.inicio} a {dados.periodo.antes.fim}<br />
                Depois: {dados.periodo.depois.inicio} a {dados.periodo.depois.fim}<br />
                Data do Diagnóstico: {dados.periodo.data_diagnostico} | Implementação: {dados.periodo.data_implementacao}<br />
                Gerado em: {new Date().toLocaleDateString('pt-BR')}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
                <div style={{ backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px", textAlign: "center", borderLeft: "4px solid #1E3A8A" }}>
                  <div style={{ fontSize: "24px", marginBottom: "10px" }}>📊</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>OEE Global</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarPercentual(dados.indicadores.oee.depois)}</div>
                  <div style={{ fontSize: "12px", marginTop: "5px", color: dados.indicadores.oee.delta >= 0 ? "#10b981" : "#ef4444" }}>
                    {getDeltaIcon(dados.indicadores.oee.delta)} {Math.abs(dados.indicadores.oee.delta).toFixed(1)}% ({dados.indicadores.oee.percentual >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.oee.percentual, 0)}%)
                  </div>
                  <div style={{ fontSize: "11px", color: "#666" }}>Antes: {formatarPercentual(dados.indicadores.oee.antes)}</div>
                </div>

                <div style={{ backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px", textAlign: "center", borderLeft: "4px solid #1E3A8A" }}>
                  <div style={{ fontSize: "24px", marginBottom: "10px" }}>⏱️</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Setup Médio</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.setup.depois, 0)} min</div>
                  <div style={{ fontSize: "12px", marginTop: "5px", color: dados.indicadores.setup.delta <= 0 ? "#10b981" : "#ef4444" }}>
                    {getDeltaIcon(dados.indicadores.setup.delta)} {Math.abs(dados.indicadores.setup.delta).toFixed(0)} min ({dados.indicadores.setup.percentual <= 0 ? '' : '+'}{formatarNumero(dados.indicadores.setup.percentual, 0)}%)
                  </div>
                  <div style={{ fontSize: "11px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.setup.antes, 0)} min</div>
                </div>

                <div style={{ backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px", textAlign: "center", borderLeft: "4px solid #1E3A8A" }}>
                  <div style={{ fontSize: "24px", marginBottom: "10px" }}>🔧</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>Refugo (pecas/dia)</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.refugo_diario.depois, 0)}</div>
                  <div style={{ fontSize: "12px", marginTop: "5px", color: dados.indicadores.refugo_diario.delta <= 0 ? "#10b981" : "#ef4444" }}>
                    {getDeltaIcon(dados.indicadores.refugo_diario.delta)} {Math.abs(dados.indicadores.refugo_diario.delta).toFixed(0)} ({dados.indicadores.refugo_diario.percentual <= 0 ? '' : '+'}{formatarNumero(dados.indicadores.refugo_diario.percentual, 0)}%)
                  </div>
                  <div style={{ fontSize: "11px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.refugo_diario.antes, 0)}</div>
                </div>

                <div style={{ backgroundColor: "#f9fafb", padding: "20px", borderRadius: "8px", textAlign: "center", borderLeft: "4px solid #1E3A8A" }}>
                  <div style={{ fontSize: "24px", marginBottom: "10px" }}>💰</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>ROI</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.financeiro.roi, 0)}%</div>
                  <div style={{ fontSize: "12px", marginTop: "5px", color: "#10b981" }}>Payback: {formatarNumero(dados.financeiro.payback_meses, 1)} meses</div>
                  <div style={{ fontSize: "11px", color: "#666" }}>Economia: {formatarMoeda(dados.financeiro.economia_anual)}/ano</div>
                </div>
              </div>

              <div style={{ margin: "30px 0" }}>
                <h3>Evolucao do OEE</h3>
                {dados.evolucao_mensal_oee && dados.evolucao_mensal_oee.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                    <div style={{ width: "70px", fontSize: "13px", fontWeight: "bold", color: "#333" }}>{formatarDataMes(item.mes)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: "30px", backgroundColor: "#e5e7eb", borderRadius: "4px", overflow: "hidden", marginBottom: "4px" }}>
                        <div style={{
                          width: `${Math.min(100, item.oee)}%`,
                          height: "100%",
                          backgroundColor: item.oee >= 70 ? "#10b981" : item.oee >= 50 ? "#f59e0b" : "#ef4444"
                        }}></div>
                      </div>
                      <div style={{ fontSize: "11px", color: "#666", textAlign: "right" }}>{formatarNumero(item.oee, 1)}%</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ margin: "30px 0" }}>
                <h3>Pilares do OEE</h3>
                
                <div style={{ marginBottom: "15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontWeight: "bold" }}>
                    <span>Disponibilidade</span>
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

                <div style={{ marginBottom: "15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontWeight: "bold" }}>
                    <span>Performance</span>
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

                <div style={{ marginBottom: "15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontWeight: "bold" }}>
                    <span>Qualidade</span>
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

              <div style={{ margin: "30px 0" }}>
                <h3>Indicadores Comparativos</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#1E3A8A" }}>
                      <th style={{ textAlign: "left", padding: "12px", color: "white" }}>Indicador</th>
                      <th style={{ textAlign: "right", padding: "12px", color: "white" }}>Antes</th>
                      <th style={{ textAlign: "right", padding: "12px", color: "white" }}>Depois</th>
                      <th style={{ textAlign: "right", padding: "12px", color: "white" }}>Delta</th>
                      <th style={{ textAlign: "right", padding: "12px", color: "white" }}>Melhoria (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "10px" }}>OEE Global</td>
                      <td style={{ textAlign: "right" }}>{formatarPercentual(dados.indicadores.oee.antes)}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(dados.indicadores.oee.depois)}</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.oee.delta >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.oee.delta, 1)}%</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.oee.percentual >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.oee.percentual, 0)}%</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                      <td style={{ padding: "10px" }}>Disponibilidade</td>
                      <td style={{ textAlign: "right" }}>{formatarPercentual(dados.indicadores.disponibilidade.antes)}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(dados.indicadores.disponibilidade.depois)}</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.disponibilidade.delta >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.disponibilidade.delta, 1)}%</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.disponibilidade.percentual >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.disponibilidade.percentual, 0)}%</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "10px" }}>Performance</td>
                      <td style={{ textAlign: "right" }}>{formatarPercentual(dados.indicadores.performance.antes)}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(dados.indicadores.performance.depois)}</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.performance.delta >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.performance.delta, 1)}%</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.performance.percentual >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.performance.percentual, 0)}%</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                      <td style={{ padding: "10px" }}>Qualidade</td>
                      <td style={{ textAlign: "right" }}>{formatarPercentual(dados.indicadores.qualidade.antes)}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(dados.indicadores.qualidade.depois)}</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.qualidade.delta >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.qualidade.delta, 1)}%</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.qualidade.percentual >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.qualidade.percentual, 0)}%</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "10px" }}>Setup (minutos)</td>
                      <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.setup.antes, 0)}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.setup.depois, 0)}</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.setup.delta >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.setup.delta, 0)}</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.setup.percentual >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.setup.percentual, 0)}%</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                      <td style={{ padding: "10px" }}>Refugo (pecas/dia)</td>
                      <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.refugo_diario.antes, 0)}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.refugo_diario.depois, 0)}</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.refugo_diario.delta >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.refugo_diario.delta, 0)}</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.refugo_diario.percentual >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.refugo_diario.percentual, 0)}%</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "10px" }}>Produtividade (pecas/dia)</td>
                      <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.produtividade.antes, 0)}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.produtividade.depois, 0)}</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.produtividade.delta >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.produtividade.delta, 0)}</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.produtividade.percentual >= 0 ? '+' : ''}{formatarNumero(dados.indicadores.produtividade.percentual, 0)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", margin: "30px 0" }}>
                <div style={{ backgroundColor: "#f0fdf4", padding: "20px", borderRadius: "8px" }}>
                  <h3 style={{ color: "#166534", marginTop: 0 }}>Economia Gerada</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span>Perda mensal antes:</span>
                    <span style={{ color: "#ef4444", fontWeight: "bold" }}>{formatarMoeda(dados.financeiro.perda_mensal_antes)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span>Perda mensal depois:</span>
                    <span style={{ color: "#10b981", fontWeight: "bold" }}>{formatarMoeda(dados.financeiro.perda_mensal_depois)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ccc", marginTop: "10px", paddingTop: "10px" }}>
                    <span><strong>Economia mensal:</strong></span>
                    <span style={{ color: "#10b981", fontSize: "18px", fontWeight: "bold" }}>{formatarMoeda(dados.financeiro.economia_mensal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span><strong>Economia anual:</strong></span>
                    <span style={{ color: "#10b981", fontSize: "18px", fontWeight: "bold" }}>{formatarMoeda(dados.financeiro.economia_anual)}</span>
                  </div>
                </div>
                <div style={{ backgroundColor: "#f0fdf4", padding: "20px", borderRadius: "8px" }}>
                  <h3 style={{ color: "#166534", marginTop: 0 }}>Retorno sobre Investimento</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span>Investimento total:</span>
                    <span><strong>{formatarMoeda(dados.financeiro.investimento_total)}</strong></span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span>ROI:</span>
                    <span style={{ color: "#10b981", fontSize: "22px", fontWeight: "bold" }}>{formatarNumero(dados.financeiro.roi, 0)}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Payback real:</span>
                    <span style={{ color: "#10b981", fontSize: "18px", fontWeight: "bold" }}>{formatarNumero(dados.financeiro.payback_meses, 1)} meses</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "11px", color: "#999", textAlign: "center", marginTop: "30px", borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}>
                <p>Fonte dos dados: Tabelas producao_oee, posto_trabalho, perdas_linha, linha_produto, produtos</p>
                <p>Total de registros considerados: {dados.metadados?.total_registros_antes || 0} (antes) | {dados.metadados?.total_registros_depois || 0} (depois)</p>
                <p>© {new Date().getFullYear()} Nexus Engenharia Aplicada - Todos os direitos reservados</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ color: "#1E3A8A", marginBottom: "10px", fontSize: "clamp(20px, 4vw, 28px)" }}>
          Validação de Resultados
        </h1>
        <p style={{ color: "#666", fontSize: "clamp(13px, 2vw, 14px)" }}>
          Compare períodos específicos para validar os resultados da consultoria.
        </p>
      </div>

      <Card titulo="Configurar Períodos de Análise" style={{ marginBottom: "25px" }}>
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
            Carregar Dados
          </Botao>
          <Botao variant="success" onClick={handleGerarRelatorio} disabled={!dados}>
            Gerar Relatório
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
                  {formatarMoeda(dados.financeiro.economia_anual)}/ano
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
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
                        <div style={{ width: "70px", fontSize: "13px", fontWeight: "bold", color: "#333" }}>{mesAno}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: "30px", backgroundColor: "#e5e7eb", borderRadius: "4px", overflow: "hidden", marginBottom: "4px" }}>
                            <div style={{
                              width: `${Math.min(100, item.oee)}%`,
                              height: "100%",
                              backgroundColor: item.oee >= 70 ? "#10b981" : item.oee >= 50 ? "#f59e0b" : "#ef4444"
                            }}></div>
                          </div>
                          <div style={{ fontSize: "11px", color: "#666", textAlign: "right" }}>
                            {formatarNumero(item.oee, 1)}%
                          </div>
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
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontWeight: "bold" }}>
                  <span>Disponibilidade</span>
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
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontWeight: "bold" }}>
                  <span>Performance</span>
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
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontWeight: "bold" }}>
                  <span>Qualidade</span>
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
                    <td style={{ textAlign: "right" }}>{formatarPercentual(dados.indicadores.oee.antes)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(dados.indicadores.oee.depois)}</td>
                    <td style={{ textAlign: "right" }}>{getDeltaSymbol(dados.indicadores.oee.delta)}{formatarNumero(dados.indicadores.oee.delta, 1)}%</td>
                    <td style={{ textAlign: "right" }}>{getDeltaSymbol(dados.indicadores.oee.percentual)}{formatarNumero(dados.indicadores.oee.percentual, 0)}%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                    <td style={{ padding: "10px" }}>Disponibilidade</td>
                    <td style={{ textAlign: "right" }}>{formatarPercentual(dados.indicadores.disponibilidade.antes)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(dados.indicadores.disponibilidade.depois)}</td>
                    <td style={{ textAlign: "right" }}>{getDeltaSymbol(dados.indicadores.disponibilidade.delta)}{formatarNumero(dados.indicadores.disponibilidade.delta, 1)}%</td>
                    <td style={{ textAlign: "right" }}>{getDeltaSymbol(dados.indicadores.disponibilidade.percentual)}{formatarNumero(dados.indicadores.disponibilidade.percentual, 0)}%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px" }}>Performance</td>
                    <td style={{ textAlign: "right" }}>{formatarPercentual(dados.indicadores.performance.antes)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(dados.indicadores.performance.depois)}</td>
                    <td style={{ textAlign: "right" }}>{getDeltaSymbol(dados.indicadores.performance.delta)}{formatarNumero(dados.indicadores.performance.delta, 1)}%</td>
                    <td style={{ textAlign: "right" }}>{getDeltaSymbol(dados.indicadores.performance.percentual)}{formatarNumero(dados.indicadores.performance.percentual, 0)}%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                    <td style={{ padding: "10px" }}>Qualidade</td>
                    <td style={{ textAlign: "right" }}>{formatarPercentual(dados.indicadores.qualidade.antes)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(dados.indicadores.qualidade.depois)}</td>
                    <td style={{ textAlign: "right" }}>{getDeltaSymbol(dados.indicadores.qualidade.delta)}{formatarNumero(dados.indicadores.qualidade.delta, 1)}%</td>
                    <td style={{ textAlign: "right" }}>{getDeltaSymbol(dados.indicadores.qualidade.percentual)}{formatarNumero(dados.indicadores.qualidade.percentual, 0)}%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px" }}>Setup (minutos)</td>
                    <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.setup.antes, 0)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.setup.depois, 0)}</td>
                    <td style={{ textAlign: "right" }}>{dados.indicadores.setup.delta > 0 ? "+" : ""}{formatarNumero(dados.indicadores.setup.delta, 0)}</td>
                    <td style={{ textAlign: "right" }}>{dados.indicadores.setup.percentual > 0 ? "+" : ""}{formatarNumero(dados.indicadores.setup.percentual, 0)}%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                    <td style={{ padding: "10px" }}>Refugo (peças/dia)</td>
                    <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.refugo_diario.antes, 0)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.refugo_diario.depois, 0)}</td>
                    <td style={{ textAlign: "right" }}>{dados.indicadores.refugo_diario.delta > 0 ? "+" : ""}{formatarNumero(dados.indicadores.refugo_diario.delta, 0)}</td>
                    <td style={{ textAlign: "right" }}>{dados.indicadores.refugo_diario.percentual > 0 ? "+" : ""}{formatarNumero(dados.indicadores.refugo_diario.percentual, 0)}%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px" }}>Produtividade (peças/dia)</td>
                    <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.produtividade.antes, 0)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.produtividade.depois, 0)}</td>
                    <td style={{ textAlign: "right" }}>{getDeltaSymbol(dados.indicadores.produtividade.delta)}{formatarNumero(dados.indicadores.produtividade.delta, 0)}</td>
                    <td style={{ textAlign: "right" }}>{getDeltaSymbol(dados.indicadores.produtividade.percentual)}{formatarNumero(dados.indicadores.produtividade.percentual, 0)}%</td>
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
            <p>Fonte dos dados: Tabelas producao_oee, posto_trabalho, perdas_linha, linha_produto, produtos</p>
            <p>Total de registros considerados: {dados.metadados?.total_registros_antes || 0} (antes) | {dados.metadados?.total_registros_depois || 0} (depois)</p>
          </div>
        </>
      )}
    </div>
  );
}
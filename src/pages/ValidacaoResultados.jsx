// src/pages/ValidacaoResultados.jsx
import { useState, useEffect, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Card from "../components/ui/Card";
import Botao from "../components/ui/Botao";
import Input from "../components/ui/Input";
import IndicatorCard from "../components/IndicatorCard";
import ComparisonChart from "../components/ComparisonChart";
import toast from "react-hot-toast";
import logo from "../assets/logo.png";
import { colors, spacing, typography } from "../styles/theme";

export default function ValidacaoResultados() {
  const { clienteAtual } = useOutletContext();
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState(null);
  const [empresaNome, setEmpresaNome] = useState("");
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);
  const relatorioRef = useRef();
  
  const [periodoAntes, setPeriodoAntes] = useState({ inicio: "", fim: "" });
  const [periodoDepois, setPeriodoDepois] = useState({ inicio: "", fim: "" });

  useEffect(() => {
    if (clienteAtual) {
      carregarEmpresa();
    }
  }, [clienteAtual]);

  const carregarEmpresa = async () => {
    try {
      const res = await api.get(`/companies`);
      const empresa = res.data.find(c => c.id === parseInt(clienteAtual));
      if (empresa) setEmpresaNome(empresa.nome);
    } catch (err) {
      console.error("Erro ao carregar empresa:", err);
    }
  };

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

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2
    }).format(valor);
  };

  const formatarNumero = (valor, casas = 1) => {
    if (valor === undefined || valor === null) return "0";
    return valor.toFixed(casas);
  };

  const handleGerarRelatorio = () => {
    if (!dados) {
      toast.error("Carregue os dados primeiro");
      return;
    }
    setMostrarRelatorio(true);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const handleExportarPDF = () => {
    window.print();
  };

  const handleFecharRelatorio = () => {
    setMostrarRelatorio(false);
  };

  if (!clienteAtual) {
    return (
      <div style={{ padding: spacing["2xl"], textAlign: "center" }}>
        <Card>
          <p>Selecione uma empresa no menu superior para visualizar a validação de resultados.</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: `clamp(${spacing.lg}, 3vw, ${spacing["2xl"]})`, 
      maxWidth: "1400px", 
      margin: "0 auto",
      backgroundColor: colors.background.secondary,
      minHeight: "100vh"
    }}>
      
      {/* Cabeçalho da Página */}
      <div style={{ marginBottom: spacing["2xl"] }}>
        <h1 style={{ 
          color: colors.primary.blue, 
          marginBottom: spacing.sm,
          fontSize: `clamp(${typography.fontSize.xl}, 4vw, ${typography.fontSize["3xl"]})`,
          fontWeight: typography.fontWeight.bold
        }}>
          Validação de Resultados
        </h1>
        <p style={{ color: colors.text.secondary }}>
          Compare períodos específicos para validar os resultados da consultoria.
          {empresaNome && ` • Empresa: ${empresaNome}`}
        </p>
      </div>

      {/* Configuração de Períodos */}
      <Card style={{ marginBottom: spacing["2xl"] }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: spacing.xl 
        }}>
          
          <div>
            <h3 style={{ color: colors.status.danger, marginBottom: spacing.md }}>
              🔴 Período ANTES da consultoria
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
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
            <h3 style={{ color: colors.status.success, marginBottom: spacing.md }}>
              🟢 Período DEPOIS da consultoria
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.md }}>
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

        <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.xl, justifyContent: "center", flexWrap: "wrap" }}>
          <Botao variant="primary" onClick={carregarDados} disabled={carregando} loading={carregando}>
            {carregando ? "Carregando..." : "Carregar Dados"}
          </Botao>
          
          {dados && (
            <Botao variant="success" onClick={handleGerarRelatorio}>
              📄 Gerar Relatório
            </Botao>
          )}
        </div>
      </Card>

      {/* RELATÓRIO PARA IMPRESSÃO */}
      {mostrarRelatorio && dados && (
        <div className="relatorio-print-container">
          <div className="no-print" style={{ 
            position: "sticky", 
            top: 0, 
            zIndex: 100, 
            backgroundColor: colors.background.secondary,
            padding: `${spacing.md} 0`,
            marginBottom: spacing.lg,
            display: "flex",
            gap: spacing.md,
            justifyContent: "flex-end"
          }}>
            <Botao variant="secondary" onClick={handleFecharRelatorio}>
              ✖ Fechar
            </Botao>
            <Botao variant="success" onClick={handleExportarPDF}>
              📄 Exportar PDF
            </Botao>
          </div>

          <div ref={relatorioRef} className="relatorio-print" style={{
            backgroundColor: "white",
            padding: "30px",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            maxWidth: "1100px",
            margin: "0 auto"
          }}>
            
            {/* MARCA D'ÁGUA */}
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
              
              {/* CABEÇALHO DO RELATÓRIO */}
              <div style={{ textAlign: "center", marginBottom: "30px", pageBreakInside: "avoid" }}>
                <img src={logo} alt="Nexus Engenharia Aplicada" style={{ width: "180px", marginBottom: "10px" }} />
                <h1 style={{ color: "#1E3A8A", margin: "5px 0", fontSize: "24px" }}>
                  NEXUS ENGENHARIA APLICADA
                </h1>
                <h2 style={{ color: "#666", fontWeight: "300", margin: "0", fontSize: "18px" }}>
                  Validação de Resultados
                </h2>
              </div>

              {/* DADOS DO CLIENTE */}
              <div style={{ marginBottom: "25px", textAlign: "center", pageBreakInside: "avoid" }}>
                <h3 style={{ color: "#1E3A8A", marginBottom: "5px", fontSize: "18px" }}>
                  {empresaNome}
                </h3>
                <p style={{ color: "#666", fontSize: "13px", margin: "5px 0" }}>
                  Período Antes: {periodoAntes.inicio.split('-').reverse().join('/')} a {periodoAntes.fim.split('-').reverse().join('/')}
                </p>
                <p style={{ color: "#666", fontSize: "13px", margin: "5px 0" }}>
                  Período Depois: {periodoDepois.inicio.split('-').reverse().join('/')} a {periodoDepois.fim.split('-').reverse().join('/')}
                </p>
                <p style={{ color: "#666", fontSize: "13px", margin: "5px 0" }}>
                  Data do Relatório: {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* SEÇÃO 1 - CARDS DE INDICADORES */}
              <h2 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "20px", fontSize: "18px", pageBreakAfter: "avoid" }}>
                1. INDICADORES DE PERFORMANCE
              </h2>
              
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "15px",
                marginBottom: "30px",
                pageBreakInside: "avoid"
              }}>
                <div style={{ backgroundColor: "#f0fdf4", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #10b981" }}>
                  <div style={{ fontSize: "11px", color: "#666" }}>OEE Global</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.oee.depois, 1)}%</div>
                  <div style={{ fontSize: "10px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.oee.antes, 1)}%</div>
                  <div style={{ fontSize: "11px", color: dados.indicadores.oee.delta >= 0 ? "#10b981" : "#ef4444" }}>
                    {dados.indicadores.oee.delta >= 0 ? "▲" : "▼"} {Math.abs(dados.indicadores.oee.delta).toFixed(1)}%
                  </div>
                </div>
                <div style={{ backgroundColor: "#eff6ff", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
                  <div style={{ fontSize: "11px", color: "#666" }}>Disponibilidade</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.disponibilidade.depois, 1)}%</div>
                  <div style={{ fontSize: "10px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.disponibilidade.antes, 1)}%</div>
                  <div style={{ fontSize: "11px", color: dados.indicadores.disponibilidade.delta >= 0 ? "#10b981" : "#ef4444" }}>
                    {dados.indicadores.disponibilidade.delta >= 0 ? "▲" : "▼"} {Math.abs(dados.indicadores.disponibilidade.delta).toFixed(1)}%
                  </div>
                </div>
                <div style={{ backgroundColor: "#fef3c7", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #f59e0b" }}>
                  <div style={{ fontSize: "11px", color: "#666" }}>Performance</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.performance.depois, 1)}%</div>
                  <div style={{ fontSize: "10px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.performance.antes, 1)}%</div>
                  <div style={{ fontSize: "11px", color: dados.indicadores.performance.delta >= 0 ? "#10b981" : "#ef4444" }}>
                    {dados.indicadores.performance.delta >= 0 ? "▲" : "▼"} {Math.abs(dados.indicadores.performance.delta).toFixed(1)}%
                  </div>
                </div>
                <div style={{ backgroundColor: "#f0fdf4", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #10b981" }}>
                  <div style={{ fontSize: "11px", color: "#666" }}>Qualidade</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.qualidade.depois, 1)}%</div>
                  <div style={{ fontSize: "10px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.qualidade.antes, 1)}%</div>
                  <div style={{ fontSize: "11px", color: dados.indicadores.qualidade.delta >= 0 ? "#10b981" : "#ef4444" }}>
                    {dados.indicadores.qualidade.delta >= 0 ? "▲" : "▼"} {Math.abs(dados.indicadores.qualidade.delta).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "15px",
                marginBottom: "30px",
                pageBreakInside: "avoid"
              }}>
                <div style={{ backgroundColor: "#fef2f2", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #ef4444" }}>
                  <div style={{ fontSize: "11px", color: "#666" }}>Setup Médio</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.setup.depois, 0)} min</div>
                  <div style={{ fontSize: "10px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.setup.antes, 0)} min</div>
                  <div style={{ fontSize: "11px", color: dados.indicadores.setup.delta <= 0 ? "#10b981" : "#ef4444" }}>
                    {dados.indicadores.setup.delta <= 0 ? "▼" : "▲"} {Math.abs(dados.indicadores.setup.delta).toFixed(0)} min
                  </div>
                </div>
                <div style={{ backgroundColor: "#fef2f2", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #ef4444" }}>
                  <div style={{ fontSize: "11px", color: "#666" }}>Refugo Diário</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.refugo_diario.depois, 0)} pç</div>
                  <div style={{ fontSize: "10px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.refugo_diario.antes, 0)} pç</div>
                  <div style={{ fontSize: "11px", color: dados.indicadores.refugo_diario.delta <= 0 ? "#10b981" : "#ef4444" }}>
                    {dados.indicadores.refugo_diario.delta <= 0 ? "▼" : "▲"} {Math.abs(dados.indicadores.refugo_diario.delta).toFixed(0)} pç
                  </div>
                </div>
                <div style={{ backgroundColor: "#eff6ff", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
                  <div style={{ fontSize: "11px", color: "#666" }}>Produtividade</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.produtividade.depois, 0)} pç/dia</div>
                  <div style={{ fontSize: "10px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.produtividade.antes, 0)} pç/dia</div>
                  <div style={{ fontSize: "11px", color: dados.indicadores.produtividade.delta >= 0 ? "#10b981" : "#ef4444" }}>
                    {dados.indicadores.produtividade.delta >= 0 ? "▲" : "▼"} {Math.abs(dados.indicadores.produtividade.delta).toFixed(0)} pç
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2 - GRÁFICO DE EVOLUÇÃO */}
              {dados.evolucao_mensal && dados.evolucao_mensal.length > 0 && (
                <>
                  <h2 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "20px", fontSize: "18px", pageBreakAfter: "avoid" }}>
                    2. EVOLUÇÃO MENSAL DO OEE
                  </h2>
                  <div style={{ marginBottom: "30px", pageBreakInside: "avoid", height: "280px" }}>
                    <ComparisonChart
                      data={dados.evolucao_mensal}
                      title=""
                      type="line"
                    />
                  </div>
                </>
              )}

              {/* SEÇÃO 3 - TABELA COMPARATIVA */}
              <h2 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "20px", fontSize: "18px", pageBreakAfter: "avoid" }}>
                3. TABELA COMPARATIVA
              </h2>
              
              <div style={{ overflowX: "auto", marginBottom: "30px", pageBreakInside: "avoid" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                      <th style={{ padding: "10px", textAlign: "left" }}>Indicador</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Antes</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Depois</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Delta</th>
                      <th style={{ padding: "10px", textAlign: "right" }}>Melhoria</th>
                     </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "8px" }}>OEE</td>
                      <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.oee.antes, 1)}%</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.oee.depois, 1)}%</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.oee.delta >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.oee.delta, 1)}%</td>
                      <td style={{ textAlign: "right", color: "#10b981" }}>{dados.indicadores.oee.percentual >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.oee.percentual, 0)}%</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                      <td style={{ padding: "8px" }}>Disponibilidade</td>
                      <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.disponibilidade.antes, 1)}%</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.disponibilidade.depois, 1)}%</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.disponibilidade.delta >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.disponibilidade.delta, 1)}%</td>
                      <td style={{ textAlign: "right", color: "#10b981" }}>{dados.indicadores.disponibilidade.percentual >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.disponibilidade.percentual, 0)}%</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "8px" }}>Performance</td>
                      <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.performance.antes, 1)}%</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.performance.depois, 1)}%</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.performance.delta >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.performance.delta, 1)}%</td>
                      <td style={{ textAlign: "right", color: "#10b981" }}>{dados.indicadores.performance.percentual >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.performance.percentual, 0)}%</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                      <td style={{ padding: "8px" }}>Qualidade</td>
                      <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.qualidade.antes, 1)}%</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.qualidade.depois, 1)}%</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.qualidade.delta >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.qualidade.delta, 1)}%</td>
                      <td style={{ textAlign: "right", color: "#10b981" }}>{dados.indicadores.qualidade.percentual >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.qualidade.percentual, 0)}%</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "8px" }}>Setup (min)</td>
                      <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.setup.antes, 0)}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.setup.depois, 0)}</td>
                      <td style={{ textAlign: "right", color: dados.indicadores.setup.delta <= 0 ? "#10b981" : "#ef4444" }}>
                        {dados.indicadores.setup.delta >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.setup.delta, 0)}
                      </td>
                      <td style={{ textAlign: "right", color: dados.indicadores.setup.percentual <= 0 ? "#10b981" : "#ef4444" }}>
                        {dados.indicadores.setup.percentual >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.setup.percentual, 0)}%
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                      <td style={{ padding: "8px" }}>Refugo (pç/dia)</td>
                      <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.refugo_diario.antes, 0)}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.refugo_diario.depois, 0)}</td>
                      <td style={{ textAlign: "right", color: dados.indicadores.refugo_diario.delta <= 0 ? "#10b981" : "#ef4444" }}>
                        {dados.indicadores.refugo_diario.delta >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.refugo_diario.delta, 0)}
                      </td>
                      <td style={{ textAlign: "right", color: dados.indicadores.refugo_diario.percentual <= 0 ? "#10b981" : "#ef4444" }}>
                        {dados.indicadores.refugo_diario.percentual >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.refugo_diario.percentual, 0)}%
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "8px" }}>Produtividade (pç/dia)</td>
                      <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.produtividade.antes, 0)}</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.produtividade.depois, 0)}</td>
                      <td style={{ textAlign: "right" }}>{dados.indicadores.produtividade.delta >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.produtividade.delta, 0)}</td>
                      <td style={{ textAlign: "right", color: "#10b981" }}>{dados.indicadores.produtividade.percentual >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.produtividade.percentual, 0)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SEÇÃO 4 - ANÁLISE FINANCEIRA */}
              <h2 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "20px", fontSize: "18px", pageBreakAfter: "avoid" }}>
                4. ANÁLISE FINANCEIRA
              </h2>
              
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "20px",
                marginBottom: "30px",
                pageBreakInside: "avoid"
              }}>
                <div style={{ backgroundColor: "#f0fdf4", padding: "15px", borderRadius: "8px" }}>
                  <h3 style={{ color: "#166534", marginBottom: "10px", fontSize: "14px" }}>💰 Economia Gerada</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px" }}>Perda mensal antes:</span>
                    <span style={{ color: "#ef4444", fontWeight: "bold", fontSize: "12px" }}>{formatarMoeda(dados.financeiro.perda_mensal_antes)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px" }}>Perda mensal depois:</span>
                    <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "12px" }}>{formatarMoeda(dados.financeiro.perda_mensal_depois)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ccc", paddingTop: "8px", marginTop: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "bold" }}>Economia mensal:</span>
                    <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "16px" }}>{formatarMoeda(dados.financeiro.economia_mensal)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", fontWeight: "bold" }}>Economia anual:</span>
                    <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "16px" }}>{formatarMoeda(dados.financeiro.economia_anual)}</span>
                  </div>
                </div>

                <div style={{ backgroundColor: "#eff6ff", padding: "15px", borderRadius: "8px" }}>
                  <h3 style={{ color: "#1e3a8a", marginBottom: "10px", fontSize: "14px" }}>📊 Retorno sobre Investimento</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px" }}>Investimento total:</span>
                    <span style={{ fontWeight: "bold", fontSize: "12px" }}>{formatarMoeda(dados.financeiro.investimento_total)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px" }}>ROI:</span>
                    <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "22px" }}>{formatarNumero(dados.financeiro.roi, 0)}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px" }}>Payback real:</span>
                    <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "16px" }}>{formatarNumero(dados.financeiro.payback_meses, 1)} meses</span>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 5 - DETALHAMENTO DAS PERDAS */}
              {dados.financeiro.detalhamento && (
                <>
                  <h2 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "20px", fontSize: "18px", pageBreakAfter: "avoid" }}>
                    5. DETALHAMENTO DAS PERDAS
                  </h2>
                  
                  <div style={{ overflowX: "auto", marginBottom: "30px", pageBreakInside: "avoid" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                          <th style={{ padding: "10px", textAlign: "left" }}>Tipo de Perda</th>
                          <th style={{ padding: "10px", textAlign: "right" }}>Antes (R$/mês)</th>
                          <th style={{ padding: "10px", textAlign: "right" }}>Depois (R$/mês)</th>
                          <th style={{ padding: "10px", textAlign: "right" }}>Economia (R$/mês)</th>
                          <th style={{ padding: "10px", textAlign: "center" }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "8px" }}>Refugo</td>
                          <td style={{ textAlign: "right" }}>{formatarMoeda(dados.financeiro.detalhamento.refugo.antes)}</td>
                          <td style={{ textAlign: "right" }}>{formatarMoeda(dados.financeiro.detalhamento.refugo.depois)}</td>
                          <td style={{ textAlign: "right", color: "#10b981" }}>{formatarMoeda(dados.financeiro.detalhamento.refugo.economia)}</td>
                          <td style={{ textAlign: "center" }}>{dados.financeiro.detalhamento.refugo.economia > 0 ? "✅" : "⚠️"}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                          <td style={{ padding: "8px" }}>Microparadas</td>
                          <td style={{ textAlign: "right" }}>{formatarMoeda(dados.financeiro.detalhamento.microparadas.antes)}</td>
                          <td style={{ textAlign: "right" }}>{formatarMoeda(dados.financeiro.detalhamento.microparadas.depois)}</td>
                          <td style={{ textAlign: "right", color: "#10b981" }}>{formatarMoeda(dados.financeiro.detalhamento.microparadas.economia)}</td>
                          <td style={{ textAlign: "center" }}>{dados.financeiro.detalhamento.microparadas.economia > 0 ? "✅" : "⚠️"}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "8px" }}>Setup</td>
                          <td style={{ textAlign: "right" }}>{formatarMoeda(dados.financeiro.detalhamento.setup.antes)}</td>
                          <td style={{ textAlign: "right" }}>{formatarMoeda(dados.financeiro.detalhamento.setup.depois)}</td>
                          <td style={{ textAlign: "right", color: "#10b981" }}>{formatarMoeda(dados.financeiro.detalhamento.setup.economia)}</td>
                          <td style={{ textAlign: "center" }}>{dados.financeiro.detalhamento.setup.economia > 0 ? "✅" : "⚠️"}</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: "#1E3A8A" }}>
                          <td style={{ padding: "10px", fontWeight: "bold", color: "white" }}>TOTAL</td>
                          <td style={{ textAlign: "right", fontWeight: "bold", color: "white" }}>{formatarMoeda(dados.financeiro.perda_mensal_antes)}</td>
                          <td style={{ textAlign: "right", fontWeight: "bold", color: "white" }}>{formatarMoeda(dados.financeiro.perda_mensal_depois)}</td>
                          <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarMoeda(dados.financeiro.economia_mensal)}</td>
                          <td style={{ textAlign: "center" }}>
                            <span style={{ color: "#10b981", fontWeight: "bold" }}>
                              {((dados.financeiro.economia_mensal / dados.financeiro.perda_mensal_antes) * 100).toFixed(0)}% ↓
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}

              {/* ASSINATURA */}
              <div style={{ marginTop: "40px", textAlign: "center", pageBreakInside: "avoid" }}>
                <p>____________________________________</p>
                <p style={{ marginTop: "5px" }}><strong>Eng. Henrique de Lima Paiva</strong></p>
                <p style={{ color: "#666", fontSize: "12px" }}>Consultor Sênior - Nexus Engenharia Aplicada</p>
                <p style={{ color: "#666", fontSize: "11px", marginTop: "10px" }}>
                  Contato: henrique@nexus.com.br | (11) 99999-9999
                </p>
              </div>

              {/* RODAPÉ */}
              <div style={{ marginTop: "30px", textAlign: "center", fontSize: "10px", color: "#999", borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}>
                <p>Fonte dos dados: Tabelas producao_oee, posto_trabalho, perdas_linha, linha_produto, produtos</p>
                <p>Total de registros considerados: {dados.metadados?.total_registros_antes || 0} (antes) | {dados.metadados?.total_registros_depois || 0} (depois)</p>
                <p>© {new Date().getFullYear()} Nexus Engenharia Aplicada - Todos os direitos reservados</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          @page {
            size: A4;
            margin: 1.5cm;
          }
          
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          
          .relatorio-print {
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0;
            background: white;
            font-size: 11pt;
            line-height: 1.4;
            color: black;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .relatorio-print h1,
          .relatorio-print h2,
          .relatorio-print h3,
          .relatorio-print h4 {
            page-break-after: avoid;
          }
          
          .relatorio-print div,
          .relatorio-print table,
          .relatorio-print .grafico-container {
            page-break-inside: avoid;
          }
          
          .relatorio-print table {
            page-break-inside: avoid;
          }
          
          .relatorio-print tr {
            page-break-inside: avoid;
          }
          
          canvas {
            page-break-inside: avoid;
            max-width: 100% !important;
            height: auto !important;
          }
          
          p, li {
            orphans: 3;
            widows: 3;
          }
        }
      `}</style>
    </div>
  );
}
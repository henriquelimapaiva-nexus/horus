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
  const [mostrarModal, setMostrarModal] = useState(false);
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

  const handleAbrirModal = () => {
    if (!dados) {
      toast.error("Carregue os dados primeiro");
      return;
    }
    setMostrarModal(true);
  };

  const handleFecharModal = () => {
    setMostrarModal(false);
  };

  const handleExportarPDF = () => {
    window.print();
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
            <Botao variant="success" onClick={handleAbrirModal}>
              📄 Gerar Relatório
            </Botao>
          )}
        </div>
      </Card>

      {/* RESULTADOS NA TELA PRINCIPAL */}
      {dados && (
        <>
          {/* Cards de Indicadores - 8 cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: spacing.lg,
            marginBottom: spacing["2xl"]
          }}>
            <IndicatorCard
              label="OEE Global"
              value={dados.indicadores.oee.depois}
              previousValue={dados.indicadores.oee.antes}
              unit="%"
              type="positive"
              icon="📊"
            />
            <IndicatorCard
              label="Disponibilidade"
              value={dados.indicadores.disponibilidade.depois}
              previousValue={dados.indicadores.disponibilidade.antes}
              unit="%"
              type="positive"
              icon="⏱️"
            />
            <IndicatorCard
              label="Performance"
              value={dados.indicadores.performance.depois}
              previousValue={dados.indicadores.performance.antes}
              unit="%"
              type="positive"
              icon="⚡"
            />
            <IndicatorCard
              label="Qualidade"
              value={dados.indicadores.qualidade.depois}
              previousValue={dados.indicadores.qualidade.antes}
              unit="%"
              type="positive"
              icon="✅"
            />
            <IndicatorCard
              label="Setup Médio"
              value={dados.indicadores.setup.depois}
              previousValue={dados.indicadores.setup.antes}
              unit="min"
              type="negative"
              icon="🔧"
              precision={0}
            />
            <IndicatorCard
              label="Refugo Diário"
              value={dados.indicadores.refugo_diario.depois}
              previousValue={dados.indicadores.refugo_diario.antes}
              unit="peças"
              type="negative"
              icon="🗑️"
              precision={0}
            />
            <IndicatorCard
              label="Produtividade"
              value={dados.indicadores.produtividade.depois}
              previousValue={dados.indicadores.produtividade.antes}
              unit="peças/dia"
              type="positive"
              icon="🏭"
              precision={0}
            />
            <IndicatorCard
              label="ROI"
              value={dados.financeiro.roi}
              previousValue={0}
              unit="%"
              type="positive"
              icon="💰"
              precision={0}
            />
          </div>

          {/* Gráfico de Evolução do OEE */}
          {dados.evolucao_mensal && dados.evolucao_mensal.length > 0 && (
            <Card style={{ marginBottom: spacing["2xl"] }}>
              <div style={{ width: '100%', height: '400px' }}>
                <ComparisonChart
                  data={dados.evolucao_mensal}
                  title="📈 Evolução Mensal do OEE"
                  type="line"
                />
              </div>
            </Card>
          )}

          {/* Resumo Financeiro */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: spacing.lg,
            marginBottom: spacing["2xl"]
          }}>
            <Card titulo="💰 Economia Gerada">
              <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Perda mensal antes:</span>
                  <span style={{ color: colors.status.danger, fontWeight: "bold" }}>
                    {formatarMoeda(dados.financeiro.perda_mensal_antes)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Perda mensal depois:</span>
                  <span style={{ color: colors.status.success, fontWeight: "bold" }}>
                    {formatarMoeda(dados.financeiro.perda_mensal_depois)}
                  </span>
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  borderTop: `1px solid ${colors.border.light}`,
                  paddingTop: spacing.md,
                  marginTop: spacing.xs
                }}>
                  <span style={{ fontWeight: "bold" }}>Economia mensal:</span>
                  <span style={{ color: colors.status.success, fontWeight: "bold", fontSize: typography.fontSize.xl }}>
                    {formatarMoeda(dados.financeiro.economia_mensal)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "bold" }}>Economia anual:</span>
                  <span style={{ color: colors.status.success, fontWeight: "bold", fontSize: typography.fontSize.xl }}>
                    {formatarMoeda(dados.financeiro.economia_anual)}
                  </span>
                </div>
              </div>
            </Card>

            <Card titulo="📊 Retorno sobre Investimento">
              <div style={{ display: "flex", flexDirection: "column", gap: spacing.md }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Investimento total:</span>
                  <span style={{ fontWeight: "bold" }}>
                    {formatarMoeda(dados.financeiro.investimento_total)}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span>ROI:</span>
                  <span style={{ color: colors.status.success, fontWeight: "bold", fontSize: typography.fontSize["3xl"] }}>
                    {formatarNumero(dados.financeiro.roi, 0)}%
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Payback real:</span>
                  <span style={{ color: colors.status.success, fontWeight: "bold", fontSize: typography.fontSize.xl }}>
                    {formatarNumero(dados.financeiro.payback_meses, 1)} meses
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabela Comparativa */}
          <Card titulo="📋 Tabela Comparativa de Indicadores" style={{ marginBottom: spacing["2xl"] }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: colors.primary.blue }}>
                    <th style={{ padding: "12px", textAlign: "left", color: "white" }}>Indicador</th>
                    <th style={{ padding: "12px", textAlign: "right", color: "white" }}>Antes</th>
                    <th style={{ padding: "12px", textAlign: "right", color: "white" }}>Depois</th>
                    <th style={{ padding: "12px", textAlign: "right", color: "white" }}>Delta</th>
                    <th style={{ padding: "12px", textAlign: "right", color: "white" }}>Melhoria</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px" }}>OEE</td>
                    <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.oee.antes, 1)}%</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.oee.depois, 1)}%</td>
                    <td style={{ textAlign: "right" }}>{dados.indicadores.oee.delta >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.oee.delta, 1)}%</td>
                    <td style={{ textAlign: "right", color: "#10b981" }}>{dados.indicadores.oee.percentual >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.oee.percentual, 0)}%</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                    <td style={{ padding: "10px" }}>Disponibilidade</td>
                    <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.disponibilidade.antes, 1)}%</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.disponibilidade.depois, 1)}%</td>
                    <td style={{ textAlign: "right" }}>{dados.indicadores.disponibilidade.delta >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.disponibilidade.delta, 1)}%</td>
                    <td style={{ textAlign: "right", color: "#10b981" }}>{dados.indicadores.disponibilidade.percentual >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.disponibilidade.percentual, 0)}%</td>
                   </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px" }}>Performance</td>
                    <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.performance.antes, 1)}%</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.performance.depois, 1)}%</td>
                    <td style={{ textAlign: "right" }}>{dados.indicadores.performance.delta >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.performance.delta, 1)}%</td>
                    <td style={{ textAlign: "right", color: "#10b981" }}>{dados.indicadores.performance.percentual >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.performance.percentual, 0)}%</td>
                   </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                    <td style={{ padding: "10px" }}>Qualidade</td>
                    <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.qualidade.antes, 1)}%</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.qualidade.depois, 1)}%</td>
                    <td style={{ textAlign: "right" }}>{dados.indicadores.qualidade.delta >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.qualidade.delta, 1)}%</td>
                    <td style={{ textAlign: "right", color: "#10b981" }}>{dados.indicadores.qualidade.percentual >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.qualidade.percentual, 0)}%</td>
                   </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px" }}>Setup (min)</td>
                    <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.setup.antes, 0)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.setup.depois, 0)}</td>
                    <td style={{ textAlign: "right" }}>{dados.indicadores.setup.delta >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.setup.delta, 0)}</td>
                    <td style={{ textAlign: "right", color: "#10b981" }}>{dados.indicadores.setup.percentual <= 0 ? "" : "+"}{formatarNumero(dados.indicadores.setup.percentual, 0)}%</td>
                   </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                    <td style={{ padding: "10px" }}>Refugo (pç/dia)</td>
                    <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.refugo_diario.antes, 0)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.refugo_diario.depois, 0)}</td>
                    <td style={{ textAlign: "right" }}>{dados.indicadores.refugo_diario.delta >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.refugo_diario.delta, 0)}</td>
                    <td style={{ textAlign: "right", color: "#10b981" }}>{dados.indicadores.refugo_diario.percentual <= 0 ? "" : "+"}{formatarNumero(dados.indicadores.refugo_diario.percentual, 0)}%</td>
                   </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px" }}>Produtividade (pç/dia)</td>
                    <td style={{ textAlign: "right" }}>{formatarNumero(dados.indicadores.produtividade.antes, 0)}</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(dados.indicadores.produtividade.depois, 0)}</td>
                    <td style={{ textAlign: "right" }}>{dados.indicadores.produtividade.delta >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.produtividade.delta, 0)}</td>
                    <td style={{ textAlign: "right", color: "#10b981" }}>{dados.indicadores.produtividade.percentual >= 0 ? "+" : ""}{formatarNumero(dados.indicadores.produtividade.percentual, 0)}%</td>
                   </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Footer */}
          <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, textAlign: "center", marginTop: spacing["2xl"] }}>
            <p>📊 Dados baseados em {dados.metadados?.total_registros_antes || 0} registros (antes) e {dados.metadados?.total_registros_depois || 0} registros (depois)</p>
          </div>
        </>
      )}

      {/* MODAL DO RELATÓRIO (mantido igual) */}
      {mostrarModal && dados && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.7)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "auto"
        }} onClick={handleFecharModal}>
          
          <div style={{
            backgroundColor: "white",
            width: "90%",
            maxWidth: "1200px",
            height: "90%",
            overflow: "auto",
            borderRadius: "12px",
            position: "relative",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
          }} onClick={(e) => e.stopPropagation()}>
            
            <div className="no-print" style={{
              position: "sticky",
              top: 0,
              right: 0,
              zIndex: 10,
              backgroundColor: "white",
              padding: "15px 20px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end"
            }}>
              <Botao variant="secondary" size="sm" onClick={handleFecharModal}>
                ✖ Fechar
              </Botao>
              <Botao variant="success" size="sm" onClick={handleExportarPDF}>
                📄 Exportar PDF
              </Botao>
            </div>

            <div ref={relatorioRef} className="relatorio-print" style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto", position: "relative" }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-45deg)", opacity: 0.03, fontSize: "80px", color: "#1E3A8A", pointerEvents: "none", whiteSpace: "nowrap", fontWeight: "bold" }}>
                NEXUS
              </div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                  <img src={logo} alt="Nexus" style={{ width: "180px", marginBottom: "10px" }} />
                  <h1 style={{ color: "#1E3A8A", margin: "5px 0", fontSize: "24px" }}>NEXUS ENGENHARIA APLICADA</h1>
                  <h2 style={{ color: "#666", fontWeight: "300", fontSize: "18px" }}>Validação de Resultados</h2>
                </div>
                <div style={{ textAlign: "center", marginBottom: "25px" }}>
                  <h3 style={{ color: "#1E3A8A", marginBottom: "5px", fontSize: "18px" }}>{empresaNome}</h3>
                  <p style={{ color: "#666", fontSize: "13px" }}>Período Antes: {periodoAntes.inicio.split('-').reverse().join('/')} a {periodoAntes.fim.split('-').reverse().join('/')}</p>
                  <p style={{ color: "#666", fontSize: "13px" }}>Período Depois: {periodoDepois.inicio.split('-').reverse().join('/')} a {periodoDepois.fim.split('-').reverse().join('/')}</p>
                  <p style={{ color: "#666", fontSize: "13px" }}>Data: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                <h2 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "20px", fontSize: "18px" }}>1. INDICADORES DE PERFORMANCE</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "30px" }}>
                  <div style={{ backgroundColor: "#f0fdf4", padding: "15px", borderRadius: "8px", borderLeft: "4px solid #10b981" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>OEE Global</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.oee.depois, 1)}%</div>
                    <div style={{ fontSize: "11px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.oee.antes, 1)}%</div>
                  </div>
                  <div style={{ backgroundColor: "#eff6ff", padding: "15px", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Disponibilidade</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.disponibilidade.depois, 1)}%</div>
                    <div style={{ fontSize: "11px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.disponibilidade.antes, 1)}%</div>
                  </div>
                  <div style={{ backgroundColor: "#fef3c7", padding: "15px", borderRadius: "8px", borderLeft: "4px solid #f59e0b" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Performance</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.performance.depois, 1)}%</div>
                    <div style={{ fontSize: "11px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.performance.antes, 1)}%</div>
                  </div>
                  <div style={{ backgroundColor: "#f0fdf4", padding: "15px", borderRadius: "8px", borderLeft: "4px solid #10b981" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Qualidade</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.qualidade.depois, 1)}%</div>
                    <div style={{ fontSize: "11px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.qualidade.antes, 1)}%</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "30px" }}>
                  <div style={{ backgroundColor: "#fef2f2", padding: "15px", borderRadius: "8px", borderLeft: "4px solid #ef4444" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Setup Médio</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.setup.depois, 0)} min</div>
                    <div style={{ fontSize: "11px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.setup.antes, 0)} min</div>
                  </div>
                  <div style={{ backgroundColor: "#fef2f2", padding: "15px", borderRadius: "8px", borderLeft: "4px solid #ef4444" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Refugo Diário</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.refugo_diario.depois, 0)} pç</div>
                    <div style={{ fontSize: "11px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.refugo_diario.antes, 0)} pç</div>
                  </div>
                  <div style={{ backgroundColor: "#eff6ff", padding: "15px", borderRadius: "8px", borderLeft: "4px solid #3b82f6" }}>
                    <div style={{ fontSize: "12px", color: "#666" }}>Produtividade</div>
                    <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1E3A8A" }}>{formatarNumero(dados.indicadores.produtividade.depois, 0)} pç/dia</div>
                    <div style={{ fontSize: "11px", color: "#666" }}>Antes: {formatarNumero(dados.indicadores.produtividade.antes, 0)} pç/dia</div>
                  </div>
                </div>

                <h2 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "20px", fontSize: "18px" }}>2. ANÁLISE FINANCEIRA</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "30px" }}>
                  <div style={{ backgroundColor: "#f0fdf4", padding: "20px", borderRadius: "8px" }}>
                    <h3 style={{ color: "#166534", marginBottom: "15px" }}>💰 Economia Gerada</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span>Perda mensal antes:</span>
                      <span style={{ color: "#ef4444", fontWeight: "bold" }}>{formatarMoeda(dados.financeiro.perda_mensal_antes)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span>Perda mensal depois:</span>
                      <span style={{ color: "#10b981", fontWeight: "bold" }}>{formatarMoeda(dados.financeiro.perda_mensal_depois)}</span>
                    </div>
                    <div style={{ borderTop: "1px solid #ccc", paddingTop: "12px", marginTop: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: "bold" }}>Economia mensal:</span>
                        <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "18px" }}>{formatarMoeda(dados.financeiro.economia_mensal)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
                        <span style={{ fontWeight: "bold" }}>Economia anual:</span>
                        <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "18px" }}>{formatarMoeda(dados.financeiro.economia_anual)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: "#eff6ff", padding: "20px", borderRadius: "8px" }}>
                    <h3 style={{ color: "#1e3a8a", marginBottom: "15px" }}>📊 Retorno sobre Investimento</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span>Investimento total:</span>
                      <span style={{ fontWeight: "bold" }}>{formatarMoeda(dados.financeiro.investimento_total)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
                      <span>ROI:</span>
                      <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "28px" }}>{formatarNumero(dados.financeiro.roi, 0)}%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Payback:</span>
                      <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "18px" }}>{formatarNumero(dados.financeiro.payback_meses, 1)} meses</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "40px", textAlign: "center" }}>
                  <p>____________________________________</p>
                  <p style={{ marginTop: "8px" }}><strong>Eng. Henrique de Lima Paiva</strong></p>
                  <p style={{ color: "#666", fontSize: "12px" }}>Consultor Sênior - Nexus Engenharia Aplicada</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .relatorio-print, .relatorio-print * {
            visibility: visible;
          }
          .relatorio-print {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  );
}
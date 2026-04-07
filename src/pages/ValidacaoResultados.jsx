// src/pages/ValidacaoResultados.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Card from "../components/ui/Card";
import Botao from "../components/ui/Botao";
import Input from "../components/ui/Input";
import IndicatorCard from "../components/IndicatorCard";
import ComparisonChart from "../components/ComparisonChart";
import toast from "react-hot-toast";
import { colors, spacing, typography, borderRadius, shadows } from "../styles/theme";

export default function ValidacaoResultados() {
  const { clienteAtual } = useOutletContext();
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState(null);
  const [empresaNome, setEmpresaNome] = useState("");
  
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
      
      {/* Header */}
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

        <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.xl, justifyContent: "center" }}>
          <Botao variant="primary" onClick={carregarDados} disabled={carregando} loading={carregando}>
            {carregando ? "Carregando..." : "Carregar Dados"}
          </Botao>
        </div>
      </Card>

      {/* Resultados */}
      {dados && (
        <>
          {/* Cards de Indicadores */}
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
              <ComparisonChart
                data={dados.evolucao_mensal}
                title="📈 Evolução Mensal do OEE"
                type="line"
                height={350}
              />
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

          {/* Detalhamento das Perdas */}
          {dados.financeiro.detalhamento && (
            <Card titulo="🔍 Detalhamento das Perdas Financeiras">
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.primary.blue }}>
                      <th style={{ padding: spacing.md, textAlign: "left", color: "white" }}>Tipo de Perda</th>
                      <th style={{ padding: spacing.md, textAlign: "right", color: "white" }}>Antes (R$/mês)</th>
                      <th style={{ padding: spacing.md, textAlign: "right", color: "white" }}>Depois (R$/mês)</th>
                      <th style={{ padding: spacing.md, textAlign: "right", color: "white" }}>Economia (R$/mês)</th>
                      <th style={{ padding: spacing.md, textAlign: "center", color: "white" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: `1px solid ${colors.border.light}` }}>
                      <td style={{ padding: spacing.md }}>Refugo</td>
                      <td style={{ textAlign: "right" }}>{formatarMoeda(dados.financeiro.detalhamento.refugo.antes)}</td>
                      <td style={{ textAlign: "right" }}>{formatarMoeda(dados.financeiro.detalhamento.refugo.depois)}</td>
                      <td style={{ textAlign: "right", color: colors.status.success }}>
                        {formatarMoeda(dados.financeiro.detalhamento.refugo.economia)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {dados.financeiro.detalhamento.refugo.economia > 0 ? "✅" : "⚠️"}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: colors.background.tertiary, borderBottom: `1px solid ${colors.border.light}` }}>
                      <td style={{ padding: spacing.md }}>Microparadas</td>
                      <td style={{ textAlign: "right" }}>{formatarMoeda(dados.financeiro.detalhamento.microparadas.antes)}</td>
                      <td style={{ textAlign: "right" }}>{formatarMoeda(dados.financeiro.detalhamento.microparadas.depois)}</td>
                      <td style={{ textAlign: "right", color: colors.status.success }}>
                        {formatarMoeda(dados.financeiro.detalhamento.microparadas.economia)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {dados.financeiro.detalhamento.microparadas.economia > 0 ? "✅" : "⚠️"}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: `1px solid ${colors.border.light}` }}>
                      <td style={{ padding: spacing.md }}>Setup</td>
                      <td style={{ textAlign: "right" }}>{formatarMoeda(dados.financeiro.detalhamento.setup.antes)}</td>
                      <td style={{ textAlign: "right" }}>{formatarMoeda(dados.financeiro.detalhamento.setup.depois)}</td>
                      <td style={{ textAlign: "right", color: colors.status.success }}>
                        {formatarMoeda(dados.financeiro.detalhamento.setup.economia)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {dados.financeiro.detalhamento.setup.economia > 0 ? "✅" : "⚠️"}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: colors.primary.blue }}>
                      <td style={{ padding: spacing.md, fontWeight: "bold", color: "white" }}>TOTAL</td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "white" }}>
                        {formatarMoeda(dados.financeiro.perda_mensal_antes)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: "white" }}>
                        {formatarMoeda(dados.financeiro.perda_mensal_depois)}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: "bold", color: colors.status.success }}>
                        {formatarMoeda(dados.financeiro.economia_mensal)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ color: colors.status.success, fontWeight: "bold" }}>
                          {((dados.financeiro.economia_mensal / dados.financeiro.perda_mensal_antes) * 100).toFixed(0)}% ↓
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}

          {/* Footer com metadados */}
          <div style={{ 
            fontSize: typography.fontSize.xs, 
            color: colors.text.tertiary, 
            textAlign: "center", 
            marginTop: spacing["2xl"],
            borderTop: `1px solid ${colors.border.light}`,
            paddingTop: spacing.lg
          }}>
            <p>
              📊 Dados baseados em {dados.metadados?.total_registros_antes || 0} registros (antes) e 
              {dados.metadados?.total_registros_depois || 0} registros (depois)
            </p>
            <p>
              🕐 Cálculo realizado em {new Date(dados.metadados?.data_calculo).toLocaleString("pt-BR")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
// src/pages/ValidacaoResultados.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Card from "../components/ui/Card";
import Botao from "../components/ui/Botao";
import toast from "react-hot-toast";

export default function ValidacaoResultados() {
  const { clienteAtual } = useOutletContext();
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState(null);
  const [mesesAntes, setMesesAntes] = useState(3);
  const [mesesDepois, setMesesDepois] = useState(3);

  const carregarDados = async () => {
    if (!clienteAtual) {
      toast.error("Selecione uma empresa primeiro");
      return;
    }

    setCarregando(true);
    toast.loading("Carregando dados de validação...", { id: "validacao" });

    try {
      const response = await api.get(
        `/evolution/compare/${clienteAtual}?meses_antes=${mesesAntes}&meses_depois=${mesesDepois}`
      );
      setDados(response.data);
      toast.success("Dados carregados com sucesso!", { id: "validacao" });
    } catch (error) {
      console.error("Erro ao carregar validação:", error);
      toast.error(error.response?.data?.erro || "Erro ao carregar dados", { id: "validacao" });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (clienteAtual) {
      carregarDados();
    }
  }, [clienteAtual, mesesAntes, mesesDepois]);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(valor || 0);
  };

  const formatarNumero = (valor, casas = 1) => {
    if (valor === undefined || valor === null) return "0";
    return valor.toFixed(casas);
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

  if (carregando && !dados) {
    return (
      <div style={{ padding: "30px", textAlign: "center" }}>
        <Card>
          <p>Carregando dados de validação...</p>
        </Card>
      </div>
    );
  }

  if (!dados) {
    return (
      <div style={{ padding: "30px", textAlign: "center" }}>
        <Card>
          <p>Nenhum dado encontrado. Verifique se há registros de produção para esta empresa.</p>
          <Botao onClick={carregarDados} variant="primary">
            Carregar Dados
          </Botao>
        </Card>
      </div>
    );
  }

  const { indicadores, financeiro, evolucao_mensal_oee, periodo, metadados } = dados;

  return (
    <div style={{ padding: "clamp(15px, 3vw, 30px)", maxWidth: "1400px", margin: "0 auto" }}>
      
      {/* Cabeçalho */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ color: "#1E3A8A", marginBottom: "10px", fontSize: "clamp(20px, 4vw, 28px)" }}>
          Validação de Resultados
        </h1>
        <p style={{ color: "#666", fontSize: "clamp(13px, 2vw, 14px)" }}>
          Comparação real entre o período antes e depois da consultoria. 
          Todos os dados são extraídos diretamente do banco de dados.
        </p>
      </div>

      {/* Cards de Resumo */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
        gap: "clamp(15px, 2vw, 20px)",
        marginBottom: "clamp(25px, 4vw, 35px)"
      }}>
        
        {/* Card OEE */}
        <Card>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "clamp(24px, 4vw, 32px)", marginBottom: "10px" }}>📊</div>
            <div style={{ fontSize: "clamp(12px, 1.8vw, 14px)", color: "#666" }}>OEE Global</div>
            <div style={{ fontSize: "clamp(18px, 3vw, 22px)", fontWeight: "bold", color: "#1E3A8A" }}>
              {formatarPercentual(indicadores.oee.depois)}
            </div>
            <div style={{ fontSize: "clamp(11px, 1.5vw, 12px)", color: "#666" }}>
              Antes: {formatarPercentual(indicadores.oee.antes)}
            </div>
            <div style={{ 
              color: getDeltaColor(indicadores.oee.delta),
              fontSize: "clamp(13px, 2vw, 14px)",
              fontWeight: "bold",
              marginTop: "5px"
            }}>
              {getDeltaIcon(indicadores.oee.delta)} {getDeltaSymbol(indicadores.oee.delta)}{formatarNumero(indicadores.oee.delta, 1)}% ({getDeltaSymbol(indicadores.oee.percentual)}{formatarNumero(indicadores.oee.percentual, 0)}%)
            </div>
          </div>
        </Card>

        {/* Card Setup */}
        <Card>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "clamp(24px, 4vw, 32px)", marginBottom: "10px" }}>⏱️</div>
            <div style={{ fontSize: "clamp(12px, 1.8vw, 14px)", color: "#666" }}>Setup Médio</div>
            <div style={{ fontSize: "clamp(18px, 3vw, 22px)", fontWeight: "bold", color: "#1E3A8A" }}>
              {formatarNumero(indicadores.setup.depois, 0)} min
            </div>
            <div style={{ fontSize: "clamp(11px, 1.5vw, 12px)", color: "#666" }}>
              Antes: {formatarNumero(indicadores.setup.antes, 0)} min
            </div>
            <div style={{ 
              color: getDeltaColor(indicadores.setup.delta, true),
              fontSize: "clamp(13px, 2vw, 14px)",
              fontWeight: "bold",
              marginTop: "5px"
            }}>
              {getDeltaIcon(indicadores.setup.delta)} {indicadores.setup.delta > 0 ? "+" : ""}{formatarNumero(indicadores.setup.delta, 0)} min ({getDeltaSymbol(indicadores.setup.percentual)}{formatarNumero(indicadores.setup.percentual, 0)}%)
            </div>
          </div>
        </Card>

        {/* Card Refugo */}
        <Card>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "clamp(24px, 4vw, 32px)", marginBottom: "10px" }}>🔧</div>
            <div style={{ fontSize: "clamp(12px, 1.8vw, 14px)", color: "#666" }}>Refugo (peças/dia)</div>
            <div style={{ fontSize: "clamp(18px, 3vw, 22px)", fontWeight: "bold", color: "#1E3A8A" }}>
              {formatarNumero(indicadores.refugo_diario.depois, 0)}
            </div>
            <div style={{ fontSize: "clamp(11px, 1.5vw, 12px)", color: "#666" }}>
              Antes: {formatarNumero(indicadores.refugo_diario.antes, 0)}
            </div>
            <div style={{ 
              color: getDeltaColor(indicadores.refugo_diario.delta, true),
              fontSize: "clamp(13px, 2vw, 14px)",
              fontWeight: "bold",
              marginTop: "5px"
            }}>
              {getDeltaIcon(indicadores.refugo_diario.delta)} {indicadores.refugo_diario.delta > 0 ? "+" : ""}{formatarNumero(indicadores.refugo_diario.delta, 0)} ({getDeltaSymbol(indicadores.refugo_diario.percentual)}{formatarNumero(indicadores.refugo_diario.percentual, 0)}%)
            </div>
          </div>
        </Card>

        {/* Card ROI */}
        <Card>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "clamp(24px, 4vw, 32px)", marginBottom: "10px" }}>💰</div>
            <div style={{ fontSize: "clamp(12px, 1.8vw, 14px)", color: "#666" }}>ROI</div>
            <div style={{ fontSize: "clamp(18px, 3vw, 22px)", fontWeight: "bold", color: "#1E3A8A" }}>
              {formatarNumero(financeiro.roi, 0)}%
            </div>
            <div style={{ fontSize: "clamp(11px, 1.5vw, 12px)", color: "#666" }}>
              Payback: {formatarNumero(financeiro.payback_meses, 1)} meses
            </div>
            <div style={{ 
              color: "#10b981",
              fontSize: "clamp(13px, 2vw, 14px)",
              fontWeight: "bold",
              marginTop: "5px"
            }}>
              ✅ {formatarMoeda(financeiro.economia_anual)}/ano
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico de Evolução do OEE */}
      {evolucao_mensal_oee && evolucao_mensal_oee.length > 0 && (
        <Card titulo="Evolução do OEE - Últimos Meses" style={{ marginBottom: "clamp(25px, 4vw, 35px)" }}>
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "500px" }}>
              {evolucao_mensal_oee.map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div style={{ width: "60px", fontSize: "12px", color: "#666" }}>{item.mes}</div>
                  <div style={{ flex: 1, height: "30px", backgroundColor: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(100, item.oee)}%`,
                      height: "100%",
                      backgroundColor: item.oee >= 70 ? "#10b981" : item.oee >= 50 ? "#f59e0b" : "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      paddingRight: "8px",
                      color: "white",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      {formatarNumero(item.oee, 1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: "15px", fontSize: "12px", color: "#666", textAlign: "center" }}>
            📌 Fonte: Tabela producao_oee | Diagnóstico: {periodo.data_diagnostico} | Implementação: {periodo.data_implementacao}
          </div>
        </Card>
      )}

      {/* Pilares do OEE */}
      <Card titulo="Pilares do OEE - Antes x Depois" style={{ marginBottom: "clamp(25px, 4vw, 35px)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ fontSize: "13px", fontWeight: "500" }}>Disponibilidade</span>
              <div>
                <span style={{ color: "#ef4444" }}>{formatarPercentual(indicadores.disponibilidade.antes)}</span>
                <span> → </span>
                <span style={{ color: "#10b981", fontWeight: "bold" }}>{formatarPercentual(indicadores.disponibilidade.depois)}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "4px", height: "30px" }}>
              <div style={{ width: `${indicadores.disponibilidade.antes}%`, backgroundColor: "#ef4444", borderRadius: "4px 0 0 4px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px" }}>
                {formatarPercentual(indicadores.disponibilidade.antes)}
              </div>
              <div style={{ width: `${indicadores.disponibilidade.depois}%`, backgroundColor: "#10b981", borderRadius: "0 4px 4px 0", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px" }}>
                {formatarPercentual(indicadores.disponibilidade.depois)}
              </div>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ fontSize: "13px", fontWeight: "500" }}>Performance</span>
              <div>
                <span style={{ color: "#ef4444" }}>{formatarPercentual(indicadores.performance.antes)}</span>
                <span> → </span>
                <span style={{ color: "#10b981", fontWeight: "bold" }}>{formatarPercentual(indicadores.performance.depois)}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "4px", height: "30px" }}>
              <div style={{ width: `${indicadores.performance.antes}%`, backgroundColor: "#ef4444", borderRadius: "4px 0 0 4px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px" }}>
                {formatarPercentual(indicadores.performance.antes)}
              </div>
              <div style={{ width: `${indicadores.performance.depois}%`, backgroundColor: "#10b981", borderRadius: "0 4px 4px 0", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px" }}>
                {formatarPercentual(indicadores.performance.depois)}
              </div>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ fontSize: "13px", fontWeight: "500" }}>Qualidade</span>
              <div>
                <span style={{ color: "#ef4444" }}>{formatarPercentual(indicadores.qualidade.antes)}</span>
                <span> → </span>
                <span style={{ color: "#10b981", fontWeight: "bold" }}>{formatarPercentual(indicadores.qualidade.depois)}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "4px", height: "30px" }}>
              <div style={{ width: `${indicadores.qualidade.antes}%`, backgroundColor: "#ef4444", borderRadius: "4px 0 0 4px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px" }}>
                {formatarPercentual(indicadores.qualidade.antes)}
              </div>
              <div style={{ width: `${indicadores.qualidade.depois}%`, backgroundColor: "#10b981", borderRadius: "0 4px 4px 0", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px" }}>
                {formatarPercentual(indicadores.qualidade.depois)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabela Comparativa */}
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
                <td style={{ textAlign: "right", padding: "10px" }}>{formatarPercentual(indicadores.oee.antes)}</td>
                <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(indicadores.oee.depois)}</td>
                <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(indicadores.oee.delta) }}>{getDeltaSymbol(indicadores.oee.delta)}{formatarNumero(indicadores.oee.delta, 1)}%</td>
                <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(indicadores.oee.percentual) }}>{getDeltaSymbol(indicadores.oee.percentual)}{formatarNumero(indicadores.oee.percentual, 0)}%</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                <td style={{ padding: "10px" }}>Disponibilidade</td>
                <td style={{ textAlign: "right", padding: "10px" }}>{formatarPercentual(indicadores.disponibilidade.antes)}</td>
                <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(indicadores.disponibilidade.depois)}</td>
                <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(indicadores.disponibilidade.delta) }}>{getDeltaSymbol(indicadores.disponibilidade.delta)}{formatarNumero(indicadores.disponibilidade.delta, 1)}%</td>
                <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(indicadores.disponibilidade.percentual) }}>{getDeltaSymbol(indicadores.disponibilidade.percentual)}{formatarNumero(indicadores.disponibilidade.percentual, 0)}%</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "10px" }}>Performance</td>
                <td style={{ textAlign: "right", padding: "10px" }}>{formatarPercentual(indicadores.performance.antes)}</td>
                <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(indicadores.performance.depois)}</td>
                <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(indicadores.performance.delta) }}>{getDeltaSymbol(indicadores.performance.delta)}{formatarNumero(indicadores.performance.delta, 1)}%</td>
                <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(indicadores.performance.percentual) }}>{getDeltaSymbol(indicadores.performance.percentual)}{formatarNumero(indicadores.performance.percentual, 0)}%</td>
               </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                <td style={{ padding: "10px" }}>Qualidade</td>
                <td style={{ textAlign: "right", padding: "10px" }}>{formatarPercentual(indicadores.qualidade.antes)}</td>
                <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold", color: "#10b981" }}>{formatarPercentual(indicadores.qualidade.depois)}</td>
                <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(indicadores.qualidade.delta) }}>{getDeltaSymbol(indicadores.qualidade.delta)}{formatarNumero(indicadores.qualidade.delta, 1)}%</td>
                <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(indicadores.qualidade.percentual) }}>{getDeltaSymbol(indicadores.qualidade.percentual)}{formatarNumero(indicadores.qualidade.percentual, 0)}%</td>
               </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "10px" }}>Setup (minutos)</td>
                <td style={{ textAlign: "right", padding: "10px" }}>{formatarNumero(indicadores.setup.antes, 0)}</td>
                <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(indicadores.setup.depois, 0)}</td>
                <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(indicadores.setup.delta, true) }}>{indicadores.setup.delta > 0 ? "+" : ""}{formatarNumero(indicadores.setup.delta, 0)}</td>
                <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(indicadores.setup.percentual, true) }}>{indicadores.setup.percentual > 0 ? "+" : ""}{formatarNumero(indicadores.setup.percentual, 0)}%</td>
               </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb" }}>
                <td style={{ padding: "10px" }}>Refugo (peças/dia)</td>
                <td style={{ textAlign: "right", padding: "10px" }}>{formatarNumero(indicadores.refugo_diario.antes, 0)}</td>
                <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(indicadores.refugo_diario.depois, 0)}</td>
                <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(indicadores.refugo_diario.delta, true) }}>{indicadores.refugo_diario.delta > 0 ? "+" : ""}{formatarNumero(indicadores.refugo_diario.delta, 0)}</td>
                <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(indicadores.refugo_diario.percentual, true) }}>{indicadores.refugo_diario.percentual > 0 ? "+" : ""}{formatarNumero(indicadores.refugo_diario.percentual, 0)}%</td>
               </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "10px" }}>Produtividade (peças/dia)</td>
                <td style={{ textAlign: "right", padding: "10px" }}>{formatarNumero(indicadores.produtividade.antes, 0)}</td>
                <td style={{ textAlign: "right", padding: "10px", fontWeight: "bold", color: "#10b981" }}>{formatarNumero(indicadores.produtividade.depois, 0)}</td>
                <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(indicadores.produtividade.delta) }}>{getDeltaSymbol(indicadores.produtividade.delta)}{formatarNumero(indicadores.produtividade.delta, 0)}</td>
                <td style={{ textAlign: "right", padding: "10px", color: getDeltaColor(indicadores.produtividade.percentual) }}>{getDeltaSymbol(indicadores.produtividade.percentual)}{formatarNumero(indicadores.produtividade.percentual, 0)}%</td>
               </tr>
            </tbody>
           </table>
        </div>
      </Card>

      {/* Cards Financeiros */}
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
              <span style={{ color: "#ef4444", fontWeight: "bold" }}>{formatarMoeda(financeiro.perda_mensal_antes)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Perda mensal depois:</span>
              <span style={{ color: "#10b981", fontWeight: "bold" }}>{formatarMoeda(financeiro.perda_mensal_depois)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e5e7eb", paddingTop: "10px", marginTop: "5px" }}>
              <span style={{ fontWeight: "bold" }}>Economia mensal:</span>
              <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "18px" }}>{formatarMoeda(financeiro.economia_mensal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: "bold" }}>Economia anual:</span>
              <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "18px" }}>{formatarMoeda(financeiro.economia_anual)}</span>
            </div>
          </div>
        </Card>

        <Card titulo="Retorno sobre Investimento">
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Investimento total:</span>
              <span style={{ fontWeight: "bold" }}>{formatarMoeda(financeiro.investimento_total)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>ROI:</span>
              <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "22px" }}>{formatarNumero(financeiro.roi, 0)}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Payback real:</span>
              <span style={{ color: "#10b981", fontWeight: "bold", fontSize: "18px" }}>{formatarNumero(financeiro.payback_meses, 1)} meses</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Rodapé com fontes */}
      <div style={{ fontSize: "11px", color: "#999", textAlign: "center", marginTop: "30px", borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}>
        <p>📌 Fonte dos dados: Tabelas producao_oee, posto_trabalho, perdas_linha, linha_produto, produtos</p>
        <p>📊 Período analisado: {periodo.antes.meses_analisados} meses antes do diagnóstico | {periodo.depois.meses_analisados} meses após implementação</p>
        <p>✅ Total de registros considerados: {metadados.total_registros_antes} (antes) | {metadados.total_registros_depois} (depois)</p>
      </div>

    </div>
  );
}
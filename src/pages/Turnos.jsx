// src/pages/Turnos.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";

const slugParaCor = {
  green:  { bg: "#dcfce7", text: "#15803d", borda: "#16a34a" },
  yellow: { bg: "#fef9c3", text: "#854d0e", borda: "#ca8a04" },
  red:    { bg: "#fee2e2", text: "#b91c1c", borda: "#dc2626" },
  gray:   { bg: "#f3f4f6", text: "#6b7280", borda: "#9ca3af" },
};

const Badge = ({ slug, texto }) => {
  const cor = slugParaCor[slug] || slugParaCor.gray;
  return (
    <span style={{ backgroundColor: cor.bg, color: cor.text, border: `1px solid ${cor.borda}`, borderRadius: "12px", padding: "3px 10px", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
      {texto}
    </span>
  );
};

const CardMetrica = ({ titulo, valor, unidade, slug, descricao }) => {
  const cor = slugParaCor[slug] || slugParaCor.gray;
  return (
    <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "20px", borderTop: `4px solid ${cor.borda}`, flex: "1", minWidth: "160px" }}>
      <p style={{ color: "#6b7280", fontSize: "12px", margin: "0 0 6px 0" }}>{titulo}</p>
      <p style={{ color: "#1E3A8A", fontSize: "26px", fontWeight: "700", margin: "0 0 4px 0" }}>
        {valor ?? "—"} <span style={{ fontSize: "14px", fontWeight: "400", color: "#6b7280" }}>{unidade}</span>
      </p>
      {descricao && <p style={{ color: "#6b7280", fontSize: "12px", margin: "6px 0 0 0" }}>{descricao}</p>}
    </div>
  );
};

const LinhaDado = ({ label, valor, destaque }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
    <span style={{ color: "#6b7280" }}>{label}</span>
    <span style={{ color: destaque ? "#b91c1c" : "#1E3A8A", fontWeight: destaque ? "700" : "600" }}>{valor}</span>
  </div>
);

const CardTurno = ({ turno }) => {
  const temDados = turno.registros > 0;
  const oee = turno.oee_medio;
  const slug = !temDados ? "gray" : oee >= 85 ? "green" : oee >= 65 ? "yellow" : "red";
  const cor  = slugParaCor[slug];
  return (
    <div style={{ flex: "1", minWidth: "220px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", borderTop: `4px solid ${cor.borda}`, overflow: "hidden" }}>
      <div style={{ backgroundColor: cor.bg, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ color: cor.text, margin: 0, fontSize: "16px", fontWeight: "700" }}>Turno {turno.turno}</h3>
        <span style={{ color: cor.text, fontSize: "22px", fontWeight: "800" }}>{temDados ? `${oee}%` : "—"}</span>
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        <LinhaDado label="Registros" valor={turno.registros} />
        <LinhaDado label="Disponibilidade" valor={temDados ? `${turno.disponibilidade_media}%` : "—"} />
        <LinhaDado label="Performance" valor={temDados ? `${turno.performance_media}%` : "—"} />
        <LinhaDado label="Qualidade" valor={temDados ? `${turno.qualidade_media}%` : "—"} />
        <LinhaDado label="Peças produzidas" valor={turno.total_pecas_produzidas ?? "—"} />
        <LinhaDado label="Refugo" valor={turno.total_refugo ?? "—"} destaque={turno.total_refugo > 0} />
        <LinhaDado label="% Refugo" valor={temDados ? `${turno.percentual_refugo}%` : "—"} destaque={turno.percentual_refugo > 3} />
        <LinhaDado label="Paradas (ocorr.)" valor={turno.manutencao?.ocorrencias_paradas ?? "—"} />
        <LinhaDado label="Tempo parado" valor={turno.manutencao?.total_parada_min ? `${turno.manutencao.total_parada_min} min` : "—"} />
        <LinhaDado label="Defeitos" valor={turno.defeitos?.total_defeitos ?? "—"} destaque={turno.defeitos?.total_defeitos > 0} />
        {turno.defeitos?.tipo_mais_frequente && <LinhaDado label="Defeito freq." valor={turno.defeitos.tipo_mais_frequente} />}
      </div>
      {turno.alertas?.length > 0 && (
        <div style={{ borderTop: "1px solid #e5e7eb", padding: "10px 16px", backgroundColor: "#fef9c3" }}>
          {turno.alertas.map((a, i) => <p key={i} style={{ color: "#854d0e", fontSize: "11px", margin: "2px 0" }}>⚠️ {a}</p>)}
        </div>
      )}
    </div>
  );
};

export default function Turnos() {
  let clienteAtual = null;
  try { const ctx = useOutletContext() || {}; clienteAtual = ctx.clienteAtual; } catch (_) {}

  const empresaId = clienteAtual;
  const [aba, setAba] = useState("empresa");
  const [linhas, setLinhas] = useState([]);
  const [linhaSel, setLinhaSel] = useState("");
  const [turnoSel, setTurnoSel] = useState("1");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [dadosEmpresa, setDadosEmpresa] = useState(null);
  const [dadosLinha, setDadosLinha] = useState(null);
  const [dadosHistorico, setDadosHistorico] = useState(null);

  useEffect(() => {
    if (!empresaId) return;
    api.get(`/lines/${empresaId}`).then(r => setLinhas(r.data || [])).catch(() => toast.error("Erro ao carregar linhas"));
  }, [empresaId]);

  function montarParams() {
    const p = new URLSearchParams();
    if (dataInicio) p.append("data_inicio", dataInicio);
    if (dataFim) p.append("data_fim", dataFim);
    const s = p.toString();
    return s ? `?${s}` : "";
  }

  async function buscarEmpresa() {
    if (!empresaId) return toast.error("Selecione um cliente no menu superior.");
    setCarregando(true);
    try { const r = await api.get(`/turnos/empresa/${empresaId}${montarParams()}`); setDadosEmpresa(r.data); }
    catch { toast.error("Erro ao buscar análise por turno da empresa"); }
    finally { setCarregando(false); }
  }

  async function buscarLinha() {
    if (!linhaSel) return toast.error("Selecione uma linha.");
    setCarregando(true);
    try { const r = await api.get(`/turnos/linha/${linhaSel}${montarParams()}`); setDadosLinha(r.data); }
    catch { toast.error("Erro ao buscar análise por turno da linha"); }
    finally { setCarregando(false); }
  }

  async function buscarHistorico() {
    if (!linhaSel) return toast.error("Selecione uma linha.");
    setCarregando(true);
    try { const r = await api.get(`/turnos/historico/${linhaSel}/${turnoSel}${montarParams()}`); setDadosHistorico(r.data); }
    catch { toast.error("Erro ao buscar histórico do turno"); }
    finally { setCarregando(false); }
  }

  function limpar() { setDataInicio(""); setDataFim(""); setLinhaSel(""); setTurnoSel("1"); setDadosEmpresa(null); setDadosLinha(null); setDadosHistorico(null); }

  const acaoBuscar = aba === "empresa" ? buscarEmpresa : aba === "linha" ? buscarLinha : buscarHistorico;
  const tendenciaIcone = (t) => t === "melhora" ? "📈" : t === "piora" ? "📉" : "➡️";
  const tendenciaSlug  = (t) => t === "melhora" ? "green" : t === "piora" ? "red" : "gray";

  return (
    <div style={{ padding: "clamp(15px,3vw,30px)", width: "100%", maxWidth: "1400px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>

      <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "25px 30px", marginBottom: "24px" }}>
        <h1 style={{ color: "#1E3A8A", margin: "0 0 4px 0", fontSize: "clamp(20px,4vw,26px)" }}>🕐 Análise por Turno</h1>
        <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>Compare OEE, perdas e qualidade entre os turnos para identificar onde está o problema</p>
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "24px" }}>
        <h3 style={{ color: "#1E3A8A", margin: "0 0 16px 0", fontSize: "15px" }}>Filtros</h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={labelStyle}>Data início</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={labelStyle}>Data fim</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} style={inputStyle} />
          </div>
          {(aba === "linha" || aba === "historico") && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={labelStyle}>Linha</label>
              <select value={linhaSel} onChange={e => setLinhaSel(e.target.value)} style={inputStyle}>
                <option value="">Selecione...</option>
                {linhas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
          )}
          {aba === "historico" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={labelStyle}>Turno</label>
              <select value={turnoSel} onChange={e => setTurnoSel(e.target.value)} style={inputStyle}>
                <option value="1">Turno 1</option>
                <option value="2">Turno 2</option>
                <option value="3">Turno 3</option>
              </select>
            </div>
          )}
          <button onClick={acaoBuscar} disabled={carregando} style={{ padding: "9px 20px", backgroundColor: "#1E3A8A", color: "white", border: "none", borderRadius: "4px", fontSize: "14px", cursor: carregando ? "not-allowed" : "pointer", opacity: carregando ? 0.7 : 1, fontWeight: "600" }}>
            {carregando ? "Buscando..." : "🔍 Buscar"}
          </button>
          <button onClick={limpar} style={{ padding: "9px 16px", backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", cursor: "pointer" }}>
            Limpar
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "20px" }}>
        {[{ key: "empresa", label: "🏢 Visão Empresa" }, { key: "linha", label: "🏭 Por Linha" }, { key: "historico", label: "📈 Histórico do Turno" }].map(a => (
          <button key={a.key} onClick={() => setAba(a.key)} style={{ padding: "9px 18px", borderRadius: "4px", border: "none", fontSize: "14px", fontWeight: "600", cursor: "pointer", backgroundColor: aba === a.key ? "#1E3A8A" : "white", color: aba === a.key ? "white" : "#1E3A8A", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === "empresa" && dadosEmpresa && (
        <>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
            <CardMetrica titulo="Linhas Analisadas" valor={dadosEmpresa.resumo?.total_linhas_analisadas} unidade="linhas" slug="gray" />
            <CardMetrica titulo="Linhas Críticas" valor={dadosEmpresa.resumo?.linhas_criticas} unidade="linhas" slug="red" descricao="Δ OEE > 20pp entre turnos" />
            <CardMetrica titulo="Linhas Atenção" valor={dadosEmpresa.resumo?.linhas_atencao} unidade="linhas" slug="yellow" descricao="Δ OEE > 10pp entre turnos" />
            <CardMetrica titulo="Linhas Estáveis" valor={dadosEmpresa.resumo?.linhas_estaveis} unidade="linhas" slug="green" descricao="Variação aceitável" />
          </div>
          {dadosEmpresa.linhas_criticas?.length > 0 && (
            <div style={{ backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
              <h3 style={{ color: "#b91c1c", margin: "0 0 10px 0", fontSize: "14px" }}>⚠️ Linhas com Variação Crítica entre Turnos</h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {dadosEmpresa.linhas_criticas.map((l, i) => (
                  <div key={i} style={{ backgroundColor: "white", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", border: "1px solid #fca5a5" }}>
                    <strong style={{ color: "#b91c1c" }}>{l.linha_nome}</strong>
                    <div style={{ color: "#374151", marginTop: "4px" }}>Δ OEE: <strong>{l.delta_oee}pp</strong></div>
                    {l.turno_problema && <div style={{ color: "#6b7280", fontSize: "12px" }}>Turno problema: <strong>T{l.turno_problema.turno}</strong> ({l.turno_problema.oee_medio}%)</div>}
                    {l.turno_referencia && <div style={{ color: "#6b7280", fontSize: "12px" }}>Turno referência: <strong>T{l.turno_referencia.turno}</strong> ({l.turno_referencia.oee_medio}%)</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflowX: "auto" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}><h3 style={{ color: "#1E3A8A", margin: 0, fontSize: "15px" }}>Variação por Linha</h3></div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                <tr><th style={th}>Linha</th><th style={th}>Δ OEE (pp)</th><th style={th}>Turno Referência</th><th style={th}>Turno Problema</th><th style={th}>Status</th></tr>
              </thead>
              <tbody>
                {dadosEmpresa.analise_por_linha?.map((l, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={td}><strong>{l.linha_nome}</strong></td>
                    <td style={td}><strong>{l.delta_oee ?? "—"}</strong></td>
                    <td style={td}>{l.turno_referencia ? `T${l.turno_referencia.turno} (${l.turno_referencia.oee_medio}%)` : "—"}</td>
                    <td style={td}>{l.turno_problema ? `T${l.turno_problema.turno} (${l.turno_problema.oee_medio}%)` : "—"}</td>
                    <td style={td}><Badge slug={l.classificacao?.slug} texto={l.classificacao?.slug === "red" ? "Crítico" : l.classificacao?.slug === "yellow" ? "Atenção" : l.classificacao?.slug === "green" ? "Estável" : "Sem dados"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "16px", padding: "12px 16px", backgroundColor: "#eff6ff", borderRadius: "6px", fontSize: "12px", color: "#1e40af" }}>
            📊 <strong>Referências:</strong> Δ OEE &gt; 20pp = Crítico | Δ OEE 10–20pp = Atenção | Δ OEE &lt; 10pp = Estável
          </div>
        </>
      )}

      {aba === "linha" && dadosLinha && (
        <>
          <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "24px" }}>
            <h3 style={{ color: "#1E3A8A", margin: "0 0 14px 0", fontSize: "15px" }}>Análise Comparativa — {dadosLinha.linha_nome}</h3>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <p style={{ color: "#6b7280", fontSize: "12px", margin: "0 0 4px 0" }}>Variação de OEE entre turnos</p>
                <p style={{ color: "#1E3A8A", fontSize: "28px", fontWeight: "800", margin: 0 }}>{dadosLinha.analise_comparativa?.delta_oee_percentual ?? "—"} <span style={{ fontSize: "14px", fontWeight: "400" }}>pp</span></p>
              </div>
              {dadosLinha.analise_comparativa?.turno_referencia && (
                <div style={{ backgroundColor: "#dcfce7", borderRadius: "8px", padding: "12px 16px", minWidth: "160px" }}>
                  <p style={{ color: "#15803d", fontSize: "11px", margin: "0 0 4px 0" }}>🏆 Turno Referência</p>
                  <p style={{ color: "#15803d", fontSize: "18px", fontWeight: "700", margin: 0 }}>T{dadosLinha.analise_comparativa.turno_referencia.turno} — {dadosLinha.analise_comparativa.turno_referencia.oee_medio}%</p>
                </div>
              )}
              {dadosLinha.analise_comparativa?.turno_problema && (
                <div style={{ backgroundColor: "#fee2e2", borderRadius: "8px", padding: "12px 16px", minWidth: "160px" }}>
                  <p style={{ color: "#b91c1c", fontSize: "11px", margin: "0 0 4px 0" }}>⚠️ Turno Problema</p>
                  <p style={{ color: "#b91c1c", fontSize: "18px", fontWeight: "700", margin: 0 }}>T{dadosLinha.analise_comparativa.turno_problema.turno} — {dadosLinha.analise_comparativa.turno_problema.oee_medio}%</p>
                </div>
              )}
              <div style={{ flex: 1, minWidth: "200px" }}><Badge slug={dadosLinha.analise_comparativa?.classificacao?.slug} texto={dadosLinha.analise_comparativa?.classificacao?.label} /></div>
            </div>
          </div>
          <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "14px 18px", marginBottom: "24px" }}>
            <span style={{ color: "#1e40af", fontSize: "14px" }}>💡 <strong>Ação recomendada:</strong> {dadosLinha.analise_comparativa?.acao_recomendada}</span>
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
            {dadosLinha.dados_por_turno?.map(t => <CardTurno key={t.turno} turno={t} />)}
          </div>
          <div style={{ padding: "12px 16px", backgroundColor: "#eff6ff", borderRadius: "6px", fontSize: "12px", color: "#1e40af" }}>
            📊 <strong>Referências:</strong> OEE ≥ 85% = Bom | 65–85% = Atenção | &lt; 65% = Crítico · Refugo &gt; 3% = Alerta
          </div>
        </>
      )}

      {aba === "historico" && dadosHistorico && (
        <>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
            <CardMetrica titulo={`OEE Médio — T${dadosHistorico.turno}`} valor={dadosHistorico.estatisticas_periodo?.oee_medio} unidade="%" slug={dadosHistorico.estatisticas_periodo?.oee_medio >= 85 ? "green" : dadosHistorico.estatisticas_periodo?.oee_medio >= 65 ? "yellow" : "red"} />
            <CardMetrica titulo="OEE Mínimo" valor={dadosHistorico.estatisticas_periodo?.oee_minimo} unidade="%" slug="red" />
            <CardMetrica titulo="OEE Máximo" valor={dadosHistorico.estatisticas_periodo?.oee_maximo} unidade="%" slug="green" />
            <CardMetrica titulo="Total de Registros" valor={dadosHistorico.estatisticas_periodo?.total_registros} unidade="dias" slug="gray" />
          </div>
          <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "16px 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "32px" }}>{tendenciaIcone(dadosHistorico.estatisticas_periodo?.tendencia)}</span>
            <div>
              <p style={{ color: "#6b7280", fontSize: "12px", margin: "0 0 4px 0" }}>Tendência do período</p>
              <Badge slug={tendenciaSlug(dadosHistorico.estatisticas_periodo?.tendencia)} texto={dadosHistorico.estatisticas_periodo?.descricao_tendencia} />
            </div>
          </div>
          <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflowX: "auto" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h3 style={{ color: "#1E3A8A", margin: 0, fontSize: "15px" }}>Série Histórica — Turno {dadosHistorico.turno}</h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                <tr>
                  <th style={th}>Data</th><th style={th}>OEE (%)</th><th style={th}>Média Móvel (%)</th>
                  <th style={th}>Disponibilidade</th><th style={th}>Performance</th><th style={th}>Qualidade</th>
                  <th style={th}>Peças Prod.</th><th style={th}>Peças Boas</th><th style={th}>Refugo</th>
                </tr>
              </thead>
              <tbody>
                {dadosHistorico.serie_historica?.map((s, i) => {
                  const dataFmt = s.data ? new Date(s.data).toLocaleDateString("pt-BR") : "—";
                  const oeeSlug = s.oee >= 85 ? "green" : s.oee >= 65 ? "yellow" : "red";
                  const cor = slugParaCor[oeeSlug];
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={td}>{dataFmt}</td>
                      <td style={{ ...td, backgroundColor: cor.bg, color: cor.text, fontWeight: "700" }}>{s.oee}%</td>
                      <td style={{ ...td, color: "#6b7280" }}>{s.media_movel_oee}%</td>
                      <td style={td}>{s.disponibilidade}%</td>
                      <td style={td}>{s.performance}%</td>
                      <td style={td}>{s.qualidade}%</td>
                      <td style={td}>{s.pecas_produzidas}</td>
                      <td style={td}>{s.pecas_boas}</td>
                      <td style={{ ...td, color: s.refugo > 0 ? "#b91c1c" : "#374151", fontWeight: s.refugo > 0 ? "700" : "400" }}>{s.refugo}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {aba === "empresa" && !dadosEmpresa && !carregando && (
        <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "50px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>🏢 Clique em <strong>Buscar</strong> para carregar a análise por turno de todas as linhas.</p>
        </div>
      )}
      {aba === "linha" && !dadosLinha && !carregando && (
        <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "50px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>🏭 Selecione uma <strong>linha</strong> e clique em <strong>Buscar</strong>.</p>
        </div>
      )}
      {aba === "historico" && !dadosHistorico && !carregando && (
        <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "50px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: "0 0 8px 0" }}>📈 Selecione uma <strong>linha</strong> e um <strong>turno</strong>, depois clique em <strong>Buscar</strong>.</p>
          <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>O histórico mostra a evolução do OEE do turno selecionado ao longo do tempo.</p>
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: "8px 12px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", minWidth: "160px" };
const labelStyle = { fontSize: "12px", color: "#374151", fontWeight: "600" };
const th = { padding: "12px", border: "1px solid #e5e7eb", textAlign: "center", fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap" };
const td = { padding: "10px 12px", border: "1px solid #e5e7eb", textAlign: "center", fontSize: "13px", whiteSpace: "nowrap" };
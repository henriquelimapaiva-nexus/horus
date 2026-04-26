// src/pages/Confiabilidade.jsx
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

export default function Confiabilidade() {
  let clienteAtual = null;
  try { const ctx = useOutletContext() || {}; clienteAtual = ctx.clienteAtual; } catch (_) {}

  const empresaId = clienteAtual;
  const [aba, setAba] = useState("ranking");
  const [linhas, setLinhas] = useState([]);
  const [postos, setPostos] = useState([]);
  const [linhaSel, setLinhaSel] = useState("");
  const [postoSel, setPostoSel] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [ranking, setRanking] = useState(null);
  const [dadosLinha, setDadosLinha] = useState(null);
  const [dadosPosto, setDadosPosto] = useState(null);

  useEffect(() => {
    if (!empresaId) return;
    api.get(`/lines/${empresaId}`).then(r => setLinhas(r.data || [])).catch(() => toast.error("Erro ao carregar linhas"));
  }, [empresaId]);

  useEffect(() => {
    if (!linhaSel) { setPostos([]); setPostoSel(""); return; }
    api.get(`/work-stations/${linhaSel}`).then(r => setPostos(r.data || [])).catch(() => toast.error("Erro ao carregar postos"));
  }, [linhaSel]);

  function montarParams() {
    const p = new URLSearchParams();
    if (dataInicio) p.append("data_inicio", dataInicio);
    if (dataFim) p.append("data_fim", dataFim);
    const s = p.toString();
    return s ? `?${s}` : "";
  }

  async function buscarRanking() {
    if (!empresaId) return toast.error("Selecione um cliente no menu superior.");
    setCarregando(true);
    try { const r = await api.get(`/confiabilidade/ranking/${empresaId}${montarParams()}`); setRanking(r.data); }
    catch { toast.error("Erro ao buscar ranking de confiabilidade"); }
    finally { setCarregando(false); }
  }

  async function buscarLinha() {
    if (!linhaSel) return toast.error("Selecione uma linha.");
    setCarregando(true);
    try { const r = await api.get(`/confiabilidade/linha/${linhaSel}${montarParams()}`); setDadosLinha(r.data); }
    catch { toast.error("Erro ao buscar confiabilidade da linha"); }
    finally { setCarregando(false); }
  }

  async function buscarPosto() {
    if (!postoSel) return toast.error("Selecione um posto.");
    setCarregando(true);
    try { const r = await api.get(`/confiabilidade/posto/${postoSel}${montarParams()}`); setDadosPosto(r.data); }
    catch { toast.error("Erro ao buscar confiabilidade do posto"); }
    finally { setCarregando(false); }
  }

  function limpar() { setDataInicio(""); setDataFim(""); setLinhaSel(""); setPostoSel(""); setRanking(null); setDadosLinha(null); setDadosPosto(null); }

  const acaoBuscar = aba === "ranking" ? buscarRanking : aba === "linha" ? buscarLinha : buscarPosto;

  return (
    <div style={{ padding: "clamp(15px,3vw,30px)", width: "100%", maxWidth: "1400px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>

      <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "25px 30px", marginBottom: "24px" }}>
        <h1 style={{ color: "#1E3A8A", margin: "0 0 4px 0", fontSize: "clamp(20px,4vw,26px)" }}>🔧 Confiabilidade — MTBF / MTTR</h1>
        <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>Analise o tempo médio entre falhas e o tempo médio de reparo dos equipamentos</p>
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
          {(aba === "linha" || aba === "posto") && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={labelStyle}>Linha</label>
              <select value={linhaSel} onChange={e => setLinhaSel(e.target.value)} style={inputStyle}>
                <option value="">Selecione...</option>
                {linhas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </div>
          )}
          {aba === "posto" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={labelStyle}>Posto</label>
              <select value={postoSel} onChange={e => setPostoSel(e.target.value)} style={inputStyle} disabled={!linhaSel}>
                <option value="">Selecione...</option>
                {postos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
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
        {[{ key: "ranking", label: "🏆 Ranking Geral" }, { key: "linha", label: "🏭 Por Linha" }, { key: "posto", label: "⚙️ Por Posto" }].map(a => (
          <button key={a.key} onClick={() => setAba(a.key)} style={{ padding: "9px 18px", borderRadius: "4px", border: "none", fontSize: "14px", fontWeight: "600", cursor: "pointer", backgroundColor: aba === a.key ? "#1E3A8A" : "white", color: aba === a.key ? "white" : "#1E3A8A", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === "ranking" && ranking && (
        <>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
            <CardMetrica titulo="Total de Postos" valor={ranking.total_postos_analisados} unidade="postos" slug="gray" />
            <CardMetrica titulo="Críticos" valor={ranking.resumo?.criticos} unidade="postos" slug="red" />
            <CardMetrica titulo="Atenção" valor={ranking.resumo?.atencao} unidade="postos" slug="yellow" />
            <CardMetrica titulo="Estáveis" valor={ranking.resumo?.estaveis} unidade="postos" slug="green" />
          </div>
          {ranking.postos_criticos?.length > 0 && (
            <div style={{ backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
              <h3 style={{ color: "#b91c1c", margin: "0 0 10px 0", fontSize: "14px" }}>⚠️ Postos Críticos — Ação Imediata</h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {ranking.postos_criticos.map(p => (
                  <div key={p.posto_id} style={{ backgroundColor: "white", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", border: "1px solid #fca5a5" }}>
                    <strong style={{ color: "#b91c1c" }}>{p.posto_nome}</strong>
                    <span style={{ color: "#666", marginLeft: "6px" }}>({p.linha_nome})</span>
                    <div style={{ color: "#374151", marginTop: "4px" }}>MTBF: <strong>{p.mtbf_horas}h</strong> · MTTR: <strong>{p.mttr_minutos}min</strong></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                <tr>
                  <th style={th}>Posto</th><th style={th}>Linha</th><th style={th}>Falhas</th>
                  <th style={th}>MTBF (h)</th><th style={th}>MTTR (min)</th><th style={th}>Disponibilidade</th><th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {ranking.ranking_completo?.length === 0
                  ? <tr><td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#666" }}>Nenhum dado encontrado</td></tr>
                  : ranking.ranking_completo?.map(p => (
                    <tr key={p.posto_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={td}><strong>{p.posto_nome}</strong></td>
                      <td style={td}>{p.linha_nome}</td>
                      <td style={td}>{p.total_falhas}</td>
                      <td style={td}>{p.mtbf_horas}</td>
                      <td style={td}>{p.mttr_minutos}</td>
                      <td style={td}>{p.disponibilidade_percentual}%</td>
                      <td style={td}><Badge slug={p.status_geral} texto={p.status_geral === "red" ? "Crítico" : p.status_geral === "yellow" ? "Atenção" : p.status_geral === "green" ? "Estável" : "Sem dados"} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "16px", padding: "12px 16px", backgroundColor: "#eff6ff", borderRadius: "6px", fontSize: "12px", color: "#1e40af" }}>
            📊 <strong>Referências:</strong> MTBF &gt; 8h = Bom | MTBF 2–8h = Atenção | MTBF &lt; 2h = Crítico · MTTR &lt; 30min = Bom | MTTR 30–120min = Atenção | MTTR &gt; 120min = Crítico
          </div>
        </>
      )}

      {aba === "linha" && dadosLinha && (
        <>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
            <CardMetrica titulo="Total de Falhas" valor={dadosLinha.metricas_globais?.total_falhas} unidade="ocorrências" slug={dadosLinha.classificacao_geral?.status_geral} />
            <CardMetrica titulo="MTBF Global" valor={dadosLinha.metricas_globais?.mtbf_horas} unidade="horas" slug={dadosLinha.classificacao_geral?.status_geral} descricao="Tempo médio entre falhas" />
            <CardMetrica titulo="MTTR Global" valor={dadosLinha.metricas_globais?.mttr_minutos} unidade="min" slug={dadosLinha.classificacao_geral?.status_geral} descricao="Tempo médio de reparo" />
            <CardMetrica titulo="Disponibilidade" valor={dadosLinha.metricas_globais?.disponibilidade_calculada} unidade="%" slug={dadosLinha.classificacao_geral?.status_geral} />
          </div>
          {dadosLinha.posto_mais_critico && (
            <div style={{ backgroundColor: "#fef9c3", border: "1px solid #fde047", borderRadius: "8px", padding: "14px 18px", marginBottom: "20px" }}>
              <span style={{ color: "#854d0e", fontSize: "14px", fontWeight: "600" }}>
                ⚠️ Posto mais crítico: <strong>{dadosLinha.posto_mais_critico.posto_nome}</strong> — MTBF: {dadosLinha.posto_mais_critico.mtbf_horas}h | MTTR: {dadosLinha.posto_mais_critico.mttr_minutos}min
              </span>
            </div>
          )}
          <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "14px 18px", marginBottom: "20px" }}>
            <span style={{ color: "#1e40af", fontSize: "14px" }}>💡 <strong>Ação recomendada:</strong> {dadosLinha.acao_recomendada}</span>
          </div>
          <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflowX: "auto" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h3 style={{ color: "#1E3A8A", margin: 0, fontSize: "15px" }}>Detalhamento por Posto</h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                <tr><th style={th}>Ordem</th><th style={th}>Posto</th><th style={th}>Falhas</th><th style={th}>MTBF (h)</th><th style={th}>MTTR (min)</th><th style={th}>Disponibilidade</th><th style={th}>Status</th></tr>
              </thead>
              <tbody>
                {dadosLinha.detalhamento_por_posto?.map(p => (
                  <tr key={p.posto_id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={td}>{p.ordem_fluxo ?? "—"}</td>
                    <td style={td}><strong>{p.posto_nome}</strong></td>
                    <td style={td}>{p.total_falhas}</td>
                    <td style={td}>{p.mtbf_horas}</td>
                    <td style={td}>{p.mttr_minutos}</td>
                    <td style={td}>{p.disponibilidade_percentual}%</td>
                    <td style={td}><Badge slug={p.status_geral} texto={p.status_geral === "red" ? "Crítico" : p.status_geral === "yellow" ? "Atenção" : p.status_geral === "green" ? "Estável" : "Sem dados"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {aba === "posto" && dadosPosto && (
        <>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
            <CardMetrica titulo="Total de Falhas" valor={dadosPosto.metricas?.total_falhas} unidade="ocorrências" slug={dadosPosto.classificacao?.status_geral} />
            <CardMetrica titulo="MTBF" valor={dadosPosto.metricas?.mtbf_horas} unidade="horas" slug={dadosPosto.classificacao?.mtbf?.slug} descricao="Tempo médio entre falhas" />
            <CardMetrica titulo="MTTR" valor={dadosPosto.metricas?.mttr_minutos} unidade="min" slug={dadosPosto.classificacao?.mttr?.slug} descricao="Tempo médio de reparo" />
            <CardMetrica titulo="Disponibilidade" valor={dadosPosto.metricas?.disponibilidade_calculada} unidade="%" slug={dadosPosto.classificacao?.status_geral} />
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
            <div style={{ flex: 1, backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "16px" }}>
              <p style={{ color: "#6b7280", fontSize: "12px", margin: "0 0 8px 0" }}>Classificação MTBF</p>
              <Badge slug={dadosPosto.classificacao?.mtbf?.slug} texto={dadosPosto.classificacao?.mtbf?.label} />
              <p style={{ color: "#6b7280", fontSize: "11px", margin: "8px 0 0 0" }}>{dadosPosto.classificacao?.mtbf?.referencia}</p>
            </div>
            <div style={{ flex: 1, backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "16px" }}>
              <p style={{ color: "#6b7280", fontSize: "12px", margin: "0 0 8px 0" }}>Classificação MTTR</p>
              <Badge slug={dadosPosto.classificacao?.mttr?.slug} texto={dadosPosto.classificacao?.mttr?.label} />
              <p style={{ color: "#6b7280", fontSize: "11px", margin: "8px 0 0 0" }}>{dadosPosto.classificacao?.mttr?.referencia}</p>
            </div>
          </div>
          <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "14px 18px", marginBottom: "20px" }}>
            <span style={{ color: "#1e40af", fontSize: "14px" }}>💡 <strong>Ação recomendada:</strong> {dadosPosto.acao_recomendada}</span>
          </div>
          {dadosPosto.tipo_falha_mais_frequente && (
            <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "16px 20px" }}>
              <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 6px 0" }}>Tipo de falha mais frequente</p>
              <p style={{ color: "#1E3A8A", fontSize: "16px", fontWeight: "700", margin: 0 }}>
                {dadosPosto.tipo_falha_mais_frequente.tipo}
                <span style={{ color: "#6b7280", fontSize: "13px", fontWeight: "400", marginLeft: "8px" }}>({dadosPosto.tipo_falha_mais_frequente.ocorrencias} ocorrências)</span>
              </p>
            </div>
          )}
        </>
      )}

      {aba === "ranking" && !ranking && !carregando && (
        <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "50px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>🔧 Clique em <strong>Buscar</strong> para carregar o ranking de confiabilidade.</p>
        </div>
      )}
      {aba === "linha" && !dadosLinha && !carregando && (
        <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "50px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>🏭 Selecione uma <strong>linha</strong> e clique em <strong>Buscar</strong>.</p>
        </div>
      )}
      {aba === "posto" && !dadosPosto && !carregando && (
        <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "50px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>⚙️ Selecione uma <strong>linha</strong> e um <strong>posto</strong>, depois clique em <strong>Buscar</strong>.</p>
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: "8px 12px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", minWidth: "160px" };
const labelStyle = { fontSize: "12px", color: "#374151", fontWeight: "600" };
const th = { padding: "12px", border: "1px solid #e5e7eb", textAlign: "center", fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap" };
const td = { padding: "10px 12px", border: "1px solid #e5e7eb", textAlign: "center", fontSize: "13px", whiteSpace: "nowrap" };
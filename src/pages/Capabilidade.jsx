// src/pages/Capabilidade.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";

const slugParaCor = {
  green:  { bg: "#dcfce7", text: "#15803d", borda: "#16a34a" },
  blue:   { bg: "#dbeafe", text: "#1e40af", borda: "#3b82f6" },
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

const slugTexto = { red: "Incapaz", yellow: "Marginal", blue: "Bom", green: "Excelente", gray: "Sem dados" };

export default function Capabilidade() {
  let clienteAtual = null;
  try { const ctx = useOutletContext() || {}; clienteAtual = ctx.clienteAtual; } catch (_) {}

  const empresaId = clienteAtual;
  const [aba, setAba] = useState("ranking");
  const [linhas, setLinhas] = useState([]);
  const [postos, setPostos] = useState([]);
  const [linhaSel, setLinhaSel] = useState("");
  const [postoSel, setPostoSel] = useState("");
  const [caracteristica, setCaracteristica] = useState("");
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

  function montarParams(extra = {}) {
    const p = new URLSearchParams();
    if (dataInicio) p.append("data_inicio", dataInicio);
    if (dataFim) p.append("data_fim", dataFim);
    Object.entries(extra).forEach(([k, v]) => { if (v) p.append(k, v); });
    const s = p.toString();
    return s ? `?${s}` : "";
  }

  async function buscarRanking() {
    if (!empresaId) return toast.error("Selecione um cliente no menu superior.");
    setCarregando(true);
    try { const r = await api.get(`/capabilidade/ranking/${empresaId}${montarParams()}`); setRanking(r.data); }
    catch { toast.error("Erro ao buscar ranking de capabilidade"); }
    finally { setCarregando(false); }
  }

  async function buscarLinha() {
    if (!linhaSel) return toast.error("Selecione uma linha.");
    setCarregando(true);
    try { const r = await api.get(`/capabilidade/linha/${linhaSel}${montarParams()}`); setDadosLinha(r.data); }
    catch { toast.error("Erro ao buscar capabilidade da linha"); }
    finally { setCarregando(false); }
  }

  async function buscarPosto() {
    if (!postoSel) return toast.error("Selecione um posto.");
    if (!caracteristica) return toast.error("Informe o nome da característica.");
    setCarregando(true);
    try { const r = await api.get(`/capabilidade/posto/${postoSel}${montarParams({ caracteristica })}`); setDadosPosto(r.data); }
    catch { toast.error("Erro ao buscar capabilidade do posto"); }
    finally { setCarregando(false); }
  }

  function limpar() { setDataInicio(""); setDataFim(""); setLinhaSel(""); setPostoSel(""); setCaracteristica(""); setRanking(null); setDadosLinha(null); setDadosPosto(null); }

  const acaoBuscar = aba === "ranking" ? buscarRanking : aba === "linha" ? buscarLinha : buscarPosto;

  return (
    <div style={{ padding: "clamp(15px,3vw,30px)", width: "100%", maxWidth: "1400px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>

      <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "25px 30px", marginBottom: "24px" }}>
        <h1 style={{ color: "#1E3A8A", margin: "0 0 4px 0", fontSize: "clamp(20px,4vw,26px)" }}>📐 Capabilidade de Processo — Cp / Cpk</h1>
        <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>Verifique se o processo é capaz de atender às especificações de qualidade (ISO 22514)</p>
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
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={labelStyle}>Posto</label>
                <select value={postoSel} onChange={e => setPostoSel(e.target.value)} style={inputStyle} disabled={!linhaSel}>
                  <option value="">Selecione...</option>
                  {postos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={labelStyle}>Característica</label>
                <input type="text" placeholder="Ex: diametro_furo" value={caracteristica} onChange={e => setCaracteristica(e.target.value)} style={{ ...inputStyle, minWidth: "180px" }} />
              </div>
            </>
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
        {[{ key: "ranking", label: "🏆 Ranking Geral" }, { key: "linha", label: "🏭 Por Linha" }, { key: "posto", label: "⚙️ Por Posto / Característica" }].map(a => (
          <button key={a.key} onClick={() => setAba(a.key)} style={{ padding: "9px 18px", borderRadius: "4px", border: "none", fontSize: "14px", fontWeight: "600", cursor: "pointer", backgroundColor: aba === a.key ? "#1E3A8A" : "white", color: aba === a.key ? "white" : "#1E3A8A", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            {a.label}
          </button>
        ))}
      </div>

      {aba === "ranking" && ranking && (
        <>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
            <CardMetrica titulo="Total Analisadas" valor={ranking.resumo?.total_caracteristicas} unidade="características" slug="gray" />
            <CardMetrica titulo="Incapazes" valor={ranking.resumo?.incapazes} unidade="itens" slug="red" descricao="Cpk < 1.00" />
            <CardMetrica titulo="Marginais" valor={ranking.resumo?.marginais} unidade="itens" slug="yellow" descricao="Cpk 1.00–1.33" />
            <CardMetrica titulo="Boas" valor={ranking.resumo?.boas} unidade="itens" slug="blue" descricao="Cpk 1.33–1.67" />
            <CardMetrica titulo="Excelentes" valor={ranking.resumo?.excelentes} unidade="itens" slug="green" descricao="Cpk ≥ 1.67" />
          </div>
          {ranking.caracteristicas_criticas?.length > 0 && (
            <div style={{ backgroundColor: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "16px", marginBottom: "20px" }}>
              <h3 style={{ color: "#b91c1c", margin: "0 0 10px 0", fontSize: "14px" }}>⚠️ Características Incapazes — Ação Imediata</h3>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {ranking.caracteristicas_criticas.map((c, i) => (
                  <div key={i} style={{ backgroundColor: "white", borderRadius: "6px", padding: "10px 14px", fontSize: "13px", border: "1px solid #fca5a5" }}>
                    <strong style={{ color: "#b91c1c" }}>{c.caracteristica}</strong>
                    <span style={{ color: "#666", marginLeft: "6px" }}>({c.unidade})</span>
                    <div style={{ color: "#374151", marginTop: "4px" }}>Cpk: <strong>{c.cpk ?? "—"}</strong> · Posto: {c.posto_nome}</div>
                    <div style={{ color: "#6b7280", fontSize: "12px" }}>{c.linha_nome}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                <tr>
                  <th style={th}>Característica</th><th style={th}>Unidade</th><th style={th}>Posto</th>
                  <th style={th}>Linha</th><th style={th}>N</th><th style={th}>Cp</th>
                  <th style={th}>Cpk</th><th style={th}>Média</th><th style={th}>Desvio</th><th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {ranking.ranking_completo?.length === 0
                  ? <tr><td colSpan="10" style={{ textAlign: "center", padding: "30px", color: "#666" }}>Nenhum dado encontrado</td></tr>
                  : ranking.ranking_completo?.map((c, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={td}><strong>{c.caracteristica}</strong></td>
                      <td style={td}>{c.unidade}</td>
                      <td style={td}>{c.posto_nome}</td>
                      <td style={td}>{c.linha_nome}</td>
                      <td style={td}>{c.n}</td>
                      <td style={td}>{c.cp ?? "—"}</td>
                      <td style={td}><strong>{c.cpk ?? "—"}</strong></td>
                      <td style={td}>{c.media ?? "—"}</td>
                      <td style={td}>{c.desvio_padrao ?? "—"}</td>
                      <td style={td}><Badge slug={c.status_geral} texto={slugTexto[c.status_geral] || "—"} /></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "16px", padding: "12px 16px", backgroundColor: "#eff6ff", borderRadius: "6px", fontSize: "12px", color: "#1e40af" }}>
            📊 <strong>ISO 22514:</strong> Cpk &lt; 1.00 = Incapaz | 1.00–1.33 = Marginal | 1.33–1.67 = Bom | ≥ 1.67 = Excelente (Six Sigma)
          </div>
        </>
      )}

      {aba === "linha" && dadosLinha && (
        <>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
            <CardMetrica titulo="Total Analisadas" valor={dadosLinha.resumo?.total_caracteristicas} unidade="características" slug="gray" />
            <CardMetrica titulo="Incapazes" valor={dadosLinha.resumo?.incapazes} unidade="itens" slug="red" />
            <CardMetrica titulo="Marginais" valor={dadosLinha.resumo?.marginais} unidade="itens" slug="yellow" />
            <CardMetrica titulo="Boas" valor={dadosLinha.resumo?.boas} unidade="itens" slug="blue" />
            <CardMetrica titulo="Excelentes" valor={dadosLinha.resumo?.excelentes} unidade="itens" slug="green" />
          </div>
          {dadosLinha.pior_caracteristica && (
            <div style={{ backgroundColor: "#fef9c3", border: "1px solid #fde047", borderRadius: "8px", padding: "14px 18px", marginBottom: "16px" }}>
              <span style={{ color: "#854d0e", fontSize: "14px", fontWeight: "600" }}>
                ⚠️ Pior característica: <strong>{dadosLinha.pior_caracteristica.caracteristica}</strong> ({dadosLinha.pior_caracteristica.unidade}) — Cpk: <strong>{dadosLinha.pior_caracteristica.cpk ?? "—"}</strong> | Posto: {dadosLinha.pior_caracteristica.posto_nome}
              </span>
            </div>
          )}
          <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "14px 18px", marginBottom: "20px" }}>
            <span style={{ color: "#1e40af", fontSize: "14px" }}>💡 <strong>Ação recomendada:</strong> {dadosLinha.acao_recomendada}</span>
          </div>
          <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", overflowX: "auto" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
              <h3 style={{ color: "#1E3A8A", margin: 0, fontSize: "15px" }}>Análise por Característica</h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                <tr>
                  <th style={th}>Característica</th><th style={th}>Unidade</th><th style={th}>Posto</th>
                  <th style={th}>N</th><th style={th}>Cp</th><th style={th}>Cpk</th>
                  <th style={th}>LSE</th><th style={th}>LIE</th><th style={th}>Status</th><th style={th}>Alerta</th>
                </tr>
              </thead>
              <tbody>
                {dadosLinha.analise_por_caracteristica?.map((c, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={td}><strong>{c.caracteristica}</strong></td>
                    <td style={td}>{c.unidade}</td>
                    <td style={td}>{c.posto_nome}</td>
                    <td style={td}>{c.n}</td>
                    <td style={td}>{c.cp ?? "—"}</td>
                    <td style={td}><strong>{c.cpk ?? "—"}</strong></td>
                    <td style={td}>{c.lse ?? "—"}</td>
                    <td style={td}>{c.lie ?? "—"}</td>
                    <td style={td}><Badge slug={c.status_geral} texto={slugTexto[c.status_geral] || "—"} /></td>
                    <td style={{ ...td, maxWidth: "200px", whiteSpace: "normal", fontSize: "11px", color: "#854d0e" }}>{c.alerta || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: "16px", padding: "12px 16px", backgroundColor: "#eff6ff", borderRadius: "6px", fontSize: "12px", color: "#1e40af" }}>
            📊 <strong>ISO 22514:</strong> Cpk &lt; 1.00 = Incapaz | 1.00–1.33 = Marginal | 1.33–1.67 = Bom | ≥ 1.67 = Excelente
          </div>
        </>
      )}

      {aba === "posto" && dadosPosto && (
        <>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
            <CardMetrica titulo="Cp" valor={dadosPosto.indices_capabilidade?.cp} unidade="" slug={dadosPosto.classificacao?.status_geral} descricao="Processo cabe na tolerância?" />
            <CardMetrica titulo="Cpk" valor={dadosPosto.indices_capabilidade?.cpk} unidade="" slug={dadosPosto.classificacao?.status_geral} descricao="Processo está centrado?" />
            <CardMetrica titulo="CPU" valor={dadosPosto.indices_capabilidade?.cpu} unidade="" slug="gray" descricao="Limite superior" />
            <CardMetrica titulo="CPL" valor={dadosPosto.indices_capabilidade?.cpl} unidade="" slug="gray" descricao="Limite inferior" />
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
            <div style={{ flex: 1, backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "20px" }}>
              <h3 style={{ color: "#1E3A8A", margin: "0 0 14px 0", fontSize: "15px" }}>Estatísticas do Processo</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { label: "N (amostras)", valor: dadosPosto.estatisticas?.n },
                  { label: "Média", valor: dadosPosto.estatisticas?.media },
                  { label: "Desvio Padrão", valor: dadosPosto.estatisticas?.desvio_padrao },
                  { label: "Amplitude", valor: dadosPosto.estatisticas?.amplitude },
                  { label: "Mínimo", valor: dadosPosto.estatisticas?.minimo },
                  { label: "Máximo", valor: dadosPosto.estatisticas?.maximo },
                  { label: "LSE", valor: dadosPosto.estatisticas?.lse ?? "—" },
                  { label: "LIE", valor: dadosPosto.estatisticas?.lie ?? "—" },
                ].map((item, i) => (
                  <div key={i} style={{ backgroundColor: "#f9fafb", borderRadius: "6px", padding: "10px 14px" }}>
                    <p style={{ color: "#6b7280", fontSize: "11px", margin: "0 0 2px 0" }}>{item.label}</p>
                    <p style={{ color: "#1E3A8A", fontSize: "16px", fontWeight: "700", margin: 0 }}>{item.valor ?? "—"}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "20px" }}>
              <h3 style={{ color: "#1E3A8A", margin: "0 0 14px 0", fontSize: "15px" }}>Classificação</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ backgroundColor: "#f9fafb", borderRadius: "6px", padding: "12px 14px" }}>
                  <p style={{ color: "#6b7280", fontSize: "11px", margin: "0 0 6px 0" }}>Cp — O processo CABE na tolerância?</p>
                  <Badge slug={dadosPosto.classificacao?.cp?.slug} texto={dadosPosto.classificacao?.cp?.label} />
                </div>
                <div style={{ backgroundColor: "#f9fafb", borderRadius: "6px", padding: "12px 14px" }}>
                  <p style={{ color: "#6b7280", fontSize: "11px", margin: "0 0 6px 0" }}>Cpk — O processo está CENTRADO?</p>
                  <Badge slug={dadosPosto.classificacao?.cpk?.slug} texto={dadosPosto.classificacao?.cpk?.label} />
                </div>
                <div style={{ backgroundColor: "#f9fafb", borderRadius: "6px", padding: "10px 14px" }}>
                  <p style={{ color: "#6b7280", fontSize: "11px", margin: "0 0 4px 0" }}>Norma de referência</p>
                  <p style={{ color: "#374151", fontSize: "12px", margin: 0 }}>{dadosPosto.classificacao?.referencia}</p>
                </div>
              </div>
            </div>
          </div>
          {dadosPosto.alertas?.length > 0 && (
            <div style={{ backgroundColor: "#fef9c3", border: "1px solid #fde047", borderRadius: "8px", padding: "14px 18px", marginBottom: "16px" }}>
              <h3 style={{ color: "#854d0e", margin: "0 0 8px 0", fontSize: "14px" }}>⚠️ Alertas</h3>
              {dadosPosto.alertas.map((a, i) => <p key={i} style={{ color: "#854d0e", fontSize: "13px", margin: "4px 0" }}>• {a}</p>)}
            </div>
          )}
          <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "14px 18px" }}>
            <span style={{ color: "#1e40af", fontSize: "14px" }}>💡 <strong>Ação recomendada:</strong> {dadosPosto.acao_recomendada}</span>
          </div>
        </>
      )}

      {aba === "ranking" && !ranking && !carregando && (
        <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "50px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>📐 Clique em <strong>Buscar</strong> para carregar o ranking de capabilidade da empresa.</p>
        </div>
      )}
      {aba === "linha" && !dadosLinha && !carregando && (
        <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "50px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>🏭 Selecione uma <strong>linha</strong> e clique em <strong>Buscar</strong>.</p>
        </div>
      )}
      {aba === "posto" && !dadosPosto && !carregando && (
        <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "50px", textAlign: "center" }}>
          <p style={{ color: "#6b7280", fontSize: "15px", margin: "0 0 10px 0" }}>⚙️ Selecione <strong>linha</strong>, <strong>posto</strong> e informe o nome da <strong>característica</strong>.</p>
          <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>Exemplo: diametro_furo, espessura_chapa, comprimento_peca</p>
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: "8px 12px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", minWidth: "160px" };
const labelStyle = { fontSize: "12px", color: "#374151", fontWeight: "600" };
const th = { padding: "12px", border: "1px solid #e5e7eb", textAlign: "center", fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap" };
const td = { padding: "10px 12px", border: "1px solid #e5e7eb", textAlign: "center", fontSize: "13px", whiteSpace: "nowrap" };
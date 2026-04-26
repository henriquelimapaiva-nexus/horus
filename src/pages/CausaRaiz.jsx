// src/pages/CausaRaiz.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import toast from "react-hot-toast";

const slugParaCor = {
  green:  { bg: "#dcfce7", text: "#15803d", borda: "#16a34a" },
  yellow: { bg: "#fef9c3", text: "#854d0e", borda: "#ca8a04" },
  red:    { bg: "#fee2e2", text: "#b91c1c", borda: "#dc2626" },
  gray:   { bg: "#f3f4f6", text: "#6b7280", borda: "#9ca3af" },
  blue:   { bg: "#dbeafe", text: "#1e40af", borda: "#3b82f6" },
};

const CATEGORIAS_6M = {
  mao_de_obra:   { label: "👷 Mão de Obra",   emoji: "👷", cor: "#7c3aed" },
  maquina:       { label: "⚙️ Máquina",        emoji: "⚙️", cor: "#dc2626" },
  metodo:        { label: "📋 Método",          emoji: "📋", cor: "#d97706" },
  material:      { label: "📦 Material",        emoji: "📦", cor: "#059669" },
  meio_ambiente: { label: "🌡️ Meio Ambiente",  emoji: "🌡️", cor: "#0284c7" },
  medicao:       { label: "📏 Medição",         emoji: "📏", cor: "#db2777" },
};

const STATUS_CONFIG = {
  aberto:       { label: "Aberto",       slug: "gray"   },
  em_andamento: { label: "Em Andamento", slug: "yellow" },
  concluido:    { label: "Concluído",    slug: "green"  },
  cancelado:    { label: "Cancelado",    slug: "red"    },
};

const Badge = ({ slug, texto }) => {
  const cor = slugParaCor[slug] || slugParaCor.gray;
  return (
    <span style={{ backgroundColor: cor.bg, color: cor.text, border: `1px solid ${cor.borda}`, borderRadius: "12px", padding: "3px 10px", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
      {texto}
    </span>
  );
};

const CardMetrica = ({ titulo, valor, unidade, slug }) => {
  const cor = slugParaCor[slug] || slugParaCor.gray;
  return (
    <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "16px 20px", borderTop: `4px solid ${cor.borda}`, flex: "1", minWidth: "140px" }}>
      <p style={{ color: "#6b7280", fontSize: "12px", margin: "0 0 4px 0" }}>{titulo}</p>
      <p style={{ color: "#1E3A8A", fontSize: "24px", fontWeight: "700", margin: 0 }}>
        {valor ?? "—"} <span style={{ fontSize: "13px", fontWeight: "400", color: "#6b7280" }}>{unidade}</span>
      </p>
    </div>
  );
};

export default function CausaRaiz() {
  let clienteAtual = null;
  try { const ctx = useOutletContext() || {}; clienteAtual = ctx.clienteAtual; } catch (_) {}

  const empresaId = clienteAtual;
  const [aba, setAba] = useState("dashboard");
  const [linhas, setLinhas] = useState([]);
  const [analises, setAnalises] = useState([]);
  const [analiseAtual, setAnaliseAtual] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao_problema: "", linha_id: "", categoria_ishikawa: "", responsavel: "", prazo: "" });
  const [editandoPorque, setEditandoPorque] = useState(null);
  const [respostaPorque, setRespostaPorque] = useState("");
  const [ishikawaForm, setIshikawaForm] = useState({ categoria: "", causa: "", subcausa: "" });
  const [adicionandoIshikawa, setAdicionandoIshikawa] = useState(false);
  const [editandoAnalise, setEditandoAnalise] = useState(false);
  const [formEdicao, setFormEdicao] = useState({ causa_raiz_final: "", acao_corretiva: "", responsavel: "", prazo: "", status: "", eficacia_verificada: false });

  useEffect(() => {
    if (!empresaId) return;
    api.get(`/lines/${empresaId}`).then(r => setLinhas(r.data || [])).catch(() => {});
    carregarDashboard();
    carregarLista();
  }, [empresaId]);

  async function carregarDashboard() {
    if (!empresaId) return;
    try { const r = await api.get(`/causa-raiz/dashboard/${empresaId}`); setDashboard(r.data); } catch { }
  }

  async function carregarLista() {
    if (!empresaId) return;
    setCarregando(true);
    try {
      let url = `/causa-raiz?empresa_id=${empresaId}`;
      if (filtroStatus) url += `&status=${filtroStatus}`;
      const r = await api.get(url);
      setAnalises(r.data.lista || []);
    } catch { toast.error("Erro ao carregar análises"); }
    finally { setCarregando(false); }
  }

  async function carregarAnalise(id) {
    setCarregando(true);
    try {
      const r = await api.get(`/causa-raiz/${id}`);
      setAnaliseAtual(r.data);
      setFormEdicao({
        causa_raiz_final: r.data.causa_raiz?.causa_raiz_final || "",
        acao_corretiva:   r.data.causa_raiz?.acao_corretiva   || "",
        responsavel:      r.data.causa_raiz?.responsavel       || "",
        prazo:            r.data.causa_raiz?.prazo ? r.data.causa_raiz.prazo.split("T")[0] : "",
        status:           r.data.causa_raiz?.status            || "aberto",
        eficacia_verificada: r.data.causa_raiz?.eficacia_verificada || false
      });
      setAba("detalhe");
    } catch { toast.error("Erro ao carregar análise"); }
    finally { setCarregando(false); }
  }

  async function criarAnalise() {
    if (!form.titulo || !form.descricao_problema) return toast.error("Título e descrição são obrigatórios.");
    setCarregando(true);
    try {
      await api.post("/causa-raiz", { ...form, empresa_id: empresaId });
      toast.success("Análise criada! Os 5 Porquês foram gerados automaticamente. ✅");
      setFormAberto(false);
      setForm({ titulo: "", descricao_problema: "", linha_id: "", categoria_ishikawa: "", responsavel: "", prazo: "" });
      await carregarLista(); await carregarDashboard();
    } catch { toast.error("Erro ao criar análise"); }
    finally { setCarregando(false); }
  }

  async function responderPorque(id, numero) {
    if (!respostaPorque.trim()) return toast.error("A resposta não pode estar vazia.");
    try {
      await api.put(`/causa-raiz/${id}/porques/${numero}`, { resposta: respostaPorque });
      toast.success(`Porquê ${numero} salvo ✅`);
      setEditandoPorque(null); setRespostaPorque("");
      await carregarAnalise(id);
    } catch { toast.error("Erro ao salvar resposta"); }
  }

  async function adicionarIshikawa(id) {
    if (!ishikawaForm.categoria || !ishikawaForm.causa) return toast.error("Categoria e causa são obrigatórios.");
    try {
      await api.post(`/causa-raiz/${id}/ishikawa`, ishikawaForm);
      toast.success("Causa adicionada ao Ishikawa ✅");
      setIshikawaForm({ categoria: "", causa: "", subcausa: "" }); setAdicionandoIshikawa(false);
      await carregarAnalise(id);
    } catch { toast.error("Erro ao adicionar causa"); }
  }

  async function removerIshikawa(analiseId, ishikawaId) {
    if (!window.confirm("Remover esta causa do Ishikawa?")) return;
    try { await api.delete(`/causa-raiz/${analiseId}/ishikawa/${ishikawaId}`); toast.success("Causa removida ✅"); await carregarAnalise(analiseId); }
    catch { toast.error("Erro ao remover causa"); }
  }

  async function salvarEdicao(id) {
    try {
      await api.put(`/causa-raiz/${id}`, formEdicao);
      toast.success("Análise atualizada ✅"); setEditandoAnalise(false);
      await carregarAnalise(id); await carregarDashboard(); await carregarLista();
    } catch { toast.error("Erro ao atualizar análise"); }
  }

  async function excluirAnalise(id) {
    if (!window.confirm("Excluir esta análise? Todos os porquês e causas do Ishikawa serão removidos.")) return;
    try {
      await api.delete(`/causa-raiz/${id}`); toast.success("Análise excluída ✅");
      setAba("lista"); setAnaliseAtual(null);
      await carregarLista(); await carregarDashboard();
    } catch { toast.error("Erro ao excluir análise"); }
  }

  return (
    <div style={{ padding: "clamp(15px,3vw,30px)", width: "100%", maxWidth: "1400px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>

      <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "25px 30px", marginBottom: "24px" }}>
        <h1 style={{ color: "#1E3A8A", margin: "0 0 4px 0", fontSize: "clamp(20px,4vw,26px)" }}>🔎 Análise de Causa Raiz</h1>
        <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>5 Porquês + Diagrama de Ishikawa (6M) — rastreie e elimine problemas na raiz</p>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", flexWrap: "wrap" }}>
        {[
          { key: "dashboard", label: "📊 Dashboard" },
          { key: "lista", label: "📋 Análises" },
          analiseAtual && { key: "detalhe", label: `🔍 ${analiseAtual.causa_raiz?.titulo?.substring(0, 20)}...` }
        ].filter(Boolean).map(a => (
          <button key={a.key} onClick={() => setAba(a.key)} style={{ padding: "9px 18px", borderRadius: "4px", border: "none", fontSize: "14px", fontWeight: "600", cursor: "pointer", backgroundColor: aba === a.key ? "#1E3A8A" : "white", color: aba === a.key ? "white" : "#1E3A8A", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {aba === "dashboard" && (
        <>
          {!empresaId ? (
            <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "50px", textAlign: "center" }}>
              <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>Selecione um cliente no menu superior.</p>
            </div>
          ) : dashboard ? (
            <>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
                <CardMetrica titulo="Total de Análises" valor={dashboard.resumo?.total} unidade="" slug="gray" />
                <CardMetrica titulo="Em Aberto" valor={dashboard.resumo?.abertos} unidade="" slug="yellow" />
                <CardMetrica titulo="Em Andamento" valor={dashboard.resumo?.em_andamento} unidade="" slug="blue" />
                <CardMetrica titulo="Concluídas" valor={dashboard.resumo?.concluidos} unidade="" slug="green" />
                <CardMetrica titulo="Atrasadas" valor={dashboard.resumo?.atrasados} unidade="" slug="red" />
                <CardMetrica titulo="Taxa Conclusão" valor={dashboard.resumo?.taxa_conclusao} unidade="%" slug={dashboard.resumo?.taxa_conclusao >= 70 ? "green" : "yellow"} />
              </div>

              <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "24px" }}>
                {dashboard.categoria_mais_recorrente && (
                  <div style={{ flex: 1, minWidth: "260px", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "20px", borderTop: "4px solid #7c3aed" }}>
                    <p style={{ color: "#6b7280", fontSize: "12px", margin: "0 0 8px 0" }}>Categoria mais recorrente (Ishikawa)</p>
                    <p style={{ color: "#7c3aed", fontSize: "20px", fontWeight: "700", margin: "0 0 4px 0" }}>{CATEGORIAS_6M[dashboard.categoria_mais_recorrente.categoria]?.label}</p>
                    <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>{dashboard.categoria_mais_recorrente.total} ocorrências</p>
                  </div>
                )}
                {dashboard.analises_atrasadas?.length > 0 && (
                  <div style={{ flex: 2, minWidth: "300px", backgroundColor: "#fee2e2", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "20px", border: "1px solid #fca5a5" }}>
                    <p style={{ color: "#b91c1c", fontSize: "14px", fontWeight: "600", margin: "0 0 10px 0" }}>⚠️ Análises Atrasadas</p>
                    {dashboard.analises_atrasadas.map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #fca5a5" }}>
                        <span style={{ color: "#b91c1c", fontWeight: "600", fontSize: "13px" }}>{a.titulo}</span>
                        <button onClick={() => carregarAnalise(a.id)} style={{ padding: "3px 10px", backgroundColor: "white", color: "#b91c1c", border: "1px solid #b91c1c", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>Ver</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {dashboard.analises_em_aberto?.length > 0 && (
                <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "20px", marginBottom: "20px" }}>
                  <h3 style={{ color: "#1E3A8A", margin: "0 0 14px 0", fontSize: "15px" }}>🔄 Análises em Aberto</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {dashboard.analises_em_aberto.map(a => (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", backgroundColor: "#f9fafb", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ color: "#1E3A8A", fontWeight: "600", fontSize: "14px" }}>{a.titulo}</span>
                          {a.linha_nome && <span style={{ color: "#6b7280", fontSize: "12px", marginLeft: "8px" }}>— {a.linha_nome}</span>}
                          <div style={{ marginTop: "4px" }}>
                            <Badge slug={STATUS_CONFIG[a.status]?.slug || "gray"} texto={STATUS_CONFIG[a.status]?.label || a.status} />
                            <span style={{ color: "#6b7280", fontSize: "12px", marginLeft: "8px" }}>{a.porques_respondidos}/5 porquês respondidos</span>
                          </div>
                        </div>
                        <button onClick={() => carregarAnalise(a.id)} style={{ padding: "6px 14px", backgroundColor: "#1E3A8A", color: "white", border: "none", borderRadius: "4px", fontSize: "13px", cursor: "pointer" }}>Abrir</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => { setAba("lista"); setFormAberto(true); }} style={{ padding: "10px 20px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "4px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                + Nova Análise
              </button>
            </>
          ) : (
            <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "50px", textAlign: "center" }}><p style={{ color: "#6b7280" }}>Carregando...</p></div>
          )}
        </>
      )}

      {/* ── LISTA ── */}
      {aba === "lista" && (
        <>
          <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "16px 20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <label style={labelStyle}>Status:</label>
              <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={inputStyle}>
                <option value="">Todos</option>
                <option value="aberto">Aberto</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <button onClick={carregarLista} style={{ padding: "8px 16px", backgroundColor: "#1E3A8A", color: "white", border: "none", borderRadius: "4px", fontSize: "13px", cursor: "pointer" }}>Filtrar</button>
            </div>
            <button onClick={() => setFormAberto(!formAberto)} style={{ padding: "9px 18px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "4px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
              {formAberto ? "Cancelar" : "+ Nova Análise"}
            </button>
          </div>

          {formAberto && (
            <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "24px", marginBottom: "20px", borderTop: "4px solid #1E3A8A" }}>
              <h3 style={{ color: "#1E3A8A", margin: "0 0 18px 0", fontSize: "16px" }}>Nova Análise de Causa Raiz</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={labelStyle}>Título do Problema *</label>
                  <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Refugo excessivo na Linha 2" style={inputStyle} />
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={labelStyle}>Descrição do Problema *</label>
                  <textarea value={form.descricao_problema} onChange={e => setForm({ ...form, descricao_problema: e.target.value })} placeholder="Descreva o problema com detalhes..." rows={3} style={{ ...inputStyle, resize: "vertical", minWidth: "unset", width: "100%", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={labelStyle}>Linha de Produção</label>
                  <select value={form.linha_id} onChange={e => setForm({ ...form, linha_id: e.target.value })} style={inputStyle}>
                    <option value="">Selecione (opcional)</option>
                    {linhas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={labelStyle}>Categoria Ishikawa (6M)</label>
                  <select value={form.categoria_ishikawa} onChange={e => setForm({ ...form, categoria_ishikawa: e.target.value })} style={inputStyle}>
                    <option value="">Selecione (opcional)</option>
                    {Object.entries(CATEGORIAS_6M).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={labelStyle}>Responsável</label>
                  <input value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome do responsável" style={inputStyle} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={labelStyle}>Prazo</label>
                  <input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                <button onClick={criarAnalise} disabled={carregando} style={{ padding: "9px 20px", backgroundColor: "#1E3A8A", color: "white", border: "none", borderRadius: "4px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                  {carregando ? "Criando..." : "Criar Análise"}
                </button>
                <button onClick={() => setFormAberto(false)} style={{ padding: "9px 16px", backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", cursor: "pointer" }}>Cancelar</button>
              </div>
            </div>
          )}

          {carregando ? (
            <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "40px", textAlign: "center" }}><p style={{ color: "#6b7280" }}>Carregando...</p></div>
          ) : analises.length === 0 ? (
            <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "50px", textAlign: "center" }}>
              <p style={{ color: "#6b7280", fontSize: "15px", margin: "0 0 12px 0" }}>Nenhuma análise encontrada.</p>
              <button onClick={() => setFormAberto(true)} style={{ padding: "9px 18px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "4px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>+ Criar Primeira Análise</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {analises.map(a => {
                const statusCfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.aberto;
                const cor = slugParaCor[statusCfg.slug];
                return (
                  <div key={a.id} style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "16px 20px", borderLeft: `4px solid ${cor.borda}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <span style={{ color: "#1E3A8A", fontWeight: "700", fontSize: "15px" }}>{a.titulo}</span>
                        <Badge slug={statusCfg.slug} texto={statusCfg.label} />
                      </div>
                      <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 4px 0" }}>{a.descricao_problema?.substring(0, 100)}{a.descricao_problema?.length > 100 ? "..." : ""}</p>
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        {a.linha_nome && <span style={{ color: "#6b7280", fontSize: "12px" }}>🏭 {a.linha_nome}</span>}
                        {a.responsavel && <span style={{ color: "#6b7280", fontSize: "12px" }}>👤 {a.responsavel}</span>}
                        {a.prazo && <span style={{ color: new Date(a.prazo) < new Date() && a.status !== "concluido" ? "#b91c1c" : "#6b7280", fontSize: "12px" }}>📅 {new Date(a.prazo).toLocaleDateString("pt-BR")}</span>}
                        <span style={{ color: "#6b7280", fontSize: "12px" }}>❓ {a.porques_respondidos}/5 porquês</span>
                        {a.causas_ishikawa > 0 && <span style={{ color: "#6b7280", fontSize: "12px" }}>🐟 {a.causas_ishikawa} causas</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => carregarAnalise(a.id)} style={{ padding: "6px 14px", backgroundColor: "#dbeafe", color: "#1e40af", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>Abrir</button>
                      <button onClick={() => excluirAnalise(a.id)} style={{ padding: "6px 14px", backgroundColor: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "4px", fontSize: "13px", fontWeight: "500", cursor: "pointer" }}>Excluir</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── DETALHE ── */}
      {aba === "detalhe" && analiseAtual && (
        <>
          {/* Cabeçalho */}
          <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "20px 24px", marginBottom: "20px", borderTop: "4px solid #1E3A8A" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h2 style={{ color: "#1E3A8A", margin: "0 0 6px 0", fontSize: "18px" }}>{analiseAtual.causa_raiz?.titulo}</h2>
                <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 8px 0" }}>{analiseAtual.causa_raiz?.descricao_problema}</p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Badge slug={STATUS_CONFIG[analiseAtual.causa_raiz?.status]?.slug || "gray"} texto={STATUS_CONFIG[analiseAtual.causa_raiz?.status]?.label || analiseAtual.causa_raiz?.status} />
                  {analiseAtual.causa_raiz?.linha_nome && <span style={{ color: "#6b7280", fontSize: "12px" }}>🏭 {analiseAtual.causa_raiz.linha_nome}</span>}
                  {analiseAtual.causa_raiz?.responsavel && <span style={{ color: "#6b7280", fontSize: "12px" }}>👤 {analiseAtual.causa_raiz.responsavel}</span>}
                </div>
              </div>
              <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "12px 16px", minWidth: "160px", textAlign: "center" }}>
                <p style={{ color: "#6b7280", fontSize: "11px", margin: "0 0 4px 0" }}>Progresso</p>
                <p style={{ color: "#1E3A8A", fontSize: "28px", fontWeight: "800", margin: 0 }}>{analiseAtual.progresso?.percentual_completo}%</p>
                <div style={{ backgroundColor: "#e5e7eb", borderRadius: "4px", height: "6px", marginTop: "6px", overflow: "hidden" }}>
                  <div style={{ backgroundColor: "#1E3A8A", height: "100%", width: `${analiseAtual.progresso?.percentual_completo}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* 5 PORQUÊS */}
          <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "20px 24px", marginBottom: "20px" }}>
            <h3 style={{ color: "#1E3A8A", margin: "0 0 16px 0", fontSize: "16px" }}>❓ 5 Porquês</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {analiseAtual.cinco_porques?.map(pq => {
                const respondido = !!pq.resposta;
                const editando   = editandoPorque === pq.numero;
                return (
                  <div key={pq.numero} style={{ backgroundColor: respondido ? "#f0fdf4" : "#f9fafb", borderRadius: "8px", padding: "14px 16px", border: `1px solid ${respondido ? "#86efac" : "#e5e7eb"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: "#1E3A8A", fontWeight: "700", fontSize: "14px", margin: "0 0 4px 0" }}>{pq.numero}° Por quê? {respondido && "✅"}</p>
                        <p style={{ color: "#374151", fontSize: "13px", margin: "0 0 6px 0", fontStyle: "italic" }}>{pq.pergunta}</p>
                        {respondido && !editando && <p style={{ color: "#15803d", fontSize: "14px", margin: 0, fontWeight: "600" }}>↳ {pq.resposta}</p>}
                      </div>
                      {!respondido && !editando && (
                        <button onClick={() => { setEditandoPorque(pq.numero); setRespostaPorque(""); }} style={{ padding: "5px 12px", backgroundColor: "#1E3A8A", color: "white", border: "none", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>Responder</button>
                      )}
                      {respondido && !editando && (
                        <button onClick={() => { setEditandoPorque(pq.numero); setRespostaPorque(pq.resposta); }} style={{ padding: "5px 12px", backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}>Editar</button>
                      )}
                    </div>
                    {editando && (
                      <div style={{ marginTop: "10px" }}>
                        <textarea value={respostaPorque} onChange={e => setRespostaPorque(e.target.value)} placeholder="Digite a resposta..." rows={2} style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", minWidth: "unset" }} />
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <button onClick={() => responderPorque(analiseAtual.causa_raiz.id, pq.numero)} style={{ padding: "6px 14px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "4px", fontSize: "13px", cursor: "pointer" }}>Salvar</button>
                          <button onClick={() => { setEditandoPorque(null); setRespostaPorque(""); }} style={{ padding: "6px 12px", backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px", cursor: "pointer" }}>Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ISHIKAWA */}
          <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "20px 24px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: "#1E3A8A", margin: 0, fontSize: "16px" }}>🐟 Diagrama de Ishikawa (6M)</h3>
              <button onClick={() => setAdicionandoIshikawa(!adicionandoIshikawa)} style={{ padding: "7px 14px", backgroundColor: adicionandoIshikawa ? "#f3f4f6" : "#1E3A8A", color: adicionandoIshikawa ? "#374151" : "white", border: adicionandoIshikawa ? "1px solid #d1d5db" : "none", borderRadius: "4px", fontSize: "13px", cursor: "pointer" }}>
                {adicionandoIshikawa ? "Cancelar" : "+ Adicionar Causa"}
              </button>
            </div>
            {adicionandoIshikawa && (
              <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "16px", marginBottom: "16px", border: "1px solid #e5e7eb" }}>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1, minWidth: "160px" }}>
                    <label style={labelStyle}>Categoria (6M) *</label>
                    <select value={ishikawaForm.categoria} onChange={e => setIshikawaForm({ ...ishikawaForm, categoria: e.target.value })} style={inputStyle}>
                      <option value="">Selecione...</option>
                      {Object.entries(CATEGORIAS_6M).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 2, minWidth: "200px" }}>
                    <label style={labelStyle}>Causa *</label>
                    <input value={ishikawaForm.causa} onChange={e => setIshikawaForm({ ...ishikawaForm, causa: e.target.value })} placeholder="Descreva a causa" style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 2, minWidth: "200px" }}>
                    <label style={labelStyle}>Subcausa</label>
                    <input value={ishikawaForm.subcausa} onChange={e => setIshikawaForm({ ...ishikawaForm, subcausa: e.target.value })} placeholder="Detalhe (opcional)" style={inputStyle} />
                  </div>
                </div>
                <button onClick={() => adicionarIshikawa(analiseAtual.causa_raiz.id)} style={{ padding: "7px 16px", backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "4px", fontSize: "13px", cursor: "pointer" }}>Adicionar</button>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
              {Object.entries(CATEGORIAS_6M).map(([key, cat]) => {
                const causas = analiseAtual.ishikawa_por_categoria?.[key]?.causas || [];
                return (
                  <div key={key} style={{ borderRadius: "8px", border: `2px solid ${cat.cor}20`, overflow: "hidden" }}>
                    <div style={{ backgroundColor: `${cat.cor}15`, padding: "10px 14px", borderBottom: `2px solid ${cat.cor}30` }}>
                      <span style={{ color: cat.cor, fontWeight: "700", fontSize: "13px" }}>{cat.label}</span>
                      <span style={{ color: "#6b7280", fontSize: "12px", marginLeft: "6px" }}>({causas.length})</span>
                    </div>
                    <div style={{ padding: "10px 14px", minHeight: "60px" }}>
                      {causas.length === 0 ? (
                        <p style={{ color: "#d1d5db", fontSize: "12px", margin: 0, fontStyle: "italic" }}>Nenhuma causa registrada</p>
                      ) : causas.map(c => (
                        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
                          <div>
                            <span style={{ color: "#374151", fontSize: "13px" }}>• {c.causa}</span>
                            {c.subcausa && <div style={{ color: "#6b7280", fontSize: "11px", marginLeft: "10px" }}>↳ {c.subcausa}</div>}
                          </div>
                          <button onClick={() => removerIshikawa(analiseAtual.causa_raiz.id, c.id)} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: "14px", padding: "0 2px" }} title="Remover">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CONCLUSÃO */}
          <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", padding: "20px 24px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: "#1E3A8A", margin: 0, fontSize: "16px" }}>✅ Conclusão e Ação Corretiva</h3>
              <button onClick={() => setEditandoAnalise(!editandoAnalise)} style={{ padding: "7px 14px", backgroundColor: editandoAnalise ? "#f3f4f6" : "#1E3A8A", color: editandoAnalise ? "#374151" : "white", border: editandoAnalise ? "1px solid #d1d5db" : "none", borderRadius: "4px", fontSize: "13px", cursor: "pointer" }}>
                {editandoAnalise ? "Cancelar" : "Editar"}
              </button>
            </div>
            {editandoAnalise ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={labelStyle}>Causa Raiz Final</label>
                  <textarea value={formEdicao.causa_raiz_final} onChange={e => setFormEdicao({ ...formEdicao, causa_raiz_final: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical", minWidth: "unset", width: "100%", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={labelStyle}>Ação Corretiva</label>
                  <textarea value={formEdicao.acao_corretiva} onChange={e => setFormEdicao({ ...formEdicao, acao_corretiva: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical", minWidth: "unset", width: "100%", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={labelStyle}>Responsável</label>
                    <input value={formEdicao.responsavel} onChange={e => setFormEdicao({ ...formEdicao, responsavel: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={labelStyle}>Prazo</label>
                    <input type="date" value={formEdicao.prazo} onChange={e => setFormEdicao({ ...formEdicao, prazo: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={labelStyle}>Status</label>
                    <select value={formEdicao.status} onChange={e => setFormEdicao({ ...formEdicao, status: e.target.value })} style={inputStyle}>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" id="eficacia" checked={formEdicao.eficacia_verificada} onChange={e => setFormEdicao({ ...formEdicao, eficacia_verificada: e.target.checked })} />
                  <label htmlFor="eficacia" style={{ fontSize: "13px", color: "#374151" }}>Eficácia verificada — a ação corretiva resolveu o problema</label>
                </div>
                <button onClick={() => salvarEdicao(analiseAtual.causa_raiz.id)} style={{ padding: "8px 18px", backgroundColor: "#1E3A8A", color: "white", border: "none", borderRadius: "4px", fontSize: "14px", fontWeight: "600", cursor: "pointer", alignSelf: "flex-start" }}>
                  Salvar
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ backgroundColor: "#f9fafb", borderRadius: "6px", padding: "14px" }}>
                  <p style={{ color: "#6b7280", fontSize: "11px", margin: "0 0 4px 0" }}>Causa Raiz Final</p>
                  <p style={{ color: "#1E3A8A", fontSize: "14px", fontWeight: "600", margin: 0 }}>{analiseAtual.causa_raiz?.causa_raiz_final || <span style={{ color: "#d1d5db", fontStyle: "italic" }}>Não definida ainda</span>}</p>
                </div>
                <div style={{ backgroundColor: "#f9fafb", borderRadius: "6px", padding: "14px" }}>
                  <p style={{ color: "#6b7280", fontSize: "11px", margin: "0 0 4px 0" }}>Ação Corretiva</p>
                  <p style={{ color: "#1E3A8A", fontSize: "14px", fontWeight: "600", margin: 0 }}>{analiseAtual.causa_raiz?.acao_corretiva || <span style={{ color: "#d1d5db", fontStyle: "italic" }}>Não definida ainda</span>}</p>
                </div>
                {analiseAtual.causa_raiz?.eficacia_verificada && (
                  <div style={{ backgroundColor: "#dcfce7", border: "1px solid #86efac", borderRadius: "6px", padding: "10px 14px" }}>
                    <span style={{ color: "#15803d", fontSize: "13px", fontWeight: "600" }}>✅ Eficácia verificada — ação corretiva confirmada como efetiva</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={() => excluirAnalise(analiseAtual.causa_raiz.id)} style={{ padding: "8px 16px", backgroundColor: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "4px", fontSize: "13px", cursor: "pointer" }}>
            🗑️ Excluir esta análise
          </button>
        </>
      )}
    </div>
  );
}

const inputStyle = { padding: "8px 12px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", minWidth: "160px" };
const labelStyle = { fontSize: "12px", color: "#374151", fontWeight: "600" };
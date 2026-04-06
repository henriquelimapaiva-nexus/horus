// src/pages/consultor/Leads.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import Botao from "../../components/ui/Botao";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Modal from "../../components/ui/Modal";
import toast from 'react-hot-toast';

export default function Leads() {
  const [carregando, setCarregando] = useState(false);
  const [leads, setLeads] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalInteracao, setModalInteracao] = useState(null);
  const [filtro, setFiltro] = useState({ status: "", consultor_id: "" });
  const [form, setForm] = useState({
    nome: "",
    cnpj: "",
    contato_nome: "",
    contato_email: "",
    contato_telefone: "",
    fonte: "",
    status: "",
    potencial_faturamento: "",
    probabilidade_fechamento: "",
    proximo_contato: "",
    observacoes: ""
  });
  const [interacaoForm, setInteracaoForm] = useState({
    tipo: "ligacao",
    data: new Date().toISOString().split('T')[0],
    hora: "",
    descricao: ""
  });
  const [editandoId, setEditandoId] = useState(null);
  // 🔧 NOVO: Estados para histórico de interações
  const [interacoes, setInteracoes] = useState([]);
  const [carregandoInteracoes, setCarregandoInteracoes] = useState(false);

  useEffect(() => {
    carregarLeads();
    carregarMetrics();
  }, [filtro]);

  const carregarLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (filtro.status) params.append("status", filtro.status);
      if (filtro.consultor_id) params.append("consultor_id", filtro.consultor_id);
      
      const res = await api.get(`/leads?${params.toString()}`);
      setLeads(res.data);
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
      toast.error("Erro ao carregar leads");
    }
  };

  const carregarMetrics = async () => {
    try {
      const res = await api.get("/leads/dashboard/metrics");
      setMetrics(res.data);
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.nome) {
      toast.error("Nome do lead é obrigatório");
      return;
    }
    
    setCarregando(true);
    try {
      if (editandoId) {
        await api.put(`/leads/${editandoId}`, form);
        toast.success("Lead atualizado com sucesso!");
      } else {
        await api.post("/leads", form);
        toast.success("Lead criado com sucesso!");
      }
      
      setModalAberto(false);
      setEditandoId(null);
      setForm({
        nome: "", cnpj: "", contato_nome: "", contato_email: "", contato_telefone: "",
        fonte: "", status: "", potencial_faturamento: "",
        probabilidade_fechamento: "", proximo_contato: "", observacoes: ""
      });
      carregarLeads();
      carregarMetrics();
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
      toast.error("Erro ao salvar lead");
    } finally {
      setCarregando(false);
    }
  };

  const handleInteracao = async (e) => {
    e.preventDefault();
    
    setCarregando(true);
    try {
      await api.post(`/leads/${modalInteracao.id}/interacoes`, interacaoForm);
      toast.success("Interação registrada com sucesso!");
      setModalInteracao(null);
      setInteracaoForm({
        tipo: "ligacao",
        data: new Date().toISOString().split('T')[0],
        hora: "",
        descricao: ""
      });
      carregarLeads();
      carregarMetrics();
    } catch (error) {
      console.error("Erro ao registrar interação:", error);
      toast.error("Erro ao registrar interação");
    } finally {
      setCarregando(false);
    }
  };

  const handleDelete = async (id, nome) => {
    if (!window.confirm(`Tem certeza que deseja excluir o lead "${nome}"?`)) {
      return;
    }
    
    try {
      await api.delete(`/leads/${id}`);
      toast.success("Lead excluído com sucesso!");
      carregarLeads();
      carregarMetrics();
    } catch (error) {
      console.error("Erro ao excluir lead:", error);
      toast.error("Erro ao excluir lead");
    }
  };

  // 🔧 NOVO: Função abrirEdicao modificada para carregar interações
  const abrirEdicao = async (lead) => {
    setEditandoId(lead.id);
    setForm({
      nome: lead.nome || "",
      cnpj: lead.cnpj || "",
      contato_nome: lead.contato_nome || "",
      contato_email: lead.contato_email || "",
      contato_telefone: lead.contato_telefone || "",
      fonte: lead.fonte || "indicação",
      status: lead.status || "prospecção",
      potencial_faturamento: lead.potencial_faturamento || "",
      probabilidade_fechamento: lead.probabilidade_fechamento || 30,
      proximo_contato: lead.proximo_contato ? lead.proximo_contato.split('T')[0] : "",
      observacoes: lead.observacoes || ""
    });
    
    // Carregar interações do lead
    setCarregandoInteracoes(true);
    try {
      const res = await api.get(`/leads/${lead.id}`);
      setInteracoes(res.data.interacoes || []);
    } catch (error) {
      console.error("Erro ao carregar interações:", error);
      setInteracoes([]);
    } finally {
      setCarregandoInteracoes(false);
    }
    
    setModalAberto(true);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const getStatusColor = (status) => {
    const cores = {
      prospecção: "#6b7280",
      contato_inicial: "#3b82f6",
      proposta_enviada: "#f59e0b",
      negociação: "#8b5cf6",
      fechado: "#10b981",
      perdido: "#ef4444"
    };
    return cores[status] || "#6b7280";
  };

  const getStatusLabel = (status) => {
    const labels = {
      prospecção: "Prospecção",
      contato_inicial: "Contato Inicial",
      proposta_enviada: "Proposta Enviada",
      negociação: "Negociação",
      fechado: "Fechado",
      perdido: "Perdido"
    };
    return labels[status] || status;
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      
      {/* Cabeçalho */}
      <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ color: "#1E3A8A", marginBottom: "5px" }}>
            🎯 Gestão de Leads
          </h1>
          <p style={{ color: "#666" }}>
            Gerencie empresas em prospecção e acompanhe o funil de vendas
          </p>
        </div>
        <Botao onClick={() => { setEditandoId(null); setForm({ nome: "", cnpj: "", contato_nome: "", contato_email: "", contato_telefone: "", fonte: "", status: "", potencial_faturamento: "", probabilidade_fechamento: "", proximo_contato: "", observacoes: "" }); setModalAberto(true); }}>
          + Novo Lead
        </Botao>
      </div>

      {/* Métricas */}
      {metrics && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "15px",
          marginBottom: "30px"
        }}>
          <MetricCard titulo="Total Leads" valor={metrics.total_leads} cor="#1E3A8A" />
          <MetricCard titulo="Pipeline" valor={formatarMoeda(metrics.pipeline_total)} cor="#f59e0b" />
          <MetricCard titulo="Pipeline Ponderado" valor={formatarMoeda(metrics.pipeline_ponderado)} cor="#10b981" />
          <MetricCard titulo="Em Negociação" valor={metrics.negociacao} cor="#8b5cf6" />
          <MetricCard titulo="Fechados (mês)" valor={metrics.fechados} cor="#10b981" />
        </div>
      )}

      {/* Filtros */}
      <Card style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <Select
            label="Status"
            value={filtro.status}
            onChange={(e) => setFiltro({ ...filtro, status: e.target.value })}
            options={[
              { value: "", label: "Todos" },
              { value: "prospecção", label: "Prospecção" },
              { value: "contato_inicial", label: "Contato Inicial" },
              { value: "proposta_enviada", label: "Proposta Enviada" },
              { value: "negociação", label: "Negociação" },
              { value: "fechado", label: "Fechado" },
              { value: "perdido", label: "Perdido" }
            ]}
          />
          <Botao variant="outline" onClick={() => setFiltro({ status: "", consultor_id: "" })}>
            Limpar Filtros
          </Botao>
        </div>
      </Card>

      {/* Tabela de Leads */}
      <Card>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#1E3A8A" }}>
                <th style={thStyle}>Empresa</th>
                <th style={thStyle}>Contato</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Potencial</th>
                <th style={thStyle}>Prob.</th>
                <th style={thStyle}>Próx. Contato</th>
                <th style={thStyle}>Ações</th>
                </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdStyle}>
                    <div><strong>{lead.nome}</strong></div>
                    {lead.cnpj && <div style={{ fontSize: "12px", color: "#666" }}>{lead.cnpj}</div>}
                   </td>
                  <td style={tdStyle}>
                    {lead.contato_nome && <div>{lead.contato_nome}</div>}
                    {lead.contato_telefone && <div style={{ fontSize: "12px", color: "#666" }}>{lead.contato_telefone}</div>}
                    {lead.contato_email && <div style={{ fontSize: "12px", color: "#666" }}>{lead.contato_email}</div>}
                   </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "500",
                      backgroundColor: `${getStatusColor(lead.status)}20`,
                      color: getStatusColor(lead.status)
                    }}>
                      {getStatusLabel(lead.status)}
                    </span>
                   </td>
                  <td style={tdStyle}>
                    {formatarMoeda(lead.potencial_faturamento)}
                   </td>
                  <td style={tdStyle}>
                    <div style={{
                      width: "60px",
                      background: "#e5e7eb",
                      borderRadius: "10px",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: `${lead.probabilidade_fechamento}%`,
                        background: "#10b981",
                        color: "white",
                        fontSize: "10px",
                        textAlign: "center",
                        padding: "2px 0"
                      }}>
                        {lead.probabilidade_fechamento}%
                      </div>
                    </div>
                   </td>
                  <td style={tdStyle}>
                    {lead.proximo_contato ? new Date(lead.proximo_contato).toLocaleDateString('pt-BR') : "-"}
                   </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => abrirEdicao(lead)}
                        style={actionButtonStyle}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setModalInteracao(lead)}
                        style={actionButtonStyle}
                      >
                        Interação
                      </button>
                      <button
                        onClick={() => handleDelete(lead.id, lead.nome)}
                        style={{ ...actionButtonStyle, color: "#dc2626", borderColor: "#dc2626" }}
                      >
                        Excluir
                      </button>
                    </div>
                   </td>
                 </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                    Nenhum lead encontrado. Clique em "Novo Lead" para começar.
                   </td>
                 </tr>
              )}
            </tbody>
           </table>
        </div>
      </Card>

      {/* Modal de Lead */}
      <Modal isOpen={modalAberto} onClose={() => setModalAberto(false)} title={editandoId ? "Editar Lead" : "Novo Lead"}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <Input
              label="Nome da Empresa *"
              value={form.nome}
              onChange={(e) => setForm({...form, nome: e.target.value})}
              required
            />
            <Input
              label="CNPJ"
              value={form.cnpj}
              onChange={(e) => setForm({...form, cnpj: e.target.value})}
            />
            <Input
              label="Nome do Contato"
              value={form.contato_nome}
              onChange={(e) => setForm({...form, contato_nome: e.target.value})}
            />
            <Input
              label="E-mail"
              type="email"
              value={form.contato_email}
              onChange={(e) => setForm({...form, contato_email: e.target.value})}
            />
            <Input
              label="Telefone"
              value={form.contato_telefone}
              onChange={(e) => setForm({...form, contato_telefone: e.target.value})}
            />
            <Select
              label="Fonte"
              value={form.fonte}
              onChange={(e) => setForm({...form, fonte: e.target.value})}
              options={[
                { value: "", label: "Selecione..." },
                { value: "indicação", label: "Indicação" },
                { value: "linkedin", label: "LinkedIn" },
                { value: "site", label: "Site" },
                { value: "evento", label: "Evento" },
                { value: "outros", label: "Outros" }
              ]}
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({...form, status: e.target.value})}
              options={[
                { value: "", label: "Selecione..." },
                { value: "prospecção", label: "Prospecção" },
                { value: "contato_inicial", label: "Contato Inicial" },
                { value: "proposta_enviada", label: "Proposta Enviada" },
                { value: "negociação", label: "Negociação" },
                { value: "fechado", label: "Fechado" },
                { value: "perdido", label: "Perdido" }
              ]}
            />
            <Input
              label="Potencial de Faturamento (R$)"
              type="number"
              value={form.potencial_faturamento}
              onChange={(e) => setForm({...form, potencial_faturamento: e.target.value})}
            />
            <Input
              label="Probabilidade de Fechamento (%)"
              type="number"
              placeholder="valor porcentagem"
              min="0"
              max="100"
              value={form.probabilidade_fechamento}
              onChange={(e) => setForm({...form, probabilidade_fechamento: e.target.value})}
            />
            <Input
              label="Próximo Contato"
              type="date"
              value={form.proximo_contato}
              onChange={(e) => setForm({...form, proximo_contato: e.target.value})}
            />
          </div>
          <div style={{ marginTop: "15px" }}>
            <Input
              label="Observações"
              as="textarea"
              rows={3}
              value={form.observacoes}
              onChange={(e) => setForm({...form, observacoes: e.target.value})}
            />
          </div>
          
          {/* 🔧 NOVO: Histórico de Interações */}
          <div style={{ marginTop: "20px", borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}>
            <h4 style={{ color: "#1E3A8A", marginBottom: "10px", fontSize: "14px" }}>
              📞 Histórico de Interações
            </h4>
            
            {carregandoInteracoes ? (
              <p style={{ color: "#666", fontSize: "12px" }}>Carregando...</p>
            ) : interacoes.length === 0 ? (
              <p style={{ color: "#666", fontSize: "12px" }}>Nenhuma interação registrada ainda.</p>
            ) : (
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {interacoes.map((interacao, index) => (
                  <div key={interacao.id || index} style={{
                    backgroundColor: "#f9fafb",
                    padding: "10px",
                    borderRadius: "6px",
                    marginBottom: "8px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "bold", fontSize: "12px" }}>
                        {interacao.tipo === "ligacao" ? "📞 Ligação" :
                         interacao.tipo === "email" ? "✉️ E-mail" :
                         interacao.tipo === "reuniao" ? "👥 Reunião" :
                         interacao.tipo === "whatsapp" ? "💬 WhatsApp" : "🏢 Visita"}
                      </span>
                      <span style={{ fontSize: "11px", color: "#666" }}>
                        {new Date(interacao.data).toLocaleDateString('pt-BR')}
                        {interacao.hora && ` às ${interacao.hora}`}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#374151" }}>
                      {interacao.descricao}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <Botao variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Botao>
            <Botao type="submit" loading={carregando}>Salvar</Botao>
          </div>
        </form>
      </Modal>

      {/* Modal de Interação */}
      <Modal isOpen={modalInteracao !== null} onClose={() => setModalInteracao(null)} title={`Registrar Interação - ${modalInteracao?.nome || ""}`}>
        <form onSubmit={handleInteracao}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <Select
              label="Tipo"
              value={interacaoForm.tipo}
              onChange={(e) => setInteracaoForm({...interacaoForm, tipo: e.target.value})}
              options={[
                { value: "ligacao", label: "Ligação" },
                { value: "email", label: "E-mail" },
                { value: "reuniao", label: "Reunião" },
                { value: "whatsapp", label: "WhatsApp" },
                { value: "visita", label: "Visita" }
              ]}
            />
            <Input
              label="Data"
              type="date"
              value={interacaoForm.data}
              onChange={(e) => setInteracaoForm({...interacaoForm, data: e.target.value})}
              required
            />
            <Input
              label="Hora"
              type="time"
              value={interacaoForm.hora}
              onChange={(e) => setInteracaoForm({...interacaoForm, hora: e.target.value})}
            />
          </div>
          <div style={{ marginTop: "15px" }}>
            <Input
              label="Descrição"
              as="textarea"
              rows={3}
              value={interacaoForm.descricao}
              onChange={(e) => setInteracaoForm({...interacaoForm, descricao: e.target.value})}
              placeholder="Resumo da conversa, próximos passos..."
            />
          </div>
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <Botao variant="outline" onClick={() => setModalInteracao(null)}>Cancelar</Botao>
            <Botao type="submit" loading={carregando}>Registrar</Botao>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MetricCard({ titulo, valor, cor }) {
  return (
    <div style={{
      backgroundColor: "white",
      padding: "15px",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      borderLeft: `4px solid ${cor}`,
      textAlign: "center"
    }}>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>{titulo}</div>
      <div style={{ fontSize: "20px", fontWeight: "bold", color: cor }}>{valor}</div>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "12px",
  fontWeight: "600",
  color: "white"
};

const tdStyle = {
  padding: "12px",
  color: "#1f2937"
};

const actionButtonStyle = {
  padding: "6px 12px",
  backgroundColor: "#f3f4f6",
  border: "1px solid #e5e7eb",
  borderRadius: "4px",
  fontSize: "12px",
  cursor: "pointer",
  transition: "all 0.2s",
  color: "#374151"
};
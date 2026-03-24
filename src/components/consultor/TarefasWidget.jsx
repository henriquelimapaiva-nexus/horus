// src/components/consultor/TarefasWidget.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import Botao from "../ui/Botao";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Modal from "../ui/Modal";
import toast from 'react-hot-toast';

export default function TarefasWidget({ onTarefasChange }) {
  const [carregando, setCarregando] = useState(false);
  const [tarefas, setTarefas] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    prioridade: "media",
    status: "pendente",
    data_limite: "",
    categoria: "geral",
    cliente_id: ""
  });
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    carregarTarefas();
    carregarClientes();
  }, []);

  const carregarTarefas = async () => {
    try {
      const res = await api.get("/tarefas");
      setTarefas(res.data);
      if (onTarefasChange) onTarefasChange(res.data);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
      toast.error("Erro ao carregar tarefas");
    }
  };

  const carregarClientes = async () => {
    try {
      const res = await api.get("/companies");
      setClientes(res.data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.titulo) {
      toast.error("Título da tarefa é obrigatório");
      return;
    }
    
    setCarregando(true);
    try {
      if (editandoId) {
        await api.put(`/tarefas/${editandoId}`, form);
        toast.success("Tarefa atualizada!");
      } else {
        await api.post("/tarefas", form);
        toast.success("Tarefa criada!");
      }
      
      setModalAberto(false);
      setEditandoId(null);
      setForm({
        titulo: "", descricao: "", prioridade: "media", status: "pendente",
        data_limite: "", categoria: "geral", cliente_id: ""
      });
      carregarTarefas();
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
      toast.error("Erro ao salvar tarefa");
    } finally {
      setCarregando(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/tarefas/${id}/toggle`);
      toast.success(res.data.status === "concluida" ? "✅ Tarefa concluída!" : "🔄 Tarefa reaberta!");
      carregarTarefas();
    } catch (error) {
      console.error("Erro ao alternar status:", error);
      toast.error("Erro ao atualizar tarefa");
    }
  };

  const handleDelete = async (id, titulo) => {
    if (window.confirm(`Excluir tarefa "${titulo}"?`)) {
      try {
        await api.delete(`/tarefas/${id}`);
        toast.success("Tarefa excluída!");
        carregarTarefas();
      } catch (error) {
        console.error("Erro ao excluir tarefa:", error);
        toast.error("Erro ao excluir tarefa");
      }
    }
  };

  const abrirEdicao = (tarefa) => {
    setEditandoId(tarefa.id);
    setForm({
      titulo: tarefa.titulo || "",
      descricao: tarefa.descricao || "",
      prioridade: tarefa.prioridade || "media",
      status: tarefa.status || "pendente",
      data_limite: tarefa.data_limite ? tarefa.data_limite.split('T')[0] : "",
      categoria: tarefa.categoria || "geral",
      cliente_id: tarefa.cliente_id || ""
    });
    setModalAberto(true);
  };

  const getPrioridadeColor = (prioridade) => {
    const cores = {
      alta: "#ef4444",
      media: "#f59e0b",
      baixa: "#10b981"
    };
    return cores[prioridade] || "#6b7280";
  };

  const getPrioridadeLabel = (prioridade) => {
    const labels = { alta: "Alta", media: "Média", baixa: "Baixa" };
    return labels[prioridade] || prioridade;
  };

  const getStatusIcon = (status) => {
    if (status === "concluida") return "✅";
    if (status === "em_andamento") return "🔄";
    return "⭕";
  };

  const tarefasPendentes = tarefas.filter(t => t.status !== "concluida");
  const tarefasConcluidas = tarefas.filter(t => t.status === "concluida");

  return (
    <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
      {/* Cabeçalho */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h3 style={{ margin: 0, color: "#1E3A8A" }}>📋 Minhas Tarefas</h3>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666" }}>
            {tarefasPendentes.length} pendentes • {tarefasConcluidas.length} concluídas
          </p>
        </div>
        <Botao size="small" onClick={() => { setEditandoId(null); setForm({ titulo: "", descricao: "", prioridade: "media", status: "pendente", data_limite: "", categoria: "geral", cliente_id: "" }); setModalAberto(true); }}>
          + Nova Tarefa
        </Botao>
      </div>

      {/* Lista de tarefas */}
      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
        {tarefasPendentes.length === 0 && tarefasConcluidas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            ✨ Nenhuma tarefa cadastrada
            <br />
            <span style={{ fontSize: "12px" }}>Clique em "Nova Tarefa" para começar</span>
          </div>
        ) : (
          <>
            {/* Tarefas Pendentes */}
            {tarefasPendentes.map(tarefa => (
              <div
                key={tarefa.id}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  transition: "background 0.2s",
                  cursor: "pointer"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <button
                  onClick={() => handleToggleStatus(tarefa.id)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  title="Marcar como concluída"
                >
                  {getStatusIcon(tarefa.status)}
                </button>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "14px" }}>{tarefa.titulo}</strong>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "10px",
                      fontWeight: "500",
                      backgroundColor: `${getPrioridadeColor(tarefa.prioridade)}20`,
                      color: getPrioridadeColor(tarefa.prioridade)
                    }}>
                      {getPrioridadeLabel(tarefa.prioridade)}
                    </span>
                    {tarefa.categoria && (
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        backgroundColor: "#e5e7eb",
                        color: "#374151"
                      }}>
                        {tarefa.categoria === "geral" ? "📌 Geral" : 
                         tarefa.categoria === "cliente" ? "🏢 Cliente" :
                         tarefa.categoria === "projeto" ? "📊 Projeto" :
                         tarefa.categoria === "administrativo" ? "📋 Admin" : "👤 Pessoal"}
                      </span>
                    )}
                    {tarefa.cliente_nome && (
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        backgroundColor: "#dbeafe",
                        color: "#1e40af"
                      }}>
                        {tarefa.cliente_nome}
                      </span>
                    )}
                  </div>
                  
                  {tarefa.descricao && (
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                      {tarefa.descricao}
                    </div>
                  )}
                  
                  {tarefa.data_limite && (
                    <div style={{
                      fontSize: "11px",
                      color: new Date(tarefa.data_limite) < new Date() ? "#ef4444" : "#888",
                      marginTop: "6px"
                    }}>
                      📅 Vence em: {new Date(tarefa.data_limite).toLocaleDateString('pt-BR')}
                      {new Date(tarefa.data_limite) < new Date() && " (Atrasada!)"}
                    </div>
                  )}
                </div>
                
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => abrirEdicao(tarefa)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "16px",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      color: "#666"
                    }}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(tarefa.id, tarefa.titulo)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "16px",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "4px",
                      color: "#ef4444"
                    }}
                    title="Excluir"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            
            {/* Tarefas Concluídas (colapsadas) */}
            {tarefasConcluidas.length > 0 && (
              <details style={{ borderTop: "1px solid #e5e7eb" }}>
                <summary style={{
                  padding: "12px 16px",
                  fontSize: "13px",
                  color: "#666",
                  cursor: "pointer",
                  fontWeight: "500"
                }}>
                  ✅ Concluídas ({tarefasConcluidas.length})
                </summary>
                {tarefasConcluidas.map(tarefa => (
                  <div
                    key={tarefa.id}
                    style={{
                      padding: "12px 16px 12px 48px",
                      borderBottom: "1px solid #e5e7eb",
                      opacity: 0.7,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px"
                    }}
                  >
                    <button
                      onClick={() => handleToggleStatus(tarefa.id)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "20px",
                        cursor: "pointer",
                        padding: "4px"
                      }}
                      title="Reabrir tarefa"
                    >
                      🔄
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ textDecoration: "line-through", fontSize: "14px" }}>
                          {tarefa.titulo}
                        </span>
                      </div>
                      {tarefa.data_conclusao && (
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
                          ✅ Concluída em: {new Date(tarefa.data_conclusao).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(tarefa.id, tarefa.titulo)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "16px",
                        cursor: "pointer",
                        color: "#ef4444"
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </details>
            )}
          </>
        )}
      </div>

      {/* Modal de Tarefa */}
      <Modal isOpen={modalAberto} onClose={() => setModalAberto(false)} title={editandoId ? "Editar Tarefa" : "Nova Tarefa"}>
        <form onSubmit={handleSubmit}>
          <Input
            label="Título *"
            value={form.titulo}
            onChange={(e) => setForm({...form, titulo: e.target.value})}
            required
            placeholder="Ex: Reunião com cliente Metalúrgica ABC"
          />
          
          <div style={{ marginTop: "12px" }}>
            <Input
              label="Descrição"
              as="textarea"
              rows={3}
              value={form.descricao}
              onChange={(e) => setForm({...form, descricao: e.target.value})}
              placeholder="Detalhes adicionais sobre a tarefa..."
            />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
            <Select
              label="Prioridade"
              value={form.prioridade}
              onChange={(e) => setForm({...form, prioridade: e.target.value})}
              options={[
                { value: "alta", label: "🔴 Alta" },
                { value: "media", label: "🟡 Média" },
                { value: "baixa", label: "🟢 Baixa" }
              ]}
            />
            
            <Select
              label="Categoria"
              value={form.categoria}
              onChange={(e) => setForm({...form, categoria: e.target.value})}
              options={[
                { value: "geral", label: "📌 Geral" },
                { value: "cliente", label: "🏢 Cliente" },
                { value: "projeto", label: "📊 Projeto" },
                { value: "administrativo", label: "📋 Administrativo" },
                { value: "pessoal", label: "👤 Pessoal" }
              ]}
            />
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
            <Input
              label="Data Limite"
              type="date"
              value={form.data_limite}
              onChange={(e) => setForm({...form, data_limite: e.target.value})}
            />
            
            <Select
              label="Cliente (opcional)"
              value={form.cliente_id}
              onChange={(e) => setForm({...form, cliente_id: e.target.value})}
              options={[
                { value: "", label: "Nenhum" },
                ...clientes.map(c => ({ value: c.id, label: c.nome }))
              ]}
            />
          </div>
          
          {editandoId && (
            <div style={{ marginTop: "12px" }}>
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => setForm({...form, status: e.target.value})}
                options={[
                  { value: "pendente", label: "⭕ Pendente" },
                  { value: "em_andamento", label: "🔄 Em Andamento" },
                  { value: "concluida", label: "✅ Concluída" }
                ]}
              />
            </div>
          )}
          
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <Botao variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Botao>
            <Botao type="submit" loading={carregando}>Salvar</Botao>
          </div>
        </form>
      </Modal>
    </div>
  );
}
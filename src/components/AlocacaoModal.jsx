// src/components/AlocacaoModal.jsx
import { useState, useEffect } from "react";
import api from "../api/api";

export default function AlocacaoModal({ 
  isOpen, 
  onClose, 
  posto, 
  colaboradores,
  onAlocacaoCriada 
}) {
  const [form, setForm] = useState({
    colaborador_id: "",
    turno: "1",
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: ""
  });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.colaborador_id) {
      setErro("Selecione um colaborador");
      return;
    }

    setCarregando(true);
    try {
      await api.post("/alocacoes", {
        ...form,
        posto_id: posto.id,
        turno: parseInt(form.turno)
      });
      
      onAlocacaoCriada();
      onClose();
    } catch (error) {
      console.error("Erro ao criar alocação:", error);
      setErro(error.response?.data?.erro || "Erro ao criar alocação");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "white",
        padding: "30px",
        borderRadius: "8px",
        maxWidth: "500px",
        width: "90%",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        <h2 style={{ color: "#1E3A8A", marginBottom: "20px" }}>
          Alocar Colaborador - {posto?.nome}
        </h2>

        {erro && (
          <div style={{
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "15px"
          }}>
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label style={labelStyle}>Colaborador *</label>
            <select
              value={form.colaborador_id}
              onChange={(e) => setForm({...form, colaborador_id: e.target.value})}
              style={inputStyle}
              required
            >
              <option value="">Selecione...</option>
              {colaboradores.map(col => (
                <option key={col.id} value={col.id}>{col.nome}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={labelStyle}>Turno *</label>
            <select
              value={form.turno}
              onChange={(e) => setForm({...form, turno: e.target.value})}
              style={inputStyle}
            >
              <option value="1">Turno 1</option>
              <option value="2">Turno 2</option>
              <option value="3">Turno 3</option>
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={labelStyle}>Data Início</label>
            <input
              type="date"
              value={form.data_inicio}
              onChange={(e) => setForm({...form, data_inicio: e.target.value})}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Data Fim (opcional)</label>
            <input
              type="date"
              value={form.data_fim}
              onChange={(e) => setForm({...form, data_fim: e.target.value})}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="submit"
              disabled={carregando}
              style={{
                ...btnStyle,
                backgroundColor: "#1E3A8A",
                flex: 2
              }}
            >
              {carregando ? "Alocando..." : "Alocar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                ...btnStyle,
                backgroundColor: "#6b7280",
                flex: 1
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "14px",
  fontWeight: "500"
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none"
};

const btnStyle = {
  padding: "10px",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontWeight: "500",
  cursor: "pointer",
  fontSize: "14px"
};
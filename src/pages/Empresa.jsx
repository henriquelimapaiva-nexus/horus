// src/pages/Empresa.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast'; // 1️⃣ IMPORT ADICIONADO

export default function Empresa() {
  // Pega o clienteAtual do contexto
  let clienteAtual = null;
  try {
    const context = useOutletContext() || {};
    clienteAtual = context.clienteAtual;
  } catch (e) {
    // Ignora erro se não houver contexto
  }

  const [form, setForm] = useState({
    nome: "",
    cnpj: "",
    segmento: "",
    regime_tributario: "",
    turnos: "",
    dias_produtivos_mes: "",
    meta_mensal: ""
  });

  // 2️⃣ REMOVIDO: const [mensagem, setMensagem] = useState("");

  const [empresas, setEmpresas] = useState([]);
  const [editId, setEditId] = useState(null);
  const [filtroNome, setFiltroNome] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Carregar empresas
  useEffect(() => {
    carregarEmpresas();
  }, []);

  async function carregarEmpresas() {
    try {
      const res = await api.get("/empresas");
      setEmpresas(res.data);
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      toast.error("Erro ao carregar empresas"); // 3️⃣ TOAST ADICIONADO
    }
  }

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    
    try {
      if (editId) {
        // Editar empresa existente
        await api.put(`/empresas/${editId}`, form);
        toast.success("Empresa atualizada com sucesso! ✅"); // 4️⃣ TOAST ADICIONADO
        setEditId(null);
      } else {
        // Criar nova empresa
        await api.post("/empresas", form);
        toast.success("Empresa cadastrada com sucesso! ✅"); // 5️⃣ TOAST ADICIONADO
      }

      setForm({
        nome: "",
        cnpj: "",
        segmento: "",
        regime_tributario: "",
        turnos: "",
        dias_produtivos_mes: "",
        meta_mensal: ""
      });

      carregarEmpresas();
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar empresa ❌"); // 6️⃣ TOAST ADICIONADO
    } finally {
      setCarregando(false);
    }
  };

  function handleEdit(empresa) {
    setForm({ ...empresa });
    setEditId(empresa.id);
  }

  async function handleDelete(id) {
    if (!window.confirm("Deseja realmente excluir esta empresa?")) return;
    
    try {
      await api.delete(`/empresas/${id}`);
      carregarEmpresas();
      toast.success("Empresa excluída ✅"); // 7️⃣ TOAST ADICIONADO
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir empresa ❌"); // 8️⃣ TOAST ADICIONADO
    }
  }

  const empresasFiltradas = empresas.filter((e) =>
    e.nome.toLowerCase().includes(filtroNome.toLowerCase())
  );

  return (
    <div style={{ 
      padding: "30px", 
      width: "100%",
      fontFamily: "Arial, sans-serif", 
      backgroundColor: "#f5f7fa",
      minHeight: "100%"
    }}>
      
      {/* Cabeçalho */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ color: "#1E3A8A", marginBottom: "5px" }}>Empresas</h1>
        <p style={{ color: "#666" }}>
          Cadastre e gerencie todas as empresas (clientes)
          {clienteAtual && ` - Cliente ativo: ${clienteAtual}`}
        </p>
      </div>

      {/* FORMULÁRIO CENTRALIZADO */}
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <form
          onSubmit={handleSubmit}
          style={{
            maxWidth: "600px",
            width: "100%",
            padding: "30px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            borderTop: "4px solid #1E3A8A",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            backgroundColor: "white",
            marginBottom: "30px"
          }}
        >
          <h2 style={{ color: "#1E3A8A", marginBottom: "10px", fontSize: "18px" }}>
            {editId ? "Editar Empresa" : "Nova Empresa"}
          </h2>

          <input 
            name="nome" 
            placeholder="Nome da Empresa" 
            value={form.nome} 
            onChange={handleChange} 
            required 
            style={inputStyle} 
          />
          <input 
            name="cnpj" 
            placeholder="CNPJ" 
            value={form.cnpj} 
            onChange={handleChange} 
            required 
            style={inputStyle} 
          />
          <input 
            name="segmento" 
            placeholder="Segmento da Empresa" 
            value={form.segmento} 
            onChange={handleChange} 
            required 
            style={inputStyle} 
          />
          <input 
            name="regime_tributario" 
            placeholder="Regime Tributário" 
            value={form.regime_tributario} 
            onChange={handleChange} 
            required 
            style={inputStyle} 
          />
          <input 
            type="number" 
            name="turnos" 
            placeholder="Número de Turnos" 
            value={form.turnos} 
            onChange={handleChange} 
            required 
            style={inputStyle} 
          />
          <input 
            type="number" 
            name="dias_produtivos_mes" 
            placeholder="Dias Produtivos no Mês" 
            value={form.dias_produtivos_mes} 
            onChange={handleChange} 
            required 
            style={inputStyle} 
          />
          <input 
            type="number" 
            step="0.01" 
            name="meta_mensal" 
            placeholder="Meta Mensal (R$)" 
            value={form.meta_mensal} 
            onChange={handleChange} 
            required 
            style={inputStyle} 
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <Botao 
              type="submit"
              variant="primary"
              size="md"
              fullWidth={true}
              loading={carregando}
              disabled={carregando}
            >
              {editId ? "Atualizar" : "Cadastrar"}
            </Botao>
            
            {editId && (
              <Botao 
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  setEditId(null);
                  setForm({
                    nome: "",
                    cnpj: "",
                    segmento: "",
                    regime_tributario: "",
                    turnos: "",
                    dias_produtivos_mes: "",
                    meta_mensal: ""
                  });
                }}
              >
                Cancelar
              </Botao>
            )}
          </div>

          {/* 9️⃣ BLOCO DE MENSAGEM REMOVIDO */}
        </form>
      </div>

      {/* FILTRO */}
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "#1E3A8A", fontSize: "18px" }}>Empresas Cadastradas</h2>
        <input
          placeholder="Filtrar por nome"
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc", width: "250px" }}
        />
      </div>

      {/* TABELA DE EMPRESAS */}
      <div style={{ overflowX: "auto", backgroundColor: "white", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ backgroundColor: "#1E3A8A", color: "white" }}>
            <tr>
              <th style={th}>Nome</th>
              <th style={th}>CNPJ</th>
              <th style={th}>Segmento</th>
              <th style={th}>Regime</th>
              <th style={th}>Turnos</th>
              <th style={th}>Dias/Mês</th>
              <th style={th}>Meta Mensal</th>
              <th style={th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {empresasFiltradas.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                  Nenhuma empresa cadastrada
                </td>
              </tr>
            ) : (
              empresasFiltradas.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={td}>{e.nome}</td>
                  <td style={td}>{e.cnpj}</td>
                  <td style={td}>{e.segmento}</td>
                  <td style={td}>{e.regime_tributario}</td>
                  <td style={td}>{e.turnos}</td>
                  <td style={td}>{e.dias_produtivos_mes}</td>
                  <td style={td}>R$ {Number(e.meta_mensal).toFixed(2).replace(".", ",")}</td>
                  <td style={td}>
                    <Botao
                      variant="primary"
                      size="sm"
                      onClick={() => handleEdit(e)}
                      style={{ marginRight: "5px" }}
                    >
                      Editar
                    </Botao>
                    <Botao
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(e.id)}
                    >
                      Excluir
                    </Botao>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Estilos
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s"
};

const th = {
  padding: "12px",
  border: "1px solid #e5e7eb",
  textAlign: "center",
  fontSize: "14px",
  fontWeight: "500"
};

const td = {
  padding: "10px 12px",
  border: "1px solid #e5e7eb",
  textAlign: "center",
  fontSize: "14px"
};
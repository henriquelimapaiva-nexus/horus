// src/pages/Empresa.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Funções de formatação
const formatarCNPJ = (cnpj) => {
  if (!cnpj) return "";
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  return cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
};

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
      // ✅ CORRIGIDO: /empresas → /companies
      const res = await api.get("/companies");
      setEmpresas(res.data);
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      toast.error("Erro ao carregar empresas");
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
        // ✅ CORRIGIDO: /empresas → /companies
        await api.put(`/companies/${editId}`, form);
        
        // Recarrega a lista
        await carregarEmpresas();
        
        // 🔥 NOVO: Limpa o cache do seletor
        localStorage.removeItem('ultimaBuscaClientes');
        
        // Dispara evento para atualizar o seletor do menu
        window.dispatchEvent(new CustomEvent('empresasAtualizadas'));
        
        toast.success("Empresa atualizada com sucesso! ✅");
        setEditId(null);
      } else {
        // ✅ CORRIGIDO: /empresas → /companies
        await api.post("/companies", form);
        
        // Recarrega a lista
        await carregarEmpresas();
        
        // 🔥 NOVO: Limpa o cache do seletor
        localStorage.removeItem('ultimaBuscaClientes');
        
        // Dispara evento para atualizar o seletor do menu
        window.dispatchEvent(new CustomEvent('empresasAtualizadas'));
        
        toast.success("Empresa cadastrada com sucesso! ✅");
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

    } catch (error) {
      console.error(error);
      
      // Tratamento de erro específico para CNPJ duplicado
      if (error.response?.data?.erro?.includes("CNPJ já está cadastrado")) {
        toast.error("CNPJ já cadastrado no sistema ❌");
      } else {
        toast.error("Erro ao salvar empresa ❌");
      }
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
      // ✅ CORRIGIDO: /empresas → /companies
      await api.delete(`/companies/${id}`);
      
      // Recarrega a lista
      await carregarEmpresas();
      
      // 🔥 NOVO: Limpa o cache do seletor
      localStorage.removeItem('ultimaBuscaClientes');
      
      // Dispara evento para atualizar o seletor do menu
      window.dispatchEvent(new CustomEvent('empresasAtualizadas'));
      
      toast.success("Empresa excluída ✅");
    } catch (error) {
      console.error(error);
      
      // Tratamento de erro se a empresa tiver vínculos
      if (error.response?.status === 409) {
        toast.error("Empresa possui linhas vinculadas. Remova os vínculos primeiro ❌");
      } else {
        toast.error("Erro ao excluir empresa ❌");
      }
    }
  }

  const empresasFiltradas = empresas.filter((e) =>
    e.nome?.toLowerCase().includes(filtroNome.toLowerCase())
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

      {/* FORMULÁRIO */}
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

      {/* TABELA */}
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
                  <td style={td}>{e.nome || e.name || "-"}</td>
                  <td style={td}>{formatarCNPJ(e.cnpj)}</td>
                  <td style={td}>{e.segmento || e.segment || "-"}</td>
                  <td style={td}>{e.regime_tributario || e.tax_regime || "-"}</td>
                  <td style={td}>{e.turnos || e.shifts || "0"}</td>
                  <td style={td}>{e.dias_produtivos_mes || e.working_days_per_month || "0"}</td>
                  <td style={td}>{formatarMoeda(e.meta_mensal || e.monthly_target)}</td>
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
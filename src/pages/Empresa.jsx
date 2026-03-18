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

// Componente de campo com olho - FORA do componente principal
const CampoComOlho = ({ empresaId, valor, campo, visivel, onToggle }) => {
  const chave = `${empresaId}-${campo}`;
  const estaVisivel = visivel[chave] || false;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
      <span>
        {estaVisivel ? valor : '••••••••'}
      </span>
      <button
        onClick={() => onToggle(empresaId, campo)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '2px',
          opacity: estaVisivel ? 1 : 0.5
        }}
        title={estaVisivel ? 'Ocultar' : 'Mostrar'}
      >
        {estaVisivel ? '👁️' : '👁️‍🗨️'}
      </button>
    </div>
  );
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
  
  // Estado para controlar quais campos estão visíveis (por empresa)
  const [camposVisiveis, setCamposVisiveis] = useState({});

  const toggleVisivel = (empresaId, campo) => {
    const chave = `${empresaId}-${campo}`;
    setCamposVisiveis(prev => {
      // Cria um novo objeto para forçar re-render
      const novo = { ...prev };
      // Inverte o valor atual
      novo[chave] = !prev[chave];
      return novo;
    });
  };

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
        
        // Limpa o cache do seletor
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
        
        // Limpa o cache do seletor
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
      
      // Limpa o cache do seletor
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
      padding: "clamp(15px, 3vw, 30px)", 
      width: "100%", 
      maxWidth: "1400px", 
      margin: "0 auto",
      fontFamily: "Arial, sans-serif",
      minHeight: "100%"
    }}>
      
      {/* Área do Título com o design padrão do sistema */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)", 
        padding: "25px 30px",
        marginBottom: "30px"
      }}>
        <div>
          <h1 style={{ color: "#1E3A8A", marginBottom: "5px", fontSize: "clamp(20px, 4vw, 28px)" }}>
            Empresas
          </h1>
          <p style={{ color: "#666", fontSize: "14px" }}>
            Cadastre e gerencie todas as empresas (clientes)
          </p>
        </div>

        {/* Informação do cliente selecionado em destaque (se houver) */}
        {clienteAtual && (
          <div style={{ 
            marginTop: "15px", 
            paddingTop: "15px", 
            borderTop: "1px solid #e5e7eb",
            fontSize: "14px",
            color: "#666"
          }}>
            Cliente ativo: <strong style={{ color: "#1E3A8A" }}>{clienteAtual}</strong>
          </div>
        )}
      </div>

      {/* FORMULÁRIO */}
      <div style={{ display: "flex", justifyContent: "center", width: "100%", marginBottom: "30px" }}>
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
            backgroundColor: "white"
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
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)", 
        padding: "20px",
        marginBottom: "20px",
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <h2 style={{ color: "#1E3A8A", fontSize: "18px", margin: 0 }}>Empresas Cadastradas</h2>
        <input
          placeholder="Filtrar por nome..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          style={{ 
            padding: "8px 12px", 
            borderRadius: "4px", 
            border: "1px solid #d1d5db",
            fontSize: "14px",
            width: "250px",
            maxWidth: "100%"
          }}
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
                <tr key={e.id} style={{ borderBottom: "1px solid #e5e7eb", hover: { backgroundColor: "#f9fafb" } }}>
                  <td style={td}>{e.nome || e.name || "-"}</td>
                  <td style={td}>
                    <CampoComOlho 
                      empresaId={e.id}
                      valor={formatarCNPJ(e.cnpj)} 
                      campo="cnpj"
                      visivel={camposVisiveis}
                      onToggle={toggleVisivel}
                    />
                  </td>
                  <td style={td}>{e.segmento || e.segment || "-"}</td>
                  <td style={td}>
                    <CampoComOlho 
                      empresaId={e.id}
                      valor={e.regime_tributario || e.tax_regime || "-"} 
                      campo="regime"
                      visivel={camposVisiveis}
                      onToggle={toggleVisivel}
                    />
                  </td>
                  <td style={td}>
                    <CampoComOlho 
                      empresaId={e.id}
                      valor={e.turnos || e.shifts || "0"} 
                      campo="turnos"
                      visivel={camposVisiveis}
                      onToggle={toggleVisivel}
                    />
                  </td>
                  <td style={td}>
                    <CampoComOlho 
                      empresaId={e.id}
                      valor={e.dias_produtivos_mes || e.working_days_per_month || "0"} 
                      campo="dias"
                      visivel={camposVisiveis}
                      onToggle={toggleVisivel}
                    />
                  </td>
                  <td style={td}>
                    <CampoComOlho 
                      empresaId={e.id}
                      valor={formatarMoeda(e.meta_mensal || e.monthly_target)} 
                      campo="meta_mensal"
                      visivel={camposVisiveis}
                      onToggle={toggleVisivel}
                    />
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                      <button
                        onClick={() => handleEdit(e)}
                        style={{
                          padding: "4px 12px",
                          backgroundColor: "#dbeafe",
                          color: "#1e40af",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "500",
                          cursor: "pointer"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#bfdbfe"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#dbeafe"}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        style={{
                          padding: "4px 12px",
                          backgroundColor: "#fee2e2",
                          color: "#b91c1c",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "500",
                          cursor: "pointer"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fecaca"}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
                      >
                        Excluir
                      </button>
                    </div>
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
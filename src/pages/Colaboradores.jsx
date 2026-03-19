// src/pages/Colaboradores.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Função auxiliar para truncar texto (mantida para outros lugares, mas não usada na tabela)
const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function Colaboradores() {
  const { clienteAtual } = useOutletContext();

  const [colaboradores, setColaboradores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    empresa_id: clienteAtual || "",
    cargo_id: ""
  });
  const [editId, setEditId] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState(clienteAtual || "");

  // Carregar empresas na inicialização
  useEffect(() => {
    carregarEmpresas();
  }, []);

  // Carregar cargos quando empresa selecionada mudar
  useEffect(() => {
    if (filtroEmpresa) {
      carregarCargos(filtroEmpresa);
      carregarColaboradores();
    }
  }, [filtroEmpresa]);

  // Carregar empresas
  async function carregarEmpresas() {
    try {
      const res = await api.get("/companies");
      setEmpresas(res.data);
      
      if (clienteAtual) {
        setFiltroEmpresa(clienteAtual);
        await carregarCargos(clienteAtual);
        await carregarColaboradores();
      }
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      toast.error("Erro ao carregar empresas");
    }
  }

  async function carregarCargos(empresaId) {
    if (!empresaId) return;
    
    try {
      const res = await api.get(`/roles/${empresaId}`);
      setCargos(res.data);
    } catch (error) {
      console.error("Erro ao carregar cargos:", error);
      toast.error("Erro ao carregar cargos");
    }
  }

  async function carregarColaboradores() {
    if (!filtroEmpresa) return;
    
    try {
      const res = await api.get(`/employees/${filtroEmpresa}`);
      setColaboradores(res.data);
    } catch (error) {
      console.error("Erro ao carregar colaboradores:", error);
      toast.error("Erro ao carregar colaboradores");
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
    
    if (!form.nome) {
      toast.error("Nome do colaborador é obrigatório");
      return;
    }

    if (!form.empresa_id) {
      toast.error("Selecione uma empresa");
      return;
    }

    setCarregando(true);
    try {
      if (editId) {
        await api.put(`/employees/${editId}`, {
          nome: form.nome,
          empresa_id: parseInt(form.empresa_id),
          cargo_id: form.cargo_id ? parseInt(form.cargo_id) : null
        });
        toast.success("Colaborador atualizado com sucesso! ✅");
        setEditId(null);
      } else {
        await api.post("/employees", {
          empresa_id: parseInt(form.empresa_id),
          cargo_id: form.cargo_id ? parseInt(form.cargo_id) : null,
          nome: form.nome
        });
        toast.success("Colaborador cadastrado com sucesso! ✅");
      }

      setForm({ 
        nome: "", 
        empresa_id: clienteAtual || "",
        cargo_id: ""
      });
      
      await carregarColaboradores();

    } catch (error) {
      console.error("Erro ao salvar colaborador:", error);
      
      if (error.response?.status === 400) {
        toast.error("Dados inválidos. Verifique empresa e cargo ❌");
      } else {
        toast.error("Erro ao salvar colaborador ❌");
      }
    } finally {
      setCarregando(false);
    }
  };

  function handleEdit(colaborador) {
    setForm({
      nome: colaborador.nome,
      empresa_id: colaborador.empresa_id,
      cargo_id: colaborador.cargo_id || ""
    });
    setEditId(colaborador.id);
    
    if (colaborador.empresa_id) {
      carregarCargos(colaborador.empresa_id);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Deseja realmente excluir este colaborador?")) return;
    
    setCarregando(true);
    try {
      await api.delete(`/employees/${id}`);
      await carregarColaboradores();
      toast.success("Colaborador excluído com sucesso ✅");
    } catch (error) {
      console.error("Erro ao excluir colaborador:", error);
      
      if (error.response?.status === 400) {
        toast.error("Colaborador possui registros de atividades vinculados ❌");
      } else {
        toast.error("Erro ao excluir colaborador ❌");
      }
    } finally {
      setCarregando(false);
    }
  }

  const getEmpresaNome = (empresaId) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa ? empresa.nome : "-";
  };

  const getCargoNome = (cargoId) => {
    const cargo = cargos.find(c => c.id === cargoId);
    return cargo ? cargo.nome : "-";
  };

  const colaboradoresFiltrados = colaboradores.filter(c => {
    const matchNome = c.nome?.toLowerCase().includes(filtroNome.toLowerCase());
    return matchNome;
  });

  // Se não houver empresa selecionada
  if (!filtroEmpresa) {
    return (
      <div style={{ 
        padding: "clamp(20px, 5vw, 60px)", 
        textAlign: "center",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        margin: "clamp(10px, 3vw, 30px)"
      }}>
        <h2 style={{ color: "#1E3A8A", marginBottom: "clamp(10px, 2vw, 20px)" }}>
          Selecione uma empresa
        </h2>
        <p style={{ color: "#666", marginBottom: "clamp(15px, 3vw, 30px)" }}>
          Escolha uma empresa no filtro acima para gerenciar os colaboradores.
        </p>
        <select
          value={filtroEmpresa}
          onChange={(e) => setFiltroEmpresa(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #d1d5db",
            width: "min(100%, 300px)",
            fontSize: "14px"
          }}
        >
          <option value="">Selecione uma empresa...</option>
          {empresas.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.nome}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "clamp(15px, 3vw, 30px)", 
      width: "100%",
      maxWidth: "1400px",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      
      {/* Cabeçalho */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 25px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)"
      }}>
        <h1 style={{ 
          color: "#1E3A8A", 
          marginBottom: "clamp(5px, 1vw, 10px)", 
          fontSize: "clamp(20px, 4vw, 28px)" 
        }}>
          Colaboradores
        </h1>
        <p style={{ 
          color: "#666", 
          fontSize: "clamp(12px, 2vw, 14px)",
          wordBreak: "break-word"
        }}>
          Cadastre os colaboradores e vincule a cargos para cálculo de custo de mão de obra
        </p>
      </div>

      {/* Formulário */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 25px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)",
        maxWidth: "600px",
        margin: "0 auto clamp(20px, 3vw, 30px) auto",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <h2 style={{ 
          color: "#1E3A8A", 
          marginBottom: "clamp(15px, 2vw, 20px)", 
          fontSize: "clamp(16px, 2.5vw, 18px)" 
        }}>
          {editId ? "Editar Colaborador" : "Novo Colaborador"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label style={labelStyleResponsivo}>Nome do Colaborador *</label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              style={inputStyleResponsivo}
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={labelStyleResponsivo}>Empresa *</label>
            <select
              name="empresa_id"
              value={form.empresa_id}
              onChange={(e) => {
                handleChange(e);
                if (e.target.value) {
                  carregarCargos(e.target.value);
                }
              }}
              style={inputStyleResponsivo}
              required
              disabled={!!clienteAtual}
            >
              <option value="">Selecione uma empresa...</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nome}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyleResponsivo}>Cargo</label>
            <select
              name="cargo_id"
              value={form.cargo_id}
              onChange={handleChange}
              style={inputStyleResponsivo}
              disabled={!form.empresa_id}
            >
              <option value="">Selecione um cargo...</option>
              {cargos.map(cargo => (
                <option key={cargo.id} value={cargo.id}>{cargo.nome}</option>
              ))}
            </select>
            <small style={{ 
              color: "#666", 
              display: "block", 
              marginTop: "4px",
              fontSize: "clamp(11px, 1.5vw, 12px)"
            }}>
              O cargo determina o custo da mão de obra
            </small>
          </div>

          <div style={{ 
            display: "flex", 
            gap: "clamp(8px, 1.5vw, 10px)",
            flexWrap: "wrap"
          }}>
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
                fullWidth={true}
                onClick={() => {
                  setEditId(null);
                  setForm({ 
                    nome: "", 
                    empresa_id: clienteAtual || "",
                    cargo_id: "" 
                  });
                }}
              >
                Cancelar
              </Botao>
            )}
          </div>
        </form>
      </div>

      {/* Filtros */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "clamp(15px, 2vw, 20px)",
        gap: "clamp(15px, 2vw, 20px)",
        flexWrap: "wrap"
      }}>
        <h2 style={{ 
          color: "#1E3A8A", 
          fontSize: "clamp(16px, 2.5vw, 18px)" 
        }}>
          Lista de Colaboradores
        </h2>
        
        <div style={{ 
          display: "flex", 
          gap: "clamp(8px, 1.5vw, 10px)", 
          flex: "1 1 auto", 
          maxWidth: "500px",
          width: "100%",
          flexWrap: "wrap"
        }}>
          <input
            type="text"
            placeholder="Filtrar por nome..."
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
            style={{
              ...inputStyleResponsivo,
              flex: "2 1 200px",
              minWidth: "150px"
            }}
          />
          
          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            style={{
              ...inputStyleResponsivo,
              flex: "1 1 150px",
              minWidth: "120px"
            }}
          >
            {empresas.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.nome}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de colaboradores - CORRIGIDA (SEM TRUNCAR) */}
      {carregando && colaboradores.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "clamp(20px, 4vw, 40px)",
          fontSize: "clamp(14px, 2vw, 16px)",
          color: "#666"
        }}>
          Carregando colaboradores...
        </div>
      ) : (
        <div style={{ 
          overflowX: "auto",
          width: "100%",
          WebkitOverflowScrolling: "touch"
        }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse", 
            backgroundColor: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            borderRadius: "8px",
            minWidth: "500px",
            tableLayout: "fixed"
          }}>
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                <th style={thResponsivo}>ID</th>
                <th style={thResponsivo}>Nome</th>
                <th style={thResponsivo}>Empresa</th>
                <th style={thResponsivo}>Cargo</th>
                <th style={thResponsivo}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {colaboradoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ 
                    textAlign: "center", 
                    padding: "clamp(20px, 3vw, 30px)", 
                    color: "#666",
                    fontSize: "clamp(13px, 1.8vw, 14px)"
                  }}>
                    Nenhum colaborador cadastrado
                  </td>
                </tr>
              ) : (
                colaboradoresFiltrados.map((colaborador) => (
                  <tr key={colaborador.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={tdResponsivo}>{colaborador.id}</td>
                    <td style={tdResponsivo} title={colaborador.nome}>
                      {colaborador.nome}  {/* ✅ NOME COMPLETO */}
                    </td>
                    <td style={tdResponsivo} title={getEmpresaNome(colaborador.empresa_id)}>
                      {getEmpresaNome(colaborador.empresa_id)}  {/* ✅ EMPRESA COMPLETA */}
                    </td>
                    <td style={tdResponsivo} title={getCargoNome(colaborador.cargo_id)}>
                      {getCargoNome(colaborador.cargo_id)}  {/* ✅ CARGO COMPLETO */}
                    </td>
                    <td style={tdResponsivo}>
                      <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                        <button
                          onClick={() => handleEdit(colaborador)}
                          style={{
                            padding: "4px 12px",
                            backgroundColor: "#dbeafe",
                            color: "#1e40af",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "background-color 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#bfdbfe"}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#dbeafe"}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(colaborador.id)}
                          style={{
                            padding: "4px 12px",
                            backgroundColor: "#fee2e2",
                            color: "#b91c1c",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "background-color 0.2s"
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
      )}
    </div>
  );
}

// Estilos responsivos
const labelStyleResponsivo = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "clamp(12px, 1.8vw, 14px)",
  fontWeight: "500"
};

const inputStyleResponsivo = {
  width: "100%",
  padding: "clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 12px)",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  fontSize: "clamp(13px, 1.8vw, 14px)",
  outline: "none",
  boxSizing: "border-box"
};

const thResponsivo = {
  padding: "clamp(8px, 1vw, 12px) clamp(4px, 0.8vw, 8px)",
  border: "1px solid #e5e7eb",
  textAlign: "center",
  fontSize: "clamp(11px, 1.5vw, 13px)",
  fontWeight: "500",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};

const tdResponsivo = {
  padding: "clamp(6px, 0.8vw, 10px) clamp(4px, 0.6vw, 8px)",
  border: "1px solid #e5e7eb",
  textAlign: "center",
  fontSize: "clamp(11px, 1.5vw, 13px)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};
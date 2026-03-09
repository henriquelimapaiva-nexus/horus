// src/pages/Cargos.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Função auxiliar para truncar texto
const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function Cargos() {
  const { clienteAtual } = useOutletContext();

  const [cargos, setCargos] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    salario_base: "",
    encargos_percentual: "70"
  });
  const [editId, setEditId] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [filtroNome, setFiltroNome] = useState("");
  const [departamentoId, setDepartamentoId] = useState("1");

  useEffect(() => {
    carregarCargos();
  }, []);

  async function carregarCargos() {
    setCarregando(true);
    try {
      const res = await api.get(`/cargos/${departamentoId}`);
      setCargos(res.data);
    } catch (error) {
      console.error("Erro ao carregar cargos:", error);
      toast.error("Erro ao carregar cargos");
    } finally {
      setCarregando(false);
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
      toast.error("Nome do cargo é obrigatório");
      return;
    }

    if (!form.salario_base || parseFloat(form.salario_base) <= 0) {
      toast.error("Salário base deve ser maior que zero");
      return;
    }

    setCarregando(true);
    try {
      if (editId) {
        await api.put(`/cargos/${editId}`, {
          nome: form.nome,
          salario_base: parseFloat(form.salario_base),
          encargos_percentual: parseFloat(form.encargos_percentual)
        });
        toast.success("Cargo atualizado com sucesso! ✅");
        setEditId(null);
      } else {
        await api.post("/cargos", {
          departamento_id: parseInt(departamentoId),
          nome: form.nome,
          salario_base: parseFloat(form.salario_base),
          encargos_percentual: parseFloat(form.encargos_percentual)
        });
        toast.success("Cargo cadastrado com sucesso! ✅");
      }

      setForm({ 
        nome: "", 
        salario_base: "", 
        encargos_percentual: "70" 
      });
      carregarCargos();

    } catch (error) {
      console.error("Erro ao salvar cargo:", error);
      toast.error("Erro ao salvar cargo ❌");
    } finally {
      setCarregando(false);
    }
  };

  function handleEdit(cargo) {
    setForm({
      nome: cargo.nome,
      salario_base: cargo.salario_base,
      encargos_percentual: cargo.encargos_percentual || "70"
    });
    setEditId(cargo.id);
  }

  async function handleDelete(id) {
    if (!window.confirm("Deseja realmente excluir este cargo?")) return;
    
    setCarregando(true);
    try {
      await api.delete(`/cargos/${id}`);
      carregarCargos();
      toast.success("Cargo excluído com sucesso ✅");
    } catch (error) {
      console.error("Erro ao excluir cargo:", error);
      toast.error("Erro ao excluir cargo ❌");
    } finally {
      setCarregando(false);
    }
  }

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const calcularCustoTotal = (salario, encargos) => {
    const salarioNum = parseFloat(salario) || 0;
    const encargosNum = parseFloat(encargos) || 70;
    return salarioNum * (1 + encargosNum / 100);
  };

  const cargosFiltrados = cargos.filter(c =>
    c.nome.toLowerCase().includes(filtroNome.toLowerCase())
  );

  return (
    <div style={{ 
      padding: "clamp(15px, 3vw, 30px)", 
      width: "100%",
      maxWidth: "1400px",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      
      {/* Cabeçalho responsivo */}
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
          Cargos
        </h1>
        <p style={{ 
          color: "#666", 
          fontSize: "clamp(12px, 2vw, 14px)",
          wordBreak: "break-word"
        }}>
          Cadastre os cargos e salários para cálculo de custo de mão de obra
          {clienteAtual && ` - Cliente ativo: ${clienteAtual}`}
        </p>
      </div>

      {/* Formulário responsivo */}
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
          {editId ? "Editar Cargo" : "Novo Cargo"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label style={labelStyleResponsivo}>Nome do Cargo *</label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              style={inputStyleResponsivo}
              placeholder="Ex: Operador de Máquina"
              required
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={labelStyleResponsivo}>Salário Base (R$) *</label>
            <input
              type="number"
              name="salario_base"
              value={form.salario_base}
              onChange={handleChange}
              step="0.01"
              min="0"
              style={inputStyleResponsivo}
              placeholder="2500,00"
              required
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyleResponsivo}>Encargos (%)</label>
            <input
              type="number"
              name="encargos_percentual"
              value={form.encargos_percentual}
              onChange={handleChange}
              step="1"
              min="0"
              max="100"
              style={inputStyleResponsivo}
              placeholder="70"
            />
            <small style={{ 
              color: "#666", 
              display: "block", 
              marginTop: "4px",
              fontSize: "clamp(11px, 1.5vw, 12px)"
            }}>
              Percentual de encargos trabalhistas (padrão: 70%)
            </small>
          </div>

          {form.salario_base && (
            <div style={{ 
              backgroundColor: "#f9fafb", 
              padding: "clamp(8px, 1.5vw, 10px)", 
              borderRadius: "4px",
              marginBottom: "20px",
              textAlign: "center"
            }}>
              <span style={{ 
                color: "#666", 
                fontSize: "clamp(12px, 1.8vw, 14px)" 
              }}>
                Custo total mensal: 
              </span>
              <span style={{ 
                fontWeight: "bold", 
                color: "#16a34a",
                fontSize: "clamp(16px, 2.5vw, 18px)"
              }}>
                {formatarMoeda(calcularCustoTotal(form.salario_base, form.encargos_percentual))}
              </span>
            </div>
          )}

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
                  setForm({ nome: "", salario_base: "", encargos_percentual: "70" });
                }}
              >
                Cancelar
              </Botao>
            )}
          </div>
        </form>
      </div>

      {/* Filtro responsivo */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "clamp(15px, 2vw, 20px)",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <h2 style={{ 
          color: "#1E3A8A", 
          fontSize: "clamp(16px, 2.5vw, 18px)" 
        }}>
          Lista de Cargos
        </h2>
        <input
          type="text"
          placeholder="Filtrar por nome..."
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          style={{
            padding: "clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 12px)",
            borderRadius: "4px",
            border: "1px solid #d1d5db",
            width: "min(100%, 250px)",
            fontSize: "clamp(13px, 1.8vw, 14px)"
          }}
        />
      </div>

      {/* Tabela de cargos responsiva */}
      {carregando && cargos.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "clamp(20px, 4vw, 40px)",
          fontSize: "clamp(14px, 2vw, 16px)",
          color: "#666"
        }}>
          Carregando cargos...
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
            minWidth: "600px",
            tableLayout: "fixed"
          }}>
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "10%" }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                <th style={thResponsivo}>ID</th>
                <th style={thResponsivo}>Nome</th>
                <th style={thResponsivo}>Salário Base</th>
                <th style={thResponsivo}>Encargos</th>
                <th style={thResponsivo}>Custo Total</th>
                <th style={thResponsivo}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cargosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ 
                    textAlign: "center", 
                    padding: "clamp(20px, 3vw, 30px)", 
                    color: "#666",
                    fontSize: "clamp(13px, 1.8vw, 14px)"
                  }}>
                    Nenhum cargo cadastrado
                  </td>
                </tr>
              ) : (
                cargosFiltrados.map((cargo) => {
                  const custoTotal = calcularCustoTotal(cargo.salario_base, cargo.encargos_percentual);
                  
                  return (
                    <tr key={cargo.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={tdResponsivo}>{cargo.id}</td>
                      <td style={tdResponsivo} title={cargo.nome}>{truncarTexto(cargo.nome, 15)}</td>
                      <td style={tdResponsivo} title={formatarMoeda(cargo.salario_base)}>
                        {truncarTexto(formatarMoeda(cargo.salario_base), 10)}
                      </td>
                      <td style={tdResponsivo}>{cargo.encargos_percentual || 70}%</td>
                      <td style={tdResponsivo}>
                        <span style={{ 
                          fontWeight: "bold",
                          color: "#16a34a"
                        }} title={formatarMoeda(custoTotal)}>
                          {truncarTexto(formatarMoeda(custoTotal), 10)}
                        </span>
                      </td>
                      <td style={tdResponsivo}>
                        <Botao
                          variant="primary"
                          size="sm"
                          onClick={() => handleEdit(cargo)}
                          style={{ marginRight: "5px" }}
                        >
                          Editar
                        </Botao>
                        <Botao
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(cargo.id)}
                        >
                          Excluir
                        </Botao>
                      </td>
                    </tr>
                  );
                })
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
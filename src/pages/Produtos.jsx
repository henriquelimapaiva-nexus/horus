// src/pages/Produtos.jsx
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

export default function Produtos() {
  const { clienteAtual } = useOutletContext();

  const [produtos, setProdutos] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    valor_unitario: ""
  });
  const [editId, setEditId] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [filtroNome, setFiltroNome] = useState("");

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    setCarregando(true);
    try {
      const res = await api.get("/produtos");
      setProdutos(res.data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos");
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
      toast.error("Nome do produto é obrigatório");
      return;
    }

    setCarregando(true);
    try {
      if (editId) {
        await api.put(`/produtos/${editId}`, {
          nome: form.nome,
          valor_unitario: form.valor_unitario ? parseFloat(form.valor_unitario) : 0
        });
        toast.success("Produto atualizado com sucesso! ✅");
        setEditId(null);
      } else {
        await api.post("/produtos", {
          nome: form.nome,
          valor_unitario: form.valor_unitario ? parseFloat(form.valor_unitario) : 0
        });
        toast.success("Produto cadastrado com sucesso! ✅");
      }

      setForm({ nome: "", valor_unitario: "" });
      carregarProdutos();

    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.error("Erro ao salvar produto ❌");
    } finally {
      setCarregando(false);
    }
  };

  function handleEdit(produto) {
    setForm({
      nome: produto.nome,
      valor_unitario: produto.valor_unitario || ""
    });
    setEditId(produto.id);
  }

  async function handleDelete(id) {
    if (!window.confirm("Deseja realmente excluir este produto?")) return;
    
    setCarregando(true);
    try {
      await api.delete(`/produtos/${id}`);
      carregarProdutos();
      toast.success("Produto excluído com sucesso ✅");
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast.error("Erro ao excluir produto ❌");
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

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(filtroNome.toLowerCase())
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
          Produtos
        </h1>
        <p style={{ 
          color: "#666", 
          fontSize: "clamp(12px, 2vw, 14px)" 
        }}>
          Cadastre os produtos fabricados e seus valores unitários
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
          {editId ? "Editar Produto" : "Novo Produto"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "clamp(10px, 1.5vw, 15px)" }}>
            <label style={labelStyleResponsivo}>Nome do Produto *</label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              style={inputStyleResponsivo}
              placeholder="Ex: Produto A"
              required
            />
          </div>

          <div style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}>
            <label style={labelStyleResponsivo}>Valor Unitário (R$)</label>
            <input
              type="number"
              name="valor_unitario"
              value={form.valor_unitario}
              onChange={handleChange}
              step="0.01"
              min="0"
              style={inputStyleResponsivo}
              placeholder="0,00"
            />
            <small style={{ 
              color: "#666", 
              display: "block", 
              marginTop: "4px",
              fontSize: "clamp(11px, 1.5vw, 12px)"
            }}>
              Valor de venda de cada peça (para cálculos financeiros)
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
                  setForm({ nome: "", valor_unitario: "" });
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
          Lista de Produtos
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

      {/* Tabela de produtos responsiva */}
      {carregando && produtos.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "clamp(20px, 4vw, 40px)",
          fontSize: "clamp(14px, 2vw, 16px)",
          color: "#666"
        }}>
          Carregando produtos...
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
              <col style={{ width: "15%" }} />
              <col style={{ width: "35%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                <th style={thResponsivo}>ID</th>
                <th style={thResponsivo}>Nome</th>
                <th style={thResponsivo}>Valor Unitário</th>
                <th style={thResponsivo}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ 
                    textAlign: "center", 
                    padding: "clamp(20px, 3vw, 30px)", 
                    color: "#666",
                    fontSize: "clamp(13px, 1.8vw, 14px)"
                  }}>
                    Nenhum produto cadastrado
                  </td>
                </tr>
              ) : (
                produtosFiltrados.map((produto) => (
                  <tr key={produto.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={tdResponsivo}>{produto.id}</td>
                    <td style={tdResponsivo} title={produto.nome}>{truncarTexto(produto.nome, 20)}</td>
                    <td style={tdResponsivo} title={formatarMoeda(produto.valor_unitario)}>
                      <span style={{ 
                        fontWeight: "bold",
                        color: "#16a34a"
                      }}>
                        {truncarTexto(formatarMoeda(produto.valor_unitario), 12)}
                      </span>
                    </td>
                    <td style={tdResponsivo}>
                      <Botao
                        variant="primary"
                        size="sm"
                        onClick={() => handleEdit(produto)}
                        style={{ marginRight: "5px" }}
                      >
                        Editar
                      </Botao>
                      <Botao
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(produto.id)}
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
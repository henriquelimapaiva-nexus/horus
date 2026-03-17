// src/pages/Produtos.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

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
  
  // ✅ ESTADO PARA CONTROLAR A VISIBILIDADE DA LISTA
  const [mostrarLista, setMostrarLista] = useState(false);

  // ========================================
  // ✅ CARREGAMENTO INICIAL E MONITORAMENTO
  // ========================================
  useEffect(() => {
    if (clienteAtual && clienteAtual !== "" && clienteAtual !== "Selecione...") {
      carregarProdutosDaEmpresa();
    } else {
      setProdutos([]);
      setMostrarLista(false); 
    }
  }, [clienteAtual]);

  async function carregarProdutosDaEmpresa() {
    setCarregando(true);
    try {
      // ✅ CORRIGIDO: /produtos/filtro/empresa/${clienteAtual} → /products/company/${clienteAtual}
      const res = await api.get(`/products/company/${clienteAtual}`);
      setProdutos(res.data);
      
      if (res.data.length === 0) {
        toast("Nenhum produto cadastrado para esta empresa", {
          icon: 'ℹ️',
          duration: 3000
        }); 
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast.error("Erro ao carregar produtos");
      setProdutos([]);
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
        // ✅ CORRIGIDO: /produtos/${editId} → /products/${editId}
        await api.put(`/products/${editId}`, {
          nome: form.nome,
          valor_unitario: form.valor_unitario ? parseFloat(form.valor_unitario) : 0
        });
        toast.success("Produto atualizado com sucesso! ✅");
        setEditId(null);
      } else {
        // ✅ CORRIGIDO: /produtos → /products
        await api.post("/products", {
          nome: form.nome,
          valor_unitario: form.valor_unitario ? parseFloat(form.valor_unitario) : 0,
          empresa_id: parseInt(clienteAtual)
        });
        toast.success("Produto cadastrado com sucesso! ✅");
      }

      setForm({ nome: "", valor_unitario: "" });
      await carregarProdutosDaEmpresa();
      setMostrarLista(true); 

    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      
      // Tratamento de erro específico
      if (error.response?.status === 400) {
        toast.error("Dados inválidos. Verifique o nome e valor ❌");
      } else {
        toast.error("Erro ao salvar produto ❌");
      }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!window.confirm("Deseja realmente excluir este produto?")) return;
    
    setCarregando(true);
    try {
      // ✅ CORRIGIDO: /produtos/${id} → /products/${id}
      await api.delete(`/products/${id}`);
      await carregarProdutosDaEmpresa(); 
      toast.success("Produto excluído com sucesso ✅");
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      
      // Tratamento de erro se o produto estiver vinculado a uma linha
      if (error.response?.status === 400 && error.response?.data?.erro?.includes("vinculado")) {
        toast.error("Produto está vinculado a uma linha de produção. Remova o vínculo primeiro ❌");
      } else {
        toast.error("Erro ao excluir produto ❌");
      }
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
    p.nome?.toLowerCase().includes(filtroNome.toLowerCase())
  );

  return (
    <div style={{ 
      padding: "clamp(15px, 3vw, 30px)", 
      width: "100%",
      maxWidth: "1400px",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      
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
        <p style={{ color: "#666", fontSize: "clamp(12px, 2vw, 14px)" }}>
          Cadastre os produtos fabricados e seus valores unitários
        </p>
        {!clienteAtual || clienteAtual === "Selecione..." ? (
          <p style={{ color: "#dc2626", fontSize: "14px", marginTop: "10px", fontWeight: "bold" }}>
            ⚠️ Selecione uma empresa no menu superior para operar.
          </p>
        ) : null}
      </div>

      {clienteAtual && clienteAtual !== "" && clienteAtual !== "Selecione..." ? (
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
          <h2 style={{ color: "#1E3A8A", marginBottom: "20px" }}>
            {editId ? "Editar Produto" : "Novo Produto"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
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

            <div style={{ marginBottom: "20px" }}>
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
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Botao
                type="submit"
                variant="primary"
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
      ) : null}

      {clienteAtual && clienteAtual !== "" && clienteAtual !== "Selecione..." && (
        <>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "15px"
          }}>
            <h2 style={{ color: "#1E3A8A" }}>
              Lista de Produtos ({produtos.length})
            </h2>
            
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Filtrar..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                style={inputStyleResponsivo}
              />
              
              <Botao
                variant={mostrarLista ? "danger" : "secondary"}
                onClick={() => setMostrarLista(!mostrarLista)}
              >
                {mostrarLista ? "Esconder" : "Mostrar"}
              </Botao>
            </div>
          </div>

          {mostrarLista && (
            <div style={{ overflowX: "auto", width: "100%", backgroundColor: "white", borderRadius: "8px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                    <th style={thResponsivo}>ID</th>
                    <th style={{...thResponsivo, textAlign: "left"}}>Nome</th>
                    <th style={thResponsivo}>Valor</th>
                    <th style={thResponsivo}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ 
                        textAlign: "center", 
                        padding: "30px", 
                        color: "#666" 
                      }}>
                        Nenhum produto encontrado
                      </td>
                    </tr>
                  ) : (
                    produtosFiltrados.map((produto) => (
                      <tr key={produto.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={tdResponsivo}>{produto.id}</td>
                        <td style={{...tdResponsivo, textAlign: "left", whiteSpace: "normal", wordWrap: "break-word", maxWidth: "400px"}}>
                          {produto.nome}
                        </td>
                        <td style={tdResponsivo}>{formatarMoeda(produto.valor_unitario)}</td>
                        <td style={tdResponsivo}>
                          <div style={{display: 'flex', gap: '5px', justifyContent: 'center'}}>
                            <Botao variant="primary" size="sm" onClick={() => handleEdit(produto)}>
                              Editar
                            </Botao>
                            <Botao variant="danger" size="sm" onClick={() => handleDelete(produto.id)}>
                              Excluir
                            </Botao>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const labelStyleResponsivo = { 
  display: "block", 
  marginBottom: "6px", 
  color: "#374151", 
  fontSize: "14px", 
  fontWeight: "500" 
};

const inputStyleResponsivo = { 
  width: "100%",
  padding: "8px", 
  borderRadius: "4px", 
  border: "1px solid #d1d5db", 
  outline: "none", 
  boxSizing: "border-box" 
};

const thResponsivo = { 
  padding: "12px", 
  border: "1px solid #e5e7eb", 
  textAlign: "center" 
};

const tdResponsivo = { 
  padding: "10px", 
  border: "1px solid #e5e7eb", 
  textAlign: "center" 
};
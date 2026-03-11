// src/pages/LinhaForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Função auxiliar para truncar texto
const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function LinhaForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { clienteAtual } = useOutletContext();

  // Estados para o formulário
  const [form, setForm] = useState({
    nome: "",
    empresa_id: clienteAtual || "",
    takt_time_segundos: "",
    meta_diaria: "",
    horas_produtivas_dia: "16"
  });

  // Estados para múltiplos produtos
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [produtoAtual, setProdutoAtual] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  // ========================================
  // ✅ ALTERADO: Carregar produtos da empresa selecionada
  // ========================================
  useEffect(() => {
    if (clienteAtual) {
      carregarProdutosDaEmpresa();
    } else {
      setProdutos([]);
    }
  }, [clienteAtual]);

  async function carregarProdutosDaEmpresa() {
    try {
      // 🔥 Usando a nova rota com o ID da empresa
      const res = await api.get(`/produtos/empresa/${clienteAtual}`);
      setProdutos(res.data);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      toast.error("Erro ao carregar produtos");
    }
  }

  // Carregar dados da linha se for edição
  useEffect(() => {
    if (id) {
      carregarLinha();
    }
  }, [id, clienteAtual]);

  async function carregarLinha() {
    try {
      const res = await api.get(`/linhas/${clienteAtual}`);
      const linha = res.data.find(l => l.id === parseInt(id));
      if (linha) {
        setForm({
          nome: linha.nome || "",
          empresa_id: linha.empresa_id || clienteAtual,
          takt_time_segundos: linha.takt_time_segundos || "",
          meta_diaria: linha.meta_diaria || "",
          horas_produtivas_dia: linha.horas_produtivas_dia || "16"
        });

        // Carregar produtos vinculados a esta linha
        try {
          const produtosRes = await api.get(`/linha-produto/${id}`);
          const produtosVinculados = produtosRes.data.map(p => p.produto_id);
          setProdutosSelecionados(produtosVinculados);
        } catch (error) {
          console.error("Erro ao carregar produtos da linha:", error);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar linha:", error);
      toast.error("Erro ao carregar dados da linha");
    }
  }

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Função para adicionar produto à lista
  const adicionarProduto = () => {
    if (!produtoAtual) {
      toast.error("Selecione um produto");
      return;
    }
    
    // Verificar se já foi adicionado
    if (produtosSelecionados.includes(parseInt(produtoAtual))) {
      toast.error("Este produto já foi adicionado");
      return;
    }
    
    setProdutosSelecionados([...produtosSelecionados, parseInt(produtoAtual)]);
    setProdutoAtual(""); // limpa a seleção
  };

  // Função para remover produto da lista
  const removerProduto = (produtoId) => {
    setProdutosSelecionados(produtosSelecionados.filter(id => id !== produtoId));
  };

  // Função para obter nome do produto pelo ID
  const getNomeProduto = (id) => {
    const produto = produtos.find(p => p.id === id);
    return produto ? produto.nome : "Produto não encontrado";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação: pelo menos um produto selecionado
    if (produtosSelecionados.length === 0) {
      toast.error("Selecione pelo menos um produto para a linha");
      return;
    }

    setCarregando(true);
    
    try {
      if (id) {
        // EDIÇÃO - usar rota existente (vamos manter simples por enquanto)
        toast.error("Edição com múltiplos produtos será implementada depois");
        // await api.put(`/linhas/${id}`, form);
        // TODO: implementar edição com múltiplos produtos
      } else {
        // CRIAÇÃO - usar a nova rota que criamos no backend
        await api.post("/linhas-com-multiplos-produtos", {
          empresa_id: clienteAtual,
          nome: form.nome,
          takt_time_segundos: form.takt_time_segundos,
          meta_diaria: form.meta_diaria,
          produtos_ids: produtosSelecionados
        });
        toast.success("Linha cadastrada com sucesso! ✅");
      }

      if (!id) {
        // Limpar formulário
        setForm({
          nome: "",
          empresa_id: clienteAtual,
          takt_time_segundos: "",
          meta_diaria: "",
          horas_produtivas_dia: "16"
        });
        setProdutosSelecionados([]);
        setProdutoAtual("");
      }

      setTimeout(() => {
        navigate(`/linhas`);
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar linha ❌");
    } finally {
      setCarregando(false);
    }
  };

  if (!clienteAtual) {
    return (
      <div style={{ 
        padding: "clamp(20px, 5vw, 40px)", 
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto"
      }}>
        <h2 style={{ color: "#dc2626", fontSize: "clamp(18px, 4vw, 22px)" }}>
          Nenhum cliente selecionado
        </h2>
        <p style={{ fontSize: "clamp(14px, 2vw, 16px)" }}>
          Selecione um cliente no menu superior para cadastrar linhas.
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "clamp(15px, 3vw, 30px)", 
      width: "100%",
      maxWidth: "800px",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      
      {/* Cabeçalho responsivo */}
      <div style={{ 
        marginBottom: "clamp(20px, 3vw, 30px)",
        textAlign: "center"
      }}>
        <h1 style={{ 
          color: "#1E3A8A", 
          marginBottom: "5px", 
          fontSize: "clamp(20px, 4vw, 28px)" 
        }}>
          {id ? "Editar Linha" : "Nova Linha de Produção"}
        </h1>
        <p style={{ 
          color: "#666", 
          fontSize: "clamp(12px, 2vw, 14px)" 
        }}>
          Cliente: {truncarTexto(clienteAtual, 30)}
        </p>
      </div>

      {/* Formulário responsivo */}
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "white",
          padding: "clamp(20px, 3vw, 30px)",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderTop: "4px solid #1E3A8A",
          width: "100%",
          maxWidth: "600px",
          margin: "0 auto",
          boxSizing: "border-box"
        }}
      >
        <div style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}>
          <label style={labelStyleResponsivo}>Nome da Linha *</label>
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
            style={inputStyleResponsivo}
            placeholder="Ex: Linha de Montagem Final"
          />
        </div>

        {/* ======================================== */}
        {/* SEÇÃO DE MÚLTIPLOS PRODUTOS */}
        {/* ======================================== */}
        <div style={{ marginBottom: "clamp(20px, 3vw, 25px)" }}>
          <label style={labelStyleResponsivo}>Produtos da Linha *</label>
          
          {/* Área de seleção com botão + */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <select
              value={produtoAtual}
              onChange={(e) => setProdutoAtual(e.target.value)}
              style={{
                flex: 1,
                padding: "clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px)",
                borderRadius: "4px",
                border: "1px solid #d1d5db",
                fontSize: "clamp(13px, 1.8vw, 14px)",
                outline: "none"
              }}
            >
              <option value="">Selecione um produto...</option>
              {produtos.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {truncarTexto(prod.nome, 30)}
                </option>
              ))}
            </select>
            
            <Botao
              type="button"
              variant="primary"
              size="md"
              onClick={adicionarProduto}
              style={{ minWidth: "50px" }}
            >
              ➕
            </Botao>
          </div>
          
          {/* Lista de produtos selecionados */}
          {produtosSelecionados.length > 0 && (
            <div style={{ 
              marginTop: "10px",
              maxHeight: "200px",
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              padding: "10px"
            }}>
              <p style={{ 
                marginBottom: "8px", 
                fontWeight: "bold", 
                color: "#1E3A8A",
                fontSize: "clamp(12px, 1.6vw, 13px)"
              }}>
                Produtos nesta linha ({produtosSelecionados.length}):
              </p>
              {produtosSelecionados.map((prodId, index) => (
                <div key={index} style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 10px",
                  marginBottom: "5px",
                  backgroundColor: "#f3f4f6",
                  borderRadius: "4px",
                  border: "1px solid #e5e7eb"
                }}>
                  <span style={{ fontSize: "clamp(12px, 1.6vw, 13px)" }}>
                    {index + 1}. {truncarTexto(getNomeProduto(prodId), 35)}
                  </span>
                  <Botao
                    type="button"
                    variant="danger"
                    size="xs"
                    onClick={() => removerProduto(prodId)}
                  >
                    ✕
                  </Botao>
                </div>
              ))}
            </div>
          )}

          {/* Mensagem se nenhum produto selecionado */}
          {produtosSelecionados.length === 0 && (
            <p style={{ 
              color: "#dc2626", 
              fontSize: "clamp(11px, 1.5vw, 12px)",
              marginTop: "5px",
              fontStyle: "italic"
            }}>
              ⚠️ Selecione pelo menos um produto
            </p>
          )}

          {/* Mensagem se não há produtos cadastrados */}
          {produtos.length === 0 && (
            <p style={{ 
              color: "#f59e0b", 
              fontSize: "clamp(11px, 1.5vw, 12px)",
              marginTop: "5px",
              fontStyle: "italic"
            }}>
              ⚠️ Nenhum produto cadastrado para esta empresa. 
              <button 
                type="button"
                onClick={() => navigate("/produtos")}
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: "#1E3A8A", 
                  textDecoration: "underline",
                  cursor: "pointer",
                  marginLeft: "5px"
                }}
              >
                Cadastre produtos primeiro
              </button>
            </p>
          )}
        </div>

        <div style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}>
          <label style={labelStyleResponsivo}>Takt Time (segundos) *</label>
          <input
            type="number"
            name="takt_time_segundos"
            value={form.takt_time_segundos}
            onChange={handleChange}
            required
            min="0.1"
            step="0.1"
            style={inputStyleResponsivo}
            placeholder="Ex: 45.5"
          />
        </div>

        <div style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}>
          <label style={labelStyleResponsivo}>Meta Diária (peças) *</label>
          <input
            type="number"
            name="meta_diaria"
            value={form.meta_diaria}
            onChange={handleChange}
            required
            min="1"
            style={inputStyleResponsivo}
            placeholder="Ex: 1000"
          />
        </div>

        <div style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}>
          <label style={labelStyleResponsivo}>Horas Produtivas por Dia</label>
          <input
            type="number"
            name="horas_produtivas_dia"
            value={form.horas_produtivas_dia}
            onChange={handleChange}
            min="1"
            max="24"
            step="0.5"
            style={inputStyleResponsivo}
            placeholder="Ex: 16"
          />
          <small style={{ 
            color: "#666", 
            display: "block", 
            marginTop: "4px",
            fontSize: "clamp(11px, 1.5vw, 12px)"
          }}>
            Horas disponíveis para produção (excluindo paradas planejadas)
          </small>
        </div>

        <div style={{ 
          display: "flex", 
          gap: "clamp(8px, 1.5vw, 10px)", 
          marginTop: "clamp(20px, 3vw, 30px)",
          flexWrap: "wrap"
        }}>
          <Botao
            type="submit"
            variant="primary"
            size="lg"
            fullWidth={true}
            loading={carregando}
            disabled={carregando || produtosSelecionados.length === 0 || produtos.length === 0}
          >
            {id ? "Atualizar Linha" : `Cadastrar Linha (${produtosSelecionados.length} produto(s))`}
          </Botao>
          
          <Botao
            type="button"
            variant="secondary"
            size="lg"
            fullWidth={true}
            onClick={() => navigate("/linhas")}
          >
            Cancelar
          </Botao>
        </div>
      </form>
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
  padding: "clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px)",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  fontSize: "clamp(13px, 1.8vw, 14px)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s"
};
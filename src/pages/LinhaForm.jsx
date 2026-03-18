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
    horas_produtivas_dia: "16"
  });

  // Estados para múltiplos produtos
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [produtoAtual, setProdutoAtual] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  // ========================================
  // ✅ Carregar produtos da empresa selecionada
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
      const res = await api.get(`/products/company/${clienteAtual}`);
      setProdutos(res.data);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      toast.error("Erro ao carregar produtos");
    }
  }

  // ========================================
  // ✅ Carregar dados da linha se for edição
  // ========================================
  useEffect(() => {
    if (id) {
      carregarLinha();
    }
  }, [id, clienteAtual]);

  async function carregarLinha() {
    try {
      // Buscar dados da linha
      const res = await api.get(`/lines/${clienteAtual}`);
      const linha = res.data.find(l => l.id === parseInt(id));
      
      if (linha) {
        // Formatar horas
        const horasFormatadas = linha.horas_produtivas_dia 
          ? parseFloat(linha.horas_produtivas_dia).toString() 
          : "16";

        setForm({
          nome: linha.nome || "",
          empresa_id: linha.empresa_id || clienteAtual,
          horas_produtivas_dia: horasFormatadas
        });

        // Buscar produtos vinculados
        try {
          const produtosRes = await api.get(`/line-products/${id}`);
          const produtosData = produtosRes.data.dados || produtosRes.data || [];
          
          const produtosVinculados = produtosData.map(p => ({
            id: p.produto_id,
            nome: p.produto_nome,
            takt: p.takt_configurado || "",
            meta: p.meta_diaria || 0,
            vinculo_id: p.vinculo_id // Guardar ID do vínculo para edição
          }));
          
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

  // ========================================
  // ✅ Funções para gerenciar produtos
  // ========================================
  const adicionarProduto = () => {
    if (!produtoAtual) {
      toast.error("Selecione um produto");
      return;
    }
    
    if (produtosSelecionados.some(p => p.id === parseInt(produtoAtual))) {
      toast.error("Este produto já foi adicionado");
      return;
    }
    
    const prod = produtos.find(p => p.id === parseInt(produtoAtual));
    setProdutosSelecionados([...produtosSelecionados, { 
      id: prod.id, 
      nome: prod.nome, 
      takt: "", 
      meta: 0 
    }]);
    setProdutoAtual("");
  };

  const removerProduto = (produtoId) => {
    setProdutosSelecionados(produtosSelecionados.filter(p => p.id !== produtoId));
  };

  const atualizarProduto = (index, campo, valor) => {
    const novos = [...produtosSelecionados];
    novos[index][campo] = campo === 'takt' ? valor : parseInt(valor) || 0;
    
    // Recalcular meta se takt mudou
    if (campo === 'takt' && parseFloat(valor) > 0 && parseFloat(form.horas_produtivas_dia) > 0) {
      const horas = parseFloat(form.horas_produtivas_dia);
      const takt = parseFloat(valor);
      novos[index].meta = Math.floor((horas * 3600) / takt);
    }
    
    setProdutosSelecionados(novos);
  };

  // ========================================
  // ✅ HANDLE SUBMIT - AGORA COM EDIÇÃO FUNCIONAL
  // ========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (produtosSelecionados.length === 0) {
      toast.error("Selecione pelo menos um produto para a linha");
      return;
    }

    setCarregando(true);
    
    try {
      if (id) {
        // 🟢 EDIÇÃO - Atualizar dados da linha
        await api.put(`/lines/${id}`, {
          nome: form.nome,
          horas_produtivas_dia: parseFloat(form.horas_produtivas_dia)
        });

        // Buscar produtos atuais para comparar
        const produtosAtuaisRes = await api.get(`/line-products/${id}`);
        const produtosAtuais = produtosAtuaisRes.data.dados || produtosAtuaisRes.data || [];
        
        // Criar mapa de produtos atuais por ID
        const produtosAtuaisMap = new Map(
          produtosAtuais.map(p => [p.produto_id, p])
        );

        // Processar cada produto selecionado
        for (const prod of produtosSelecionados) {
          const produtoAtual = produtosAtuaisMap.get(prod.id);
          
          if (produtoAtual) {
            // Produto já existe - atualizar
            if (produtoAtual.takt_configurado != prod.takt || produtoAtual.meta_diaria != prod.meta) {
              await api.put(`/line-product/${produtoAtual.vinculo_id}`, {
                takt_time_segundos: parseFloat(prod.takt) || 0,
                meta_diaria: prod.meta || 0
              });
            }
            // Remover do mapa para não excluir depois
            produtosAtuaisMap.delete(prod.id);
          } else {
            // Produto novo - criar
            await api.post("/line-product", {
              linha_id: parseInt(id),
              produto_id: prod.id,
              takt_time_segundos: parseFloat(prod.takt) || 0,
              meta_diaria: prod.meta || 0
            });
          }
        }

        // Excluir produtos que não estão mais na lista
        for (const [_, produto] of produtosAtuaisMap) {
          await api.delete(`/line-product/${produto.vinculo_id}`);
        }

        toast.success("Linha atualizada com sucesso! ✅");
      } else {
        // 🟢 CRIAÇÃO
        await api.post("/lines-master", {
          empresa_id: parseInt(clienteAtual),
          nome: form.nome,
          horas_produtivas: parseFloat(form.horas_produtivas_dia),
          produtos: produtosSelecionados.map(p => ({
            id: p.id,
            takt: parseFloat(p.takt) || 0,
            meta: p.meta || 0
          }))
        });
        toast.success("Linha cadastrada com sucesso! ✅");
      }

      setTimeout(() => {
        navigate(`/linhas`);
      }, 1500);

    } catch (error) {
      console.error(error);
      
      if (error.response?.status === 400) {
        toast.error(error.response.data.erro || "Erro ao salvar linha ❌");
      } else if (error.response?.status === 404) {
        toast.error("Recurso não encontrado. Verifique as rotas no backend ❌");
      } else {
        toast.error("Erro ao salvar linha ❌");
      }
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
      
      {/* Cabeçalho */}
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

      {/* Formulário */}
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

        {/* SEÇÃO DE PRODUTOS */}
        <div style={{ marginBottom: "clamp(20px, 3vw, 25px)" }}>
          <label style={labelStyleResponsivo}>Produtos da Linha *</label>
          
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
          
          {/* TABELA DE PRODUTOS */}
          {produtosSelecionados.length > 0 && (
            <div style={{ marginTop: "20px", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "2px solid #eee" }}>
                    <th style={{ padding: "10px" }}>Produto</th>
                    <th style={{ padding: "10px" }}>Takt (s)</th>
                    <th style={{ padding: "10px" }}>Meta (un)</th>
                    <th style={{ padding: "10px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {produtosSelecionados.map((p, index) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "10px" }}>{p.nome}</td>
                      <td style={{ padding: "10px" }}>
                        <input 
                          type="number"
                          style={{ width: "80px", padding: "5px", border: "1px solid #ccc", borderRadius: "4px" }}
                          value={p.takt}
                          placeholder="0.0"
                          onChange={(e) => atualizarProduto(index, 'takt', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "10px", fontWeight: "bold", color: "#16a34a" }}>
                        <input 
                          type="number"
                          style={{ width: "80px", padding: "5px", border: "1px solid #ccc", borderRadius: "4px", color: "#16a34a", fontWeight: "bold" }}
                          value={p.meta}
                          placeholder="0"
                          onChange={(e) => atualizarProduto(index, 'meta', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "10px" }}>
                        <Botao
                          type="button"
                          variant="danger"
                          size="xs"
                          onClick={() => removerProduto(p.id)}
                        >
                          ✕
                        </Botao>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
            Horas disponíveis para produção
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
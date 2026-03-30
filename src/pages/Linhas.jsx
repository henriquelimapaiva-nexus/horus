// src/pages/Linhas.jsx
import { useState, useEffect } from "react";
import { useOutletContext, Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function Linhas() {
  const { clienteAtual, nomeCliente } = useOutletContext();
  const navigate = useNavigate();

  const [linhas, setLinhas] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!clienteAtual) {
      setLinhas([]);
      return;
    }

    carregarLinhas();
  }, [clienteAtual]);

  async function carregarLinhas() {
    setCarregando(true);
    try {
      // Buscar linhas da empresa
      const res = await api.get(`/lines/${clienteAtual}`);
      
      // Para cada linha, buscar seus produtos
      const linhasComProdutos = await Promise.all(
        res.data.map(async (linha) => {
          try {
            const produtosRes = await api.get(`/line-products/${linha.id}`);
            const produtos = produtosRes.data.dados || produtosRes.data || [];
            return { ...linha, produtos };
          } catch (err) {
            console.error(`Erro ao carregar produtos da linha ${linha.id}:`, err);
            return { ...linha, produtos: [] };
          }
        })
      );
      
      console.log("✅ Linhas carregadas:", linhasComProdutos);
      setLinhas(linhasComProdutos);
    } catch (err) {
      console.error("Erro ao carregar linhas:", err);
      toast.error("Erro ao carregar linhas");
    } finally {
      setCarregando(false);
    }
  }

  async function excluirLinha(id) {
    if (!window.confirm("Deseja realmente excluir esta linha?")) return;
    
    try {
      await api.delete(`/lines/${id}`);
      toast.success("Linha excluída com sucesso! ✅");
      carregarLinhas(); // Recarrega a lista
    } catch (error) {
      console.error("Erro ao excluir linha:", error);
      
      // Tratamento de erro específico
      if (error.response?.status === 409) {
        toast.error("Linha possui postos vinculados. Remova os postos primeiro ❌");
      } else if (error.response?.status === 404) {
        toast.error("Linha não encontrada ❌");
      } else {
        toast.error("Erro ao excluir linha ❌");
      }
    }
  }

  if (!clienteAtual) {
    return (
      <div style={{ padding: "60px 40px", textAlign: "center", width: "100%" }}>
        <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", margin: "0 auto", maxWidth: "500px" }}>
          <h2 style={{ color: "#1E3A8A" }}>Nenhum cliente selecionado</h2>
          <p style={{ color: "#666", marginBottom: "30px" }}>Selecione um cliente no menu superior para visualizar as linhas.</p>
          <Link to="/empresas"><Botao variant="primary" size="lg">Ir para Empresas</Botao></Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "clamp(15px, 3vw, 30px)", width: "100%", maxWidth: "1400px", margin: "0 auto" }}>
      
      {/* Área do Título com o design padrão do sistema */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)", 
        padding: "25px 30px",
        marginBottom: "30px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
          <div>
            <h1 style={{ color: "#1E3A8A", marginBottom: "5px", fontSize: "clamp(20px, 4vw, 28px)" }}>
              Linhas de Produção
            </h1>
            <p style={{ color: "#666", fontSize: "14px" }}>
              Gerencie as linhas de produção e configure os produtos associados
            </p>
          </div>
          
          <Link to="/linhas/novo" style={{ textDecoration: "none" }}>
            <Botao variant="success" size="md">+ Nova Linha</Botao>
          </Link>
        </div>

        {/* Informação do cliente selecionado em destaque */}
        <div style={{ 
          marginTop: "15px", 
          paddingTop: "15px", 
          borderTop: "1px solid #e5e7eb",
          fontSize: "14px",
          color: "#666"
        }}>
          Cliente selecionado: <strong style={{ color: "#1E3A8A" }}>{nomeCliente}</strong>
        </div>
      </div>

      {carregando ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Botao variant="primary" loading={true} disabled={true}>Carregando linhas...</Botao>
        </div>
      ) : linhas.length === 0 ? (
        <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px", textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#666", marginBottom: "20px" }}>Nenhuma linha cadastrada para {nomeCliente}.</p>
          <Link to="/linhas/novo"><Botao variant="primary">Cadastrar primeira linha</Botao></Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {linhas.map((linha) => {
            return (
              <div 
                key={linha.id} 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  backgroundColor: "white", 
                  borderRadius: "8px", 
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)", 
                  borderLeft: "4px solid #1E3A8A", 
                  transition: "transform 0.2s, box-shadow 0.2s",
                  overflow: 'hidden',
                  height: '100%',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                }}
                onClick={() => navigate(`/linhas/${linha.id}`)}
              >
                {/* Área de conteúdo clicável */}
                <div style={{ 
                  padding: "20px",
                  flex: 1,
                }}>
                  <h3 style={{ 
                    color: "#1E3A8A", 
                    marginBottom: "12px",
                    fontSize: "clamp(16px, 2vw, 18px)",
                    fontWeight: "600",
                    wordBreak: "break-word",
                    paddingRight: 0,
                    lineHeight: 1.4
                  }}>
                    {truncarTexto(linha.nome, 40)}
                  </h3>
                  
                  {/* LISTA DE PRODUTOS - CORRIGIDO: MOSTRA TODOS OS PRODUTOS */}
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ 
                      fontSize: "13px", 
                      fontWeight: "600", 
                      color: "#4b5563", 
                      marginBottom: "8px",
                      borderBottom: "1px solid #e5e7eb",
                      paddingBottom: "4px"
                    }}>
                      Produtos:
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {linha.produtos && linha.produtos.length > 0 ? (
                        linha.produtos.map((produto, idx) => (
                          <div 
                            key={produto.produto_id || produto.id || idx} 
                            style={{ 
                              fontSize: "13px",
                              padding: "6px 8px",
                              backgroundColor: "#f3f4f6",
                              borderRadius: "6px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "8px"
                            }}
                          >
                            <span style={{ fontWeight: "500", color: "#1f2937" }}>
                              {truncarTexto(produto.produto_nome || produto.nome, 20)}
                            </span>
                            <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
                              <span style={{ color: "#6b7280" }}>
                                Takt: <strong style={{ color: "#1E3A8A" }}>{produto.takt_configurado || produto.takt_time_segundos || '—'}s</strong>
                              </span>
                              <span style={{ color: "#6b7280" }}>
                                Meta: <strong style={{ color: "#16a34a" }}>{produto.meta_diaria || '—'}</strong>
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: "13px", color: "#9ca3af", fontStyle: "italic", padding: "8px" }}>
                          Nenhum produto vinculado
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botões na parte inferior */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  padding: '12px 20px',
                  borderTop: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb'
                }}
                onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/linhas/editar/${linha.id}`);
                    }}
                    style={{
                      padding: '6px 16px',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#bfdbfe'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dbeafe'}
                  >
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      excluirLinha(linha.id);
                    }}
                    style={{
                      padding: '6px 16px',
                      backgroundColor: '#fee2e2',
                      color: '#b91c1c',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fecaca'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
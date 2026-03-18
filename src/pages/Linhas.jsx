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
      
      <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1 style={{ color: "#1E3A8A", marginBottom: "5px", fontSize: "clamp(20px, 4vw, 28px)" }}>
            Linhas de Produção
          </h1>
          <p style={{ color: "#666", fontSize: "14px" }}>
            Cliente selecionado: <strong style={{ color: "#1E3A8A" }}>{nomeCliente}</strong>
          </p>
        </div>
        
        <Link to="/linhas/novo" style={{ textDecoration: "none" }}>
          <Botao variant="success" size="md">+ Nova Linha</Botao>
        </Link>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {linhas.map((linha) => {
            // Pega o primeiro produto para mostrar takt e meta no card
            const primeiroProduto = linha.produtos && linha.produtos.length > 0 ? linha.produtos[0] : null;
            
            return (
              <div key={linha.id} style={{ position: 'relative' }}>
                <Link to={`/linhas/${linha.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ 
                    backgroundColor: "white", 
                    padding: "20px", 
                    paddingTop: "15px",
                    paddingRight: "90px", // Espaço reservado para os botões
                    borderRadius: "8px", 
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)", 
                    borderLeft: "4px solid #1E3A8A", 
                    transition: "transform 0.2s",
                    minHeight: "140px",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    zIndex: 1
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                    
                    <h3 style={{ 
                      color: "#1E3A8A", 
                      marginBottom: "10px",
                      fontSize: "clamp(16px, 2vw, 18px)",
                      paddingRight: "0",
                      wordBreak: "break-word",
                      maxWidth: "calc(100% - 20px)"
                    }}>
                      {truncarTexto(linha.nome, 30)}
                    </h3>
                    
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      fontSize: "14px", 
                      marginBottom: "5px" 
                    }}>
                      <span style={{ color: "#666" }}>Takt time:</span>
                      <span style={{ fontWeight: "bold" }}>
                        {primeiroProduto ? `${primeiroProduto.takt_configurado}s` : '—'}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      fontSize: "14px" 
                    }}>
                      <span style={{ color: "#666" }}>Meta diária:</span>
                      <span style={{ fontWeight: "bold", color: "#16a34a" }}>
                        {primeiroProduto ? `${primeiroProduto.meta_diaria} pçs` : '—'}
                      </span>
                    </div>

                    {linha.produtos && linha.produtos.length > 1 && (
                      <div style={{ 
                        marginTop: "8px", 
                        fontSize: "12px", 
                        color: "#666",
                        fontStyle: "italic"
                      }}>
                        +{linha.produtos.length - 1} produto(s)
                      </div>
                    )}
                  </div>
                </Link>
                
                {/* Botões de ação - com fundo branco e posição fixa */}
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  display: 'flex',
                  gap: '5px',
                  zIndex: 10,
                  backgroundColor: 'white',
                  padding: '4px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}>
                  <Botao
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/linhas/editar/${linha.id}`);
                    }}
                    style={{ padding: '4px 10px', fontSize: '12px', minWidth: '60px' }}
                  >
                    Editar
                  </Botao>
                  <Botao
                    variant="danger"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      excluirLinha(linha.id);
                    }}
                    style={{ padding: '4px 10px', fontSize: '12px', minWidth: '60px' }}
                  >
                    Excluir
                  </Botao>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
// src/pages/Conhecimento.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Função auxiliar para truncar texto
const truncarTexto = (texto, maxLength = 50) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function Conhecimento() {
  const { clienteAtual } = useOutletContext();
  
  const [categorias, setCategorias] = useState([
    { id: "gargalos", nome: "Gargalos", icon: "🔴" },
    { id: "setup", nome: "Setup e Troca", icon: "⏱️" },
    { id: "qualidade", nome: "Qualidade", icon: "✅" },
    { id: "manutencao", nome: "Manutenção", icon: "🔧" },
    { id: "treinamento", nome: "Treinamento", icon: "📚" },
    { id: "checklist", nome: "Checklists", icon: "📋" }
  ]);

  const [artigos, setArtigos] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState("gargalos");
  const [modoEdicao, setModoEdicao] = useState(false);
  const [artigoAtual, setArtigoAtual] = useState(null);
  
  const [novoArtigo, setNovoArtigo] = useState({
    titulo: "",
    problema: "",
    solucao: "",
    resultados: "",
    data: new Date().toLocaleDateString('pt-BR'),
    cliente: "",
    categoria: "gargalos",
    tags: ""
  });

  useEffect(() => {
    const stored = localStorage.getItem("base_conhecimento");
    if (stored) {
      setArtigos(JSON.parse(stored));
    } else {
      const exemplos = [
        {
          id: 1,
          titulo: "Microparadas frequentes em esteiras",
          problema: "Esteira parando 15-20 vezes por hora devido a sensores desalinhados",
          solucao: "Realizar calibração semanal dos sensores e criar checklist de verificação",
          resultados: "Redução de 70% nas microparadas, ganho de 12% em OEE",
          data: "15/03/2026",
          cliente: "Metalúrgica XYZ",
          categoria: "gargalos",
          tags: "esteira, sensor, microparada"
        },
        {
          id: 2,
          titulo: "Setup longo em prensa hidráulica",
          problema: "Setup de 45 minutos, causando paradas frequentes",
          solucao: "Aplicação de SMED com preparação externa e padronização",
          resultados: "Setup reduzido para 18 minutos, ganho de 2h/dia",
          data: "10/03/2026",
          cliente: "Autopeças ABC",
          categoria: "setup",
          tags: "smed, prensa, setup"
        },
        {
          id: 3,
          titulo: "Checklist de início de turno",
          problema: "Operadores perdiam 15 minutos no início do turno",
          solucao: "Criar checklist padronizado com 10 itens essenciais",
          resultados: "Início de turno reduzido para 5 minutos",
          data: "05/03/2026",
          cliente: "Alimentos Ltda",
          categoria: "checklist",
          tags: "checklist, turno, padronização"
        }
      ];
      setArtigos(exemplos);
      localStorage.setItem("base_conhecimento", JSON.stringify(exemplos));
    }
  }, []);

  useEffect(() => {
    if (artigos.length > 0) {
      localStorage.setItem("base_conhecimento", JSON.stringify(artigos));
    }
  }, [artigos]);

  const handleInputChange = (e) => {
    setNovoArtigo({
      ...novoArtigo,
      [e.target.name]: e.target.value
    });
  };

  const adicionarArtigo = () => {
    if (!novoArtigo.titulo || !novoArtigo.problema || !novoArtigo.solucao) {
      toast.error("Preencha título, problema e solução");
      return;
    }

    const artigo = {
      id: Date.now(),
      ...novoArtigo,
      data: new Date().toLocaleDateString('pt-BR'),
      cliente: clienteAtual || novoArtigo.cliente || "Geral"
    };

    setArtigos([artigo, ...artigos]);
    toast.success("Registro adicionado com sucesso! ✅");
    
    setNovoArtigo({
      titulo: "",
      problema: "",
      solucao: "",
      resultados: "",
      data: new Date().toLocaleDateString('pt-BR'),
      cliente: "",
      categoria: categoriaAtiva,
      tags: ""
    });
    setModoEdicao(false);
  };

  const excluirArtigo = (id) => {
    if (window.confirm("Excluir este registro?")) {
      setArtigos(artigos.filter(a => a.id !== id));
      toast.success("Registro excluído com sucesso ✅");
    }
  };

  const artigosFiltrados = artigos.filter(a => 
    a.categoria === categoriaAtiva
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
          Base de Conhecimento
        </h1>
        <p style={{ 
          color: "#666", 
          fontSize: "clamp(12px, 2vw, 14px)" 
        }}>
          Registre problemas recorrentes, soluções aplicadas e lições aprendidas
        </p>
      </div>

      {/* Categorias responsivas */}
      <div style={{ 
        display: "flex", 
        gap: "clamp(8px, 1.5vw, 10px)", 
        marginBottom: "clamp(20px, 3vw, 25px)",
        flexWrap: "wrap",
        justifyContent: "center"
      }}>
        {categorias.map((cat) => (
          <Botao
            key={cat.id}
            variant={categoriaAtiva === cat.id ? "primary" : "outline"}
            size="md"
            onClick={() => setCategoriaAtiva(cat.id)}
            style={{
              borderRadius: "30px",
              padding: "clamp(6px, 1vw, 10px) clamp(12px, 2vw, 20px)",
              fontSize: "clamp(12px, 1.8vw, 14px)"
            }}
          >
            <span style={{ marginRight: "4px" }}>{cat.icon}</span> {cat.nome}
          </Botao>
        ))}
        
        <Botao
          variant="success"
          size="md"
          onClick={() => setModoEdicao(!modoEdicao)}
          style={{ 
            marginLeft: "auto",
            fontSize: "clamp(12px, 1.8vw, 14px)",
            padding: "clamp(6px, 1vw, 10px) clamp(12px, 2vw, 20px)"
          }}
        >
          {modoEdicao ? "Cancelar" : "+ Novo Registro"}
        </Botao>
      </div>

      {/* Formulário de novo registro responsivo */}
      {modoEdicao && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 25px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          marginBottom: "clamp(20px, 3vw, 30px)",
          borderTop: "4px solid #16a34a",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <h2 style={{ 
            color: "#1E3A8A", 
            marginBottom: "clamp(15px, 2vw, 20px)", 
            fontSize: "clamp(16px, 2.5vw, 18px)" 
          }}>
            Novo Registro
          </h2>

          <div style={{ display: "grid", gap: "clamp(10px, 1.5vw, 15px)" }}>
            <div>
              <label style={labelStyleResponsivo}>Título *</label>
              <input
                type="text"
                name="titulo"
                value={novoArtigo.titulo}
                onChange={handleInputChange}
                placeholder="Ex: Microparadas em Esteira"
                style={inputStyleResponsivo}
              />
            </div>

            <div>
              <label style={labelStyleResponsivo}>Problema *</label>
              <textarea
                name="problema"
                value={novoArtigo.problema}
                onChange={handleInputChange}
                rows="3"
                placeholder="Descreva o problema identificado..."
                style={{ ...inputStyleResponsivo, resize: "vertical", minHeight: "80px" }}
              />
            </div>

            <div>
              <label style={labelStyleResponsivo}>Solução Aplicada *</label>
              <textarea
                name="solucao"
                value={novoArtigo.solucao}
                onChange={handleInputChange}
                rows="3"
                placeholder="Descreva a solução implementada..."
                style={{ ...inputStyleResponsivo, resize: "vertical", minHeight: "80px" }}
              />
            </div>

            <div>
              <label style={labelStyleResponsivo}>Resultados Obtidos</label>
              <textarea
                name="resultados"
                value={novoArtigo.resultados}
                onChange={handleInputChange}
                rows="2"
                placeholder="Ex: Redução de 40% nas paradas..."
                style={{ ...inputStyleResponsivo, resize: "vertical", minHeight: "60px" }}
              />
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", 
              gap: "clamp(10px, 1.5vw, 15px)" 
            }}>
              <div>
                <label style={labelStyleResponsivo}>Categoria</label>
                <select
                  name="categoria"
                  value={novoArtigo.categoria}
                  onChange={handleInputChange}
                  style={inputStyleResponsivo}
                >
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyleResponsivo}>Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={novoArtigo.tags}
                  onChange={handleInputChange}
                  placeholder="esteira, sensor, setup"
                  style={inputStyleResponsivo}
                />
              </div>
            </div>

            <div style={{ 
              display: "flex", 
              gap: "clamp(8px, 1.5vw, 10px)", 
              marginTop: "clamp(8px, 1.5vw, 10px)",
              flexWrap: "wrap"
            }}>
              <Botao
                variant="success"
                size="md"
                onClick={adicionarArtigo}
                fullWidth={true}
              >
                Salvar Registro
              </Botao>
              <Botao
                variant="secondary"
                size="md"
                onClick={() => setModoEdicao(false)}
                fullWidth={true}
              >
                Cancelar
              </Botao>
            </div>
          </div>
        </div>
      )}

      {/* Lista de artigos responsiva */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: "clamp(15px, 2vw, 20px)" 
      }}>
        {artigosFiltrados.length === 0 ? (
          <div style={{ 
            backgroundColor: "white", 
            padding: "clamp(30px, 5vw, 50px)", 
            borderRadius: "8px", 
            textAlign: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            <p style={{ 
              color: "#666", 
              marginBottom: "clamp(10px, 2vw, 15px)",
              fontSize: "clamp(14px, 2vw, 16px)"
            }}>
              Nenhum registro encontrado nesta categoria.
            </p>
            <Botao
              variant="primary"
              size="md"
              onClick={() => setModoEdicao(true)}
            >
              Criar primeiro registro
            </Botao>
          </div>
        ) : (
          artigosFiltrados.map((artigo) => (
            <div
              key={artigo.id}
              style={{
                backgroundColor: "white",
                padding: "clamp(15px, 2vw, 20px)",
                borderRadius: "8px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                borderLeft: "4px solid #1E3A8A",
                transition: "transform 0.2s",
                width: "100%",
                boxSizing: "border-box"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateX(4px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateX(0)"}
            >
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: "10px",
                marginBottom: "10px"
              }}>
                <h3 style={{ 
                  color: "#1E3A8A", 
                  fontSize: "clamp(16px, 2.5vw, 18px)", 
                  marginBottom: "5px",
                  flex: "1 1 auto"
                }}>
                  {artigo.titulo}
                </h3>
                <Botao
                  variant="danger"
                  size="sm"
                  onClick={() => excluirArtigo(artigo.id)}
                >
                  Excluir
                </Botao>
              </div>

              <div style={{ 
                display: "flex", 
                gap: "clamp(8px, 1.5vw, 15px)", 
                marginBottom: "clamp(10px, 1.5vw, 15px)", 
                flexWrap: "wrap" 
              }}>
                <span style={tagStyleResponsivo}>📅 {artigo.data}</span>
                <span style={tagStyleResponsivo}>🏭 {truncarTexto(artigo.cliente, 15)}</span>
                {artigo.tags && artigo.tags.split(',').slice(0, 3).map((tag, i) => (
                  <span key={i} style={{ ...tagStyleResponsivo, backgroundColor: "#e5e7eb", color: "#374151" }}>
                    #{tag.trim()}
                  </span>
                ))}
                {artigo.tags && artigo.tags.split(',').length > 3 && (
                  <span style={tagStyleResponsivo}>+{artigo.tags.split(',').length - 3}</span>
                )}
              </div>

              <div style={{ marginBottom: "clamp(10px, 1.5vw, 15px)" }}>
                <div style={{ fontWeight: "600", color: "#dc2626", marginBottom: "5px" }}>
                  🔴 Problema:
                </div>
                <p style={{ 
                  color: "#4b5563", 
                  marginLeft: "clamp(10px, 2vw, 20px)",
                  fontSize: "clamp(13px, 1.8vw, 14px)",
                  lineHeight: "1.5",
                  wordBreak: "break-word"
                }}>
                  {truncarTexto(artigo.problema, 150)}
                </p>
              </div>

              <div style={{ marginBottom: "clamp(10px, 1.5vw, 15px)" }}>
                <div style={{ fontWeight: "600", color: "#16a34a", marginBottom: "5px" }}>
                  ✅ Solução:
                </div>
                <p style={{ 
                  color: "#4b5563", 
                  marginLeft: "clamp(10px, 2vw, 20px)",
                  fontSize: "clamp(13px, 1.8vw, 14px)",
                  lineHeight: "1.5",
                  wordBreak: "break-word"
                }}>
                  {truncarTexto(artigo.solucao, 150)}
                </p>
              </div>

              {artigo.resultados && (
                <div>
                  <div style={{ fontWeight: "600", color: "#1E3A8A", marginBottom: "5px" }}>
                    📊 Resultados:
                  </div>
                  <p style={{ 
                    color: "#4b5563", 
                    marginLeft: "clamp(10px, 2vw, 20px)",
                    fontSize: "clamp(13px, 1.8vw, 14px)",
                    lineHeight: "1.5",
                    wordBreak: "break-word"
                  }}>
                    {truncarTexto(artigo.resultados, 100)}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
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
  fontFamily: "inherit",
  boxSizing: "border-box"
};

const tagStyleResponsivo = {
  padding: "4px 10px",
  backgroundColor: "#1E3A8A20",
  color: "#1E3A8A",
  borderRadius: "16px",
  fontSize: "clamp(11px, 1.5vw, 12px)",
  fontWeight: "500",
  whiteSpace: "nowrap"
};
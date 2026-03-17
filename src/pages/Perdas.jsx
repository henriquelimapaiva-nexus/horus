// src/pages/Perdas.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Importar componentes de gráficos
import GraficoPizza from "../components/graficos/GraficoPizza";
import GraficoBarras from "../components/graficos/GraficoBarras";
import { coresNexus } from "../components/graficos/GraficoBase";

// Função auxiliar para truncar texto
const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function Perdas() {
  const { clienteAtual } = useOutletContext();

  const [empresas, setEmpresas] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [linhaProdutos, setLinhaProdutos] = useState([]);
  const [perdas, setPerdas] = useState([]);
  
  const [filtros, setFiltros] = useState({
    empresaId: clienteAtual || "",
    linhaId: "",
    produtoId: "",
    dataInicio: "",
    dataFim: ""
  });

  const [form, setForm] = useState({
    linha_produto_id: "",
    microparadas_minutos: "",
    retrabalho_pecas: "",
    refugo_pecas: "",
    data: new Date().toISOString().split('T')[0]
  });

  const [editId, setEditId] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const [dadosGrafico, setDadosGrafico] = useState({
    labels: [],
    valores: []
  });

  useEffect(() => {
    // ✅ CORRIGIDO: /empresas → /companies
    api.get("/companies")
      .then(res => setEmpresas(res.data))
      .catch(err => {
        console.error("Erro ao carregar empresas:", err);
        toast.error("Erro ao carregar empresas");
      });
  }, []);

  useEffect(() => {
    if (filtros.empresaId) {
      // ✅ CORRIGIDO: /linhas/${filtros.empresaId} → /lines/${filtros.empresaId}
      api.get(`/lines/${filtros.empresaId}`)
        .then(res => setLinhas(res.data))
        .catch(err => {
          console.error("Erro ao carregar linhas:", err);
          toast.error("Erro ao carregar linhas");
        });
    } else {
      setLinhas([]);
      setLinhaProdutos([]);
    }
  }, [filtros.empresaId]);

  useEffect(() => {
    if (filtros.linhaId) {
      carregarLinhaProdutos(filtros.linhaId);
    } else {
      setLinhaProdutos([]);
    }
  }, [filtros.linhaId]);

  useEffect(() => {
    carregarPerdas();
  }, [filtros.linhaId, filtros.dataInicio, filtros.dataFim]);

  useEffect(() => {
    calcularDadosGrafico();
  }, [perdas]);

  async function carregarLinhaProdutos(linhaId) {
    try {
      // ✅ CORRIGIDO: /linha-produto/${linhaId} → /line-products/${linhaId}
      const res = await api.get(`/line-products/${linhaId}`);
      const produtosData = res.data.dados || res.data || [];
      setLinhaProdutos(produtosData);
    } catch (error) {
      console.error("Erro ao carregar produtos da linha:", error);
      toast.error("Erro ao carregar produtos da linha");
    }
  }

  async function carregarPerdas() {
    if (!filtros.linhaId) {
      setPerdas([]);
      return;
    }

    setCarregando(true);
    try {
      // ✅ CORRIGIDO: /perdas/${filtros.linhaId} → /losses/${filtros.linhaId}
      const res = await api.get(`/losses/${filtros.linhaId}`);
      
      // Filtrar por data se necessário
      let perdasFiltradas = res.data;
      if (filtros.dataInicio) {
        perdasFiltradas = perdasFiltradas.filter(p => 
          new Date(p.data_medicao) >= new Date(filtros.dataInicio)
        );
      }
      if (filtros.dataFim) {
        perdasFiltradas = perdasFiltradas.filter(p => 
          new Date(p.data_medicao) <= new Date(filtros.dataFim)
        );
      }
      
      setPerdas(perdasFiltradas);
    } catch (error) {
      console.error("Erro ao carregar perdas:", error);
      toast.error("Erro ao carregar perdas");
    } finally {
      setCarregando(false);
    }
  }

  const calcularDadosGrafico = () => {
    let totalMicro = 0;
    let totalRetrabalho = 0;
    let totalRefugo = 0;

    perdas.forEach(p => {
      totalMicro += p.microparadas_minutos || 0;
      totalRetrabalho += p.retrabalho_pecas || 0;
      totalRefugo += p.refugo_pecas || 0;
    });

    if (totalMicro === 0 && totalRetrabalho === 0 && totalRefugo === 0) {
      setDadosGrafico({ labels: [], valores: [] });
      return;
    }

    setDadosGrafico({
      labels: ['Microparadas (min)', 'Retrabalho (pç)', 'Refugo (pç)'],
      valores: [totalMicro, totalRetrabalho, totalRefugo]
    });
  };

  const handleFiltroChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };

  const handleFormChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.linha_produto_id) {
      toast.error("Selecione um produto");
      return;
    }

    setCarregando(true);
    try {
      if (editId) {
        // ✅ CORRIGIDO: /perdas/${editId} → /losses/${editId}
        await api.put(`/losses/${editId}`, {
          microparadas_minutos: parseFloat(form.microparadas_minutos) || 0,
          retrabalho_pecas: parseInt(form.retrabalho_pecas) || 0,
          refugo_pecas: parseInt(form.refugo_pecas) || 0
        });
        toast.success("Perda atualizada com sucesso! ✅");
        setEditId(null);
      } else {
        // ✅ CORRIGIDO: /perdas → /losses
        await api.post("/losses", {
          linha_produto_id: parseInt(form.linha_produto_id),
          microparadas_minutos: parseFloat(form.microparadas_minutos) || 0,
          retrabalho_pecas: parseInt(form.retrabalho_pecas) || 0,
          refugo_pecas: parseInt(form.refugo_pecas) || 0
        });
        toast.success("Perda registrada com sucesso! ✅");
      }

      setForm({
        linha_produto_id: "",
        microparadas_minutos: "",
        retrabalho_pecas: "",
        refugo_pecas: "",
        data: new Date().toISOString().split('T')[0]
      });

      carregarPerdas();

    } catch (error) {
      console.error("Erro ao salvar perda:", error);
      
      // Tratamento de erro específico
      if (error.response?.status === 400) {
        toast.error("Dados inválidos. Verifique os valores ❌");
      } else {
        toast.error("Erro ao salvar perda ❌");
      }
    } finally {
      setCarregando(false);
    }
  };

  function handleEdit(perda) {
    setForm({
      linha_produto_id: perda.linha_produto_id,
      microparadas_minutos: perda.microparadas_minutos || "",
      retrabalho_pecas: perda.retrabalho_pecas || "",
      refugo_pecas: perda.refugo_pecas || "",
      data: perda.data_medicao || new Date().toISOString().split('T')[0]
    });
    setEditId(perda.id);
  }

  async function handleDelete(id) {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;
    
    setCarregando(true);
    try {
      // ✅ CORRIGIDO: /perdas/${id} → /losses/${id}
      await api.delete(`/losses/${id}`);
      carregarPerdas();
      toast.success("Registro excluído com sucesso ✅");
    } catch (error) {
      console.error("Erro ao excluir perda:", error);
      toast.error("Erro ao excluir perda ❌");
    } finally {
      setCarregando(false);
    }
  }

  const formatarData = (dataString) => {
    if (!dataString) return "";
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  const getProdutoNome = (linhaProdutoId) => {
    const item = linhaProdutos.find(lp => lp.vinculo_id === linhaProdutoId || lp.id === linhaProdutoId);
    return item ? item.produto_nome || "Produto" : "-";
  };

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
          Registro de Perdas
        </h1>
        <p style={{ 
          color: "#666", 
          fontSize: "clamp(12px, 2vw, 14px)" 
        }}>
          Registre microparadas, retrabalho e refugo por produto e linha
        </p>
      </div>

      {/* Filtros responsivos */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <h3 style={{ 
          color: "#1E3A8A", 
          marginBottom: "clamp(10px, 1.5vw, 15px)", 
          fontSize: "clamp(16px, 2.5vw, 18px)" 
        }}>
          Filtros
        </h3>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", 
          gap: "clamp(10px, 1.5vw, 15px)" 
        }}>
          <div>
            <label style={labelStyleResponsivo}>Empresa</label>
            <select
              name="empresaId"
              value={filtros.empresaId}
              onChange={handleFiltroChange}
              style={inputStyleResponsivo}
            >
              <option value="">Todas</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{truncarTexto(emp.nome, 20)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyleResponsivo}>Linha</label>
            <select
              name="linhaId"
              value={filtros.linhaId}
              onChange={handleFiltroChange}
              style={inputStyleResponsivo}
              disabled={!filtros.empresaId}
            >
              <option value="">Selecione...</option>
              {linhas.map(linha => (
                <option key={linha.id} value={linha.id}>{truncarTexto(linha.nome, 20)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyleResponsivo}>Data Início</label>
            <input
              type="date"
              name="dataInicio"
              value={filtros.dataInicio}
              onChange={handleFiltroChange}
              style={inputStyleResponsivo}
            />
          </div>

          <div>
            <label style={labelStyleResponsivo}>Data Fim</label>
            <input
              type="date"
              name="dataFim"
              value={filtros.dataFim}
              onChange={handleFiltroChange}
              style={inputStyleResponsivo}
            />
          </div>
        </div>
      </div>

      {/* GRÁFICO DE PERDAS responsivo */}
      {filtros.linhaId && dadosGrafico.valores.length > 0 && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "clamp(20px, 3vw, 30px)",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <h3 style={{ 
            color: "#1E3A8A", 
            marginBottom: "clamp(15px, 2vw, 20px)", 
            fontSize: "clamp(16px, 2.5vw, 18px)" 
          }}>
            Distribuição das Perdas
          </h3>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", 
            gap: "clamp(15px, 2vw, 20px)" 
          }}>
            <div style={{ width: "100%", overflow: "hidden" }}>
              <GraficoPizza 
                labels={dadosGrafico.labels}
                valores={dadosGrafico.valores}
                titulo="Perdas por Tipo"
                cores={[coresNexus.warning, coresNexus.info, coresNexus.danger]}
              />
            </div>

            <div style={{ width: "100%", overflow: "hidden" }}>
              <GraficoBarras 
                labels={dadosGrafico.labels}
                valores={dadosGrafico.valores}
                titulo="Total por Tipo de Perda"
                cor={coresNexus.primary}
                formato="numero"
              />
            </div>
          </div>

          <div style={{ 
            marginTop: "clamp(15px, 2vw, 20px)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))",
            gap: "clamp(10px, 1.5vw, 15px)"
          }}>
            <ResumoCardResponsivo 
              titulo="Microparadas"
              valor={`${dadosGrafico.valores[0] || 0} min`}
              cor={coresNexus.warning}
            />
            <ResumoCardResponsivo 
              titulo="Retrabalho"
              valor={`${dadosGrafico.valores[1] || 0} pç`}
              cor={coresNexus.info}
            />
            <ResumoCardResponsivo 
              titulo="Refugo"
              valor={`${dadosGrafico.valores[2] || 0} pç`}
              cor={coresNexus.danger}
            />
          </div>
        </div>
      )}

      {/* Formulário responsivo */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 25px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <h3 style={{ 
          color: "#1E3A8A", 
          marginBottom: "clamp(10px, 1.5vw, 15px)", 
          fontSize: "clamp(16px, 2.5vw, 18px)" 
        }}>
          {editId ? "Editar Registro" : "Novo Registro de Perda"}
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", 
            gap: "clamp(10px, 1.5vw, 15px)" 
          }}>
            
            <div>
              <label style={labelStyleResponsivo}>Produto *</label>
              <select
                name="linha_produto_id"
                value={form.linha_produto_id}
                onChange={handleFormChange}
                style={inputStyleResponsivo}
                required
                disabled={!filtros.linhaId}
              >
                <option value="">Selecione...</option>
                {linhaProdutos.map(lp => (
                  <option key={lp.vinculo_id || lp.id} value={lp.vinculo_id || lp.id}>
                    {truncarTexto(lp.produto_nome || lp.nome, 20)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyleResponsivo}>Microparadas (min)</label>
              <input
                type="number"
                name="microparadas_minutos"
                value={form.microparadas_minutos}
                onChange={handleFormChange}
                step="0.5"
                min="0"
                style={inputStyleResponsivo}
                placeholder="0"
              />
            </div>

            <div>
              <label style={labelStyleResponsivo}>Retrabalho (pç)</label>
              <input
                type="number"
                name="retrabalho_pecas"
                value={form.retrabalho_pecas}
                onChange={handleFormChange}
                min="0"
                step="1"
                style={inputStyleResponsivo}
                placeholder="0"
              />
            </div>

            <div>
              <label style={labelStyleResponsivo}>Refugo (pç)</label>
              <input
                type="number"
                name="refugo_pecas"
                value={form.refugo_pecas}
                onChange={handleFormChange}
                min="0"
                step="1"
                style={inputStyleResponsivo}
                placeholder="0"
              />
            </div>

            <div>
              <label style={labelStyleResponsivo}>Data</label>
              <input
                type="date"
                name="data"
                value={form.data}
                onChange={handleFormChange}
                style={inputStyleResponsivo}
              />
            </div>
          </div>

          <div style={{ 
            display: "flex", 
            gap: "clamp(8px, 1.5vw, 10px)", 
            marginTop: "clamp(15px, 2vw, 20px)",
            flexWrap: "wrap"
          }}>
            <Botao
              type="submit"
              variant="primary"
              size="md"
              fullWidth={true}
              loading={carregando}
              disabled={carregando || !filtros.linhaId}
            >
              {editId ? "Atualizar" : "Registrar Perda"}
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
                    linha_produto_id: "",
                    microparadas_minutos: "",
                    retrabalho_pecas: "",
                    refugo_pecas: "",
                    data: new Date().toISOString().split('T')[0]
                  });
                }}
              >
                Cancelar
              </Botao>
            )}
          </div>
        </form>
      </div>

      {/* Tabela de Perdas responsiva */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <h3 style={{ 
          color: "#1E3A8A", 
          marginBottom: "clamp(10px, 1.5vw, 15px)", 
          fontSize: "clamp(16px, 2.5vw, 18px)" 
        }}>
          Histórico de Perdas
        </h3>

        {carregando && perdas.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "clamp(20px, 4vw, 40px)", 
            fontSize: "clamp(14px, 2vw, 16px)",
            color: "#666"
          }}>
            Carregando perdas...
          </div>
        ) : perdas.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "clamp(20px, 4vw, 40px)", 
            color: "#666",
            fontSize: "clamp(14px, 2vw, 16px)"
          }}>
            Nenhum registro encontrado.
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
              minWidth: "600px",
              tableLayout: "fixed"
            }}>
              <colgroup>
                <col style={{ width: "15%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                  <th style={thResponsivo}>Data</th>
                  <th style={thResponsivo}>Produto</th>
                  <th style={thResponsivo}>Microparadas</th>
                  <th style={thResponsivo}>Retrabalho</th>
                  <th style={thResponsivo}>Refugo</th>
                  <th style={thResponsivo}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {perdas.map((perda) => (
                  <tr key={perda.perda_id || perda.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={tdResponsivo}>{formatarData(perda.data_medicao)}</td>
                    <td style={tdResponsivo} title={perda.produto_nome || getProdutoNome(perda.linha_produto_id)}>
                      {truncarTexto(perda.produto_nome || getProdutoNome(perda.linha_produto_id), 15)}
                    </td>
                    <td style={tdResponsivo}>{perda.microparadas_minutos || 0} min</td>
                    <td style={tdResponsivo}>{perda.retrabalho_pecas || 0} pç</td>
                    <td style={tdResponsivo}>{perda.refugo_pecas || 0} pç</td>
                    <td style={tdResponsivo}>
                      <Botao
                        variant="primary"
                        size="sm"
                        onClick={() => handleEdit(perda)}
                        style={{ marginRight: "5px" }}
                      >
                        Editar
                      </Botao>
                      <Botao
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(perda.perda_id || perda.id)}
                      >
                        Excluir
                      </Botao>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de card de resumo responsivo
function ResumoCardResponsivo({ titulo, valor, cor }) {
  return (
    <div style={{ 
      backgroundColor: "#f9fafb",
      padding: "clamp(10px, 1.5vw, 15px)",
      borderRadius: "8px",
      borderLeft: `4px solid ${cor}`,
      textAlign: "center",
      width: "100%",
      boxSizing: "border-box",
      minWidth: 0
    }}>
      <div style={{ 
        color: "#666", 
        fontSize: "clamp(11px, 1.5vw, 13px)", 
        marginBottom: "5px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }} title={titulo}>
        {titulo}
      </div>
      <div style={{ 
        fontSize: "clamp(16px, 2.5vw, 20px)", 
        fontWeight: "bold", 
        color: cor,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }} title={valor}>
        {valor}
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
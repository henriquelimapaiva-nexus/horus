// src/pages/OEE.jsx
import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Componentes de gráficos
import GraficoLinha from "../components/graficos/GraficoLinha";
import GraficoBarras from "../components/graficos/GraficoBarras";
import { coresNexus } from "../components/graficos/GraficoBase";

// Códigos de parada padronizados
const codigosParada = [
  { codigo: "P01", nome: "Microparada (<5min)", categoria: "disponibilidade" },
  { codigo: "P02", nome: "Setup/Troca", categoria: "disponibilidade" },
  { codigo: "P03", nome: "Falta de Material", categoria: "disponibilidade" },
  { codigo: "P04", nome: "Quebra de Máquina", categoria: "disponibilidade" },
  { codigo: "P05", nome: "Manutenção Preventiva", categoria: "disponibilidade" },
  { codigo: "P06", nome: "Falta de Operador", categoria: "disponibilidade" },
  { codigo: "P07", nome: "Problema Qualidade", categoria: "qualidade" },
  { codigo: "P08", nome: "Aguardando Instrução", categoria: "disponibilidade" }
];

export default function OEE() {
  const { clienteAtual } = useOutletContext();
  const navigate = useNavigate();

  // Estados
  const [empresas, setEmpresas] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [postos, setPostos] = useState([]);
  const [historicoOEE, setHistoricoOEE] = useState([]);
  const [taktTime, setTaktTime] = useState(null);
  const [editId, setEditId] = useState(null); // Estado para edição
  
  const [filtros, setFiltros] = useState({
    empresaId: clienteAtual || "",
    linhaId: "",
    produtoId: "",
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0]
  });

  const [producao, setProducao] = useState({
    turno: "1",
    pecas_produzidas: "",
    pecas_boas: "",
    tempo_operando_min: "",
    data: new Date().toISOString().split('T')[0], // Campo data adicionado
    paradas: []
  });

  const [novaParada, setNovaParada] = useState({
    codigo: "",
    duracao_min: "",
    descricao: ""
  });

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Carregar empresas
  useEffect(() => {
    api.get("/companies")
      .then(res => setEmpresas(res.data))
      .catch(err => console.error("Erro ao carregar empresas:", err));
  }, []);

  // Carregar linhas
  useEffect(() => {
    if (filtros.empresaId) {
      api.get(`/lines/${filtros.empresaId}`)
        .then(res => setLinhas(res.data))
        .catch(err => console.error("Erro ao carregar linhas:", err));
    }
  }, [filtros.empresaId]);

  // Carregar produtos
  useEffect(() => {
    if (filtros.empresaId) {
      api.get(`/products/company/${filtros.empresaId}`)
        .then(res => setProdutos(res.data))
        .catch(err => console.error("Erro ao carregar produtos:", err));
    }
  }, [filtros.empresaId]);

  // Carregar postos da linha
  useEffect(() => {
    if (filtros.linhaId) {
      api.get(`/work-stations/${filtros.linhaId}`)
        .then(res => setPostos(res.data))
        .catch(err => console.error("Erro ao carregar postos:", err));
    }
  }, [filtros.linhaId]);

  // Carregar takt time do produto na linha selecionada
  useEffect(() => {
    if (filtros.linhaId && filtros.produtoId) {
      carregarTaktTime();
    } else {
      setTaktTime(null);
    }
  }, [filtros.linhaId, filtros.produtoId]);

  // Carregar histórico OEE
  useEffect(() => {
    if (filtros.linhaId) {
      carregarHistoricoOEE();
    }
  }, [filtros.linhaId, filtros.dataInicio, filtros.dataFim]);

  async function carregarHistoricoOEE() {
    setCarregando(true);
    try {
      const res = await api.get(`/oee/history/${filtros.linhaId}?data_inicio=${filtros.dataInicio}&data_fim=${filtros.dataFim}`);
      setHistoricoOEE(res.data);
    } catch (error) {
      console.error("Erro ao carregar histórico OEE:", error);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarTaktTime() {
    try {
      const res = await api.get(`/line-products/${filtros.linhaId}`);
      const produtos = res.data.dados || res.data || [];
      const produtoEncontrado = produtos.find(p => p.produto_id === parseInt(filtros.produtoId));
      
      if (produtoEncontrado && produtoEncontrado.takt_time_segundos && produtoEncontrado.takt_time_segundos > 0) {
        setTaktTime(produtoEncontrado.takt_time_segundos);
        console.log(`✅ Takt time carregado: ${produtoEncontrado.takt_time_segundos}s`);
      } else {
        console.error(`❌ Takt time NÃO CADASTRADO para este produto`);
        setTaktTime(null);
      }
    } catch (error) {
      console.error("Erro ao carregar takt time:", error);
      setTaktTime(null);
    }
  }

  const handleFiltroChange = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value
    });
  };

  const handleProducaoChange = (e) => {
    setProducao({
      ...producao,
      [e.target.name]: e.target.value
    });
  };

  const handleParadaChange = (e) => {
    setNovaParada({
      ...novaParada,
      [e.target.name]: e.target.value
    });
  };

  const adicionarParada = () => {
    if (!novaParada.codigo || !novaParada.duracao_min) {
      toast.error("Selecione o código e informe a duração");
      return;
    }

    const codigoInfo = codigosParada.find(c => c.codigo === novaParada.codigo);
    
    setProducao({
      ...producao,
      paradas: [...producao.paradas, {
        codigo: novaParada.codigo,
        nome: codigoInfo?.nome || novaParada.codigo,
        duracao_min: parseFloat(novaParada.duracao_min),
        descricao: novaParada.descricao
      }]
    });

    setNovaParada({ codigo: "", duracao_min: "", descricao: "" });
  };

  const removerParada = (index) => {
    const novasParadas = [...producao.paradas];
    novasParadas.splice(index, 1);
    setProducao({ ...producao, paradas: novasParadas });
  };

  const calcularOEE = () => {
    // Validação: só calcula se takt time estiver carregado
    if (!taktTime || taktTime <= 0) {
      return null;
    }
    
    // Tempo planejado (8h = 480 min)
    const tempoPlanejado = 480;
    
    // Tempo parado
    const tempoParado = producao.paradas.reduce((total, p) => total + p.duracao_min, 0);
    const tempoOperando = producao.tempo_operando_min ? parseFloat(producao.tempo_operando_min) : (tempoPlanejado - tempoParado);
    
    // Disponibilidade
    const disponibilidade = (tempoOperando / tempoPlanejado) * 100;
    
    // Performance (usando takt time do cadastro)
    const pecasProduzidas = parseInt(producao.pecas_produzidas) || 0;
    const tempoTeorico = (pecasProduzidas * taktTime) / 60; // em minutos
    const performance = (tempoTeorico / tempoOperando) * 100;
    
    // Qualidade
    const pecasBoas = parseInt(producao.pecas_boas) || pecasProduzidas;
    const qualidade = (pecasBoas / pecasProduzidas) * 100;
    
    // OEE Final
    const oee = (disponibilidade * performance * qualidade) / 10000;
    
    return {
      disponibilidade: disponibilidade.toFixed(2),
      performance: performance.toFixed(2),
      qualidade: qualidade.toFixed(2),
      oee: oee.toFixed(2)
    };
  };

  async function salvarProducao() {
    if (!filtros.linhaId || !filtros.produtoId) {
      toast.error("Selecione linha e produto");
      return;
    }

    if (!producao.pecas_produzidas) {
      toast.error("Informe a quantidade produzida");
      return;
    }

    const oeeCalculado = calcularOEE();
    
    if (!oeeCalculado) {
      toast.error("Takt time não configurado para este produto");
      return;
    }

    setSalvando(true);
    try {
      const dados = {
        linha_id: parseInt(filtros.linhaId),
        produto_id: parseInt(filtros.produtoId),
        turno: parseInt(producao.turno),
        data: producao.data,
        pecas_produzidas: parseInt(producao.pecas_produzidas),
        pecas_boas: parseInt(producao.pecas_boas) || parseInt(producao.pecas_produzidas),
        tempo_operando_min: parseFloat(producao.tempo_operando_min) || null,
        paradas: producao.paradas,
        oee: parseFloat(oeeCalculado.oee),
        disponibilidade: parseFloat(oeeCalculado.disponibilidade),
        performance: parseFloat(oeeCalculado.performance),
        qualidade: parseFloat(oeeCalculado.qualidade)
      };

      if (editId) {
        // Edição
        await api.put(`/producao/${editId}`, dados);
        toast.success("Produção atualizada com sucesso! ✅");
        setEditId(null);
      } else {
        // Criação
        await api.post("/producao/registrar", dados);
        toast.success("Produção registrada com sucesso! ✅");
      }
      
      // Limpar formulário
      setProducao({
        turno: "1",
        pecas_produzidas: "",
        pecas_boas: "",
        tempo_operando_min: "",
        data: new Date().toISOString().split('T')[0],
        paradas: []
      });
      
      // Recarregar histórico
      carregarHistoricoOEE();
      
    } catch (error) {
      console.error("Erro ao salvar produção:", error);
      toast.error(editId ? "Erro ao atualizar produção ❌" : "Erro ao salvar produção ❌");
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;
    
    setCarregando(true);
    try {
      await api.delete(`/producao/${id}`);
      toast.success("Registro excluído com sucesso ✅");
      carregarHistoricoOEE();
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      toast.error("Erro ao excluir registro ❌");
    } finally {
      setCarregando(false);
    }
  }

  function handleEdit(registro) {
    setEditId(registro.id);
    setProducao({
      turno: registro.turno.toString(),
      pecas_produzidas: registro.pecas_produzidas,
      pecas_boas: registro.pecas_boas,
      tempo_operando_min: registro.tempo_operando_min || "",
      data: registro.data.split('T')[0],
      paradas: registro.paradas || []
    });
    
    // Rolar para o formulário
    document.getElementById('formulario-producao')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditId(null);
    setProducao({
      turno: "1",
      pecas_produzidas: "",
      pecas_boas: "",
      tempo_operando_min: "",
      data: new Date().toISOString().split('T')[0],
      paradas: []
    });
  }

  const oeeCalculado = producao.pecas_produzidas ? calcularOEE() : null;

  // Se não houver empresa selecionada
  if (!filtros.empresaId) {
    return (
      <div style={{ padding: "clamp(20px, 5vw, 60px)", textAlign: "center" }}>
        <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px", maxWidth: "500px", margin: "0 auto" }}>
          <h2 style={{ color: "#1E3A8A" }}>Selecione uma empresa</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>Escolha uma empresa para visualizar o OEE.</p>
          <select
            value={filtros.empresaId}
            onChange={(e) => setFiltros({ ...filtros, empresaId: e.target.value })}
            style={{ padding: "10px", borderRadius: "4px", border: "1px solid #d1d5db", width: "100%" }}
          >
            <option value="">Selecione uma empresa...</option>
            {empresas.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.nome}</option>
            ))}
          </select>
        </div>
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
        <h1 style={{ color: "#1E3A8A", marginBottom: "5px", fontSize: "clamp(20px, 4vw, 28px)" }}>
          OEE - Eficiência Global
        </h1>
        <p style={{ color: "#666", fontSize: "clamp(12px, 2vw, 14px)" }}>
          Registre produção por turno e acompanhe a eficiência da linha
        </p>
      </div>

      {/* Filtros */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>Filtros</h3>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", 
          gap: "15px" 
        }}>
          <div>
            <label style={labelStyle}>Empresa</label>
            <select
              name="empresaId"
              value={filtros.empresaId}
              onChange={handleFiltroChange}
              style={inputStyle}
            >
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Linha</label>
            <select
              name="linhaId"
              value={filtros.linhaId}
              onChange={handleFiltroChange}
              style={inputStyle}
              disabled={!filtros.empresaId}
            >
              <option value="">Selecione...</option>
              {linhas.map(linha => (
                <option key={linha.id} value={linha.id}>{linha.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Produto</label>
            <select
              name="produtoId"
              value={filtros.produtoId}
              onChange={handleFiltroChange}
              style={inputStyle}
              disabled={!filtros.linhaId}
            >
              <option value="">Selecione...</option>
              {produtos.map(prod => (
                <option key={prod.id} value={prod.id}>{prod.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Data Início</label>
            <input
              type="date"
              name="dataInicio"
              value={filtros.dataInicio}
              onChange={handleFiltroChange}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Data Fim</label>
            <input
              type="date"
              name="dataFim"
              value={filtros.dataFim}
              onChange={handleFiltroChange}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Histórico OEE - Gráfico */}
      {historicoOEE.length > 0 && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "30px"
        }}>
          <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>📈 Tendência de OEE</h3>
          <div style={{ height: "300px" }}>
            <GraficoLinha
              labels={historicoOEE.map(h => h.data)}
              valores={historicoOEE.map(h => parseFloat(h.oee))}
              titulo="Evolução do OEE"
              cor={coresNexus.primary}
              formato="percentual"
            />
          </div>
        </div>
      )}

      {/* Formulário de Produção */}
      {filtros.linhaId && filtros.produtoId && (
        <div 
          id="formulario-producao"
          style={{ 
            backgroundColor: "white", 
            padding: "clamp(15px, 2vw, 25px)", 
            borderRadius: "8px", 
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            marginBottom: "30px"
          }}
        >
          <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>
            {editId ? "✏️ Editar Produção" : "📊 Registrar Produção"}
          </h3>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: "15px",
            marginBottom: "20px"
          }}>
            <div style={{ minWidth: "140px" }}>
              <label style={labelStyle}>Data *</label>
              <input
                type="date"
                name="data"
                value={producao.data}
                onChange={handleProducaoChange}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Turno</label>
              <select
                name="turno"
                value={producao.turno}
                onChange={handleProducaoChange}
                style={inputStyle}
              >
                <option value="1">1º Turno</option>
                <option value="2">2º Turno</option>
                <option value="3">3º Turno</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Peças Produzidas *</label>
              <input
                type="number"
                name="pecas_produzidas"
                value={producao.pecas_produzidas}
                onChange={handleProducaoChange}
                style={inputStyle}
                placeholder="Quantidade produzida"
              />
            </div>

            <div>
              <label style={labelStyle}>Peças Boas</label>
              <input
                type="number"
                name="pecas_boas"
                value={producao.pecas_boas}
                onChange={handleProducaoChange}
                style={inputStyle}
                placeholder="Deixe em branco se igual às produzidas"
              />
            </div>

            <div>
              <label style={labelStyle}>Tempo Operando (min)</label>
              <input
                type="number"
                name="tempo_operando_min"
                value={producao.tempo_operando_min}
                onChange={handleProducaoChange}
                style={inputStyle}
                placeholder="Tempo efetivo de produção"
              />
            </div>
          </div>

          {/* Cálculo OEE em Tempo Real */}
          {oeeCalculado ? (
            <div style={{ 
              backgroundColor: "#f9fafb", 
              padding: "15px", 
              borderRadius: "8px", 
              marginBottom: "20px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "15px",
              textAlign: "center"
            }}>
              <div>
                <div style={{ fontSize: "12px", color: "#666" }}>Takt Time</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: coresNexus.primary }}>{taktTime}s</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#666" }}>Disponibilidade</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: coresNexus.primary }}>{oeeCalculado.disponibilidade}%</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#666" }}>Performance</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: coresNexus.info }}>{oeeCalculado.performance}%</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#666" }}>Qualidade</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: coresNexus.warning }}>{oeeCalculado.qualidade}%</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#666" }}>OEE Global</div>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: parseFloat(oeeCalculado.oee) >= 85 ? "#16a34a" : parseFloat(oeeCalculado.oee) >= 60 ? "#f59e0b" : "#dc2626" }}>
                  {oeeCalculado.oee}%
                </div>
              </div>
            </div>
          ) : (filtros.linhaId && filtros.produtoId && (
            <div style={{ 
              backgroundColor: "#fef2f2", 
              padding: "15px", 
              borderRadius: "8px", 
              marginBottom: "20px",
              textAlign: "center",
              color: "#dc2626",
              border: "1px solid #fecaca"
            }}>
              ⚠️ Aguardando configuração do Takt Time para este produto na linha selecionada.
              <br />
              <small>Configure o Takt Time no cadastro da linha antes de registrar produção.</small>
            </div>
          ))}

          {/* Registro de Paradas */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ marginBottom: "10px" }}>⛔ Paradas</h4>
            
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "10px",
              marginBottom: "10px"
            }}>
              <div>
                <select
                  name="codigo"
                  value={novaParada.codigo}
                  onChange={handleParadaChange}
                  style={inputStyle}
                >
                  <option value="">Selecione o código</option>
                  {codigosParada.map(c => (
                    <option key={c.codigo} value={c.codigo}>{c.codigo} - {c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="number"
                  name="duracao_min"
                  value={novaParada.duracao_min}
                  onChange={handleParadaChange}
                  style={inputStyle}
                  placeholder="Duração (min)"
                />
              </div>
              <div>
                <input
                  type="text"
                  name="descricao"
                  value={novaParada.descricao}
                  onChange={handleParadaChange}
                  style={inputStyle}
                  placeholder="Descrição (opcional)"
                />
              </div>
              <div>
                <Botao variant="secondary" size="sm" onClick={adicionarParada} fullWidth>
                  + Adicionar Parada
                </Botao>
              </div>
            </div>

            {producao.paradas.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f3f4f6" }}>
                      <th style={{ padding: "8px", textAlign: "left" }}>Código</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>Parada</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>Duração</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>Descrição</th>
                      <th style={{ padding: "8px" }}></th>
                     </tr>
                  </thead>
                  <tbody>
                    {producao.paradas.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "8px" }}>{p.codigo}</td>
                        <td style={{ padding: "8px" }}>{p.nome}</td>
                        <td style={{ padding: "8px" }}>{p.duracao_min} min</td>
                        <td style={{ padding: "8px" }}>{p.descricao || "-"}</td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <Botao variant="danger" size="xs" onClick={() => removerParada(idx)}>
                            ✕
                          </Botao>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Botao
              variant="success"
              size="lg"
              fullWidth
              onClick={salvarProducao}
              loading={salvando}
              disabled={salvando || !producao.pecas_produzidas}
            >
              {salvando ? "Salvando..." : (editId ? "✅ Atualizar Produção" : "✅ Registrar Produção")}
            </Botao>
            
            {editId && (
              <Botao
                variant="secondary"
                size="lg"
                fullWidth
                onClick={handleCancelEdit}
              >
                Cancelar Edição
              </Botao>
            )}
          </div>
        </div>
      )}

      {/* Tabela de Histórico com Editar e Excluir */}
      {historicoOEE.length > 0 && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "20px", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>📋 Histórico de Produção</h3>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>Turno</th>
                  <th style={thStyle}>Produto</th>
                  <th style={thStyle}>Peças</th>
                  <th style={thStyle}>Disponibilidade</th>
                  <th style={thStyle}>Performance</th>
                  <th style={thStyle}>Qualidade</th>
                  <th style={thStyle}>OEE</th>
                  <th style={thStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {historicoOEE.map((h, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={tdStyle}>{new Date(h.data).toLocaleDateString('pt-BR')}</td>
                    <td style={tdStyle}>{h.turno}º Turno</td>
                    <td style={tdStyle}>{h.produto_nome}</td>
                    <td style={tdStyle}>{h.pecas_produzidas}</td>
                    <td style={tdStyle}>{h.disponibilidade}%</td>
                    <td style={tdStyle}>{h.performance}%</td>
                    <td style={tdStyle}>{h.qualidade}%</td>
                    <td style={tdStyle}>
                      <span style={{
                        fontWeight: "bold",
                        color: h.oee >= 85 ? "#16a34a" : h.oee >= 60 ? "#f59e0b" : "#dc2626"
                      }}>
                        {h.oee}%
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                        <Botao
                          variant="primary"
                          size="xs"
                          onClick={() => handleEdit(h)}
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                        >
                          Editar
                        </Botao>
                        <Botao
                          variant="danger"
                          size="xs"
                          onClick={() => handleDelete(h.id)}
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                        >
                          Excluir
                        </Botao>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos
const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "13px",
  fontWeight: "500"
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box"
};

const thStyle = {
  padding: "12px 8px",
  textAlign: "center",
  fontSize: "13px",
  fontWeight: "500"
};

const tdStyle = {
  padding: "10px 8px",
  textAlign: "center",
  fontSize: "13px"
};
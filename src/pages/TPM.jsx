// src/pages/TPM.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';
import GraficoPizza from "../components/graficos/GraficoPizza";
import GraficoBarras from "../components/graficos/GraficoBarras";
import { coresNexus } from "../components/graficos/GraficoBase";

// Tipos de manutenção corrigidos
const tiposManutencao = [
  { valor: "corretiva", label: "🔧 Corretiva", cor: "#dc2626" },
  { valor: "preventiva", label: "📅 Preventiva", cor: "#3b82f6" },
  { valor: "preditiva", label: "📊 Preditiva", cor: "#8b5cf6" },
  { valor: "detectiva", label: "🔍 Detectiva", cor: "#f59e0b" }
];

const causasParada = [
  "Elétrica", "Mecânica", "Eletrônica", "Software", 
  "Operacional", "Ferramenta", "Material", "Outro"
];

export default function TPM() {
  const { clienteAtual } = useOutletContext();

  const [empresas, setEmpresas] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [postos, setPostos] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [editId, setEditId] = useState(null);
  
  const [filtros, setFiltros] = useState({
    empresaId: clienteAtual || "",
    linhaId: "",
    postoId: "",
    dataInicio: "",
    dataFim: ""
  });

  const [novoRegistro, setNovoRegistro] = useState({
    posto_id: "",
    tipo: "",
    causa: "",
    tempo_parada_min: "",
    tempo_reparo_min: "",
    descricao: "",
    peca_substituida: "",
    turno: ""
  });

  const [estatisticas, setEstatisticas] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api.get("/companies")
      .then(res => setEmpresas(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (filtros.empresaId) {
      api.get(`/lines/${filtros.empresaId}`)
        .then(res => setLinhas(res.data))
        .catch(err => console.error(err));
    }
  }, [filtros.empresaId]);

  useEffect(() => {
    if (filtros.linhaId) {
      api.get(`/work-stations/${filtros.linhaId}`)
        .then(res => setPostos(res.data))
        .catch(err => console.error(err));
    }
  }, [filtros.linhaId]);

  useEffect(() => {
    if (filtros.linhaId && filtros.dataInicio && filtros.dataFim) {
      carregarRegistros();
    }
  }, [filtros.linhaId, filtros.dataInicio, filtros.dataFim, filtros.postoId]);

  async function carregarRegistros() {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtros.dataInicio) params.append('data_inicio', filtros.dataInicio);
      if (filtros.dataFim) params.append('data_fim', filtros.dataFim);
      if (filtros.postoId) params.append('posto_id', filtros.postoId);
      
      const res = await api.get(`/manutencao/registros/linha/${filtros.linhaId}?${params}`);
      setRegistros(res.data);
      calcularEstatisticas(res.data);
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    } finally {
      setCarregando(false);
    }
  }

  function calcularEstatisticas(dados) {
    if (dados.length === 0) {
      setEstatisticas(null);
      return;
    }

    const totalParadas = dados.length;
    const tempoTotalParado = dados.reduce((sum, r) => sum + (r.tempo_parada_min || 0), 0);
    const tempoTotalReparo = dados.reduce((sum, r) => sum + (r.tempo_reparo_min || 0), 0);
    
    const mtbf = tempoTotalParado / totalParadas;
    const mttr = tempoTotalReparo / totalParadas;
    
    const corretivas = dados.filter(r => r.tipo === "corretiva").length;
    const preventivas = dados.filter(r => r.tipo === "preventiva").length;
    const preditivas = dados.filter(r => r.tipo === "preditiva").length;
    const detectivas = dados.filter(r => r.tipo === "detectiva").length;
    
    const causasMap = {};
    dados.forEach(r => {
      causasMap[r.causa] = (causasMap[r.causa] || 0) + 1;
    });
    const causaMaisFrequente = Object.entries(causasMap).sort((a, b) => b[1] - a[1])[0];

    setEstatisticas({
      total_paradas: totalParadas,
      tempo_total_parado: tempoTotalParado,
      tempo_total_reparo: tempoTotalReparo,
      mtbf: (mtbf / 60).toFixed(1),
      mttr: mttr.toFixed(1),
      corretivas,
      preventivas,
      preditivas,
      detectivas,
      causa_mais_frequente: causaMaisFrequente ? causaMaisFrequente[0] : "-",
      causas: causasMap
    });
  }

  const handleFiltroChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const handleFormChange = (e) => {
    setNovoRegistro({ ...novoRegistro, [e.target.name]: e.target.value });
  };

  async function salvarRegistro() {
    if (!novoRegistro.posto_id || !novoRegistro.tipo || !novoRegistro.tempo_parada_min || !novoRegistro.turno) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSalvando(true);
    try {
      const dados = {
        posto_id: parseInt(novoRegistro.posto_id),
        tipo: novoRegistro.tipo,
        causa: novoRegistro.causa || null,
        tempo_parada_min: parseFloat(novoRegistro.tempo_parada_min),
        tempo_reparo_min: parseFloat(novoRegistro.tempo_reparo_min) || 0,
        descricao: novoRegistro.descricao || null,
        peca_substituida: novoRegistro.peca_substituida || null,
        turno: parseInt(novoRegistro.turno),
        data: new Date().toISOString().split('T')[0]
      };

      if (editId) {
        await api.put(`/manutencao/registros/${editId}`, dados);
        toast.success("Registro atualizado com sucesso! ✅");
        setEditId(null);
      } else {
        await api.post("/manutencao/registros", dados);
        toast.success("Registro de manutenção salvo! ✅");
      }
      
      setNovoRegistro({
        posto_id: "",
        tipo: "",
        causa: "",
        tempo_parada_min: "",
        tempo_reparo_min: "",
        descricao: "",
        peca_substituida: "",
        turno: ""
      });
      
      carregarRegistros();
      
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error(editId ? "Erro ao atualizar registro ❌" : "Erro ao salvar registro ❌");
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Deseja realmente excluir este registro?")) return;
    
    setCarregando(true);
    try {
      await api.delete(`/manutencao/registros/${id}`);
      toast.success("Registro excluído com sucesso ✅");
      carregarRegistros();
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      toast.error("Erro ao excluir registro ❌");
    } finally {
      setCarregando(false);
    }
  }

  function handleEdit(registro) {
    setEditId(registro.id);
    setNovoRegistro({
      posto_id: registro.posto_id.toString(),
      tipo: registro.tipo,
      causa: registro.causa || "",
      tempo_parada_min: registro.tempo_parada_min,
      tempo_reparo_min: registro.tempo_reparo_min || "",
      descricao: registro.descricao || "",
      peca_substituida: registro.peca_substituida || "",
      turno: registro.turno.toString()
    });
    
    document.getElementById('formulario-manutencao')?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditId(null);
    setNovoRegistro({
      posto_id: "",
      tipo: "",
      causa: "",
      tempo_parada_min: "",
      tempo_reparo_min: "",
      descricao: "",
      peca_substituida: "",
      turno: ""
    });
  }

  const getPostoNome = (id) => {
    const posto = postos.find(p => p.id === id);
    return posto ? posto.nome : `Posto ${id}`;
  };

  const getTipoLabel = (valor) => {
    const tipo = tiposManutencao.find(t => t.valor === valor);
    return tipo ? tipo.label : valor;
  };

  // Preparar dados para gráficos
  const dadosGraficoTipos = estatisticas ? {
    labels: ["Corretiva", "Preventiva", "Preditiva", "Detectiva"],
    valores: [estatisticas.corretivas, estatisticas.preventivas, estatisticas.preditivas, estatisticas.detectivas]
  } : null;

  const dadosGraficoCausas = estatisticas && estatisticas.causas ? {
    labels: Object.keys(estatisticas.causas),
    valores: Object.values(estatisticas.causas)
  } : null;

  if (!filtros.empresaId) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px", maxWidth: "500px", margin: "0 auto" }}>
          <h2 style={{ color: "#1E3A8A" }}>Selecione uma empresa</h2>
          <select
            value={filtros.empresaId}
            onChange={(e) => setFiltros({ ...filtros, empresaId: e.target.value })}
            style={{ padding: "10px", borderRadius: "4px", border: "1px solid #d1d5db", width: "100%", marginTop: "20px" }}
          >
            <option value="">Selecione...</option>
            {empresas.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.nome}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "clamp(15px, 3vw, 30px)", maxWidth: "1400px", margin: "0 auto" }}>
      
      <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "8px", marginBottom: "30px" }}>
        <h1 style={{ color: "#1E3A8A" }}>TPM - Manutenção e Confiabilidade</h1>
        <p style={{ color: "#666" }}>Registre paradas, acompanhe MTBF e MTTR</p>
      </div>

      {/* Filtros */}
      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
        <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>Filtros</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
          <div>
            <label style={labelStyle}>Empresa</label>
            <select name="empresaId" value={filtros.empresaId} onChange={handleFiltroChange} style={inputStyle}>
              {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Linha</label>
            <select name="linhaId" value={filtros.linhaId} onChange={handleFiltroChange} style={inputStyle}>
              <option value="">Selecione a linha</option>
              {linhas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Posto</label>
            <select name="postoId" value={filtros.postoId} onChange={handleFiltroChange} style={inputStyle}>
              <option value="">Selecione o posto</option>
              {postos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Data Início</label><input type="date" name="dataInicio" value={filtros.dataInicio} onChange={handleFiltroChange} style={inputStyle} /></div>
          <div><label style={labelStyle}>Data Fim</label><input type="date" name="dataFim" value={filtros.dataFim} onChange={handleFiltroChange} style={inputStyle} /></div>
        </div>
      </div>

      {/* Gráficos e Indicadores */}
      {estatisticas && (
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
          <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>📊 Indicadores de Confiabilidade</h3>
          
          {/* Cards de MTBF e MTTR */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginBottom: "20px" }}>
            <div style={{ backgroundColor: "#f9fafb", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>Total de Paradas</div>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1E3A8A" }}>{estatisticas.total_paradas}</div>
            </div>
            <div style={{ backgroundColor: "#f9fafb", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>MTBF</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#16a34a" }}>{estatisticas.mtbf} h</div>
              <div style={{ fontSize: "11px", color: "#666" }}>Tempo médio entre falhas</div>
            </div>
            <div style={{ backgroundColor: "#f9fafb", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>MTTR</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#f59e0b" }}>{estatisticas.mttr} min</div>
              <div style={{ fontSize: "11px", color: "#666" }}>Tempo médio de reparo</div>
            </div>
            <div style={{ backgroundColor: "#f9fafb", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>Causa + Frequente</div>
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>{estatisticas.causa_mais_frequente}</div>
            </div>
          </div>

          {/* Gráficos */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {dadosGraficoTipos && dadosGraficoTipos.valores.some(v => v > 0) && (
              <div>
                <GraficoPizza
                  labels={dadosGraficoTipos.labels}
                  valores={dadosGraficoTipos.valores}
                  titulo="Tipos de Manutenção"
                  cores={["#dc2626", "#3b82f6", "#8b5cf6", "#f59e0b"]}
                />
              </div>
            )}
            {dadosGraficoCausas && dadosGraficoCausas.valores.some(v => v > 0) && (
              <div>
                <GraficoBarras
                  labels={dadosGraficoCausas.labels}
                  valores={dadosGraficoCausas.valores}
                  titulo="Causas mais Frequentes"
                  cor={coresNexus.primary}
                  formato="numero"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Formulário */}
      <div 
        id="formulario-manutencao"
        style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}
      >
        <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>
          {editId ? "✏️ Editar Registro de Manutenção" : "🔧 Novo Registro de Manutenção"}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" }}>
          <div><label style={labelStyle}>Posto *</label><select name="posto_id" value={novoRegistro.posto_id} onChange={handleFormChange} style={inputStyle}><option value="">Selecione</option>{postos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
          <div><label style={labelStyle}>Tipo *</label><select name="tipo" value={novoRegistro.tipo} onChange={handleFormChange} style={inputStyle}><option value="">Selecione</option>{tiposManutencao.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}</select></div>
          <div><label style={labelStyle}>Causa</label><select name="causa" value={novoRegistro.causa} onChange={handleFormChange} style={inputStyle}><option value="">Selecione</option>{causasParada.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label style={labelStyle}>Tempo Parada (min) *</label><input type="number" name="tempo_parada_min" value={novoRegistro.tempo_parada_min} onChange={handleFormChange} style={inputStyle} /></div>
          <div><label style={labelStyle}>Tempo Reparo (min)</label><input type="number" name="tempo_reparo_min" value={novoRegistro.tempo_reparo_min} onChange={handleFormChange} style={inputStyle} /></div>
          <div><label style={labelStyle}>Turno *</label><select name="turno" value={novoRegistro.turno} onChange={handleFormChange} style={inputStyle}><option value="">Selecione o turno</option><option value="1">1º Turno</option><option value="2">2º Turno</option><option value="3">3º Turno</option></select></div>
        </div>
        <div style={{ marginBottom: "15px" }}><label style={labelStyle}>Descrição</label><input type="text" name="descricao" value={novoRegistro.descricao} onChange={handleFormChange} style={inputStyle} placeholder="Descreva o ocorrido..." /></div>
        <div style={{ marginBottom: "15px" }}><label style={labelStyle}>Peça Substituída</label><input type="text" name="peca_substituida" value={novoRegistro.peca_substituida} onChange={handleFormChange} style={inputStyle} placeholder="Peça trocada (se aplicável)" /></div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Botao variant="success" size="md" fullWidth onClick={salvarRegistro} loading={salvando}>
            {editId ? "Atualizar Registro" : "Registrar Manutenção"}
          </Botao>
          {editId && (
            <Botao variant="secondary" size="md" fullWidth onClick={handleCancelEdit}>
              Cancelar Edição
            </Botao>
          )}
        </div>
      </div>

      {/* Histórico com Editar e Excluir */}
      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px" }}>
        <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>📋 Histórico de Manutenção</h3>
        {carregando ? <div style={{ textAlign: "center", padding: "40px" }}>Carregando...</div> : registros.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>Nenhum registro encontrado.</div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                  <th style={thStyle}>Data</th>
                  <th style={thStyle}>Posto</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Causa</th>
                  <th style={thStyle}>Parada</th>
                  <th style={thStyle}>Reparo</th>
                  <th style={thStyle}>Turno</th>
                  <th style={thStyle}>Ações</th>
                 </tr>
              </thead>
              <tbody>
                {registros.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={tdStyle}>{new Date(r.data).toLocaleDateString('pt-BR')}</td>
                    <td style={tdStyle}>{getPostoNome(r.posto_id)}</td>
                    <td style={tdStyle}>{getTipoLabel(r.tipo)}</td>
                    <td style={tdStyle}>{r.causa || "-"}</td>
                    <td style={tdStyle}>{r.tempo_parada_min} min</td>
                    <td style={tdStyle}>{r.tempo_reparo_min || "-"} min</td>
                    <td style={tdStyle}>{r.turno}º</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
                        <Botao
                          variant="primary"
                          size="xs"
                          onClick={() => handleEdit(r)}
                          style={{ padding: "4px 8px", fontSize: "11px" }}
                        >
                          Editar
                        </Botao>
                        <Botao
                          variant="danger"
                          size="xs"
                          onClick={() => handleDelete(r.id)}
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
        )}
      </div>
    </div>
  );
}

const labelStyle = { display: "block", marginBottom: "6px", color: "#374151", fontSize: "13px", fontWeight: "500" };
const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" };
const thStyle = { padding: "12px 8px", textAlign: "center", fontSize: "13px", fontWeight: "500" };
const tdStyle = { padding: "10px 8px", textAlign: "center", fontSize: "13px" };
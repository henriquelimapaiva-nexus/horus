// src/pages/TPM.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Tipos de parada e causas
const tiposParada = [
  { valor: "quebra", label: "Quebra de Máquina", cor: "#dc2626" },
  { valor: "setup", label: "Setup / Troca", cor: "#f59e0b" },
  { valor: "manutencao", label: "Manutenção Preventiva", cor: "#3b82f6" },
  { valor: "falta_material", label: "Falta de Material", cor: "#8b5cf6" },
  { valor: "falta_operador", label: "Falta de Operador", cor: "#ec489a" }
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
  
  const [filtros, setFiltros] = useState({
    empresaId: clienteAtual || "",
    linhaId: "",
    postoId: "",
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0]
  });

  const [novoRegistro, setNovoRegistro] = useState({
    posto_id: "",
    tipo: "",
    causa: "",
    tempo_parada_min: "",
    tempo_reparo_min: "",
    descricao: "",
    peca_substituida: "",
    turno: "1"
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
    
    const quebras = dados.filter(r => r.tipo === "quebra").length;
    const setups = dados.filter(r => r.tipo === "setup").length;
    
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
      quebras,
      setups,
      causa_mais_frequente: causaMaisFrequente ? causaMaisFrequente[0] : "-"
    });
  }

  const handleFiltroChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const handleFormChange = (e) => {
    setNovoRegistro({ ...novoRegistro, [e.target.name]: e.target.value });
  };

  async function salvarRegistro() {
    if (!novoRegistro.posto_id || !novoRegistro.tipo || !novoRegistro.tempo_parada_min) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setSalvando(true);
    try {
      await api.post("/manutencao/registros", {
        ...novoRegistro,
        tempo_parada_min: parseFloat(novoRegistro.tempo_parada_min),
        tempo_reparo_min: parseFloat(novoRegistro.tempo_reparo_min) || 0,
        turno: parseInt(novoRegistro.turno),
        data: new Date().toISOString().split('T')[0]
      });
      
      toast.success("Registro de manutenção salvo! ✅");
      
      setNovoRegistro({
        posto_id: "",
        tipo: "",
        causa: "",
        tempo_parada_min: "",
        tempo_reparo_min: "",
        descricao: "",
        peca_substituida: "",
        turno: "1"
      });
      
      carregarRegistros();
      
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar registro ❌");
    } finally {
      setSalvando(false);
    }
  }

  const getPostoNome = (id) => {
    const posto = postos.find(p => p.id === id);
    return posto ? posto.nome : `Posto ${id}`;
  };

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
              <option value="">Todas</option>
              {linhas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Posto</label>
            <select name="postoId" value={filtros.postoId} onChange={handleFiltroChange} style={inputStyle}>
              <option value="">Todos</option>
              {postos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Data Início</label><input type="date" name="dataInicio" value={filtros.dataInicio} onChange={handleFiltroChange} style={inputStyle} /></div>
          <div><label style={labelStyle}>Data Fim</label><input type="date" name="dataFim" value={filtros.dataFim} onChange={handleFiltroChange} style={inputStyle} /></div>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
          <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>📊 Indicadores de Confiabilidade</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px" }}>
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
        </div>
      )}

      {/* Formulário */}
      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
        <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>🔧 Novo Registro de Manutenção</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" }}>
          <div><label style={labelStyle}>Posto *</label><select name="posto_id" value={novoRegistro.posto_id} onChange={handleFormChange} style={inputStyle}><option value="">Selecione</option>{postos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></div>
          <div><label style={labelStyle}>Tipo *</label><select name="tipo" value={novoRegistro.tipo} onChange={handleFormChange} style={inputStyle}><option value="">Selecione</option>{tiposParada.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}</select></div>
          <div><label style={labelStyle}>Causa</label><select name="causa" value={novoRegistro.causa} onChange={handleFormChange} style={inputStyle}><option value="">Selecione</option>{causasParada.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label style={labelStyle}>Tempo Parada (min) *</label><input type="number" name="tempo_parada_min" value={novoRegistro.tempo_parada_min} onChange={handleFormChange} style={inputStyle} /></div>
          <div><label style={labelStyle}>Tempo Reparo (min)</label><input type="number" name="tempo_reparo_min" value={novoRegistro.tempo_reparo_min} onChange={handleFormChange} style={inputStyle} /></div>
          <div><label style={labelStyle}>Turno</label><select name="turno" value={novoRegistro.turno} onChange={handleFormChange} style={inputStyle}><option value="1">1º Turno</option><option value="2">2º Turno</option><option value="3">3º Turno</option></select></div>
        </div>
        <div style={{ marginBottom: "15px" }}><label style={labelStyle}>Descrição</label><input type="text" name="descricao" value={novoRegistro.descricao} onChange={handleFormChange} style={inputStyle} placeholder="Descreva o ocorrido..." /></div>
        <div style={{ marginBottom: "15px" }}><label style={labelStyle}>Peça Substituída</label><input type="text" name="peca_substituida" value={novoRegistro.peca_substituida} onChange={handleFormChange} style={inputStyle} placeholder="Peça trocada (se aplicável)" /></div>
        <Botao variant="success" size="md" fullWidth onClick={salvarRegistro} loading={salvando}>Registrar Manutenção</Botao>
      </div>

      {/* Histórico */}
      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px" }}>
        <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>📋 Histórico de Manutenção</h3>
        {carregando ? <div style={{ textAlign: "center", padding: "40px" }}>Carregando...</div> : registros.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>Nenhum registro encontrado.</div> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ backgroundColor: "#1E3A8A", color: "white" }}><th style={thStyle}>Data</th><th style={thStyle}>Posto</th><th style={thStyle}>Tipo</th><th style={thStyle}>Causa</th><th style={thStyle}>Parada</th><th style={thStyle}>Reparo</th><th style={thStyle}>Turno</th></tr></thead>
              <tbody>
                {registros.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={tdStyle}>{new Date(r.data).toLocaleDateString('pt-BR')}</td>
                    <td style={tdStyle}>{getPostoNome(r.posto_id)}</td>
                    <td style={tdStyle}>{tiposParada.find(t => t.valor === r.tipo)?.label || r.tipo}</td>
                    <td style={tdStyle}>{r.causa || "-"}</td>
                    <td style={tdStyle}>{r.tempo_parada_min} min</td>
                    <td style={tdStyle}>{r.tempo_reparo_min || "-"} min</td>
                    <td style={tdStyle}>{r.turno}º</td>
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
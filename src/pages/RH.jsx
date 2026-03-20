// src/pages/RH.jsx
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

export default function RH() {
  const { clienteAtual } = useOutletContext();

  const [empresas, setEmpresas] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [treinamentos, setTreinamentos] = useState([]);
  
  const [filtros, setFiltros] = useState({
    empresaId: clienteAtual || "",
    colaboradorId: "",
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0]
  });

  const [novoTreinamento, setNovoTreinamento] = useState({
    colaborador_id: "",
    nome_curso: "",
    carga_horaria: "",
    data_realizacao: new Date().toISOString().split('T')[0],
    certificado: "",
    observacao: ""
  });

  const [novaHabilidade, setNovaHabilidade] = useState({
    colaborador_id: "",
    habilidade: "",
    nivel: "3"
  });

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("treinamentos");

  const niveisHabilidade = [
    { valor: "1", label: "Básico - Supervisionado" },
    { valor: "2", label: "Intermediário - Executa com ajuda" },
    { valor: "3", label: "Avançado - Executa sozinho" },
    { valor: "4", label: "Especialista - Treina outros" },
    { valor: "5", label: "Mestre - Cria métodos" }
  ];

  useEffect(() => {
    api.get("/companies").then(res => setEmpresas(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (filtros.empresaId) {
      api.get(`/employees/${filtros.empresaId}`).then(res => setColaboradores(res.data)).catch(console.error);
    }
  }, [filtros.empresaId]);

  useEffect(() => {
    if (filtros.colaboradorId) {
      carregarDados();
    }
  }, [filtros.colaboradorId]);

  async function carregarDados() {
    setCarregando(true);
    try {
      const [treinamentosRes, habilidadesRes] = await Promise.all([
        api.get(`/rh/treinamentos/colaborador/${filtros.colaboradorId}`),
        api.get(`/rh/habilidades/colaborador/${filtros.colaboradorId}`)
      ]);
      setTreinamentos(treinamentosRes.data || []);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setCarregando(false);
    }
  }

  async function salvarTreinamento() {
    if (!novoTreinamento.colaborador_id || !novoTreinamento.nome_curso) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setSalvando(true);
    try {
      await api.post("/rh/treinamentos", novoTreinamento);
      toast.success("Treinamento registrado! ✅");
      setNovoTreinamento({
        colaborador_id: filtros.colaboradorId,
        nome_curso: "",
        carga_horaria: "",
        data_realizacao: new Date().toISOString().split('T')[0],
        certificado: "",
        observacao: ""
      });
      carregarDados();
    } catch (error) {
      toast.error("Erro ao registrar treinamento ❌");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarHabilidade() {
    if (!novaHabilidade.colaborador_id || !novaHabilidade.habilidade) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setSalvando(true);
    try {
      await api.post("/rh/habilidades", novaHabilidade);
      toast.success("Habilidade registrada! ✅");
      setNovaHabilidade({
        colaborador_id: filtros.colaboradorId,
        habilidade: "",
        nivel: "3"
      });
      carregarDados();
    } catch (error) {
      toast.error("Erro ao registrar habilidade ❌");
    } finally {
      setSalvando(false);
    }
  }

  if (!filtros.empresaId) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "8px", maxWidth: "500px", margin: "0 auto" }}>
          <h2 style={{ color: "#1E3A8A" }}>Selecione uma empresa</h2>
          <select onChange={(e) => setFiltros({ ...filtros, empresaId: e.target.value })} style={{ padding: "10px", borderRadius: "4px", width: "100%", marginTop: "20px" }}>
            <option value="">Selecione...</option>
            {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
          </select>
        </div>
      </div>
    );
  }

  const colaboradorSelecionado = colaboradores.find(c => c.id === parseInt(filtros.colaboradorId));

  return (
    <div style={{ padding: "clamp(15px, 3vw, 30px)", maxWidth: "1400px", margin: "0 auto" }}>
      
      <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "8px", marginBottom: "30px" }}>
        <h1 style={{ color: "#1E3A8A" }}>RH - Gestão de Talentos</h1>
        <p style={{ color: "#666" }}>Registre treinamentos, habilidades e acompanhe o desenvolvimento da equipe</p>
      </div>

      <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px" }}>
          <div>
            <label style={labelStyle}>Empresa</label>
            <select value={filtros.empresaId} onChange={(e) => setFiltros({ ...filtros, empresaId: e.target.value, colaboradorId: "" })} style={inputStyle}>
              {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Colaborador</label>
            <select value={filtros.colaboradorId} onChange={(e) => setFiltros({ ...filtros, colaboradorId: e.target.value })} style={inputStyle}>
              <option value="">Selecione um colaborador</option>
              {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>
      </div>

      {colaboradorSelecionado && (
        <>
          <div style={{ backgroundColor: "#f0f9ff", padding: "15px", borderRadius: "8px", marginBottom: "30px", borderLeft: "4px solid #1E3A8A" }}>
            <h2 style={{ margin: 0, color: "#1E3A8A" }}>{colaboradorSelecionado.nome}</h2>
            <p style={{ margin: "5px 0 0", color: "#666" }}>Cargo: {colaboradorSelecionado.cargo_nome || "Não definido"}</p>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #e5e7eb" }}>
            <button onClick={() => setAbaAtiva("treinamentos")} style={{ padding: "10px 20px", backgroundColor: abaAtiva === "treinamentos" ? "#1E3A8A" : "transparent", color: abaAtiva === "treinamentos" ? "white" : "#1E3A8A", border: "none", borderRadius: "8px 8px 0 0", cursor: "pointer" }}>📚 Treinamentos</button>
            <button onClick={() => setAbaAtiva("habilidades")} style={{ padding: "10px 20px", backgroundColor: abaAtiva === "habilidades" ? "#1E3A8A" : "transparent", color: abaAtiva === "habilidades" ? "white" : "#1E3A8A", border: "none", borderRadius: "8px 8px 0 0", cursor: "pointer" }}>⭐ Matriz de Habilidades</button>
          </div>

          {abaAtiva === "treinamentos" && (
            <>
              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
                <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>➕ Novo Treinamento</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" }}>
                  <input type="text" name="nome_curso" value={novoTreinamento.nome_curso} onChange={(e) => setNovoTreinamento({ ...novoTreinamento, nome_curso: e.target.value, colaborador_id: filtros.colaboradorId })} placeholder="Nome do Curso *" style={inputStyle} />
                  <input type="number" name="carga_horaria" value={novoTreinamento.carga_horaria} onChange={(e) => setNovoTreinamento({ ...novoTreinamento, carga_horaria: e.target.value })} placeholder="Carga Horária (h)" style={inputStyle} />
                  <input type="date" name="data_realizacao" value={novoTreinamento.data_realizacao} onChange={(e) => setNovoTreinamento({ ...novoTreinamento, data_realizacao: e.target.value })} style={inputStyle} />
                  <input type="text" name="certificado" value={novoTreinamento.certificado} onChange={(e) => setNovoTreinamento({ ...novoTreinamento, certificado: e.target.value })} placeholder="Certificado (opcional)" style={inputStyle} />
                </div>
                <input type="text" name="observacao" value={novoTreinamento.observacao} onChange={(e) => setNovoTreinamento({ ...novoTreinamento, observacao: e.target.value })} placeholder="Observações" style={{ ...inputStyle, marginBottom: "15px" }} />
                <Botao variant="success" size="md" fullWidth onClick={salvarTreinamento} loading={salvando}>Registrar Treinamento</Botao>
              </div>

              <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px" }}>
                <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>📋 Histórico de Treinamentos</h3>
                {treinamentos.length === 0 ? <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>Nenhum treinamento registrado.</div> : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr style={{ backgroundColor: "#1E3A8A", color: "white" }}><th style={thStyle}>Data</th><th style={thStyle}>Curso</th><th style={thStyle}>Carga</th><th style={thStyle}>Certificado</th></tr></thead>
                      <tbody>
                        {treinamentos.map((t, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <td style={tdStyle}>{new Date(t.data_realizacao).toLocaleDateString('pt-BR')}</td>
                            <td style={tdStyle}>{t.nome_curso}</td>
                            <td style={tdStyle}>{t.carga_horaria}h</td>
                            <td style={tdStyle}>{t.certificado ? "✅" : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {abaAtiva === "habilidades" && (
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px" }}>
              <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>➕ Nova Habilidade</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginBottom: "15px" }}>
                <input type="text" placeholder="Habilidade *" value={novaHabilidade.habilidade} onChange={(e) => setNovaHabilidade({ ...novaHabilidade, habilidade: e.target.value, colaborador_id: filtros.colaboradorId })} style={inputStyle} />
                <select value={novaHabilidade.nivel} onChange={(e) => setNovaHabilidade({ ...novaHabilidade, nivel: e.target.value })} style={inputStyle}>
                  {niveisHabilidade.map(n => <option key={n.valor} value={n.valor}>{n.label}</option>)}
                </select>
              </div>
              <Botao variant="success" size="md" fullWidth onClick={salvarHabilidade} loading={salvando}>Registrar Habilidade</Botao>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const labelStyle = { display: "block", marginBottom: "6px", color: "#374151", fontSize: "13px", fontWeight: "500" };
const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #d1d5db", fontSize: "14px", outline: "none", boxSizing: "border-box" };
const thStyle = { padding: "12px 8px", textAlign: "center", fontSize: "13px", fontWeight: "500" };
const tdStyle = { padding: "10px 8px", textAlign: "center", fontSize: "13px" };
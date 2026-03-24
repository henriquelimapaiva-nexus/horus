// src/pages/consultor/RegistroHoras.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import Botao from "../../components/ui/Botao";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import toast from 'react-hot-toast';

export default function RegistroHoras() {
  const [carregando, setCarregando] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [resumo, setResumo] = useState({ total_horas: 0, horas_faturaveis: 0, horas_administrativas: 0 });
  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    horas: "",
    tipo: "faturável",
    descricao: ""
  });

  useEffect(() => {
    carregarRegistros();
    carregarResumo();
  }, []);

  const carregarRegistros = async () => {
    try {
      const res = await api.get("/horas");
      setRegistros(res.data);
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
      toast.error("Erro ao carregar registros");
    }
  };

  const carregarResumo = async () => {
    try {
      const res = await api.get("/horas/resumo");
      setResumo(res.data);
    } catch (error) {
      console.error("Erro ao carregar resumo:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.horas || form.horas <= 0) {
      toast.error("Informe a quantidade de horas");
      return;
    }
    
    setCarregando(true);
    try {
      await api.post("/horas", form);
      toast.success("Horas registradas com sucesso!");
      setForm({
        data: new Date().toISOString().split('T')[0],
        horas: "",
        tipo: "faturável",
        descricao: ""
      });
      carregarRegistros();
      carregarResumo();
    } catch (error) {
      console.error("Erro ao registrar:", error);
      toast.error("Erro ao registrar horas");
    } finally {
      setCarregando(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  // Calcular valor estimado (baseado em R$ 120/hora)
  const valorHora = 120;
  const valorFaturado = resumo.horas_faturaveis * valorHora;

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      
      {/* Cabeçalho */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ color: "#1E3A8A", marginBottom: "5px" }}>
          ⏱️ Registro de Horas
        </h1>
        <p style={{ color: "#666" }}>
          Registre suas horas trabalhadas e acompanhe sua produtividade
        </p>
      </div>

      {/* Resumo */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        <CardResumo titulo="Total Horas" valor={`${resumo.total_horas}h`} cor="#1E3A8A" />
        <CardResumo titulo="Horas Faturáveis" valor={`${resumo.horas_faturaveis}h`} cor="#16a34a" />
        <CardResumo titulo="Horas Administrativas" valor={`${resumo.horas_administrativas}h`} cor="#f59e0b" />
        <CardResumo titulo="Valor Estimado" valor={formatarMoeda(valorFaturado)} cor="#059669" />
      </div>

      {/* Formulário */}
      <Card titulo="Registrar Horas">
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
            <Input
              label="Data"
              type="date"
              value={form.data}
              onChange={(e) => setForm({...form, data: e.target.value})}
              required
            />
            <Input
              label="Horas"
              type="number"
              step="0.5"
              value={form.horas}
              onChange={(e) => setForm({...form, horas: e.target.value})}
              placeholder="Ex: 4.5"
              required
            />
            <Select
              label="Tipo"
              value={form.tipo}
              onChange={(e) => setForm({...form, tipo: e.target.value})}
              options={[
                { value: "faturável", label: "Faturável (projeto)" },
                { value: "administrativo", label: "Administrativo" }
              ]}
            />
            <Input
              label="Descrição"
              value={form.descricao}
              onChange={(e) => setForm({...form, descricao: e.target.value})}
              placeholder="Ex: Análise de dados Metalúrgica ABC"
            />
          </div>
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
            <Botao type="submit" loading={carregando}>
              Registrar Horas
            </Botao>
          </div>
        </form>
      </Card>

      {/* Lista de registros */}
      <Card titulo="Registros do Mês" style={{ marginTop: "30px" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                <th style={thStyle}>Data</th>
                <th style={thStyle}>Horas</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Descrição</th>
               </tr>
            </thead>
            <tbody>
              {registros.map(reg => (
                <tr key={reg.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdStyle}>{new Date(reg.data).toLocaleDateString('pt-BR')}</td>
                  <td style={tdStyle}>{reg.horas}h</td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      backgroundColor: reg.tipo === "faturável" ? "#16a34a20" : "#f59e0b20",
                      color: reg.tipo === "faturável" ? "#16a34a" : "#f59e0b"
                    }}>
                      {reg.tipo === "faturável" ? "Faturável" : "Administrativo"}
                    </span>
                  </td>
                  <td style={tdStyle}>{reg.descricao || "-"}</td>
                </tr>
              ))}
              {registros.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                    Nenhum registro encontrado este mês
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CardResumo({ titulo, valor, cor }) {
  return (
    <div style={{
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      borderLeft: `4px solid ${cor}`,
      textAlign: "center"
    }}>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>{titulo}</div>
      <div style={{ fontSize: "24px", fontWeight: "bold", color: cor }}>{valor}</div>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "12px",
  fontWeight: "600",
  color: "#374151"
};

const tdStyle = {
  padding: "12px",
  color: "#1f2937"
};
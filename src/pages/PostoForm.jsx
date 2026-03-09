// src/pages/PostoForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Função auxiliar para truncar texto
const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function PostoForm() {
  const navigate = useNavigate();
  const { linhaId, postoId } = useParams();

  const [form, setForm] = useState({
    nome: "",
    linha_id: linhaId || "",
    tempo_ciclo_segundos: "",
    tempo_setup_minutos: "",
    disponibilidade_percentual: "95",
    cargo_id: "",
    ordem_fluxo: ""
  });

  const [cargos, setCargos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (linhaId) {
      buscarDadosLinha();
    }
  }, [linhaId]);

  useEffect(() => {
    if (postoId) {
      carregarPosto();
    }
  }, [postoId]);

  useEffect(() => {
    if (empresaId) {
      carregarCargos();
    }
  }, [empresaId]);

  async function buscarDadosLinha() {
    try {
      const res = await api.get(`/linhas/${linhaId}`);
      if (res.data && res.data.length > 0) {
        const linha = res.data[0];
        setEmpresaId(linha.empresa_id);
      }
    } catch (error) {
      console.error("Erro ao buscar dados da linha:", error);
      toast.error("Erro ao carregar dados da linha");
    }
  }

  async function carregarCargos() {
    try {
      const res = await api.get(`/cargos/${empresaId}`);
      setCargos(res.data);
    } catch (error) {
      console.error("Erro ao carregar cargos:", error);
      toast.error("Erro ao carregar cargos");
    }
  }

  async function carregarPosto() {
    try {
      const res = await api.get(`/postos/${linhaId}`);
      const posto = res.data.find(p => p.id === parseInt(postoId));
      if (posto) {
        setForm({
          nome: posto.nome || "",
          linha_id: posto.linha_id || linhaId,
          tempo_ciclo_segundos: posto.tempo_ciclo_segundos || "",
          tempo_setup_minutos: posto.tempo_setup_minutos || "",
          disponibilidade_percentual: posto.disponibilidade_percentual || "95",
          cargo_id: posto.cargo_id || "",
          ordem_fluxo: posto.ordem_fluxo || ""
        });
      }
    } catch (error) {
      console.error("Erro ao carregar posto:", error);
      toast.error("Erro ao carregar dados do posto");
    }
  }

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    
    try {
      if (postoId) {
        await api.put(`/postos/${postoId}`, {
          ...form,
          tempo_ciclo_segundos: parseFloat(form.tempo_ciclo_segundos) || 0,
          tempo_setup_minutos: parseFloat(form.tempo_setup_minutos) || 0,
          disponibilidade_percentual: parseFloat(form.disponibilidade_percentual) || 95,
          cargo_id: form.cargo_id ? parseInt(form.cargo_id) : null
        });
        toast.success("Posto atualizado com sucesso! ✅");
      } else {
        await api.post("/postos", {
          ...form,
          linha_id: parseInt(linhaId),
          tempo_ciclo_segundos: parseFloat(form.tempo_ciclo_segundos) || 0,
          tempo_setup_minutos: parseFloat(form.tempo_setup_minutos) || 0,
          disponibilidade_percentual: parseFloat(form.disponibilidade_percentual) || 95,
          cargo_id: form.cargo_id ? parseInt(form.cargo_id) : null
        });
        toast.success("Posto cadastrado com sucesso! ✅");
      }

      setTimeout(() => {
        navigate(`/linhas/${linhaId}?aba=postos`);
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar posto ❌");
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

  const calcularCustoEstimado = () => {
    if (!form.cargo_id) return null;
    const cargo = cargos.find(c => c.id === parseInt(form.cargo_id));
    if (!cargo) return null;
    
    const salario = parseFloat(cargo.salario_base) || 0;
    const encargos = parseFloat(cargo.encargos_percentual) || 70;
    const custoMensal = salario * (1 + encargos / 100);
    
    return custoMensal;
  };

  return (
    <div style={{ 
      padding: "clamp(15px, 3vw, 30px)", 
      width: "100%",
      maxWidth: "800px",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      
      {/* Cabeçalho responsivo */}
      <div style={{ marginBottom: "clamp(20px, 3vw, 30px)" }}>
        <h1 style={{ 
          color: "#1E3A8A", 
          marginBottom: "5px", 
          fontSize: "clamp(20px, 4vw, 28px)" 
        }}>
          {postoId ? "Editar Posto" : "Novo Posto de Trabalho"}
        </h1>
        <p style={{ 
          color: "#666", 
          fontSize: "clamp(12px, 2vw, 14px)" 
        }}>
          Linha ID: {linhaId}
        </p>
      </div>

      {/* Formulário responsivo */}
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
          <label style={labelStyleResponsivo}>Nome do Posto *</label>
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
            style={inputStyleResponsivo}
            placeholder="Ex: Estação 1 - Corte"
          />
        </div>

        <div style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}>
          <label style={labelStyleResponsivo}>Tempo de Ciclo (segundos) *</label>
          <input
            type="number"
            name="tempo_ciclo_segundos"
            value={form.tempo_ciclo_segundos}
            onChange={handleChange}
            required
            min="0.1"
            step="0.1"
            style={inputStyleResponsivo}
            placeholder="Ex: 45.5"
          />
        </div>

        <div style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}>
          <label style={labelStyleResponsivo}>Tempo de Setup (minutos)</label>
          <input
            type="number"
            name="tempo_setup_minutos"
            value={form.tempo_setup_minutos}
            onChange={handleChange}
            min="0"
            step="0.5"
            style={inputStyleResponsivo}
            placeholder="Ex: 15"
          />
        </div>

        <div style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}>
          <label style={labelStyleResponsivo}>Disponibilidade (%)</label>
          <input
            type="number"
            name="disponibilidade_percentual"
            value={form.disponibilidade_percentual}
            onChange={handleChange}
            min="0"
            max="100"
            step="1"
            style={inputStyleResponsivo}
            placeholder="Ex: 95"
          />
        </div>

        <div style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}>
          <label style={labelStyleResponsivo}>Cargo</label>
          <select
            name="cargo_id"
            value={form.cargo_id}
            onChange={handleChange}
            style={inputStyleResponsivo}
          >
            <option value="">Selecione um cargo (opcional)</option>
            {cargos.map((cargo) => (
              <option key={cargo.id} value={cargo.id}>
                {truncarTexto(cargo.nome, 25)}
              </option>
            ))}
          </select>
          <small style={{ 
            color: "#666", 
            display: "block", 
            marginTop: "4px",
            fontSize: "clamp(11px, 1.5vw, 12px)"
          }}>
            O cargo define o custo da mão de obra para cálculos financeiros
          </small>
        </div>

        {form.cargo_id && (
          <div style={{ 
            backgroundColor: "#f9fafb", 
            padding: "clamp(12px, 1.8vw, 15px)", 
            borderRadius: "4px",
            marginBottom: "clamp(15px, 2vw, 20px)"
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px"
            }}>
              <span style={{ 
                color: "#666", 
                fontSize: "clamp(12px, 1.8vw, 14px)" 
              }}>
                Custo mensal estimado:
              </span>
              <span style={{ 
                fontWeight: "bold", 
                color: "#16a34a",
                fontSize: "clamp(16px, 2.5vw, 18px)"
              }}>
                {formatarMoeda(calcularCustoEstimado())}
              </span>
            </div>
            <div style={{ 
              fontSize: "clamp(10px, 1.3vw, 12px)", 
              color: "#666", 
              marginTop: "5px",
              fontStyle: "italic"
            }}>
              * Baseado no salário e encargos do cargo selecionado
            </div>
          </div>
        )}

        <div style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}>
          <label style={labelStyleResponsivo}>Ordem no Fluxo</label>
          <input
            type="number"
            name="ordem_fluxo"
            value={form.ordem_fluxo}
            onChange={handleChange}
            min="1"
            style={inputStyleResponsivo}
            placeholder="Ex: 1"
          />
          <small style={{ 
            color: "#666", 
            display: "block", 
            marginTop: "4px",
            fontSize: "clamp(11px, 1.5vw, 12px)"
          }}>
            Posição do posto na linha. Deixe em branco para ordem automática.
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
            disabled={carregando}
          >
            {postoId ? "Atualizar Posto" : "Cadastrar Posto"}
          </Botao>
          
          <Botao
            type="button"
            variant="secondary"
            size="lg"
            fullWidth={true}
            onClick={() => navigate(`/linhas/${linhaId}?aba=postos`)}
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
  padding: "clamp(6px, 1vw, 8px) clamp(8px, 1.5vw, 12px)",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  fontSize: "clamp(13px, 1.8vw, 14px)",
  outline: "none",
  boxSizing: "border-box"
};
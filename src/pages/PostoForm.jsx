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
  const [empresaId, setEmpresaId] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [linha, setLinha] = useState(null);
  const [empresaNome, setEmpresaNome] = useState("");

  // ========================================
  // 1. BUSCAR DADOS DA LINHA
  // ========================================
  useEffect(() => {
    if (linhaId) {
      buscarDadosLinha();
    }
  }, [linhaId]);

  // ========================================
  // 2. CARREGAR POSTO SE FOR EDIÇÃO
  // ========================================
  useEffect(() => {
    if (postoId && linhaId) {
      carregarPosto();
    }
  }, [postoId, linhaId]);

  // ========================================
  // 3. CARREGAR CARGOS QUANDO EMPRESA FOR DEFINIDA
  // ========================================
  useEffect(() => {
    if (empresaId) {
      carregarCargos();
    }
  }, [empresaId]);

  // ========================================
  // FUNÇÃO: Buscar dados da linha
  // ========================================
  async function buscarDadosLinha() {
    try {
      console.log('🔍 Buscando linha ID:', linhaId);
      
      if (!linhaId) {
        toast.error("ID da linha não fornecido");
        return;
      }

      // Buscar todas as empresas
      const empresasRes = await api.get("/companies");
      
      let linhaEncontrada = null;
      let empresaEncontrada = null;
      
      for (const empresa of empresasRes.data) {
        try {
          const linhasRes = await api.get(`/lines/${empresa.id}`);
          const linha = linhasRes.data.find(l => l.id === parseInt(linhaId));
          
          if (linha) {
            linhaEncontrada = linha;
            empresaEncontrada = empresa;
            break;
          }
        } catch (error) {
          // Ignora erro e continua
        }
      }
      
      if (linhaEncontrada && empresaEncontrada) {
        console.log('✅ Linha encontrada:', linhaEncontrada);
        console.log('🏢 Empresa:', empresaEncontrada.nome);
        
        setLinha(linhaEncontrada);
        setEmpresaNome(empresaEncontrada.nome);
        
        const empresaId = linhaEncontrada.empresa_id || empresaEncontrada.id;
        
        if (empresaId) {
          setEmpresaId(empresaId);
        } else {
          toast.error("Linha não possui empresa vinculada");
        }
      } else {
        console.error('❌ Linha não encontrada');
        toast.error(`Linha ID ${linhaId} não encontrada`);
      }
      
    } catch (error) {
      console.error("Erro ao buscar dados da linha:", error);
      toast.error("Erro ao carregar dados da linha");
    }
  }

  // ========================================
  // FUNÇÃO: Carregar cargos
  // ========================================
  async function carregarCargos() {
    try {
      const res = await api.get(`/roles/${empresaId}`);
      setCargos(res.data);
    } catch (error) {
      console.error("Erro ao carregar cargos:", error);
      toast.error("Erro ao carregar cargos");
    }
  }

  // ========================================
  // FUNÇÃO: Carregar posto (para edição)
  // ========================================
  async function carregarPosto() {
    try {
      const res = await api.get(`/work-stations/${linhaId}`);
      const posto = res.data.find(p => p.id === parseInt(postoId));
      
      if (posto) {
        setForm({
          nome: posto.nome || "",
          linha_id: posto.linha_id || parseInt(linhaId),
          tempo_ciclo_segundos: posto.tempo_ciclo_segundos || "",
          tempo_setup_minutos: posto.tempo_setup_minutos || "",
          disponibilidade_percentual: posto.disponibilidade_percentual || "95",
          cargo_id: posto.cargo_id || "",
          ordem_fluxo: posto.ordem_fluxo || ""
        });
      } else {
        toast.error("Posto não encontrado");
      }
    } catch (error) {
      console.error("Erro ao carregar posto:", error);
      toast.error("Erro ao carregar dados do posto");
    }
  }

  // ========================================
  // HANDLE CHANGE
  // ========================================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // ========================================
  // HANDLE SUBMIT
  // ========================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    
    try {
      if (postoId) {
        // EDIÇÃO
        await api.put(`/work-stations/${postoId}`, {
          nome: form.nome,
          tempo_ciclo_segundos: parseFloat(form.tempo_ciclo_segundos) || 0,
          tempo_setup_minutos: parseFloat(form.tempo_setup_minutos) || 0,
          disponibilidade_percentual: parseFloat(form.disponibilidade_percentual) || 95,
          cargo_id: form.cargo_id ? parseInt(form.cargo_id) : null,
          ordem_fluxo: form.ordem_fluxo ? parseInt(form.ordem_fluxo) : null
        });
        
        toast.success("Posto atualizado com sucesso! ✅");
        
        setTimeout(() => {
          navigate(`/postos?linha=${linhaId}`);
        }, 1500);
        
      } else {
        // CRIAÇÃO
        await api.post("/work-stations", {
          linha_id: parseInt(linhaId),
          nome: form.nome,
          tempo_ciclo_segundos: parseFloat(form.tempo_ciclo_segundos) || 0,
          tempo_setup_minutos: parseFloat(form.tempo_setup_minutos) || 0,
          disponibilidade_percentual: parseFloat(form.disponibilidade_percentual) || 95,
          cargo_id: form.cargo_id ? parseInt(form.cargo_id) : null
        });
        
        toast.success("Posto cadastrado com sucesso! ✅");
        
        // Limpar formulário
        setForm({
          nome: "",
          linha_id: linhaId || "",
          tempo_ciclo_segundos: "",
          tempo_setup_minutos: "",
          disponibilidade_percentual: "95",
          cargo_id: "",
          ordem_fluxo: ""
        });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

    } catch (error) {
      console.error(error);
      
      if (error.response?.status === 400) {
        toast.error(error.response.data.erro || "Erro ao salvar posto ❌");
      } else {
        toast.error("Erro ao salvar posto ❌");
      }
    } finally {
      setCarregando(false);
    }
  };

  // ========================================
  // FUNÇÕES AUXILIARES
  // ========================================
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
      maxWidth: "1200px",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      
      {/* ======================================== */}
      {/* 🎯 MOLDURA DO TÍTULO (PADRÃO DO SISTEMA) */}
      {/* ======================================== */}
      <div style={{ 
        backgroundColor: "white", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)", 
        padding: "25px 30px",
        marginBottom: "30px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <div>
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
            {linha?.nome ? `Linha: ${linha.nome}` : `ID da Linha: ${linhaId}`}
            {empresaNome && ` | Empresa: ${empresaNome}`}
          </p>
        </div>

        {/* 🔵 BOTÃO VOLTAR PERTO DO TÍTULO */}
        <Botao
          variant="primary"
          size="md"
          onClick={() => navigate(`/postos?linha=${linhaId}`)}
          style={{ minWidth: "120px" }}
        >
          ← Voltar para Postos
        </Botao>
      </div>

      {/* ======================================== */}
      {/* 📋 FORMULÁRIO */}
      {/* ======================================== */}
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

        {/* SELECT DE CARGOS */}
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
            O cargo define o custo da mão de obra
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
              <span style={{ color: "#666", fontSize: "clamp(12px, 1.8vw, 14px)" }}>
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
          <small style={{ color: "#666", display: "block", marginTop: "4px" }}>
            Posição do posto na linha. Deixe em branco para ordem automática.
          </small>
        </div>

        {/* ======================================== */}
        {/* 🟢 BOTÕES DO FORMULÁRIO (APENAS 2) */}
        {/* ======================================== */}
        <div style={{ 
          display: "flex", 
          gap: "clamp(8px, 1.5vw, 10px)", 
          marginTop: "clamp(20px, 3vw, 30px)",
          flexWrap: "wrap"
        }}>
          {/* Botão Cadastrar (verde) */}
          <Botao
            type="submit"
            variant="success"
            size="lg"
            style={{ flex: 2 }}
            loading={carregando}
            disabled={carregando}
          >
            {postoId ? "Atualizar Posto" : "Cadastrar Posto"}
          </Botao>
          
          {/* Botão Cancelar (cinza) */}
          <Botao
            type="button"
            variant="secondary"
            size="lg"
            style={{ flex: 1 }}
            onClick={() => navigate(`/postos?linha=${linhaId}`)}
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
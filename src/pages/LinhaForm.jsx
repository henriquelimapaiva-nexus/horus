// src/pages/LinhaForm.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Função auxiliar para truncar texto
const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function LinhaForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { clienteAtual } = useOutletContext();

  const [form, setForm] = useState({
    nome: "",
    empresa_id: clienteAtual || "",
    produto_id: "",
    takt_time_segundos: "",
    meta_diaria: "",
    horas_produtivas_dia: "16"
  });

  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (id) {
      carregarLinha();
    }
  }, [id]);

  useEffect(() => {
    api.get("/produtos")
      .then((res) => setProdutos(res.data))
      .catch((err) => {
        console.error("Erro ao carregar produtos:", err);
        toast.error("Erro ao carregar produtos");
      });
  }, []);

  async function carregarLinha() {
    try {
      const res = await api.get(`/linhas/${clienteAtual}`);
      const linha = res.data.find(l => l.id === parseInt(id));
      if (linha) {
        setForm({
          nome: linha.nome || "",
          empresa_id: linha.empresa_id || clienteAtual,
          produto_id: linha.produto_id || "",
          takt_time_segundos: linha.takt_time_segundos || "",
          meta_diaria: linha.meta_diaria || "",
          horas_produtivas_dia: linha.horas_produtivas_dia || "16"
        });
      }
    } catch (error) {
      console.error("Erro ao carregar linha:", error);
      toast.error("Erro ao carregar dados da linha");
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
      if (id) {
        await api.put(`/linhas/${id}`, form);
        toast.success("Linha atualizada com sucesso! ✅");
      } else {
        await api.post("/linhas", {
          ...form,
          empresa_id: clienteAtual
        });
        toast.success("Linha cadastrada com sucesso! ✅");
      }

      if (!id) {
        setForm({
          nome: "",
          empresa_id: clienteAtual,
          produto_id: "",
          takt_time_segundos: "",
          meta_diaria: "",
          horas_produtivas_dia: "16"
        });
      }

      setTimeout(() => {
        navigate(`/linhas`);
      }, 1500);

    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar linha ❌");
    } finally {
      setCarregando(false);
    }
  };

  if (!clienteAtual) {
    return (
      <div style={{ 
        padding: "clamp(20px, 5vw, 40px)", 
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto"
      }}>
        <h2 style={{ color: "#dc2626", fontSize: "clamp(18px, 4vw, 22px)" }}>
          Nenhum cliente selecionado
        </h2>
        <p style={{ fontSize: "clamp(14px, 2vw, 16px)" }}>
          Selecione um cliente no menu superior para cadastrar linhas.
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "clamp(15px, 3vw, 30px)", 
      width: "100%",
      maxWidth: "800px",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      
      {/* Cabeçalho responsivo */}
      <div style={{ 
        marginBottom: "clamp(20px, 3vw, 30px)",
        textAlign: "center"
      }}>
        <h1 style={{ 
          color: "#1E3A8A", 
          marginBottom: "5px", 
          fontSize: "clamp(20px, 4vw, 28px)" 
        }}>
          {id ? "Editar Linha" : "Nova Linha de Produção"}
        </h1>
        <p style={{ 
          color: "#666", 
          fontSize: "clamp(12px, 2vw, 14px)" 
        }}>
          Cliente: {truncarTexto(clienteAtual, 30)}
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
          <label style={labelStyleResponsivo}>Nome da Linha *</label>
          <input
            type="text"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
            style={inputStyleResponsivo}
            placeholder="Ex: Linha de Montagem Final"
          />
        </div>

        <div style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}>
          <label style={labelStyleResponsivo}>Produto *</label>
          <select
            name="produto_id"
            value={form.produto_id}
            onChange={handleChange}
            required
            style={inputStyleResponsivo}
          >
            <option value="">Selecione um produto</option>
            {produtos.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {truncarTexto(prod.nome, 25)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}>
          <label style={labelStyleResponsivo}>Takt Time (segundos) *</label>
          <input
            type="number"
            name="takt_time_segundos"
            value={form.takt_time_segundos}
            onChange={handleChange}
            required
            min="0.1"
            step="0.1"
            style={inputStyleResponsivo}
            placeholder="Ex: 45.5"
          />
        </div>

        <div style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}>
          <label style={labelStyleResponsivo}>Meta Diária (peças) *</label>
          <input
            type="number"
            name="meta_diaria"
            value={form.meta_diaria}
            onChange={handleChange}
            required
            min="1"
            style={inputStyleResponsivo}
            placeholder="Ex: 1000"
          />
        </div>

        <div style={{ marginBottom: "clamp(15px, 2vw, 20px)" }}>
          <label style={labelStyleResponsivo}>Horas Produtivas por Dia</label>
          <input
            type="number"
            name="horas_produtivas_dia"
            value={form.horas_produtivas_dia}
            onChange={handleChange}
            min="1"
            max="24"
            step="0.5"
            style={inputStyleResponsivo}
            placeholder="Ex: 16"
          />
          <small style={{ 
            color: "#666", 
            display: "block", 
            marginTop: "4px",
            fontSize: "clamp(11px, 1.5vw, 12px)"
          }}>
            Horas disponíveis para produção (excluindo paradas planejadas)
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
            {id ? "Atualizar Linha" : "Cadastrar Linha"}
          </Botao>
          
          <Botao
            type="button"
            variant="secondary"
            size="lg"
            fullWidth={true}
            onClick={() => navigate("/linhas")}
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
  padding: "clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px)",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  fontSize: "clamp(13px, 1.8vw, 14px)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s"
};
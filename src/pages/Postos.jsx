// src/pages/Postos.jsx
import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Função auxiliar para truncar texto
const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function Postos() {
  const { clienteAtual } = useOutletContext();

  const [empresas, setEmpresas] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [postos, setPostos] = useState([]);
  const [cargos, setCargos] = useState([]); // ✅ Estado para armazenar cargos
  const [carregando, setCarregando] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(clienteAtual || "");
  const [linhaSelecionada, setLinhaSelecionada] = useState("");

  // ========================================
  // 1. CARREGAR EMPRESAS (sempre ao iniciar)
  // ========================================
  useEffect(() => {
    api.get("/companies")
      .then(res => setEmpresas(res.data))
      .catch(err => {
        console.error("Erro ao carregar empresas:", err);
        toast.error("Erro ao carregar empresas");
      });
  }, []);

  // ========================================
  // 2. QUANDO EMPRESA MUDAR:
  //    - Carregar linhas da empresa
  //    - Carregar cargos da empresa
  // ========================================
  useEffect(() => {
    if (empresaSelecionada) {
      // Carregar linhas
      api.get(`/lines/${empresaSelecionada}`)
        .then(res => setLinhas(res.data))
        .catch(err => {
          console.error("Erro ao carregar linhas:", err);
          toast.error("Erro ao carregar linhas");
        });
      
      // ✅ Carregar cargos da empresa selecionada
      carregarCargos(empresaSelecionada);
    } else {
      setLinhas([]);
      setLinhaSelecionada("");
      setCargos([]); // Limpar cargos quando não há empresa
    }
  }, [empresaSelecionada]);

  // ========================================
  // 3. FUNÇÃO PARA CARREGAR CARGOS
  // ========================================
  async function carregarCargos(empresaId) {
    try {
      console.log('📡 Carregando cargos da empresa:', empresaId);
      const response = await api.get(`/roles/${empresaId}`);
      setCargos(response.data);
      console.log('✅ Cargos carregados:', response.data.length);
    } catch (error) {
      console.error("❌ Erro ao carregar cargos:", error);
      toast.error("Erro ao carregar lista de cargos");
    }
  }

  // ========================================
  // 4. QUANDO LINHA MUDAR: carregar postos
  // ========================================
  useEffect(() => {
    if (linhaSelecionada) {
      carregarPostos(linhaSelecionada);
    } else {
      setPostos([]);
    }
  }, [linhaSelecionada]);

  // ========================================
  // 5. FUNÇÃO PARA CARREGAR POSTOS
  // ========================================
  async function carregarPostos(linhaId) {
    setCarregando(true);
    try {
      const res = await api.get(`/work-stations/${linhaId}`);
      setPostos(res.data);
      if (res.data.length > 0) {
        toast.success(`${res.data.length} postos carregados`);
      }
    } catch (error) {
      console.error("Erro ao carregar postos:", error);
      toast.error("Erro ao carregar postos");
    } finally {
      setCarregando(false);
    }
  }

  // ========================================
  // 6. FUNÇÃO PARA EXCLUIR POSTO
  // ========================================
  async function excluirPosto(id) {
    if (!window.confirm("Excluir este posto?")) return;
    
    try {
      await api.delete(`/work-stations/${id}`);
      carregarPostos(linhaSelecionada);
      toast.success("Posto excluído com sucesso! ✅");
    } catch (error) {
      console.error("Erro ao excluir posto:", error);
      
      if (error.response?.status === 409) {
        toast.error("Posto possui vínculos. Remova as alocações primeiro ❌");
      } else {
        toast.error("Erro ao excluir posto ❌");
      }
    }
  }

  // ========================================
  // 7. ✅ FUNÇÃO CORRIGIDA: Busca nome do cargo pelo ID
  // ========================================
  const getCargoNome = (cargoId) => {
    if (!cargoId) return "-";
    const cargo = cargos.find(c => c.id === cargoId);
    return cargo ? cargo.nome : `Cargo ID: ${cargoId}`;
  };

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
        <h1 style={{ 
          color: "#1E3A8A", 
          marginBottom: "clamp(5px, 1vw, 10px)", 
          fontSize: "clamp(20px, 4vw, 28px)" 
        }}>
          Postos de Trabalho
        </h1>
        <p style={{ 
          color: "#666", 
          fontSize: "clamp(12px, 2vw, 14px)" 
        }}>
          Visualize e gerencie os postos de trabalho por linha
        </p>
      </div>

      {/* Filtros */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 20px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)",
        display: "flex",
        gap: "clamp(10px, 2vw, 20px)",
        flexWrap: "wrap",
        alignItems: "flex-end",
        width: "100%",
        boxSizing: "border-box"
      }}>
        {/* Select de Empresa */}
        <div style={{ 
          flex: "1 1 250px",
          minWidth: "200px"
        }}>
          <label style={labelStyleResponsivo}>Empresa</label>
          <select
            value={empresaSelecionada}
            onChange={(e) => setEmpresaSelecionada(e.target.value)}
            style={inputStyleResponsivo}
          >
            <option value="">Selecione...</option>
            {empresas.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.nome} {/* ✅ NOME COMPLETO, SEM TRUNCAR */}
              </option>
            ))}
          </select>
        </div>

        {/* Select de Linha */}
        <div style={{ 
          flex: "1 1 250px",
          minWidth: "200px"
        }}>
          <label style={labelStyleResponsivo}>Linha</label>
          <select
            value={linhaSelecionada}
            onChange={(e) => setLinhaSelecionada(e.target.value)}
            style={inputStyleResponsivo}
            disabled={!empresaSelecionada}
          >
            <option value="">Selecione...</option>
            {linhas.map(linha => (
              <option key={linha.id} value={linha.id}>
                {truncarTexto(linha.nome, 25)}
              </option>
            ))}
          </select>
        </div>

        {/* Botão Novo Posto */}
        {linhaSelecionada && (
          <div style={{ 
            flex: "0 0 auto",
            width: "100%",
            maxWidth: "200px"
          }}>
            <Link to={`/postos/novo/${linhaSelecionada}`} style={{ textDecoration: "none" }}>
              <Botao variant="success" size="md" fullWidth>
                + Novo Posto
              </Botao>
            </Link>
          </div>
        )}
      </div>

      {/* Lista de Postos */}
      {carregando ? (
        <div style={{ textAlign: "center", padding: "clamp(20px, 4vw, 40px)" }}>
          <Botao variant="primary" size="lg" loading={true} disabled={true}>
            Carregando postos...
          </Botao>
        </div>
      ) : postos.length === 0 ? (
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(30px, 6vw, 60px)", 
          borderRadius: "8px", 
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
          <p style={{ 
            color: "#666", 
            marginBottom: "clamp(15px, 3vw, 20px)",
            fontSize: "clamp(14px, 2vw, 16px)"
          }}>
            {linhaSelecionada 
              ? "Nenhum posto cadastrado para esta linha." 
              : "Selecione uma empresa e linha para visualizar os postos."}
          </p>
          {linhaSelecionada && (
            <Link to={`/postos/novo/${linhaSelecionada}`} style={{ textDecoration: "none" }}>
              <Botao variant="primary" size="lg">
                Cadastrar Primeiro Posto
              </Botao>
            </Link>
          )}
        </div>
      ) : (
        <div style={{ overflowX: "auto", width: "100%" }}>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse", 
            backgroundColor: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            borderRadius: "8px",
            minWidth: "700px"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                <th style={thResponsivo}>Ordem</th>
                <th style={thResponsivo}>Nome</th>
                <th style={thResponsivo}>Ciclo (s)</th>
                <th style={thResponsivo}>Setup (min)</th>
                <th style={thResponsivo}>Disponibilidade</th>
                <th style={thResponsivo}>Cargo</th>
                <th style={thResponsivo}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {postos.map((posto, index) => (
                <tr key={posto.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={tdResponsivo}>{posto.ordem_fluxo || index + 1}</td>
                  <td style={tdResponsivo} title={posto.nome}>
                    {posto.nome} {/* ✅ NOME COMPLETO */}
                  </td>
                  <td style={tdResponsivo}>{posto.tempo_ciclo_segundos || 0}s</td>
                  <td style={tdResponsivo}>{posto.tempo_setup_minutos || 0} min</td>
                  <td style={tdResponsivo}>
                    <span style={{ 
                      color: (posto.disponibilidade_percentual || 0) >= 90 ? "#16a34a" : "#dc2626",
                      fontWeight: "bold"
                    }}>
                      {posto.disponibilidade_percentual || 0}%
                    </span>
                  </td>
                  <td style={tdResponsivo} title={getCargoNome(posto.cargo_id)}>
                    {/* ✅ AGORA MOSTRA O NOME REAL DO CARGO */}
                    {getCargoNome(posto.cargo_id)} {/* ✅ CARGO COMPLETO */}
                  </td>
                  <td style={tdResponsivo}>
                    <Link to={`/postos/editar/${posto.id}/linha/${linhaSelecionada}`} 
                          style={{ textDecoration: "none", display: "inline-block" }}>
                      <Botao variant="primary" size="sm" style={{ marginRight: "5px" }}>
                        Editar
                      </Botao>
                    </Link>
                    <Botao variant="danger" size="sm" onClick={() => excluirPosto(posto.id)}>
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
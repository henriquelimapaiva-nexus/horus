// src/pages/ColetaDados.jsx
import { useState, useEffect } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Função auxiliar para truncar texto
const truncarTexto = (texto, maxLength = 20) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function ColetaDados() {
  const { linhaId } = useParams();
  const { clienteAtual } = useOutletContext();
  const navigate = useNavigate();

  const [postos, setPostos] = useState([]);
  const [postoSelecionado, setPostoSelecionado] = useState("");
  const [modoColeta, setModoColeta] = useState("ciclo");
  const [medicoes, setMedicoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [novaMedicao, setNovaMedicao] = useState({
    tempo_ciclo_segundos: "",
    tipo_parada: "microparada",
    tempo_parada_minutos: "",
    descricao: "",
    turno: "1",
    data: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!linhaId) return;
    
    api.get(`/postos/${linhaId}`)
      .then((res) => setPostos(res.data))
      .catch((err) => {
        console.error("Erro ao carregar postos:", err);
        toast.error("Erro ao carregar postos");
      });
  }, [linhaId]);

  useEffect(() => {
    if (!linhaId || !postoSelecionado) return;
    
    carregarMedicoes();
  }, [linhaId, postoSelecionado]);

  async function carregarMedicoes() {
    setCarregando(true);
    try {
      const response = await api.get(`/medicoes/${postoSelecionado}`);
      setMedicoes(response.data);
      setErro("");
    } catch (error) {
      console.error("Erro ao carregar medições:", error);
      setErro("Erro ao carregar medições");
      toast.error("Erro ao carregar medições");
    } finally {
      setCarregando(false);
    }
  }

  const handleInputChange = (e) => {
    setNovaMedicao({
      ...novaMedicao,
      [e.target.name]: e.target.value
    });
  };

  async function adicionarMedicao() {
    if (!postoSelecionado) {
      toast.error("Selecione um posto");
      return;
    }

    if (modoColeta === "ciclo" && !novaMedicao.tempo_ciclo_segundos) {
      toast.error("Informe o tempo de ciclo");
      return;
    }

    if (modoColeta === "parada" && !novaMedicao.tempo_parada_minutos) {
      toast.error("Informe o tempo de parada");
      return;
    }

    setSalvando(true);
    try {
      const dados = {
        posto_id: parseInt(postoSelecionado),
        tipo: modoColeta,
        turno: parseInt(novaMedicao.turno),
        data_medicao: novaMedicao.data,
        descricao: novaMedicao.descricao || null
      };

      if (modoColeta === "ciclo") {
        dados.valor_numerico = parseFloat(novaMedicao.tempo_ciclo_segundos);
      } else if (modoColeta === "parada") {
        dados.valor_numerico = parseFloat(novaMedicao.tempo_parada_minutos);
      }

      const response = await api.post("/medicoes", dados);
      
      setMedicoes([response.data, ...medicoes]);
      
      if (modoColeta === "ciclo") {
        setNovaMedicao({ ...novaMedicao, tempo_ciclo_segundos: "" });
      } else if (modoColeta === "parada") {
        setNovaMedicao({ ...novaMedicao, tempo_parada_minutos: "", descricao: "" });
      } else {
        setNovaMedicao({ ...novaMedicao, descricao: "" });
      }
      
      setErro("");
      toast.success(`${modoColeta === "ciclo" ? "Ciclo" : modoColeta === "parada" ? "Parada" : "Evento"} registrado com sucesso! ✅`);
      
    } catch (error) {
      console.error("Erro ao salvar medição:", error);
      setErro("Erro ao salvar medição");
      toast.error("Erro ao salvar medição ❌");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirMedicao(id) {
    if (!window.confirm("Excluir esta medição?")) return;
    
    try {
      await api.delete(`/medicoes/${id}`);
      setMedicoes(medicoes.filter(m => m.id !== id));
      setErro("");
      toast.success("Medição excluída com sucesso ✅");
    } catch (error) {
      console.error("Erro ao excluir medição:", error);
      setErro("Erro ao excluir medição");
      toast.error("Erro ao excluir medição ❌");
    }
  }

  const exportarCSV = () => {
    let csv = "Data,Posto,Tipo,Valor,Descrição,Turno\n";
    
    medicoes.forEach(m => {
      const postoNome = postos.find(p => p.id === m.posto_id)?.nome || `Posto ${m.posto_id}`;
      const valor = m.tipo === "ciclo" ? `${m.valor_numerico}s` : 
                   m.tipo === "parada" ? `${m.valor_numerico}min` : "-";
      
      csv += `${m.data_medicao},${postoNome},${m.tipo},${valor},${m.descricao || "-"},${m.turno}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicoes_linha_${linhaId}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success("Arquivo CSV exportado com sucesso!");
  };

  const formatarData = (dataString) => {
    if (!dataString) return "";
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  if (!linhaId) {
    return (
      <div style={{ 
        padding: "clamp(20px, 5vw, 40px)", 
        textAlign: "center" 
      }}>
        <h2 style={{ color: "#dc2626", fontSize: "clamp(18px, 4vw, 22px)" }}>Linha não especificada</h2>
        <p style={{ fontSize: "clamp(14px, 2vw, 16px)" }}>Selecione uma linha para iniciar a coleta.</p>
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
      
      {/* Cabeçalho responsivo */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 25px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)",
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
            Coleta de Dados
          </h1>
          <p style={{ 
            color: "#666", 
            fontSize: "clamp(12px, 2vw, 14px)" 
          }}>
            Registre medições de ciclo, paradas e observações em campo
          </p>
        </div>
        <Botao
          variant="secondary"
          size="md"
          onClick={() => navigate(`/linhas/${linhaId}`)}
        >
          ← Voltar
        </Botao>
      </div>

      {/* Seletor de Posto e Modo */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 25px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)",
        width: "100%",
        boxSizing: "border-box"
      }}>
        
        {erro && (
          <div style={{ 
            backgroundColor: "#fee2e2", 
            color: "#dc2626", 
            padding: "clamp(8px, 1.5vw, 10px)", 
            borderRadius: "4px",
            marginBottom: "15px",
            fontSize: "clamp(13px, 1.8vw, 14px)"
          }}>
            {erro}
          </div>
        )}

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", 
          gap: "clamp(15px, 2vw, 20px)", 
          marginBottom: "20px" 
        }}>
          <div>
            <label style={labelStyleResponsivo}>Posto de Trabalho *</label>
            <select
              value={postoSelecionado}
              onChange={(e) => setPostoSelecionado(e.target.value)}
              style={inputStyleResponsivo}
            >
              <option value="">Selecione um posto</option>
              {postos.map((posto) => (
                <option key={posto.id} value={posto.id}>{truncarTexto(posto.nome, 25)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyleResponsivo}>Tipo de Coleta</label>
            <div style={{ 
              display: "flex", 
              gap: "clamp(5px, 1vw, 10px)", 
              marginTop: "6px",
              flexWrap: "wrap"
            }}>
              {["ciclo", "parada", "evento"].map((modo) => (
                <Botao
                  key={modo}
                  variant={modoColeta === modo ? "primary" : "outline"}
                  size="sm"
                  fullWidth={true}
                  onClick={() => setModoColeta(modo)}
                >
                  {modo === "ciclo" ? "⏱️ Ciclo" : 
                   modo === "parada" ? "⛔ Parada" : "📝 Evento"}
                </Botao>
              ))}
            </div>
          </div>
        </div>

        {/* Formulário dinâmico */}
        <div style={{ 
          backgroundColor: "#f9fafb", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px",
          marginTop: "10px",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <h3 style={{ 
            color: "#1E3A8A", 
            marginBottom: "clamp(10px, 1.5vw, 15px)", 
            fontSize: "clamp(15px, 2.2vw, 16px)" 
          }}>
            {modoColeta === "ciclo" && "⏱️ Nova Medição de Ciclo"}
            {modoColeta === "parada" && "⛔ Registrar Parada"}
            {modoColeta === "evento" && "📝 Registrar Evento"}
          </h3>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", 
            gap: "clamp(10px, 1.5vw, 15px)" 
          }}>
            
            <div>
              <label style={labelStyleResponsivo}>Turno</label>
              <select
                name="turno"
                value={novaMedicao.turno}
                onChange={handleInputChange}
                style={inputStyleResponsivo}
                disabled={salvando}
              >
                <option value="1">Turno 1</option>
                <option value="2">Turno 2</option>
                <option value="3">Turno 3</option>
              </select>
            </div>

            <div>
              <label style={labelStyleResponsivo}>Data</label>
              <input
                type="date"
                name="data"
                value={novaMedicao.data}
                onChange={handleInputChange}
                style={inputStyleResponsivo}
                disabled={salvando}
              />
            </div>

            {modoColeta === "ciclo" && (
              <div style={{ gridColumn: "span 1" }}>
                <label style={labelStyleResponsivo}>Tempo de Ciclo (s) *</label>
                <input
                  type="number"
                  name="tempo_ciclo_segundos"
                  value={novaMedicao.tempo_ciclo_segundos}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  style={inputStyleResponsivo}
                  placeholder="Ex: 45.5"
                  disabled={salvando}
                />
              </div>
            )}

            {modoColeta === "parada" && (
              <>
                <div>
                  <label style={labelStyleResponsivo}>Tipo de Parada</label>
                  <select
                    name="tipo_parada"
                    value={novaMedicao.tipo_parada}
                    onChange={handleInputChange}
                    style={inputStyleResponsivo}
                    disabled={salvando}
                  >
                    <option value="microparada">Microparada</option>
                    <option value="setup">Setup</option>
                    <option value="manutencao">Manutenção</option>
                    <option value="falta_material">Falta Material</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyleResponsivo}>Tempo (min) *</label>
                  <input
                    type="number"
                    name="tempo_parada_minutos"
                    value={novaMedicao.tempo_parada_minutos}
                    onChange={handleInputChange}
                    step="0.5"
                    min="0"
                    style={inputStyleResponsivo}
                    placeholder="Ex: 5.5"
                    disabled={salvando}
                  />
                </div>
              </>
            )}

            {(modoColeta === "parada" || modoColeta === "evento") && (
              <div style={{ 
                gridColumn: modoColeta === "evento" ? "1 / -1" : "span 1"
              }}>
                <label style={labelStyleResponsivo}>Descrição</label>
                <input
                  type="text"
                  name="descricao"
                  value={novaMedicao.descricao}
                  onChange={handleInputChange}
                  style={inputStyleResponsivo}
                  placeholder={modoColeta === "evento" ? "Descreva o evento..." : "Descreva a causa da parada..."}
                  disabled={salvando}
                />
              </div>
            )}
          </div>

          <Botao
            variant="success"
            size="md"
            fullWidth={true}
            onClick={adicionarMedicao}
            disabled={salvando}
            loading={salvando}
            style={{ marginTop: "20px" }}
          >
            + Registrar {modoColeta === "ciclo" ? "Medição" : 
                         modoColeta === "parada" ? "Parada" : "Evento"}
          </Botao>
        </div>
      </div>

      {/* Lista de medições */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 25px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "clamp(15px, 2vw, 20px)",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <h2 style={{ 
            color: "#1E3A8A", 
            fontSize: "clamp(16px, 2.5vw, 18px)" 
          }}>
            Histórico de Coletas {postoSelecionado ? `- ${truncarTexto(postos.find(p => p.id === parseInt(postoSelecionado))?.nome, 20)}` : ""}
          </h2>
          {medicoes.length > 0 && (
            <Botao
              variant="secondary"
              size="sm"
              onClick={exportarCSV}
            >
              📥 Exportar CSV
            </Botao>
          )}
        </div>

        {!postoSelecionado ? (
          <div style={{ 
            textAlign: "center", 
            padding: "clamp(20px, 4vw, 40px)", 
            color: "#666",
            fontSize: "clamp(14px, 2vw, 16px)"
          }}>
            Selecione um posto para ver as medições.
          </div>
        ) : carregando ? (
          <div style={{ 
            textAlign: "center", 
            padding: "clamp(20px, 4vw, 40px)", 
            color: "#666",
            fontSize: "clamp(14px, 2vw, 16px)"
          }}>
            Carregando medições...
          </div>
        ) : medicoes.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "clamp(20px, 4vw, 40px)", 
            color: "#666",
            fontSize: "clamp(14px, 2vw, 16px)"
          }}>
            Nenhuma medição registrada para este posto.
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
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "20%" }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                  <th style={thResponsivo}>Data</th>
                  <th style={thResponsivo}>Tipo</th>
                  <th style={thResponsivo}>Valor</th>
                  <th style={thResponsivo}>Descrição</th>
                  <th style={thResponsivo}>Turno</th>
                  <th style={thResponsivo}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {medicoes.map((med) => (
                  <tr key={med.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={tdResponsivo}>{formatarData(med.data_medicao)}</td>
                    <td style={tdResponsivo}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "clamp(10px, 1.3vw, 12px)",
                        backgroundColor: med.tipo === "ciclo" ? "#16a34a20" :
                                       med.tipo === "parada" ? "#dc262620" : "#f59e0b20",
                        color: med.tipo === "ciclo" ? "#16a34a" :
                               med.tipo === "parada" ? "#dc2626" : "#f59e0b"
                      }}>
                        {med.tipo === "ciclo" ? "⏱️ Ciclo" :
                         med.tipo === "parada" ? "⛔ Parada" : "📝 Evento"}
                      </span>
                    </td>
                    <td style={tdResponsivo}>
                      {med.tipo === "ciclo" ? `${med.valor_numerico}s` :
                       med.tipo === "parada" ? `${med.valor_numerico}min` : "-"}
                    </td>
                    <td style={tdResponsivo} title={med.descricao || "-"}>
                      {truncarTexto(med.descricao || "-", 15)}
                    </td>
                    <td style={tdResponsivo}>{med.turno}º</td>
                    <td style={tdResponsivo}>
                      <Botao
                        variant="danger"
                        size="sm"
                        onClick={() => excluirMedicao(med.id)}
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
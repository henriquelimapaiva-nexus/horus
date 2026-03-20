// src/pages/ColetaDados.jsx
import { useState, useEffect } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import api from "../api/api";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

export default function ColetaDados() {
  const { linhaId } = useParams();
  const { clienteAtual } = useOutletContext();
  const navigate = useNavigate();

  // Estados
  const [linhaSelecionada, setLinhaSelecionada] = useState("");
  const [linhasDisponiveis, setLinhasDisponiveis] = useState([]);
  const [postos, setPostos] = useState([]);
  const [postoSelecionado, setPostoSelecionado] = useState("");
  const [operadores, setOperadores] = useState([]);
  const [medicoes, setMedicoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [analiseEstatistica, setAnaliseEstatistica] = useState(null);

  // Formulário de medição
  const [novaMedicao, setNovaMedicao] = useState({
    operador_id: "",
    elemento: "",
    tempo_ciclo_segundos: "",
    metodo: "padrao",
    condicao: "normal",
    observacao: ""
  });

  // Elementos predefinidos para cronoanálise
  const elementosPadrao = [
    "Pegar peça",
    "Posicionar",
    "Operação principal",
    "Inspecionar",
    "Remover peça",
    "Aguardar ciclo",
    "Movimentação"
  ];

  // Métodos disponíveis
  const metodos = [
    { value: "padrao", label: "Padrão (POP)" },
    { value: "melhorado", label: "Melhorado (Kaizen)" },
    { value: "fora_padrao", label: "Fora do padrão" }
  ];

  // Condições disponíveis
  const condicoes = [
    { value: "normal", label: "Normal" },
    { value: "problema_material", label: "Problema com material" },
    { value: "problema_ferramenta", label: "Problema com ferramenta" },
    { value: "treinamento", label: "Operador em treinamento" },
    { value: "falta_operador", label: "Falta de operador" }
  ];

  // Carregar linhas da empresa
  useEffect(() => {
    if (clienteAtual) {
      carregarLinhas();
    }
  }, [clienteAtual]);

  async function carregarLinhas() {
    try {
      const res = await api.get(`/lines/${clienteAtual}`);
      setLinhasDisponiveis(res.data);
    } catch (error) {
      console.error("Erro ao carregar linhas:", error);
      toast.error("Erro ao carregar linhas");
    }
  }

  // Carregar postos
  useEffect(() => {
    const idParaUsar = linhaId || linhaSelecionada;
    if (!idParaUsar) return;
    
    api.get(`/work-stations/${idParaUsar}`)
      .then((res) => setPostos(res.data))
      .catch((err) => {
        console.error("Erro ao carregar postos:", err);
        toast.error("Erro ao carregar postos");
      });
  }, [linhaId, linhaSelecionada]);

  // Carregar operadores da empresa
  useEffect(() => {
    if (clienteAtual) {
      api.get(`/employees/${clienteAtual}`)
        .then((res) => setOperadores(res.data))
        .catch((err) => {
          console.error("Erro ao carregar operadores:", err);
        });
    }
  }, [clienteAtual]);

  // Carregar medições existentes
  useEffect(() => {
    if (!postoSelecionado) return;
    carregarMedicoes();
  }, [postoSelecionado]);

  async function carregarMedicoes() {
    setCarregando(true);
    try {
      const response = await api.get(`/cycle-measurements?posto_id=${postoSelecionado}`);
      const dados = response.data || [];
      setMedicoes(dados);
      calcularEstatisticas(dados);
    } catch (error) {
      console.error("Erro ao carregar medições:", error);
      setMedicoes([]);
    } finally {
      setCarregando(false);
    }
  }

  function calcularEstatisticas(medicoesList) {
    if (medicoesList.length === 0) {
      setAnaliseEstatistica(null);
      return;
    }

    const tempos = medicoesList.map(m => parseFloat(m.tempo_ciclo_segundos)).filter(t => t > 0);
    if (tempos.length === 0) {
      setAnaliseEstatistica(null);
      return;
    }

    const soma = tempos.reduce((a, b) => a + b, 0);
    const media = soma / tempos.length;
    const minimo = Math.min(...tempos);
    const maximo = Math.max(...tempos);
    
    // Cálculo do desvio padrão
    const variancia = tempos.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / tempos.length;
    const desvio = Math.sqrt(variancia);
    const cv = (desvio / media) * 100;

    setAnaliseEstatistica({
      total_amostras: tempos.length,
      media: media.toFixed(2),
      minimo: minimo.toFixed(2),
      maximo: maximo.toFixed(2),
      desvio: desvio.toFixed(2),
      cv: cv.toFixed(2),
      classificacao: cv < 5 ? "Excelente" : cv < 10 ? "Bom" : cv < 20 ? "Regular" : "Crítico"
    });
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

    if (!novaMedicao.tempo_ciclo_segundos) {
      toast.error("Informe o tempo de ciclo");
      return;
    }

    if (!novaMedicao.elemento) {
      toast.error("Selecione um elemento");
      return;
    }

    setSalvando(true);
    try {
      const dados = {
        posto_id: parseInt(postoSelecionado),
        operador_id: novaMedicao.operador_id ? parseInt(novaMedicao.operador_id) : null,
        elemento: novaMedicao.elemento,
        tempo_ciclo_segundos: parseFloat(novaMedicao.tempo_ciclo_segundos),
        metodo: novaMedicao.metodo,
        condicao: novaMedicao.condicao,
        observacao: novaMedicao.observacao || null
      };
      
      const response = await api.post("/cycle-measurements", dados);
      
      const novaMed = {
        id: response.data.id,
        data_medicao: new Date().toISOString().split('T')[0],
        hora_medicao: new Date().toLocaleTimeString('pt-BR'),
        elemento: novaMedicao.elemento,
        tempo_ciclo_segundos: response.data.tempo_ciclo_segundos,
        metodo: novaMedicao.metodo,
        condicao: novaMedicao.condicao,
        operador_id: novaMedicao.operador_id,
        observacao: novaMedicao.observacao
      };
      
      setMedicoes([novaMed, ...medicoes]);
      calcularEstatisticas([novaMed, ...medicoes]);
      
      setNovaMedicao({
        operador_id: "",
        elemento: "",
        tempo_ciclo_segundos: "",
        metodo: "padrao",
        condicao: "normal",
        observacao: ""
      });
      
      toast.success("Medição registrada com sucesso! ✅");
      
    } catch (error) {
      console.error("Erro ao salvar medição:", error);
      toast.error("Erro ao salvar medição ❌");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirMedicao(id) {
    if (!window.confirm("Excluir esta medição?")) return;
    
    try {
      await api.delete(`/cycle-measurements/${id}`);
      const novasMedicoes = medicoes.filter(m => m.id !== id);
      setMedicoes(novasMedicoes);
      calcularEstatisticas(novasMedicoes);
      toast.success("Medição excluída com sucesso ✅");
    } catch (error) {
      console.error("Erro ao excluir medição:", error);
      toast.error("Erro ao excluir medição ❌");
    }
  }

  const exportarCSV = () => {
    let csv = "Data,Hora,Posto,Elemento,Tempo (s),Método,Condição,Operador,Observação\n";
    
    medicoes.forEach(m => {
      const postoNome = postos.find(p => p.id === parseInt(postoSelecionado))?.nome || `Posto ${postoSelecionado}`;
      const operadorNome = operadores.find(op => op.id === m.operador_id)?.nome || "-";
      const metodoLabel = metodos.find(met => met.value === m.metodo)?.label || m.metodo;
      const condicaoLabel = condicoes.find(c => c.value === m.condicao)?.label || m.condicao;
      
      csv += `${m.data_medicao},${m.hora_medicao || "-"},${postoNome},${m.elemento},${m.tempo_ciclo_segundos},${metodoLabel},${condicaoLabel},${operadorNome},${m.observacao || "-"}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cronoanalise_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success("Arquivo CSV exportado com sucesso!");
  };

  const formatarData = (dataString) => {
    if (!dataString) return "";
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  // Seletor de linha (quando não tem linhaId na URL)
  if (!linhaId && !linhaSelecionada) {
    return (
      <div style={{ 
        padding: "clamp(20px, 5vw, 40px)", 
        maxWidth: "600px",
        margin: "0 auto",
        textAlign: "center" 
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          padding: "30px"
        }}>
          <h2 style={{ color: "#1E3A8A", marginBottom: "20px" }}>Selecionar Linha</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>Escolha uma linha para iniciar a coleta de dados:</p>
          
          <select
            value={linhaSelecionada}
            onChange={(e) => setLinhaSelecionada(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "4px",
              border: "1px solid #d1d5db",
              fontSize: "14px",
              marginBottom: "20px"
            }}
          >
            <option value="">Selecione uma linha...</option>
            {linhasDisponiveis.map(linha => (
              <option key={linha.id} value={linha.id}>{linha.nome}</option>
            ))}
          </select>
          
          <Botao
            variant="primary"
            size="lg"
            fullWidth={true}
            onClick={() => navigate(`/coleta/${linhaSelecionada}`)}
            disabled={!linhaSelecionada}
          >
            Iniciar Coleta
          </Botao>
        </div>
      </div>
    );
  }

  const linhaIdAtual = linhaId || linhaSelecionada;
  const postoAtual = postos.find(p => p.id === parseInt(postoSelecionado));

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
            Cronoanálise
          </h1>
          <p style={{ 
            color: "#666", 
            fontSize: "clamp(12px, 2vw, 14px)" 
          }}>
            Registre medições de ciclo por elemento de trabalho
          </p>
        </div>
        <Botao
          variant="secondary"
          size="md"
          onClick={() => navigate(`/linhas/${linhaIdAtual}`)}
        >
          ← Voltar
        </Botao>
      </div>

      {/* Seletores */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "clamp(15px, 2vw, 25px)", 
        borderRadius: "8px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "clamp(20px, 3vw, 30px)",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", 
          gap: "clamp(15px, 2vw, 20px)" 
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
                <option key={posto.id} value={posto.id}>{posto.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyleResponsivo}>Operador</label>
            <select
              name="operador_id"
              value={novaMedicao.operador_id}
              onChange={handleInputChange}
              style={inputStyleResponsivo}
              disabled={!postoSelecionado}
            >
              <option value="">Selecione (opcional)</option>
              {operadores.map(op => (
                <option key={op.id} value={op.id}>{op.nome}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Painel de Estatísticas */}
      {postoSelecionado && analiseEstatistica && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 20px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "clamp(20px, 3vw, 30px)",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <h3 style={{ 
            color: "#1E3A8A", 
            marginBottom: "clamp(10px, 1.5vw, 15px)", 
            fontSize: "clamp(16px, 2.5vw, 18px)" 
          }}>
            📊 Análise Estatística - {postoAtual?.nome}
          </h3>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 120px), 1fr))", 
            gap: "clamp(10px, 1.5vw, 15px)" 
          }}>
            <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#666" }}>AMOSTRAS</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1E3A8A" }}>{analiseEstatistica.total_amostras}</div>
            </div>
            <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#666" }}>MÉDIA (s)</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#16a34a" }}>{analiseEstatistica.media}</div>
            </div>
            <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#666" }}>MIN / MAX</div>
              <div style={{ fontSize: "14px", fontWeight: "bold" }}>{analiseEstatistica.minimo} / {analiseEstatistica.maximo}</div>
            </div>
            <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#666" }}>DESVIO PADRÃO</div>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#f59e0b" }}>{analiseEstatistica.desvio}s</div>
            </div>
            <div style={{ backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#666" }}>CV (%)</div>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: analiseEstatistica.cv < 10 ? "#16a34a" : "#dc2626" }}>{analiseEstatistica.cv}</div>
              <div style={{ fontSize: "10px", color: "#666" }}>{analiseEstatistica.classificacao}</div>
            </div>
          </div>
        </div>
      )}

      {/* Formulário de Medição */}
      {postoSelecionado && (
        <div style={{ 
          backgroundColor: "white", 
          padding: "clamp(15px, 2vw, 25px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "clamp(20px, 3vw, 30px)",
          width: "100%",
          boxSizing: "border-box"
        }}>
          <h3 style={{ 
            color: "#1E3A8A", 
            marginBottom: "clamp(15px, 2vw, 20px)", 
            fontSize: "clamp(16px, 2.5vw, 18px)" 
          }}>
            ⏱️ Nova Medição de Ciclo
          </h3>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", 
            gap: "clamp(15px, 2vw, 20px)" 
          }}>
            <div>
              <label style={labelStyleResponsivo}>Elemento *</label>
              <select
                name="elemento"
                value={novaMedicao.elemento}
                onChange={handleInputChange}
                style={inputStyleResponsivo}
                required
              >
                <option value="">Selecione um elemento</option>
                {elementosPadrao.map(elem => (
                  <option key={elem} value={elem}>{elem}</option>
                ))}
              </select>
            </div>

            <div>
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
              />
            </div>

            <div>
              <label style={labelStyleResponsivo}>Método</label>
              <select
                name="metodo"
                value={novaMedicao.metodo}
                onChange={handleInputChange}
                style={inputStyleResponsivo}
              >
                {metodos.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyleResponsivo}>Condição</label>
              <select
                name="condicao"
                value={novaMedicao.condicao}
                onChange={handleInputChange}
                style={inputStyleResponsivo}
              >
                {condicoes.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyleResponsivo}>Observação</label>
              <input
                type="text"
                name="observacao"
                value={novaMedicao.observacao}
                onChange={handleInputChange}
                style={inputStyleResponsivo}
                placeholder="Anotações sobre a medição..."
              />
            </div>
          </div>

          <Botao
            variant="success"
            size="md"
            fullWidth={true}
            onClick={adicionarMedicao}
            disabled={salvando || !novaMedicao.elemento || !novaMedicao.tempo_ciclo_segundos}
            loading={salvando}
            style={{ marginTop: "20px" }}
          >
            + Registrar Medição
          </Botao>
        </div>
      )}

      {/* Histórico de Medições */}
      {postoSelecionado && (
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
              Histórico de Medições {postoAtual?.nome ? `- ${postoAtual.nome}` : ""}
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

          {carregando ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              Carregando medições...
            </div>
          ) : medicoes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              Nenhuma medição registrada para este posto.
            </div>
          ) : (
            <div style={{ overflowX: "auto", width: "100%" }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse",
                minWidth: "800px",
                backgroundColor: "white"
              }}>
                <thead>
                  <tr style={{ backgroundColor: "#1E3A8A", color: "white" }}>
                    <th style={thResponsivo}>Data/Hora</th>
                    <th style={thResponsivo}>Elemento</th>
                    <th style={thResponsivo}>Tempo (s)</th>
                    <th style={thResponsivo}>Método</th>
                    <th style={thResponsivo}>Condição</th>
                    <th style={thResponsivo}>Operador</th>
                    <th style={thResponsivo}>Observação</th>
                    <th style={thResponsivo}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {medicoes.map((med) => (
                    <tr key={med.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={tdResponsivo}>
                        {formatarData(med.data_medicao)}<br/>
                        <span style={{ fontSize: "11px", color: "#666" }}>{med.hora_medicao || "-"}</span>
                      </td>
                      <td style={tdResponsivo}>{med.elemento}</td>
                      <td style={tdResponsivo}>
                        <span style={{ fontWeight: "bold", color: "#16a34a" }}>
                          {parseFloat(med.tempo_ciclo_segundos).toFixed(2)}s
                        </span>
                      </td>
                      <td style={tdResponsivo}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          backgroundColor: med.metodo === "padrao" ? "#16a34a20" : 
                                         med.metodo === "melhorado" ? "#3b82f620" : "#dc262620",
                          color: med.metodo === "padrao" ? "#16a34a" : 
                                 med.metodo === "melhorado" ? "#3b82f6" : "#dc2626"
                        }}>
                          {metodos.find(m => m.value === med.metodo)?.label || med.metodo}
                        </span>
                      </td>
                      <td style={tdResponsivo}>
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          backgroundColor: med.condicao === "normal" ? "#16a34a20" : "#f59e0b20",
                          color: med.condicao === "normal" ? "#16a34a" : "#f59e0b"
                        }}>
                          {condicoes.find(c => c.value === med.condicao)?.label || med.condicao}
                        </span>
                      </td>
                      <td style={tdResponsivo}>
                        {operadores.find(op => op.id === med.operador_id)?.nome || "-"}
                      </td>
                      <td style={tdResponsivo} title={med.observacao || "-"}>
                        {med.observacao ? (med.observacao.length > 20 ? med.observacao.substring(0, 20) + '...' : med.observacao) : "-"}
                      </td>
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
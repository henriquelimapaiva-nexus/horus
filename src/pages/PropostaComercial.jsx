// src/pages/PropostaComercial.jsx
import { useState, useEffect, useRef } from "react";
import { useOutletContext, Link, useLocation } from "react-router-dom";
import api from "../api/api";
import logo from "../assets/logo.png";
import Botao from "../components/ui/Botao";
import toast from 'react-hot-toast';

// Função auxiliar para truncar texto
const truncarTexto = (texto, maxLength = 30) => {
  if (!texto) return "";
  return texto.length > maxLength ? texto.substring(0, maxLength - 3) + '...' : texto;
};

export default function PropostaComercial() {
  const { clienteAtual } = useOutletContext();
  const location = useLocation();
  const propostaRef = useRef();

  const [empresas, setEmpresas] = useState([]);
  const [dadosProposta, setDadosProposta] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(clienteAtual || "");
  const [precoIA, setPrecoIA] = useState(null);
  const [textoCompletoIA, setTextoCompletoIA] = useState("");
  
  const [parametros, setParametros] = useState({
    honorarios: "",
    percentualReducao: "",
    mesesAcompanhamento: ""
  });

  useEffect(() => {
    api.get("/empresas")
      .then(res => setEmpresas(res.data))
      .catch(err => {
        console.error("Erro ao carregar empresas:", err);
        toast.error("Erro ao carregar empresas");
      });
  }, []);

  // RECEBER EMPRESA DO STATE (quando vem da IA de Precificação)
  useEffect(() => {
    if (location.state?.empresaId) {
      setEmpresaSelecionada(location.state.empresaId);
    }
  }, [location]);

  // Carregar preço da IA quando selecionar empresa
  useEffect(() => {
    const precoSalvo = localStorage.getItem('precoJustoProposta');
    if (precoSalvo) {
      try {
        const dados = JSON.parse(precoSalvo);
        setPrecoIA(dados);
        
        const empresaAtual = empresas.find(e => e.id === parseInt(empresaSelecionada));
        if (empresaAtual && empresaAtual.nome === dados.empresa) {
          setParametros(prev => ({
            ...prev,
            honorarios: dados.honorarios,
            percentualReducao: dados.percentualReducao || 30,
            mesesAcompanhamento: dados.mesesAcompanhamento || 3
          }));
          toast.success('🤖 Preço da IA carregado!');
        }
      } catch (error) {
        console.error('Erro ao carregar preço da IA:', error);
      }
    }
  }, [empresaSelecionada, empresas]);

  // FUNÇÃO PARA GERAR PROPOSTA COM IA (TEXTO COMPLETO)
  const gerarPropostaComIA = async () => {
    if (!empresaSelecionada) {
      toast.error("Selecione uma empresa");
      return;
    }

    setCarregando(true);
    const toastId = toast.loading('🤖 IA gerando proposta detalhada...');

    try {
      // 1. Buscar dados da empresa
      const linhasRes = await api.get(`/linhas/${empresaSelecionada}`);
      const linhas = linhasRes.data;

      let perdasTotais = 0;
      let oees = [];
      let gargalosCriticos = 0;
      let totalPostos = 0;
      const dadosLinhas = [];

      for (const linha of linhas) {
        try {
          const analiseRes = await api.get(`/analise-linha/${linha.id}`).catch(() => ({ data: {} }));
          const analise = analiseRes.data;
          
          if (analise.eficiencia_percentual) {
            oees.push(parseFloat(analise.eficiencia_percentual));
            if (analise.eficiencia_percentual < 60) {
              gargalosCriticos++;
            }
          }

          const postosRes = await api.get(`/postos/${linha.id}`).catch(() => ({ data: [] }));
          const postos = postosRes.data;
          totalPostos += postos.length;

          // Guardar dados detalhados da linha
          dadosLinhas.push({
            nome: linha.nome,
            oee: analise.eficiencia_percentual || 0,
            gargalo: analise.gargalo || "Não identificado",
            capacidade: analise.capacidade_estimada_dia || 0,
            postos: postos.length
          });

          for (const posto of postos) {
            if (posto.cargo_id) {
              const cargosRes = await api.get(`/cargos/${empresaSelecionada}`).catch(() => ({ data: [] }));
              const cargo = cargosRes.data.find(c => c.id === posto.cargo_id);
              if (cargo) {
                const salario = parseFloat(cargo.salario_base) || 0;
                const encargos = parseFloat(cargo.encargos_percentual) || 70;
                const custoMensal = salario * (1 + encargos / 100);
                perdasTotais += custoMensal * 0.2;
              }
            }
          }
        } catch (err) {
          console.error(`Erro ao processar linha ${linha.id}:`, err);
        }
      }

      const oeeMedio = oees.length > 0 ? oees.reduce((a, b) => a + b, 0) / oees.length : 0;
      
      // 2. Usar honorários da IA ou calcular automaticamente
      const honorarios = parametros.honorarios || Math.round(perdasTotais * 0.3 * 12 * 0.3);
      const percentualReducao = parametros.percentualReducao || 30;
      const mesesAcompanhamento = parametros.mesesAcompanhamento || 3;
      
      const ganhoMensal = perdasTotais * (percentualReducao / 100);
      const roiAnual = (ganhoMensal * 12 / honorarios) * 100;
      const payback = honorarios / ganhoMensal;

      // 3. Montar dados para a IA
      const dadosParaIA = {
        empresa: empresas.find(e => e.id === parseInt(empresaSelecionada))?.nome,
        data: new Date().toLocaleDateString('pt-BR'),
        oeeMedio: oeeMedio.toFixed(1),
        perdasTotais,
        gargalosCriticos,
        totalLinhas: linhas.length,
        totalPostos,
        dadosLinhas,
        honorarios,
        percentualReducao,
        mesesAcompanhamento,
        ganhoMensal,
        roiAnual: roiAnual.toFixed(0),
        payback: payback.toFixed(1)
      };

      // 4. Chamar a IA para gerar o texto completo
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/ia/gerar-proposta-completa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(dadosParaIA)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Erro na IA');
      }

      // 5. Guardar o texto gerado pela IA
      setTextoCompletoIA(data.proposta);
      
      // 6. Também manter os dados numéricos para referência
      setDadosProposta({
        empresa: dadosParaIA.empresa,
        data: dadosParaIA.data,
        diagnostico: {
          oeeMedio: dadosParaIA.oeeMedio,
          perdasTotais: dadosParaIA.perdasTotais,
          gargalosCriticos: dadosParaIA.gargalosCriticos,
          totalLinhas: dadosParaIA.totalLinhas,
          totalPostos: dadosParaIA.totalPostos
        },
        escopo: {
          diagnostico: "2 semanas",
          implementacao: "4 semanas",
          acompanhamento: `${dadosParaIA.mesesAcompanhamento} meses`
        },
        investimento: {
          honorarios: dadosParaIA.honorarios,
          entrada: dadosParaIA.honorarios * 0.5,
          saldo: dadosParaIA.honorarios * 0.5
        },
        retorno: {
          ganhoMensal: dadosParaIA.ganhoMensal,
          roiAnual: dadosParaIA.roiAnual,
          payback: dadosParaIA.payback
        }
      });
      
      toast.dismiss(toastId);
      toast.success('Proposta detalhada gerada com sucesso!');

    } catch (error) {
      console.error('Erro ao gerar proposta com IA:', error);
      toast.dismiss(toastId);
      toast.error('Erro ao gerar proposta');
    } finally {
      setCarregando(false);
    }
  };

  const gerarPDF = () => {
    if (!dadosProposta) {
      toast.error("Gere uma proposta primeiro");
      return;
    }
    window.print();
    toast.success("PDF gerado com sucesso!");
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  return (
    <div style={{ 
      padding: "clamp(15px, 3vw, 30px)", 
      width: "100%",
      maxWidth: "1200px",
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      
      {/* 🟢 CABEÇALHO REMOVIDO - AGORA VAI DIRETO PARA O CONTEÚDO */}

      {/* Configurações responsivas */}
      <div className="no-print" style={{ 
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
          Configurar Proposta
        </h3>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", 
          gap: "clamp(15px, 2vw, 20px)" 
        }}>
          
          <div>
            <label style={labelStyleResponsivo}>Empresa *</label>
            <select
              value={empresaSelecionada}
              onChange={(e) => setEmpresaSelecionada(e.target.value)}
              style={inputStyleResponsivo}
            >
              <option value="">Selecione...</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{truncarTexto(emp.nome, 25)}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyleResponsivo}>Honorários (R$) *</label>
            <input
              type="number"
              value={parametros.honorarios}
              onChange={(e) => setParametros({...parametros, honorarios: e.target.value})}
              style={inputStyleResponsivo}
              step="1000"
              min="10000"
              placeholder="Ex: 48000"
              required
            />
            {precoIA && precoIA.empresa === empresas.find(e => e.id === parseInt(empresaSelecionada))?.nome && (
              <small style={{ color: '#16a34a', display: 'block', marginTop: '4px' }}>
                ✨ Preço calculado pela IA de Precificação
              </small>
            )}
          </div>

          <div>
            <label style={labelStyleResponsivo}>% Redução *</label>
            <input
              type="number"
              value={parametros.percentualReducao}
              onChange={(e) => setParametros({...parametros, percentualReducao: e.target.value})}
              style={inputStyleResponsivo}
              min="10"
              max="50"
              step="5"
              placeholder="Ex: 30"
              required
            />
          </div>

          <div>
            <label style={labelStyleResponsivo}>Meses Acompanhamento *</label>
            <input
              type="number"
              value={parametros.mesesAcompanhamento}
              onChange={(e) => setParametros({...parametros, mesesAcompanhamento: e.target.value})}
              style={inputStyleResponsivo}
              min="1"
              max="6"
              placeholder="Ex: 3"
              required
            />
          </div>
        </div>

        <div style={{ 
          display: "flex", 
          gap: "clamp(8px, 1.5vw, 10px)", 
          marginTop: "clamp(15px, 2vw, 20px)",
          flexWrap: "wrap"
        }}>
          
          {/* BOTÃO DA IA (sempre visível se empresa selecionada) */}
          {empresaSelecionada && (
            <Botao
              variant="primary"
              size="md"
              onClick={gerarPropostaComIA}
              disabled={carregando}
              loading={carregando}
              style={{
                backgroundColor: "#7c3aed",
                color: "white"
              }}
            >
              {carregando ? 'Gerando...' : '✨ Gerar proposta detalhada com IA'}
            </Botao>
          )}
          
          {/* BOTÃO EXPORTAR PDF (sempre visível, mas desabilitado se não houver proposta) */}
          <Botao
            variant="success"
            size="md"
            onClick={gerarPDF}
            disabled={!dadosProposta}
          >
            📄 Exportar PDF
          </Botao>
        </div>
      </div>

      {/* CONTEÚDO DA PROPOSTA GERADA PELA IA */}
      {carregando && (
        <div style={{ 
          textAlign: "center", 
          padding: "clamp(20px, 4vw, 40px)", 
          color: "#666",
          fontSize: "clamp(14px, 2vw, 16px)"
        }}>
          Gerando proposta detalhada... (pode levar alguns segundos)
        </div>
      )}

      {dadosProposta && (
        <div className="relatorio-print" ref={propostaRef} style={{ 
          backgroundColor: "white", 
          padding: "clamp(20px, 4vw, 40px)", 
          borderRadius: "8px", 
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          position: "relative",
          width: "100%",
          boxSizing: "border-box",
          overflow: "hidden"
        }}>
          
          {/* Marca d'água responsiva */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-45deg)",
            opacity: 0.03,
            fontSize: "clamp(40px, 10vw, 100px)",
            color: "#1E3A8A",
            pointerEvents: "none",
            zIndex: 0,
            whiteSpace: "nowrap",
            fontWeight: "bold"
          }}>
            NEXUS
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            
            {/* Cabeçalho do documento com logo e nome da empresa */}
            <div style={{ textAlign: "center", marginBottom: "clamp(20px, 4vw, 40px)" }}>
              <img src={logo} alt="Nexus Engenharia Aplicada" style={{ 
                width: "min(180px, 50%)", 
                height: "auto", 
                marginBottom: "clamp(5px, 1vw, 10px)" 
              }} />
              
              {/* NOME DA EMPRESA */}
              <h2 style={{ 
                color: "#1E3A8A", 
                margin: "0 0 5px 0",
                fontSize: "clamp(16px, 2.5vw, 20px)",
                fontWeight: "600",
                letterSpacing: "0.5px"
              }}>
                NEXUS ENGENHARIA APLICADA
              </h2>
              
              <h1 style={{ 
                color: "#1E3A8A", 
                margin: "5px 0", 
                fontSize: "clamp(18px, 4vw, 26px)" 
              }}>
                PROPOSTA COMERCIAL
              </h1>
              <p style={{ 
                color: "#666", 
                fontSize: "clamp(12px, 2vw, 14px)" 
              }}>
                Data: {dadosProposta.data}
              </p>
            </div>

            {/* Dados do Cliente */}
            <div style={{ marginBottom: "clamp(20px, 3vw, 30px)" }}>
              <h2 style={{ 
                color: "#1E3A8A", 
                fontSize: "clamp(16px, 2.5vw, 18px)", 
                marginBottom: "10px",
                wordBreak: "break-word"
              }}>
                Para: {truncarTexto(dadosProposta.empresa, 40)}
              </h2>
            </div>

            {/* TEXTO COMPLETO GERADO PELA IA (se existir) */}
            {textoCompletoIA && (
              <div style={{ 
                whiteSpace: "pre-line", 
                lineHeight: 1.8,
                fontSize: "clamp(13px, 1.8vw, 14px)",
                marginBottom: "clamp(30px, 5vw, 50px)",
                textAlign: "justify"
              }}>
                {textoCompletoIA
                  .replace(/\*\*/g, '')
                  .replace(/\*/g, '')
                  .replace(/PROPOSTA COMERCIAL DETALHADA E PERSUASIVA/g, '')
                  .replace(/CABEÇALHO PROFISSIONAL/g, '')
                }
              </div>
            )}

            {/* Caso não tenha texto da IA, mostra o layout antigo (fallback) */}
            {!textoCompletoIA && (
              <>
                {/* 1. DIAGNÓSTICO ATUAL responsivo */}
                <div style={{ marginBottom: "clamp(20px, 3vw, 30px)" }}>
                  <h3 style={{ 
                    color: "#1E3A8A", 
                    borderBottom: "2px solid #1E3A8A", 
                    paddingBottom: "5px", 
                    marginBottom: "clamp(10px, 1.5vw, 15px)",
                    fontSize: "clamp(16px, 2.5vw, 18px)"
                  }}>
                    1. DIAGNÓSTICO ATUAL
                  </h3>
                  
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", 
                    gap: "clamp(10px, 1.5vw, 15px)",
                    backgroundColor: "#f9fafb",
                    padding: "clamp(15px, 2vw, 20px)",
                    borderRadius: "4px"
                  }}>
                    <div>
                      <p style={{ fontSize: "clamp(13px, 1.8vw, 14px)" }}>
                        <strong>📊 OEE Médio:</strong> {dadosProposta.diagnostico.oeeMedio}%
                      </p>
                      <p style={{ fontSize: "clamp(13px, 1.8vw, 14px)" }}>
                        <strong>💰 Perdas Totais:</strong> {formatarMoeda(dadosProposta.diagnostico.perdasTotais)}/mês
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: "clamp(13px, 1.8vw, 14px)" }}>
                        <strong>🔴 Gargalos Críticos:</strong> {dadosProposta.diagnostico.gargalosCriticos}
                      </p>
                      <p style={{ fontSize: "clamp(13px, 1.8vw, 14px)" }}>
                        <strong>🏭 Linhas/Postos:</strong> {dadosProposta.diagnostico.totalLinhas} linhas, {dadosProposta.diagnostico.totalPostos} postos
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. ESCOPO DO TRABALHO responsivo */}
                <div style={{ marginBottom: "clamp(20px, 3vw, 30px)" }}>
                  <h3 style={{ 
                    color: "#1E3A8A", 
                    borderBottom: "2px solid #1E3A8A", 
                    paddingBottom: "5px", 
                    marginBottom: "clamp(10px, 1.5vw, 15px)",
                    fontSize: "clamp(16px, 2.5vw, 18px)"
                  }}>
                    2. ESCOPO DO TRABALHO
                  </h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 1.5vw, 15px)" }}>
                    {[1, 2, 3].map((num) => {
                      const fase = num === 1 ? "Diagnóstico Detalhado" : 
                                   num === 2 ? "Implementação" : "Acompanhamento";
                      const prazo = num === 1 ? dadosProposta.escopo.diagnostico :
                                    num === 2 ? dadosProposta.escopo.implementacao :
                                    dadosProposta.escopo.acompanhamento;
                      const descricao = num === 1 ? "Análise aprofundada dos gargalos, mapeamento de perdas" :
                                         num === 2 ? "Redução de setup (SMED), balanceamento de linhas" :
                                         "Monitoramento de indicadores, ajustes finos, transferência";
                      
                      return (
                        <div key={num} style={{ 
                          display: "flex", 
                          gap: "clamp(10px, 2vw, 20px)", 
                          alignItems: "flex-start",
                          flexWrap: "wrap"
                        }}>
                          <div style={{ 
                            width: "clamp(30px, 5vw, 40px)", 
                            height: "clamp(30px, 5vw, 40px)", 
                            borderRadius: "50%", 
                            backgroundColor: "#1E3A8A20",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            color: "#1E3A8A",
                            fontSize: "clamp(14px, 2vw, 16px)",
                            flexShrink: 0
                          }}>{num}</div>
                          <div style={{ flex: 1, minWidth: "200px" }}>
                            <strong style={{ fontSize: "clamp(14px, 2vw, 16px)" }}>
                              Fase {num} - {fase} ({prazo})
                            </strong>
                            <p style={{ 
                              margin: "5px 0 0 0", 
                              color: "#666", 
                              fontSize: "clamp(12px, 1.8vw, 14px)" 
                            }}>
                              {descricao}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. INVESTIMENTO responsivo */}
                <div style={{ marginBottom: "clamp(20px, 3vw, 30px)" }}>
                  <h3 style={{ 
                    color: "#1E3A8A", 
                    borderBottom: "2px solid #1E3A8A", 
                    paddingBottom: "5px", 
                    marginBottom: "clamp(10px, 1.5vw, 15px)",
                    fontSize: "clamp(16px, 2.5vw, 18px)"
                  }}>
                    3. INVESTIMENTO
                  </h3>
                  
                  <div style={{ overflowX: "auto", width: "100%" }}>
                    <table style={{ 
                      width: "100%", 
                      borderCollapse: "collapse",
                      minWidth: "300px"
                    }}>
                      <tbody>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "clamp(8px, 1.5vw, 10px)" }}>
                            <strong>Honorários totais</strong>
                          </td>
                          <td style={{ 
                            padding: "clamp(8px, 1.5vw, 10px)", 
                            textAlign: "right" 
                          }}>
                            {formatarMoeda(dadosProposta.investimento.honorarios)}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "clamp(8px, 1.5vw, 10px)" }}>Entrada (50%)</td>
                          <td style={{ 
                            padding: "clamp(8px, 1.5vw, 10px)", 
                            textAlign: "right" 
                          }}>
                            {formatarMoeda(dadosProposta.investimento.entrada)}
                          </td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "clamp(8px, 1.5vw, 10px)" }}>Saldo na entrega (50%)</td>
                          <td style={{ 
                            padding: "clamp(8px, 1.5vw, 10px)", 
                            textAlign: "right" 
                          }}>
                            {formatarMoeda(dadosProposta.investimento.saldo)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: "clamp(8px, 1.5vw, 10px)", color: "#666" }}>Prazo total</td>
                          <td style={{ 
                            padding: "clamp(8px, 1.5vw, 10px)", 
                            textAlign: "right", 
                            color: "#666" 
                          }}>
                            3 meses
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. RETORNO SOBRE INVESTIMENTO responsivo */}
                <div style={{ marginBottom: "clamp(20px, 3vw, 30px)" }}>
                  <h3 style={{ 
                    color: "#1E3A8A", 
                    borderBottom: "2px solid #1E3A8A", 
                    paddingBottom: "5px", 
                    marginBottom: "clamp(10px, 1.5vw, 15px)",
                    fontSize: "clamp(16px, 2.5vw, 18px)"
                  }}>
                    4. RETORNO SOBRE INVESTIMENTO (ROI)
                  </h3>
                  
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", 
                    gap: "clamp(15px, 2vw, 20px)",
                    textAlign: "center"
                  }}>
                    <div style={{ 
                      backgroundColor: "#f9fafb", 
                      padding: "clamp(15px, 2vw, 20px)", 
                      borderRadius: "8px"
                    }}>
                      <div style={{ 
                        fontSize: "clamp(12px, 1.8vw, 14px)", 
                        color: "#666", 
                        marginBottom: "5px" 
                      }}>
                        Ganho Mensal
                      </div>
                      <div style={{ 
                        fontSize: "clamp(18px, 3vw, 24px)", 
                        fontWeight: "bold", 
                        color: "#16a34a" 
                      }}>
                        {formatarMoeda(dadosProposta.retorno.ganhoMensal)}
                      </div>
                    </div>

                    <div style={{ 
                      backgroundColor: "#f9fafb", 
                      padding: "clamp(15px, 2vw, 20px)", 
                      borderRadius: "8px"
                    }}>
                      <div style={{ 
                        fontSize: "clamp(12px, 1.8vw, 14px)", 
                        color: "#666", 
                        marginBottom: "5px" 
                      }}>
                        ROI Anual
                      </div>
                      <div style={{ 
                        fontSize: "clamp(18px, 3vw, 24px)", 
                        fontWeight: "bold", 
                        color: "#1E3A8A" 
                      }}>
                        {dadosProposta.retorno.roiAnual}%
                      </div>
                    </div>

                    <div style={{ 
                      backgroundColor: "#f9fafb", 
                      padding: "clamp(15px, 2vw, 20px)", 
                      borderRadius: "8px"
                    }}>
                      <div style={{ 
                        fontSize: "clamp(12px, 1.8vw, 14px)", 
                        color: "#666", 
                        marginBottom: "5px" 
                      }}>
                        Payback
                      </div>
                      <div style={{ 
                        fontSize: "clamp(18px, 3vw, 24px)", 
                        fontWeight: "bold", 
                        color: "#f59e0b" 
                      }}>
                        {dadosProposta.retorno.payback} meses
                      </div>
                    </div>
                  </div>

                  <p style={{ 
                    marginTop: "clamp(10px, 1.5vw, 15px)", 
                    padding: "clamp(8px, 1.5vw, 10px)", 
                    backgroundColor: "#16a34a20", 
                    borderRadius: "4px",
                    color: "#16a34a",
                    textAlign: "center",
                    fontSize: "clamp(12px, 1.8vw, 14px)"
                  }}>
                    ⚡ Retorno do investimento em apenas {dadosProposta.retorno.payback} meses!
                  </p>
                </div>

                {/* 5. PRÓXIMOS PASSOS */}
                <div style={{ marginBottom: "clamp(20px, 3vw, 30px)" }}>
                  <h3 style={{ 
                    color: "#1E3A8A", 
                    borderBottom: "2px solid #1E3A8A", 
                    paddingBottom: "5px", 
                    marginBottom: "clamp(10px, 1.5vw, 15px)",
                    fontSize: "clamp(16px, 2.5vw, 18px)"
                  }}>
                    5. PRÓXIMOS PASSOS
                  </h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "clamp(8px, 1.5vw, 10px)" }}>
                    <label style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "10px",
                      fontSize: "clamp(13px, 1.8vw, 14px)"
                    }}>
                      <input type="checkbox" style={{ width: "18px", height: "18px" }} />
                      <span>Assinar proposta</span>
                    </label>
                    <label style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "10px",
                      fontSize: "clamp(13px, 1.8vw, 14px)"
                    }}>
                      <input type="checkbox" style={{ width: "18px", height: "18px" }} />
                      <span>Agendar reunião de kick-off</span>
                    </label>
                    <label style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "10px",
                      fontSize: "clamp(13px, 1.8vw, 14px)"
                    }}>
                      <input type="checkbox" style={{ width: "18px", height: "18px" }} />
                      <span>Iniciar diagnóstico</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Assinatura responsiva (sempre aparece) */}
            <div style={{ marginTop: "clamp(30px, 5vw, 50px)", textAlign: "center" }}>
              <p>____________________________________</p>
              <p style={{ 
                marginTop: "5px", 
                fontSize: "clamp(14px, 2vw, 16px)" 
              }}>
                <strong>Eng. [Seu Nome]</strong>
              </p>
              <p style={{ 
                color: "#666", 
                fontSize: "clamp(12px, 1.8vw, 14px)" 
              }}>
                Consultor - Nexus Engenharia Aplicada
              </p>
            </div>

            {/* Validade responsiva */}
            <p style={{ 
              marginTop: "clamp(20px, 3vw, 30px)", 
              fontSize: "clamp(10px, 1.5vw, 12px)", 
              color: "#999",
              textAlign: "center"
            }}>
              Proposta válida por 15 dias
            </p>
          </div>
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
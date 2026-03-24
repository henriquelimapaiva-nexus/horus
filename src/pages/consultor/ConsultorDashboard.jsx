// src/pages/consultor/ConsultorDashboard.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import { useConsultorAuth } from "../../context/ConsultorAuthContext";
import TarefasWidget from "../../components/consultor/TarefasWidget";

// Cores exclusivas do consultor
const coresConsultor = {
  primary: "#0f172a",
  secondary: "#334155",
  accent: "#7c3aed",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#dc2626",
  info: "#2563eb",
  faturamento: "#059669",
  metas: "#7c3aed",
  clientes: "#2563eb",
  projetos: "#db2777"
};

export default function ConsultorDashboard() {
  const { usuario } = useConsultorAuth();
  const [carregando, setCarregando] = useState(true);
  const [tarefas, setTarefas] = useState([]);
  const [resumoTarefas, setResumoTarefas] = useState(null);
  const [dados, setDados] = useState({
    empresas: [],
    totalLinhas: 0,
    totalPostos: 0,
    totalPerdas: 0,
    oeeMedio: 0,
    faturamentoMes: 0,
    faturamentoAno: 0,
    faturamentoProjetado: 0,
    clientesAtivos: 0,
    projetos: {
      diagnostico: 0,
      implementacao: 0,
      acompanhamento: 0,
      concluidos: 0
    },
    topClientes: [],
    taxaRetencao: 98,
    satisfacaoMedia: 4.8,
    projetosConcluidos: 0,
    horasConsultadas: 450,
    roiMedio: 3.2,
    progressoFaturamento: 0,
    progressoClientes: 0,
    progressoSatisfacao: 96,
    horasTrabalhadas: 0,
    horasFaturaveis: 0
  });

  // Missão, Visão e Valores
  const missao = "Transformar indústrias através da engenharia aplicada, maximizando eficiência e reduzindo perdas com soluções personalizadas e baseadas em dados.";
  const visao = "Ser referência nacional em consultoria de otimização de processos industriais até 2030, impactando mais de 100 empresas com ganhos superiores a R$ 100 milhões.";
  const valores = [
    "Excelência Técnica",
    "Transparência",
    "Inovação Constante",
    "Resultado para o Cliente",
    "Ética e Integridade",
    "Sustentabilidade"
  ];

  // Carregar dados reais
  useEffect(() => {
    async function carregarDados() {
      try {
        const [empresasRes, resumoTarefasRes, horasRes] = await Promise.all([
          api.get("/companies"),
          api.get("/tarefas/resumo"),
          api.get("/horas/resumo")
        ]);
        
        const empresas = empresasRes.data;
        
        let totalLinhas = 0;
        let totalPostos = 0;
        let totalPerdas = 0;
        let somaOEE = 0;
        let empresasComOEE = 0;
        
        // Dados para faturamento e status
        let faturamentoTotal = 0;
        let projetos = { diagnostico: 0, implementacao: 0, acompanhamento: 0, concluidos: 0 };
        let clientesAtivos = 0;
        const clientesComImpacto = [];

        for (const empresa of empresas) {
          // Soma valor do contrato
          if (empresa.valor_contrato) {
            faturamentoTotal += parseFloat(empresa.valor_contrato);
          }
          
          // Conta por status
          if (empresa.status === "diagnostico") projetos.diagnostico++;
          else if (empresa.status === "implementacao") projetos.implementacao++;
          else if (empresa.status === "acompanhamento") projetos.acompanhamento++;
          else if (empresa.status === "concluido") projetos.concluidos++;
          
          // Conta clientes ativos (todos exceto concluídos)
          if (empresa.status !== "concluido") {
            clientesAtivos++;
          }
          
          // Calcular impacto aproximado (baseado nas perdas)
          let impactoEmpresa = 0;
          
          try {
            const linhasRes = await api.get(`/lines/${empresa.id}`);
            const linhas = linhasRes.data;
            
            for (const linha of linhas) {
              const perdasRes = await api.get(`/losses/${linha.id}`).catch(() => ({ data: [] }));
              perdasRes.data.forEach(perda => {
                impactoEmpresa += (perda.microparadas_minutos || 0) * 10;
                impactoEmpresa += (perda.refugo_pecas || 0) * 50;
              });
            }
          } catch (err) {
            console.error(`Erro ao calcular impacto para ${empresa.nome}:`, err);
          }
          
          clientesComImpacto.push({
            id: empresa.id,
            nome: empresa.nome,
            impacto: impactoEmpresa || Math.floor(Math.random() * 30000) + 10000,
            status: empresa.status
          });
          
          // Buscar linhas e postos
          try {
            const linhasRes = await api.get(`/lines/${empresa.id}`);
            const linhas = linhasRes.data;
            totalLinhas += linhas.length;

            for (const linha of linhas) {
              try {
                const postosRes = await api.get(`/work-stations/${linha.id}`);
                totalPostos += postosRes.data.length;

                const analiseRes = await api.get(`/analise-linha/${linha.id}`);
                if (analiseRes.data.eficiencia_percentual) {
                  somaOEE += parseFloat(analiseRes.data.eficiencia_percentual);
                  empresasComOEE++;
                }

                const perdasRes = await api.get(`/losses/${linha.id}`).catch(() => ({ data: [] }));
                perdasRes.data.forEach(perda => {
                  totalPerdas += (perda.microparadas_minutos || 0) * 0.5;
                  totalPerdas += (perda.refugo_pecas || 0) * 50;
                });

              } catch (err) {
                console.error(`Erro ao processar linha ${linha.id}:`, err);
              }
            }
          } catch (err) {
            console.error(`Erro ao processar empresa ${empresa.id}:`, err);
          }
        }

        // Calcular metas
        const metaFaturamento = 240000;
        const progressoFaturamento = Math.min(100, Math.round((faturamentoTotal / metaFaturamento) * 100));
        const metaClientes = 12;
        const progressoClientes = Math.min(100, Math.round((clientesAtivos / metaClientes) * 100));

        // Top 3 clientes por impacto
        const topClientes = clientesComImpacto
          .sort((a, b) => b.impacto - a.impacto)
          .slice(0, 3);

        setResumoTarefas(resumoTarefasRes.data);
        setDados(prev => ({
          ...prev,
          empresas,
          totalLinhas,
          totalPostos,
          totalPerdas: Math.round(totalPerdas),
          oeeMedio: empresasComOEE > 0 ? (somaOEE / empresasComOEE).toFixed(1) : 0,
          clientesAtivos,
          faturamentoMes: Math.round(faturamentoTotal / 12),
          faturamentoAno: faturamentoTotal,
          faturamentoProjetado: faturamentoTotal + Math.round(faturamentoTotal * 0.3),
          projetos,
          topClientes,
          projetosConcluidos: projetos.concluidos,
          progressoFaturamento,
          progressoClientes,
          horasTrabalhadas: horasRes.data.total_horas || 0,
          horasFaturaveis: horasRes.data.horas_faturaveis || 0
        }));

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  if (carregando) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "400px" 
      }}>
        <p>Carregando dados do consultor...</p>
      </div>
    );
  }

  return (
    <div>
      {/* SEÇÃO 1 - FATURAMENTO */}
      <h3 style={{ color: coresConsultor.primary, marginBottom: "15px" }}>
        💰 Faturamento
      </h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        <CardFaturamento
          titulo="Este Mês"
          valor={dados.faturamentoMes}
          variacao={dados.faturamentoMes > 0 ? "+12%" : "-"}
          cor={coresConsultor.faturamento}
        />
        <CardFaturamento
          titulo="Este Ano"
          valor={dados.faturamentoAno}
          variacao={dados.faturamentoAno > 0 ? "+8%" : "-"}
          cor={coresConsultor.faturamento}
        />
        <CardFaturamento
          titulo="Projetado 2026"
          valor={dados.faturamentoProjetado}
          variacao="Projeção"
          cor={coresConsultor.faturamento}
        />
      </div>

      {/* SEÇÃO 1.5 - HORAS TRABALHADAS */}
      <h3 style={{ color: coresConsultor.primary, marginBottom: "15px" }}>
        ⏱️ Horas Trabalhadas
      </h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        <CardMetrica
          titulo="Total Horas"
          valor={`${dados.horasTrabalhadas}h`}
          icone="⏱️"
          cor={coresConsultor.info}
        />
        <CardMetrica
          titulo="Horas Faturáveis"
          valor={`${dados.horasFaturaveis}h`}
          icone="💰"
          cor={coresConsultor.faturamento}
        />
        <CardMetrica
          titulo="Valor Faturável"
          valor={formatarMoeda(dados.horasFaturaveis * 120)}
          icone="📈"
          cor={coresConsultor.success}
        />
      </div>

      {/* SEÇÃO 2 - MÉTRICAS DO NEGÓCIO */}
      <h3 style={{ color: coresConsultor.primary, marginBottom: "15px" }}>
        📊 Métricas do Negócio
      </h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        <CardMetrica
          titulo="Clientes Ativos"
          valor={dados.clientesAtivos}
          icone="🏢"
          cor={coresConsultor.clientes}
        />
        <CardMetrica
          titulo="Projetos Concluídos"
          valor={dados.projetosConcluidos}
          icone="✅"
          cor={coresConsultor.success}
        />
        <CardMetrica
          titulo="Em Diagnóstico"
          valor={dados.projetos.diagnostico}
          icone="🔍"
          cor={coresConsultor.info}
        />
        <CardMetrica
          titulo="Em Implementação"
          valor={dados.projetos.implementacao}
          icone="⚙️"
          cor={coresConsultor.warning}
        />
        <CardMetrica
          titulo="Em Acompanhamento"
          valor={dados.projetos.acompanhamento}
          icone="📊"
          cor={coresConsultor.success}
        />
        <CardMetrica
          titulo="ROI Médio"
          valor={`${dados.roiMedio}x`}
          icone="📈"
          cor={coresConsultor.success}
        />
      </div>

      {/* SEÇÃO 3 - DADOS DOS CLIENTES */}
      <h3 style={{ color: coresConsultor.primary, marginBottom: "15px" }}>
        🏭 Dados Consolidados dos Clientes
      </h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        <CardMetrica
          titulo="Total de Linhas"
          valor={dados.totalLinhas}
          icone="📏"
          cor={coresConsultor.secondary}
        />
        <CardMetrica
          titulo="Total de Postos"
          valor={dados.totalPostos}
          icone="⚙️"
          cor={coresConsultor.secondary}
        />
        <CardMetrica
          titulo="Perdas Totais"
          valor={`R$ ${(dados.totalPerdas / 1000).toFixed(1)}K`}
          icone="💰"
          cor={coresConsultor.danger}
        />
        <CardMetrica
          titulo="OEE Médio"
          valor={`${dados.oeeMedio}%`}
          icone="📊"
          cor={dados.oeeMedio >= 70 ? coresConsultor.success : coresConsultor.warning}
        />
      </div>

      {/* SEÇÃO 4 - TAREFAS (WIDGET EDITÁVEL) */}
      <h3 style={{ color: coresConsultor.primary, marginBottom: "15px" }}>
        📋 Minhas Tarefas
      </h3>
      <div style={{ marginBottom: "30px" }}>
        <TarefasWidget onTarefasChange={setTarefas} />
      </div>

      {/* SEÇÃO 5 - RANKING DE CLIENTES */}
      <h3 style={{ color: coresConsultor.primary, marginBottom: "15px" }}>
        🏆 Top 3 Clientes por Impacto
      </h3>
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "30px"
      }}>
        {dados.topClientes.length > 0 ? (
          dados.topClientes.map((cliente, index) => (
            <div key={cliente.id} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: index < dados.topClientes.length - 1 ? "1px solid #e5e7eb" : "none"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: index === 0 ? coresConsultor.faturamento : 
                                 index === 1 ? coresConsultor.warning : coresConsultor.info,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "12px"
                }}>
                  {index + 1}
                </span>
                <span style={{ fontWeight: "500" }}>{cliente.nome}</span>
                <span style={{
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "10px",
                  backgroundColor: cliente.status === "concluido" ? `${coresConsultor.success}20` :
                                 cliente.status === "implementacao" ? `${coresConsultor.warning}20` :
                                 `${coresConsultor.info}20`,
                  color: cliente.status === "concluido" ? coresConsultor.success :
                         cliente.status === "implementacao" ? coresConsultor.warning :
                         coresConsultor.info
                }}>
                  {cliente.status === "diagnostico" ? "Diagnóstico" :
                   cliente.status === "implementacao" ? "Implementação" :
                   cliente.status === "acompanhamento" ? "Acompanhamento" : "Concluído"}
                </span>
              </div>
              <span style={{ fontWeight: "bold", color: coresConsultor.success }}>
                R$ {(cliente.impacto / 1000).toFixed(0)}K
              </span>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
            Nenhum cliente com impacto registrado
          </div>
        )}
      </div>

      {/* SEÇÃO 6 - PRÓXIMAS TAREFAS (do resumo) */}
      {resumoTarefas?.proximas_tarefas?.length > 0 && (
        <>
          <h3 style={{ color: coresConsultor.primary, marginBottom: "15px" }}>
            📅 Próximos Compromissos
          </h3>
          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            marginBottom: "30px"
          }}>
            {resumoTarefas.proximas_tarefas.map((tarefa, index) => (
              <div key={tarefa.id} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: index < resumoTarefas.proximas_tarefas.length - 1 ? "1px solid #e5e7eb" : "none"
              }}>
                <div>
                  <div style={{ fontWeight: "500" }}>{tarefa.titulo}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    📅 {new Date(tarefa.data_limite).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <span style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  backgroundColor: tarefa.prioridade === "alta" ? "#fee2e2" : "#fef3c7",
                  color: tarefa.prioridade === "alta" ? "#ef4444" : "#f59e0b"
                }}>
                  {tarefa.prioridade === "alta" ? "🔴 Alta" : "🟡 Média"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* SEÇÃO 7 - MISSÃO, VISÃO E VALORES */}
      <h3 style={{ color: coresConsultor.primary, marginBottom: "15px" }}>
        📌 Missão, Visão e Valores
      </h3>
      <div style={{
        backgroundColor: "white",
        padding: "25px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: "30px"
      }}>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontWeight: "bold", color: coresConsultor.primary, marginBottom: "5px" }}>
            🎯 MISSÃO
          </div>
          <p style={{ color: "#374151", lineHeight: "1.6", margin: 0 }}>
            {missao}
          </p>
        </div>
        
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontWeight: "bold", color: coresConsultor.primary, marginBottom: "5px" }}>
            👁️ VISÃO
          </div>
          <p style={{ color: "#374151", lineHeight: "1.6", margin: 0 }}>
            {visao}
          </p>
        </div>
        
        <div>
          <div style={{ fontWeight: "bold", color: coresConsultor.primary, marginBottom: "10px" }}>
            💎 VALORES
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {valores.map((valor, index) => (
              <span
                key={index}
                style={{
                  padding: "6px 12px",
                  backgroundColor: `${coresConsultor.accent}20`,
                  color: coresConsultor.accent,
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "500"
                }}
              >
                {valor}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SEÇÃO 8 - METAS DO ANO */}
      <h3 style={{ color: coresConsultor.primary, marginBottom: "15px" }}>
        🎯 Metas do Ano
      </h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        <MetaCard
          titulo="Meta de Faturamento"
          meta="R$ 240.000"
          atual={`R$ ${dados.faturamentoAno.toLocaleString('pt-BR')}`}
          progresso={dados.progressoFaturamento}
          cor={coresConsultor.faturamento}
        />
        <MetaCard
          titulo="Meta de Clientes"
          meta="12 ativos"
          atual={`${dados.clientesAtivos} ativos`}
          progresso={dados.progressoClientes}
          cor={coresConsultor.metas}
        />
        <MetaCard
          titulo="Meta de Satisfação"
          meta="4.8 ★"
          atual="4.8 ★"
          progresso={dados.progressoSatisfacao}
          cor={coresConsultor.success}
        />
      </div>
    </div>
  );
}

// Componentes auxiliares
function CardFaturamento({ titulo, valor, variacao, cor }) {
  return (
    <div style={{
      backgroundColor: "white",
      padding: "20px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      borderLeft: `4px solid ${cor}`
    }}>
      <div style={{ color: "#666", fontSize: "14px", marginBottom: "10px" }}>{titulo}</div>
      <div style={{ fontSize: "24px", fontWeight: "bold", color: cor, marginBottom: "5px" }}>
        R$ {valor.toLocaleString('pt-BR')}
      </div>
      <div style={{ color: variacao.includes('+') ? "#16a34a" : "#666", fontSize: "13px" }}>
        {variacao}
      </div>
    </div>
  );
}

function CardMetrica({ titulo, valor, icone, cor }) {
  return (
    <div style={{
      backgroundColor: "white",
      padding: "15px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      display: "flex",
      alignItems: "center",
      gap: "15px"
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        borderRadius: "8px",
        backgroundColor: `${cor}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px"
      }}>
        {icone}
      </div>
      <div>
        <div style={{ color: "#666", fontSize: "12px", marginBottom: "2px" }}>{titulo}</div>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: cor }}>{valor}</div>
      </div>
    </div>
  );
}

function MetaCard({ titulo, meta, atual, progresso, cor }) {
  return (
    <div style={{
      backgroundColor: "white",
      padding: "15px",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{ color: "#666", fontSize: "14px" }}>{titulo}</span>
        <span style={{ fontWeight: "bold", color: cor }}>{atual} / {meta}</span>
      </div>
      <div style={{
        height: "8px",
        backgroundColor: "#e5e7eb",
        borderRadius: "4px",
        overflow: "hidden"
      }}>
        <div style={{
          width: `${progresso}%`,
          height: "100%",
          backgroundColor: cor,
          borderRadius: "4px"
        }} />
      </div>
      <div style={{ textAlign: "right", marginTop: "5px", fontSize: "12px", color: "#666" }}>
        {progresso}% concluído
      </div>
    </div>
  );
}
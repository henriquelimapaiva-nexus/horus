// src/pages/consultor/ConsultorDashboard.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import { useConsultorAuth } from "../../context/ConsultorAuthContext";

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
  const [dados, setDados] = useState({
    empresas: [],
    totalLinhas: 0,
    totalPostos: 0,
    totalPerdas: 0,
    oeeMedio: 0,
    faturamentoMes: 45000,
    faturamentoAno: 540000,
    faturamentoProjetado: 1200000,
    clientesAtivos: 0,
    taxaRetencao: 98,
    satisfacaoMedia: 4.8,
    projetosConcluidos: 156,
    horasConsultadas: 450,
    roiMedio: 3.2,
    progressoFaturamento: 78,
    progressoClientes: 45,
    progressoSatisfacao: 96
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

  // Carregar dados reais da empresa teste
  useEffect(() => {
    async function carregarDados() {
      try {
        // ✅ CORRIGIDO: /empresas → /companies
        const empresasRes = await api.get("/companies");
        const empresas = empresasRes.data;
        
        let totalLinhas = 0;
        let totalPostos = 0;
        let totalPerdas = 0;
        let somaOEE = 0;
        let empresasComOEE = 0;

        // Para cada empresa, buscar linhas e postos
        for (const empresa of empresas) {
          try {
            // ✅ CORRIGIDO: /linhas/${empresa.id} → /lines/${empresa.id}
            const linhasRes = await api.get(`/lines/${empresa.id}`);
            const linhas = linhasRes.data;
            totalLinhas += linhas.length;

            // Para cada linha, buscar postos
            for (const linha of linhas) {
              try {
                // ✅ CORRIGIDO: /postos/${linha.id} → /work-stations/${linha.id}
                const postosRes = await api.get(`/work-stations/${linha.id}`);
                totalPostos += postosRes.data.length;

                // ✅ CORRIGIDO: /analise-linha/${linha.id} mantido
                const analiseRes = await api.get(`/analise-linha/${linha.id}`);
                if (analiseRes.data.eficiencia_percentual) {
                  somaOEE += parseFloat(analiseRes.data.eficiencia_percentual);
                  empresasComOEE++;
                }

                // ✅ CORRIGIDO: /perdas/${linha.id} → /losses/${linha.id}
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

        setDados(prev => ({
          ...prev,
          empresas,
          totalLinhas,
          totalPostos,
          totalPerdas: Math.round(totalPerdas),
          oeeMedio: empresasComOEE > 0 ? (somaOEE / empresasComOEE).toFixed(1) : 0,
          clientesAtivos: empresas.length
        }));

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

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
          variacao="+12%"
          cor={coresConsultor.faturamento}
        />
        <CardFaturamento
          titulo="Este Ano"
          valor={dados.faturamentoAno}
          variacao="+8%"
          cor={coresConsultor.faturamento}
        />
        <CardFaturamento
          titulo="Projetado 2026"
          valor={dados.faturamentoProjetado}
          variacao="Meta"
          cor={coresConsultor.faturamento}
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
          titulo="Taxa de Retenção"
          valor={`${dados.taxaRetencao}%`}
          icone="🔄"
          cor={coresConsultor.success}
        />
        <CardMetrica
          titulo="Satisfação Média"
          valor={`${dados.satisfacaoMedia} ★`}
          icone="⭐"
          cor={coresConsultor.warning}
        />
        <CardMetrica
          titulo="Projetos Concluídos"
          valor={dados.projetosConcluidos}
          icone="✅"
          cor={coresConsultor.success}
        />
        <CardMetrica
          titulo="Horas Consultadas"
          valor={dados.horasConsultadas}
          icone="⏱️"
          cor={coresConsultor.info}
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

      {/* SEÇÃO 4 - MISSÃO, VISÃO E VALORES */}
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

      {/* SEÇÃO 5 - METAS DO ANO */}
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
          meta="R$ 1.200.000"
          atual="R$ 940.000"
          progresso={dados.progressoFaturamento}
          cor={coresConsultor.faturamento}
        />
        <MetaCard
          titulo="Meta de Clientes"
          meta="15 novos"
          atual="7 novos"
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

      {/* SEÇÃO 6 - PRÓXIMAS AÇÕES */}
      <h3 style={{ color: coresConsultor.primary, marginBottom: "15px" }}>
        📋 Próximas Ações
      </h3>
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #e5e7eb" }}>
          <input type="checkbox" style={{ width: "18px", height: "18px" }} />
          <span>Reunião com Plásticos SA - 15/06 10:00</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #e5e7eb" }}>
          <input type="checkbox" style={{ width: "18px", height: "18px" }} />
          <span>Entregar relatório para Autopeças - 18/06</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #e5e7eb" }}>
          <input type="checkbox" style={{ width: "18px", height: "18px" }} />
          <span>Iniciar diagnóstico na Química Ltda - 20/06</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0" }}>
          <input type="checkbox" style={{ width: "18px", height: "18px" }} />
          <span>Renovar contrato com Metalúrgica - 25/06</span>
        </div>
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
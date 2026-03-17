// src/pages/consultor/ConsultorClientes.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";

// Cores exclusivas do consultor
const coresConsultor = {
  primary: "#0f172a",
  secondary: "#334155",
  accent: "#7c3aed",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#dc2626",
  info: "#0891b2"
};

export default function ConsultorClientes() {
  const [carregando, setCarregando] = useState(true);
  const [empresas, setEmpresas] = useState([]);
  const [dadosDetalhados, setDadosDetalhados] = useState([]);
  const [filtro, setFiltro] = useState("todos"); // todos, critico, atencao, bom
  const [busca, setBusca] = useState("");

  // Carregar dados reais
  useEffect(() => {
    async function carregarDados() {
      try {
        // ✅ CORRIGIDO: /empresas → /companies
        const empresasRes = await api.get("/companies");
        const empresasData = empresasRes.data;
        setEmpresas(empresasData);

        // Para cada empresa, buscar dados detalhados
        const dadosPromises = empresasData.map(async (empresa) => {
          try {
            // ✅ CORRIGIDO: /linhas/${empresa.id} → /lines/${empresa.id}
            const linhasRes = await api.get(`/lines/${empresa.id}`);
            const linhas = linhasRes.data;

            let totalLinhas = linhas.length;
            let totalPostos = 0;
            let somaOEE = 0;
            let totalPerdas = 0;
            let qtdOEE = 0;
            let ultimaVisita = "15/05/2026"; // Placeholder até termos dados reais

            // Para cada linha, buscar postos e análises
            for (const linha of linhas) {
              try {
                // ✅ CORRIGIDO: /postos/${linha.id} → /work-stations/${linha.id}
                const postosRes = await api.get(`/work-stations/${linha.id}`);
                totalPostos += postosRes.data.length;

                // ✅ CORRIGIDO: /analise-linha/${linha.id} mantido
                const analiseRes = await api.get(`/analise-linha/${linha.id}`);
                if (analiseRes.data.eficiencia_percentual) {
                  somaOEE += parseFloat(analiseRes.data.eficiencia_percentual);
                  qtdOEE++;
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

            const oeeMedio = qtdOEE > 0 ? (somaOEE / qtdOEE).toFixed(1) : 0;

            // Determinar status baseado no OEE
            let status = "bom";
            let statusCor = coresConsultor.success;
            let statusIcon = "✅";
            
            if (oeeMedio < 60) {
              status = "crítico";
              statusCor = coresConsultor.danger;
              statusIcon = "🔴";
            } else if (oeeMedio < 75) {
              status = "atenção";
              statusCor = coresConsultor.warning;
              statusIcon = "🟡";
            }

            return {
              id: empresa.id,
              nome: empresa.nome,
              cnpj: empresa.cnpj || "00.000.000/0001-00",
              segmento: empresa.segmento || "Indústria",
              totalLinhas,
              totalPostos,
              oeeMedio: parseFloat(oeeMedio),
              perdasTotais: Math.round(totalPerdas),
              ultimaVisita,
              status,
              statusCor,
              statusIcon
            };

          } catch (err) {
            console.error(`Erro ao processar empresa ${empresa.id}:`, err);
            return null;
          }
        });

        const resultados = await Promise.all(dadosPromises);
        setDadosDetalhados(resultados.filter(r => r !== null));

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  // Filtrar dados
  const dadosFiltrados = dadosDetalhados.filter(emp => {
    // Filtro por status
    if (filtro !== "todos" && emp.status !== filtro) return false;
    
    // Busca por nome
    if (busca && !emp.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    
    return true;
  });

  // Ordenar por perdas (maiores primeiro)
  const dadosOrdenados = [...dadosFiltrados].sort((a, b) => b.perdasTotais - a.perdasTotais);

  // Calcular totais
  const totais = {
    empresas: dadosDetalhados.length,
    linhas: dadosDetalhados.reduce((acc, e) => acc + e.totalLinhas, 0),
    postos: dadosDetalhados.reduce((acc, e) => acc + e.totalPostos, 0),
    perdas: dadosDetalhados.reduce((acc, e) => acc + e.perdasTotais, 0),
    oeeMedio: dadosDetalhados.length > 0 
      ? (dadosDetalhados.reduce((acc, e) => acc + e.oeeMedio, 0) / dadosDetalhados.length).toFixed(1)
      : 0
  };

  if (carregando) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "400px" 
      }}>
        <p>Carregando dados dos clientes...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ color: coresConsultor.primary, marginBottom: "5px" }}>
          👥 Clientes
        </h2>
        <p style={{ color: "#666" }}>
          Visualize e gerencie todos os seus clientes
        </p>
      </div>

      {/* Cards de resumo */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        <ResumoCard
          titulo="Total de Clientes"
          valor={totais.empresas}
          icone="🏢"
          cor={coresConsultor.primary}
        />
        <ResumoCard
          titulo="Total de Linhas"
          valor={totais.linhas}
          icone="📏"
          cor={coresConsultor.secondary}
        />
        <ResumoCard
          titulo="Total de Postos"
          valor={totais.postos}
          icone="⚙️"
          cor={coresConsultor.info}
        />
        <ResumoCard
          titulo="Perdas Totais"
          valor={`R$ ${(totais.perdas / 1000).toFixed(1)}K`}
          icone="💰"
          cor={coresConsultor.danger}
        />
        <ResumoCard
          titulo="OEE Médio"
          valor={`${totais.oeeMedio}%`}
          icone="📊"
          cor={totais.oeeMedio >= 70 ? coresConsultor.success : coresConsultor.warning}
        />
      </div>

      {/* Filtros e busca */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px",
        flexWrap: "wrap",
        gap: "15px"
      }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <FiltroBotao
            ativo={filtro === "todos"}
            onClick={() => setFiltro("todos")}
            cor={coresConsultor.primary}
          >
            Todos
          </FiltroBotao>
          <FiltroBotao
            ativo={filtro === "critico"}
            onClick={() => setFiltro("critico")}
            cor={coresConsultor.danger}
          >
            🔴 Crítico
          </FiltroBotao>
          <FiltroBotao
            ativo={filtro === "atencao"}
            onClick={() => setFiltro("atencao")}
            cor={coresConsultor.warning}
          >
            🟡 Atenção
          </FiltroBotao>
          <FiltroBotao
            ativo={filtro === "bom"}
            onClick={() => setFiltro("bom")}
            cor={coresConsultor.success}
          >
            ✅ Bom
          </FiltroBotao>
        </div>

        <input
          type="text"
          placeholder="Buscar cliente..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: "4px",
            border: "1px solid #d1d5db",
            fontSize: "14px",
            width: "250px"
          }}
        />
      </div>

      {/* Ranking */}
      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: coresConsultor.primary, marginBottom: "15px" }}>
          🏆 Ranking de Clientes por Perda
        </h3>
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden"
        }}>
          {dadosOrdenados.map((empresa, index) => (
            <div
              key={empresa.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "15px 20px",
                borderBottom: index < dadosOrdenados.length - 1 ? "1px solid #e5e7eb" : "none",
                backgroundColor: index === 0 ? "#fef2f2" : "white"
              }}
            >
              {/* Posição */}
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: index === 0 ? coresConsultor.danger :
                               index === 1 ? coresConsultor.warning :
                               index === 2 ? coresConsultor.info : "#f3f4f6",
                color: index < 3 ? "white" : "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                marginRight: "15px"
              }}>
                {index + 1}
              </div>

              {/* Informações */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                  <span style={{ fontWeight: "bold", fontSize: "16px" }}>{empresa.nome}</span>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    backgroundColor: `${empresa.statusCor}20`,
                    color: empresa.statusCor
                  }}>
                    {empresa.statusIcon} {empresa.status === "critico" ? "Crítico" :
                                         empresa.status === "atencao" ? "Atenção" : "Bom"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "13px", color: "#666" }}>
                  <span>📊 OEE: {empresa.oeeMedio}%</span>
                  <span>📏 {empresa.totalLinhas} linhas</span>
                  <span>⚙️ {empresa.totalPostos} postos</span>
                  <span>💰 Perdas: R$ {(empresa.perdasTotais / 1000).toFixed(1)}K</span>
                  <span>📅 Última visita: {empresa.ultimaVisita}</span>
                </div>
              </div>

              {/* Ações */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={botaoAcao}>📊 Ver</button>
                <button style={botaoAcao}>📅 Agendar</button>
              </div>
            </div>
          ))}

          {dadosOrdenados.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
              Nenhum cliente encontrado.
            </div>
          )}
        </div>
      </div>

      {/* Clientes que precisam de atenção */}
      <h3 style={{ color: coresConsultor.primary, marginBottom: "15px" }}>
        ⚠️ Clientes que Precisam de Atenção
      </h3>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        {dadosDetalhados
          .filter(e => e.status === "critico" || e.status === "atencao")
          .slice(0, 3)
          .map(empresa => (
            <div key={empresa.id} style={{
              backgroundColor: "white",
              padding: "15px",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              borderLeft: `4px solid ${empresa.statusCor}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontWeight: "bold" }}>{empresa.nome}</span>
                <span style={{
                  padding: "2px 8px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  backgroundColor: `${empresa.statusCor}20`,
                  color: empresa.statusCor
                }}>
                  {empresa.statusIcon} {empresa.status === "critico" ? "Crítico" : "Atenção"}
                </span>
              </div>
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "15px" }}>
                <div>OEE: {empresa.oeeMedio}% | Perdas: R$ {(empresa.perdasTotais / 1000).toFixed(1)}K</div>
              </div>
              <button style={{
                width: "100%",
                padding: "8px",
                backgroundColor: coresConsultor.primary,
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}>
                Agendar Reunião
              </button>
            </div>
          ))}
      </div>

      {/* Timeline de projetos */}
      <h3 style={{ color: coresConsultor.primary, marginBottom: "15px" }}>
        📅 Timeline de Projetos
      </h3>
      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}>
        {dadosDetalhados.slice(0, 5).map((empresa, index) => {
          const progresso = Math.floor(Math.random() * 100); // Placeholder até termos dados reais
          const status = progresso === 100 ? "concluido" : 
                        progresso > 0 ? "andamento" : "pendente";
          
          return (
            <div key={empresa.id} style={{ marginBottom: index < 4 ? "15px" : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ fontWeight: "500" }}>{empresa.nome}</span>
                <span style={{
                  color: status === "concluido" ? coresConsultor.success :
                         status === "andamento" ? coresConsultor.warning : "#666"
                }}>
                  {status === "concluido" ? "✅ Concluído" :
                   status === "andamento" ? "🔄 Em andamento" : "⏳ Pendente"}
                </span>
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
                  backgroundColor: status === "concluido" ? coresConsultor.success :
                                   status === "andamento" ? coresConsultor.warning : coresConsultor.secondary,
                  borderRadius: "4px"
                }} />
              </div>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                {progresso}% • Previsão: {new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Componentes auxiliares
function ResumoCard({ titulo, valor, icone, cor }) {
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
        width: "45px",
        height: "45px",
        borderRadius: "8px",
        backgroundColor: `${cor}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px"
      }}>
        {icone}
      </div>
      <div>
        <div style={{ color: "#666", fontSize: "12px", marginBottom: "2px" }}>{titulo}</div>
        <div style={{ fontSize: "20px", fontWeight: "bold", color: cor }}>{valor}</div>
      </div>
    </div>
  );
}

function FiltroBotao({ ativo, onClick, children, cor }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: "20px",
        border: "none",
        backgroundColor: ativo ? cor : "#f3f4f6",
        color: ativo ? "white" : "#374151",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "500",
        transition: "all 0.2s"
      }}
    >
      {children}
    </button>
  );
}

const botaoAcao = {
  padding: "4px 8px",
  backgroundColor: "transparent",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  fontSize: "12px",
  cursor: "pointer",
  color: "#374151"
};
// src/pages/consultor/ConsultorClientes.jsx
import { useState, useEffect } from "react";
import api from "../../api/api";
import toast from 'react-hot-toast';

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
  const [backups, setBackups] = useState({}); // Armazena backups por empresa
  const [mostrarModalBackups, setMostrarModalBackups] = useState(null); // empresaId do modal aberto
  // 👇 NOVO: Estados para agendamento
  const [modalAgendamento, setModalAgendamento] = useState(null);
  const [carregandoAgendamento, setCarregandoAgendamento] = useState(false);
  const [formAgendamento, setFormAgendamento] = useState({
    data: "",
    hora: "10:00",
    descricao: ""
  });

  // Carregar dados reais
  useEffect(() => {
    async function carregarDados() {
      try {
        const empresasRes = await api.get("/companies");
        const empresasData = empresasRes.data;
        setEmpresas(empresasData);

        const dadosPromises = empresasData.map(async (empresa) => {
          try {
            const linhasRes = await api.get(`/lines/${empresa.id}`);
            const linhas = linhasRes.data;

            let totalLinhas = linhas.length;
            let totalPostos = 0;
            let somaOEE = 0;
            let totalPerdas = 0;
            let qtdOEE = 0;
            let ultimaVisita = "15/05/2026";

            for (const linha of linhas) {
              try {
                const postosRes = await api.get(`/work-stations/${linha.id}`);
                totalPostos += postosRes.data.length;

                const analiseRes = await api.get(`/analise-linha/${linha.id}`);
                if (analiseRes.data.eficiencia_percentual) {
                  somaOEE += parseFloat(analiseRes.data.eficiencia_percentual);
                  qtdOEE++;
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

            const oeeMedio = qtdOEE > 0 ? (somaOEE / qtdOEE).toFixed(1) : 0;

            let status = "bom";
            let statusCor = coresConsultor.success;
            let statusIcon = "✅";
            
            if (oeeMedio < 60) {
              status = "critico";
              statusCor = coresConsultor.danger;
              statusIcon = "🔴";
            } else if (oeeMedio < 75) {
              status = "atencao";
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

        // Carregar backups para cada empresa
        const backupsPromises = resultados.map(async (emp) => {
          if (emp) {
            try {
              const res = await api.get(`/companies/${emp.id}/backups`);
              return { id: emp.id, backups: res.data };
            } catch (err) {
              return { id: emp.id, backups: [] };
            }
          }
          return null;
        });
        const backupsResultados = await Promise.all(backupsPromises);
        const backupsMap = {};
        backupsResultados.forEach(b => {
          if (b) backupsMap[b.id] = b.backups;
        });
        setBackups(backupsMap);

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  // Funções de gestão de dados
  const handleExportar = async (empresa) => {
    try {
      toast.loading(`Exportando dados de ${empresa.nome}...`, { id: `export_${empresa.id}` });
      const response = await api.get(`/companies/${empresa.id}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${empresa.nome}_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Dados de ${empresa.nome} exportados com sucesso!`, { id: `export_${empresa.id}` });
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error(`Erro ao exportar dados de ${empresa.nome}`, { id: `export_${empresa.id}` });
    }
  };

  const handleLimpar = async (empresa) => {
    if (!window.confirm(`⚠️ ATENÇÃO!\n\nIsso vai REMOVER TODOS os dados de produção de "${empresa.nome}".\n\nO cadastro da empresa será mantido, mas linhas, postos, cargos, colaboradores, perdas e medições serão excluídos.\n\nEsta ação é irreversível! Faça um backup antes se necessário.\n\nDeseja continuar?`)) {
      return;
    }

    try {
      toast.loading(`Limpando dados de ${empresa.nome}...`, { id: `clean_${empresa.id}` });
      await api.delete(`/companies/${empresa.id}/clean`);
      toast.success(`Dados de ${empresa.nome} removidos com sucesso!`, { id: `clean_${empresa.id}` });
      // Recarregar dados
      window.location.reload();
    } catch (error) {
      console.error("Erro ao limpar:", error);
      toast.error(`Erro ao limpar dados de ${empresa.nome}`, { id: `clean_${empresa.id}` });
    }
  };

  const handleFazerBackup = async (empresa) => {
    const motivo = prompt(`Digite um motivo para este backup (opcional):\n\nEmpresa: ${empresa.nome}`);
    
    try {
      toast.loading(`Criando backup de ${empresa.nome}...`, { id: `backup_${empresa.id}` });
      await api.post(`/companies/${empresa.id}/backup`, { motivo: motivo || "Backup manual" });
      toast.success(`Backup de ${empresa.nome} criado com sucesso!`, { id: `backup_${empresa.id}` });
      // Recarregar lista de backups
      const res = await api.get(`/companies/${empresa.id}/backups`);
      setBackups(prev => ({ ...prev, [empresa.id]: res.data }));
    } catch (error) {
      console.error("Erro ao fazer backup:", error);
      toast.error(`Erro ao criar backup de ${empresa.nome}`, { id: `backup_${empresa.id}` });
    }
  };

  const handleRestaurar = async (empresa, backupId, backupData) => {
    if (!window.confirm(`⚠️ ATENÇÃO!\n\nIsso vai RESTAURAR os dados de "${empresa.nome}" para a versão do backup de ${new Date(backupData.criado_em).toLocaleString('pt-BR')}.\n\nOs dados atuais serão SUBSTITUÍDOS!\n\nEsta ação é irreversível! Faça um backup atual antes se necessário.\n\nDeseja continuar?`)) {
      return;
    }

    try {
      toast.loading(`Restaurando backup de ${empresa.nome}...`, { id: `restore_${empresa.id}` });
      await api.post(`/companies/${empresa.id}/restore/${backupId}`);
      toast.success(`Backup de ${empresa.nome} restaurado com sucesso!`, { id: `restore_${empresa.id}` });
      // Recarregar página
      window.location.reload();
    } catch (error) {
      console.error("Erro ao restaurar:", error);
      toast.error(`Erro ao restaurar backup de ${empresa.nome}`, { id: `restore_${empresa.id}` });
    }
  };

  // 👇 NOVAS FUNÇÕES: Agendamento de Reunião
  const handleAbrirAgendamento = (empresa) => {
    // Data padrão: amanhã
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const dataPadrao = amanha.toISOString().split('T')[0];
    
    setModalAgendamento(empresa);
    setFormAgendamento({
      data: dataPadrao,
      hora: "10:00",
      descricao: `Reunião de acompanhamento com ${empresa.nome}`
    });
  };

  const handleSalvarAgendamento = async () => {
    if (!formAgendamento.data) {
      toast.error("Selecione uma data para a reunião");
      return;
    }
    
    setCarregandoAgendamento(true);
    
    try {
      // Criar uma tarefa no sistema
      await api.post("/tarefas", {
        titulo: `📅 Reunião com ${modalAgendamento.nome}`,
        descricao: formAgendamento.descricao,
        prioridade: "alta",
        status: "pendente",
        data_limite: formAgendamento.data,
        categoria: "cliente",
        cliente_id: modalAgendamento.id
      });
      
      toast.success(`✅ Reunião agendada para ${new Date(formAgendamento.data).toLocaleDateString('pt-BR')} às ${formAgendamento.hora}`);
      
      // Fechar modal
      setModalAgendamento(null);
      
    } catch (error) {
      console.error("Erro ao agendar reunião:", error);
      toast.error("Erro ao agendar reunião. Tente novamente.");
    } finally {
      setCarregandoAgendamento(false);
    }
  };

  // Modal de backups
  const ModalBackups = ({ empresa, onClose }) => {
    const listaBackups = backups[empresa.id] || [];
    
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "25px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto"
        }}>
          <h3 style={{ marginBottom: "15px" }}>📋 Backups - {empresa.nome}</h3>
          
          {listaBackups.length === 0 ? (
            <p style={{ color: "#666" }}>Nenhum backup encontrado. Clique em "Fazer Backup" para criar um.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {listaBackups.map(backup => (
                <div key={backup.id} style={{
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontWeight: "500" }}>
                      {new Date(backup.criado_em).toLocaleString('pt-BR')}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Motivo: {backup.motivo || "Backup manual"}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestaurar(empresa, backup.id, backup)}
                    style={{
                      padding: "4px 12px",
                      backgroundColor: coresConsultor.warning,
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
            <button
              onClick={() => handleFazerBackup(empresa)}
              style={{
                padding: "8px 16px",
                backgroundColor: coresConsultor.success,
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              💾 Novo Backup
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                backgroundColor: "#e5e7eb",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Filtrar dados
  const dadosFiltrados = dadosDetalhados.filter(emp => {
    if (filtro !== "todos" && emp.status !== filtro) return false;
    if (busca && !emp.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const dadosOrdenados = [...dadosFiltrados].sort((a, b) => b.perdasTotais - a.perdasTotais);

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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <p>Carregando dados dos clientes...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Modal de backups */}
      {mostrarModalBackups && (
        <ModalBackups
          empresa={dadosDetalhados.find(e => e.id === mostrarModalBackups)}
          onClose={() => setMostrarModalBackups(null)}
        />
      )}

      {/* 👇 NOVO: Modal de Agendamento */}
      {modalAgendamento && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001
        }} onClick={() => setModalAgendamento(null)}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Cabeçalho */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <h3 style={{ margin: 0, color: coresConsultor.primary }}>
                📅 Agendar Reunião
              </h3>
              <button
                onClick={() => setModalAgendamento(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#666"
                }}
              >
                ×
              </button>
            </div>
            
            {/* Informações do Cliente */}
            <div style={{
              backgroundColor: "#f3f4f6",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px"
            }}>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                {modalAgendamento.nome}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                OEE: {modalAgendamento.oeeMedio}% • Perdas: R$ {(modalAgendamento.perdasTotais / 1000).toFixed(1)}K
              </div>
            </div>
            
            {/* Formulário */}
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                Data da Reunião *
              </label>
              <input
                type="date"
                value={formAgendamento.data}
                onChange={(e) => setFormAgendamento({...formAgendamento, data: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "14px"
                }}
              />
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                Horário
              </label>
              <input
                type="time"
                value={formAgendamento.hora}
                onChange={(e) => setFormAgendamento({...formAgendamento, hora: e.target.value})}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "14px"
                }}
              />
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                Descrição / Pauta
              </label>
              <textarea
                rows={3}
                value={formAgendamento.descricao}
                onChange={(e) => setFormAgendamento({...formAgendamento, descricao: e.target.value})}
                placeholder="O que será discutido na reunião?"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "14px",
                  resize: "vertical"
                }}
              />
            </div>
            
            {/* Botões */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setModalAgendamento(null)}
                style={{
                  padding: "10px 20px",
                  border: "1px solid #c90303",
                  borderRadius: "6px",
                  background: "red",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#ccc",
                  fontweight: "500"
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarAgendamento}
                disabled={carregandoAgendamento}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "6px",
                  background: coresConsultor.primary,
                  color: "white",
                  cursor: carregandoAgendamento ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  opacity: carregandoAgendamento ? 0.7 : 1
                }}
              >
                {carregandoAgendamento ? "Agendando..." : "✅ Agendar Reunião"}
              </button>
            </div>
          </div>
        </div>
      )}

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
        <ResumoCard titulo="Total de Clientes" valor={totais.empresas} icone="🏢" cor={coresConsultor.primary} />
        <ResumoCard titulo="Total de Linhas" valor={totais.linhas} icone="📏" cor={coresConsultor.secondary} />
        <ResumoCard titulo="Total de Postos" valor={totais.postos} icone="⚙️" cor={coresConsultor.info} />
        <ResumoCard titulo="Perdas Totais" valor={`R$ ${(totais.perdas / 1000).toFixed(1)}K`} icone="💰" cor={coresConsultor.danger} />
        <ResumoCard titulo="OEE Médio" valor={`${totais.oeeMedio}%`} icone="📊" cor={totais.oeeMedio >= 70 ? coresConsultor.success : coresConsultor.warning} />
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
          <FiltroBotao ativo={filtro === "todos"} onClick={() => setFiltro("todos")} cor={coresConsultor.primary}>Todos</FiltroBotao>
          <FiltroBotao ativo={filtro === "critico"} onClick={() => setFiltro("critico")} cor={coresConsultor.danger}>🔴 Crítico</FiltroBotao>
          <FiltroBotao ativo={filtro === "atencao"} onClick={() => setFiltro("atencao")} cor={coresConsultor.warning}>🟡 Atenção</FiltroBotao>
          <FiltroBotao ativo={filtro === "bom"} onClick={() => setFiltro("bom")} cor={coresConsultor.success}>✅ Bom</FiltroBotao>
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

      {/* Ranking de Clientes */}
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
                backgroundColor: index === 0 ? "#fef2f2" : "white",
                flexWrap: "wrap",
                gap: "10px"
              }}
            >
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
                marginRight: "15px",
                flexShrink: 0
              }}>
                {index + 1}
              </div>

              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: "bold", fontSize: "16px" }}>{empresa.nome}</span>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    backgroundColor: `${empresa.statusCor}20`,
                    color: empresa.statusCor
                  }}>
                    {empresa.statusIcon} {empresa.status === "critico" ? "Crítico" : empresa.status === "atencao" ? "Atenção" : "Bom"}
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

              {/* Botões de gestão de dados */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleExportar(empresa)}
                  style={botaoAcao}
                  title="Exportar dados (JSON)"
                >
                  📦 Exportar
                </button>
                <button
                  onClick={() => handleFazerBackup(empresa)}
                  style={botaoAcao}
                  title="Fazer backup no sistema"
                >
                  💾 Backup
                </button>
                <button
                  onClick={() => setMostrarModalBackups(empresa.id)}
                  style={botaoAcao}
                  title="Ver e restaurar backups"
                >
                  🔄 Restaurar
                </button>
                <button
                  onClick={() => handleLimpar(empresa)}
                  style={{ ...botaoAcao, color: coresConsultor.danger, borderColor: coresConsultor.danger }}
                  title="Limpar todos os dados de produção"
                >
                  🗑️ Limpar
                </button>
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
              {/* 👇 BOTÃO MODIFICADO COM onClick */}
              <button 
                onClick={() => handleAbrirAgendamento(empresa)}
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor: coresConsultor.primary,
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
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
          const progresso = Math.floor(Math.random() * 100);
          const status = progresso === 100 ? "concluido" : progresso > 0 ? "andamento" : "pendente";
          
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
  padding: "6px 10px",
  backgroundColor: "transparent",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  fontSize: "12px",
  cursor: "pointer",
  color: "#374151",
  transition: "all 0.2s"
};
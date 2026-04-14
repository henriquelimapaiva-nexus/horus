// src/pages/consultor/IASugestoes.jsx
import { useState, useEffect } from 'react';
import Botao from '../../components/ui/Botao';
import Card from '../../components/ui/Card';
import api from '../../api/api';
import toast from 'react-hot-toast';

export default function IASugestoes() {
  const [empresas, setEmpresas] = useState([]);
  const [linhas, setLinhas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  const [linhaSelecionada, setLinhaSelecionada] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    api.get("/companies")
      .then(res => setEmpresas(res.data))
      .catch(err => {
        console.error("Erro ao carregar empresas:", err);
        toast.error("Erro ao carregar empresas");
      });
  }, []);

  useEffect(() => {
    if (empresaSelecionada) {
      api.get(`/lines/${empresaSelecionada}`)
        .then(res => setLinhas(res.data))
        .catch(err => {
          console.error("Erro ao carregar linhas:", err);
          setLinhas([]);
        });
    } else {
      setLinhas([]);
    }
  }, [empresaSelecionada]);

  const handleAnalisar = async () => {
    if (!empresaSelecionada) {
      toast.error('Selecione uma empresa');
      return;
    }

    setCarregando(true);
    setResultado(null);

    try {
      const url = `/ia/sugestoes/${empresaSelecionada}${linhaSelecionada ? `?linha_id=${linhaSelecionada}` : ''}`;
      const response = await api.get(url);
      
      const dados = response.data;
      
      setResultado({
        empresa: dados.empresa,
        data_analise: dados.data_analise,
        resumo: dados.resumo,
        diagnosticos: dados.diagnosticos,
        projecoes: dados.projecoes
      });
      toast.success('Análise concluída!');
    } catch (error) {
      console.error('Erro ao analisar:', error);
      toast.error(error.response?.data?.erro || 'Erro ao gerar sugestões');
    } finally {
      setCarregando(false);
    }
  };

  const getPrioridadeCor = (prioridade) => {
    switch(prioridade) {
      case 'alta': return '#dc2626';
      case 'media': return '#f59e0b';
      case 'baixa': return '#16a34a';
      default: return '#666';
    }
  };

  const getPrioridadeBg = (prioridade) => {
    switch(prioridade) {
      case 'alta': return '#fee2e2';
      case 'media': return '#fef3c7';
      case 'baixa': return '#dcfce7';
      default: return '#f3f4f6';
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(valor || 0);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Cabeçalho */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1E3A8A', marginBottom: '10px' }}>
          🤖 IA de Sugestões de Melhoria
        </h1>
        <p style={{ color: '#666' }}>
          A IA analisa os dados reais da empresa e sugere ações prioritárias para otimizar processos.
        </p>
      </div>

      {/* Filtros */}
      <Card titulo="📋 Selecione a Empresa">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Empresa *</label>
            <select
              value={empresaSelecionada}
              onChange={(e) => setEmpresaSelecionada(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            >
              <option value="">Selecione...</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nome}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Linha (opcional)</label>
            <select
              value={linhaSelecionada}
              onChange={(e) => setLinhaSelecionada(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
              disabled={!empresaSelecionada}
            >
              <option value="">Todas as linhas</option>
              {linhas.map(linha => (
                <option key={linha.id} value={linha.id}>{linha.nome}</option>
              ))}
            </select>
          </div>

          <Botao
            variant="primary"
            onClick={handleAnalisar}
            disabled={!empresaSelecionada || carregando}
            loading={carregando}
          >
            {carregando ? 'Analisando...' : '🔍 Analisar Empresa'}
          </Botao>
        </div>
      </Card>

      {/* Resultados */}
      {carregando && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🤖</div>
          <p>IA analisando dados da empresa...</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>Isso pode levar alguns segundos</p>
        </div>
      )}

      {resultado && (
        <>
          {/* Resumo Executivo */}
          <Card titulo={`📊 Diagnóstico - ${resultado.empresa}`} style={{ marginTop: '30px' }}>
            <div style={{ 
              backgroundColor: '#f0f9ff', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <p><strong>Data da análise:</strong> {resultado.data_analise}</p>
              <p><strong>Total de diagnósticos:</strong> {resultado.resumo?.total_diagnosticos || 0}</p>
              <div style={{ display: 'flex', gap: '20px', marginTop: '15px', flexWrap: 'wrap' }}>
                <span style={{ backgroundColor: '#fee2e2', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                  🔴 {resultado.resumo?.alta_prioridade || 0} críticos
                </span>
                <span style={{ backgroundColor: '#fef3c7', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                  🟠 {resultado.resumo?.media_prioridade || 0} médios
                </span>
                <span style={{ backgroundColor: '#dcfce7', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                  🟢 {resultado.resumo?.baixa_prioridade || 0} baixos
                </span>
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Ganho Total Estimado</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                  {resultado.projecoes?.ganho_mensal || 'R$ 0'}<span style={{ fontSize: '12px' }}>/mês</span>
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>OEE Projetado</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E3A8A' }}>
                  {resultado.projecoes?.novo_oee || 'N/A'}
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>Tempo Estimado</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E3A8A' }}>
                  {resultado.projecoes?.tempo_estimado || 'N/A'}
                </div>
              </div>
            </div>
          </Card>

          {/* Sugestões por Prioridade */}
          <Card titulo="🎯 Plano de Ação" style={{ marginTop: '30px' }}>
            
            {/* Alta Prioridade */}
            {resultado.diagnosticos?.alta?.length > 0 && (
              <>
                <h3 style={{ color: '#dc2626', marginBottom: '15px', borderBottom: '2px solid #dc2626', paddingBottom: '5px' }}>
                  🔴 Críticos (Alta Prioridade)
                </h3>
                {resultado.diagnosticos.alta.map((diag, idx) => (
                  <div key={idx} style={{ 
                    backgroundColor: getPrioridadeBg(diag.prioridade),
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    borderLeft: `6px solid ${getPrioridadeCor(diag.prioridade)}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '16px' }}>{diag.problema}</h4>
                      <span style={{ 
                        backgroundColor: getPrioridadeCor(diag.prioridade),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {diag.prioridade}
                      </span>
                    </div>
                    
                    <p style={{ margin: '10px 0', color: '#444' }}>
                      <strong>Linha:</strong> {diag.linha_nome} | 
                      <strong> Valor real:</strong> {diag.valor_real} | 
                      <strong> Limite:</strong> {diag.valor_limite}
                    </p>
                    
                    <div style={{ 
                      backgroundColor: 'white',
                      padding: '15px',
                      borderRadius: '8px',
                      marginTop: '10px'
                    }}>
                      <strong>🛠️ Ferramenta sugerida: {diag.ferramenta}</strong>
                      <div style={{ marginTop: '10px', fontSize: '14px' }}>
                        {diag.passo_a_passo?.map((passo, i) => (
                          <div key={i} style={{ margin: '5px 0' }}>✓ {passo}</div>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '20px', 
                      marginTop: '15px',
                      paddingTop: '10px',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div>
                        <strong>📈 Ganho estimado:</strong>
                        <div style={{ color: '#16a34a', fontWeight: 'bold' }}>{formatarMoeda(diag.ganho_estimado)}/mês</div>
                      </div>
                      <div>
                        <strong>⏱️ Esforço estimado:</strong>
                        <div>{diag.esforco_semanas} semanas</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Média Prioridade */}
            {resultado.diagnosticos?.media?.length > 0 && (
              <>
                <h3 style={{ color: '#f59e0b', marginBottom: '15px', borderBottom: '2px solid #f59e0b', paddingBottom: '5px', marginTop: '30px' }}>
                  🟠 Médios (Média Prioridade)
                </h3>
                {resultado.diagnosticos.media.map((diag, idx) => (
                  <div key={idx} style={{ 
                    backgroundColor: getPrioridadeBg(diag.prioridade),
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    borderLeft: `6px solid ${getPrioridadeCor(diag.prioridade)}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '16px' }}>{diag.problema}</h4>
                      <span style={{ 
                        backgroundColor: getPrioridadeCor(diag.prioridade),
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {diag.prioridade}
                      </span>
                    </div>
                    
                    <p style={{ margin: '10px 0', color: '#444' }}>
                      <strong>Linha:</strong> {diag.linha_nome} | 
                      <strong> Valor real:</strong> {diag.valor_real} | 
                      <strong> Limite:</strong> {diag.valor_limite}
                    </p>
                    
                    <div style={{ 
                      backgroundColor: 'white',
                      padding: '15px',
                      borderRadius: '8px',
                      marginTop: '10px'
                    }}>
                      <strong>🛠️ Ferramenta sugerida: {diag.ferramenta}</strong>
                      <div style={{ marginTop: '10px', fontSize: '14px' }}>
                        {diag.passo_a_passo?.map((passo, i) => (
                          <div key={i} style={{ margin: '5px 0' }}>✓ {passo}</div>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      gap: '20px', 
                      marginTop: '15px',
                      paddingTop: '10px',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      <div>
                        <strong>📈 Ganho estimado:</strong>
                        <div style={{ color: '#16a34a', fontWeight: 'bold' }}>{formatarMoeda(diag.ganho_estimado)}/mês</div>
                      </div>
                      <div>
                        <strong>⏱️ Esforço estimado:</strong>
                        <div>{diag.esforco_semanas} semanas</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Baixa Prioridade */}
            {resultado.diagnosticos?.baixa?.length > 0 && (
              <>
                <h3 style={{ color: '#16a34a', marginBottom: '15px', borderBottom: '2px solid #16a34a', paddingBottom: '5px', marginTop: '30px' }}>
                  🟢 Baixos (Baixa Prioridade)
                </h3>
                {resultado.diagnosticos.baixa.map((diag, idx) => (
                  <div key={idx} style={{ 
                    backgroundColor: getPrioridadeBg(diag.prioridade),
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    borderLeft: `6px solid ${getPrioridadeCor(diag.prioridade)}`
                  }}>
                    <p><strong>{diag.problema}</strong> - {diag.ferramenta}</p>
                  </div>
                ))}
              </>
            )}

            {(!resultado.diagnosticos?.alta || resultado.diagnosticos.alta.length === 0) && 
             (!resultado.diagnosticos?.media || resultado.diagnosticos.media.length === 0) && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '20px' }}>✅</span>
                <p>Nenhum desvio crítico encontrado!</p>
                <p>A empresa está dentro dos padrões de referência.</p>
              </div>
            )}
          </Card>

          {/* Projeção Final */}
          <Card titulo="📈 Projeção de Resultados" style={{ marginTop: '30px' }}>
            <div style={{ 
              backgroundColor: '#f0fdf4', 
              padding: '20px', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#166534', marginBottom: '15px' }}>Com a implementação das sugestões acima</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>OEE Projetado</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>{resultado.projecoes?.novo_oee || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Ganho Mensal Total</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>{resultado.projecoes?.ganho_mensal || 'R$ 0'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Tempo Estimado</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#166534' }}>{resultado.projecoes?.tempo_estimado || 'N/A'}</div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
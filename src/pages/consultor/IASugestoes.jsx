// src/pages/consultor/IASugestoes.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Botao from '../../components/ui/Botao';
import Card from '../../components/ui/Card';
import api from '../../api/api';
import { gerarSugestoes } from '../../services/iaSugestoesService';
import toast from 'react-hot-toast';

export default function IASugestoes() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [sugestoes, setSugestoes] = useState(null);
  const [dadosEmpresa, setDadosEmpresa] = useState(null);

  useEffect(() => {
    api.get("/empresas")
      .then(res => setEmpresas(res.data))
      .catch(err => {
        console.error("Erro ao carregar empresas:", err);
        toast.error("Erro ao carregar empresas");
      });
  }, []);

  const buscarDadosEmpresa = async (empresaId) => {
    setCarregando(true);
    setSugestoes(null);
    
    try {
      // Buscar dados da empresa
      const linhasRes = await api.get(`/linhas/${empresaId}`);
      const linhas = linhasRes.data;
      
      let dadosCompletos = {
        empresa: empresas.find(e => e.id === parseInt(empresaId))?.nome,
        linhas: []
      };

      for (const linha of linhas) {
        try {
          const analiseRes = await api.get(`/analise-linha/${linha.id}`).catch(() => ({ data: {} }));
          const analise = analiseRes.data;
          
          const postosRes = await api.get(`/postos/${linha.id}`).catch(() => ({ data: [] }));
          const postos = postosRes.data;
          
          const perdasRes = await api.get(`/perdas/${linha.id}`).catch(() => ({ data: [] }));
          const perdas = perdasRes.data;

          dadosCompletos.linhas.push({
            nome: linha.nome,
            analise,
            postos,
            perdas
          });
        } catch (err) {
          console.error(`Erro na linha ${linha.id}:`, err);
        }
      }

      setDadosEmpresa(dadosCompletos);
      
      // Chamar IA para gerar sugestões
      const sugestoesIA = await gerarSugestoes(empresaId);
      setSugestoes(sugestoesIA);

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao analisar empresa');
    } finally {
      setCarregando(false);
    }
  };

  const getPrioridadeCor = (prioridade) => {
    switch(prioridade?.toLowerCase()) {
      case 'alta': return '#dc2626';
      case 'media': return '#f59e0b';
      case 'baixa': return '#16a34a';
      default: return '#666';
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Cabeçalho */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1E3A8A', marginBottom: '10px' }}>
          🤖 IA de Sugestões de Melhoria
        </h1>
        <p style={{ color: '#666' }}>
          A IA analisa os dados da empresa e sugere ações prioritárias para melhorar o OEE.
        </p>
      </div>

      {/* Seleção de empresa */}
      <Card titulo="📋 Selecione a Empresa">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Empresa</label>
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
          
          <Botao
            variant="primary"
            onClick={() => buscarDadosEmpresa(empresaSelecionada)}
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
          IA analisando dados... (pode levar alguns segundos)
        </div>
      )}

      {sugestoes && (
        <div style={{ marginTop: '30px' }}>
          <Card titulo={`💡 Sugestões para ${dadosEmpresa?.empresa}`}>
            
            {/* Resumo executivo */}
            <div style={{ 
              backgroundColor: '#f0f9ff', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '30px',
              border: '1px solid #1E3A8A30'
            }}>
              <h3 style={{ color: '#1E3A8A', marginBottom: '10px' }}>📊 Resumo Executivo</h3>
              <p style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                {sugestoes.resumo}
              </p>
            </div>

            {/* Lista de sugestões priorizadas */}
            <h3 style={{ color: '#1E3A8A', marginBottom: '20px' }}>🎯 Ações Prioritárias</h3>
            
            {sugestoes.acoes?.map((acao, index) => (
              <div 
                key={index}
                style={{ 
                  backgroundColor: '#f9fafb',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  borderLeft: `6px solid ${getPrioridadeCor(acao.prioridade)}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px' }}>{acao.titulo}</h4>
                  <span style={{ 
                    backgroundColor: getPrioridadeCor(acao.prioridade),
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {acao.prioridade}
                  </span>
                </div>
                
                <p style={{ margin: '10px 0', color: '#444' }}>{acao.descricao}</p>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '10px',
                  marginTop: '15px',
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '8px'
                }}>
                  <div>
                    <strong>📈 Ganho estimado:</strong>
                    <div style={{ color: '#16a34a', fontSize: '18px', fontWeight: 'bold' }}>
                      {acao.ganho}
                    </div>
                  </div>
                  <div>
                    <strong>⏱️ Esforço:</strong>
                    <div>{acao.esforco}</div>
                  </div>
                  <div>
                    <strong>💰 Investimento:</strong>
                    <div>{acao.investimento}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Projeções */}
            <div style={{ 
              marginTop: '30px',
              backgroundColor: '#f0fdf4',
              padding: '20px',
              borderRadius: '8px'
            }}>
              <h3 style={{ color: '#166534', marginBottom: '15px' }}>📈 Projeções</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Novo OEE estimado</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>
                    {sugestoes.projecoes?.novoOEE}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Ganho mensal total</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>
                    {sugestoes.projecoes?.ganhoMensal}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666' }}>Tempo estimado</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>
                    {sugestoes.projecoes?.tempoEstimado}
                  </div>
                </div>
              </div>
            </div>

          </Card>
        </div>
      )}
    </div>
  );
}
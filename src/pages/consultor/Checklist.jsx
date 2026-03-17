// src/pages/consultor/Checklist.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Botao from '../../components/ui/Botao';
import Card from '../../components/ui/Card';
import api from '../../api/api';
import { 
  listarProjetos, 
  buscarProjeto, 
  criarProjeto,
  adicionarItem,
  atualizarItem,
  atualizarFase 
} from '../../services/checklistService';
import toast from 'react-hot-toast';

export default function Checklist() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('');
  const [projetos, setProjetos] = useState([]);
  const [projetoAtual, setProjetoAtual] = useState(null);
  const [fases, setFases] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarNovoProjeto, setMostrarNovoProjeto] = useState(false);
  const [novoProjeto, setNovoProjeto] = useState({
    nome: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_previsao: ''
  });

  useEffect(() => {
    // ✅ CORRIGIDO: /empresas → /companies
    api.get("/companies")
      .then(res => setEmpresas(res.data))
      .catch(err => {
        console.error("Erro ao carregar empresas:", err);
        toast.error("Erro ao carregar empresas");
      });
  }, []);

  const carregarProjetos = async () => {
    if (!empresaSelecionada) return;
    
    setCarregando(true);
    try {
      const data = await listarProjetos(empresaSelecionada);
      setProjetos(data);
    } catch (error) {
      toast.error('Erro ao carregar projetos');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (empresaSelecionada) {
      carregarProjetos();
    }
  }, [empresaSelecionada]);

  const handleCriarProjeto = async () => {
    if (!novoProjeto.nome || !novoProjeto.data_previsao) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      await criarProjeto({
        empresa_id: parseInt(empresaSelecionada),
        nome: novoProjeto.nome,
        data_inicio: novoProjeto.data_inicio,
        data_previsao: novoProjeto.data_previsao
      });
      toast.success('Projeto criado!');
      setMostrarNovoProjeto(false);
      carregarProjetos();
    } catch (error) {
      toast.error('Erro ao criar projeto');
    }
  };

  const handleSelecionarProjeto = async (projetoId) => {
    try {
      const data = await buscarProjeto(projetoId);
      setProjetoAtual(data.projeto);
      setFases(data.fases);
    } catch (error) {
      toast.error('Erro ao carregar projeto');
    }
  };

  const handleConcluirItem = async (itemId, concluido) => {
    try {
      await atualizarItem(itemId, { concluido });
      
      // Atualizar local
      const novasFases = fases.map(fase => ({
        ...fase,
        itens: fase.itens?.map(item => 
          item.id === itemId ? { ...item, concluido } : item
        )
      }));
      setFases(novasFases);
      
      // Recalcular progresso das fases
      for (const fase of novasFases) {
        if (fase.itens && fase.itens.length > 0) {
          const concluidos = fase.itens.filter(i => i.concluido).length;
          const progresso = Math.round((concluidos / fase.itens.length) * 100);
          const status = progresso === 100 ? 'concluido' : 'em_andamento';
          
          await atualizarFase(fase.id, { progresso, status });
        }
      }
      
      toast.success('Item atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar item');
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'concluido': return '✅';
      case 'em_andamento': return '⏳';
      case 'pendente': return '⭕';
      default: return '⭕';
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Cabeçalho */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1E3A8A', marginBottom: '10px' }}>
          📋 Checklist de Implantação
        </h1>
        <p style={{ color: '#666' }}>
          Acompanhe o progresso dos projetos passo a passo
        </p>
      </div>

      {/* Seleção de empresa */}
      <Card titulo="🏢 Empresa">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Selecione a empresa</label>
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
            onClick={() => setMostrarNovoProjeto(true)}
            disabled={!empresaSelecionada}
          >
            + Novo Projeto
          </Botao>
        </div>
      </Card>

      {/* Modal novo projeto */}
      {mostrarNovoProjeto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Card style={{ maxWidth: '500px', width: '100%' }}>
            <h2 style={{ color: '#1E3A8A', marginBottom: '20px' }}>Novo Projeto</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Nome do Projeto *</label>
              <input
                type="text"
                value={novoProjeto.nome}
                onChange={(e) => setNovoProjeto({...novoProjeto, nome: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db'
                }}
                placeholder="Ex: Implantação Industrial 2026"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Data de Início</label>
              <input
                type="date"
                value={novoProjeto.data_inicio}
                onChange={(e) => setNovoProjeto({...novoProjeto, data_inicio: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Previsão de Conclusão *</label>
              <input
                type="date"
                value={novoProjeto.data_previsao}
                onChange={(e) => setNovoProjeto({...novoProjeto, data_previsao: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Botao variant="secondary" onClick={() => setMostrarNovoProjeto(false)}>
                Cancelar
              </Botao>
              <Botao variant="primary" onClick={handleCriarProjeto}>
                Criar Projeto
              </Botao>
            </div>
          </Card>
        </div>
      )}

      {/* Lista de projetos */}
      {empresaSelecionada && (
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ color: '#1E3A8A', marginBottom: '20px' }}>Projetos da Empresa</h2>
          
          {carregando && <p>Carregando...</p>}

          <div style={{ display: 'grid', gap: '15px' }}>
            {projetos.map(projeto => (
              <Card key={projeto.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: '#1E3A8A' }}>{projeto.nome}</h3>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      Início: {new Date(projeto.data_inicio).toLocaleDateString()} | 
                      Previsão: {new Date(projeto.data_previsao).toLocaleDateString()} |
                      Status: {getStatusIcon(projeto.status)} {projeto.status}
                    </div>
                  </div>
                  <Botao
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSelecionarProjeto(projeto.id)}
                  >
                    Ver Detalhes
                  </Botao>
                </div>
              </Card>
            ))}

            {projetos.length === 0 && !carregando && (
              <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
                Nenhum projeto cadastrado para esta empresa
              </p>
            )}
          </div>
        </div>
      )}

      {/* Detalhes do projeto selecionado */}
      {projetoAtual && (
        <div style={{ marginTop: '40px' }}>
          <Card>
            <h2 style={{ color: '#1E3A8A', marginBottom: '20px' }}>
              📋 {projetoAtual.nome}
            </h2>

            {fases.map(fase => (
              <div key={fase.id} style={{ marginBottom: '30px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}>
                  <h3 style={{ margin: 0, color: '#1E3A8A' }}>
                    {getStatusIcon(fase.status)} {fase.nome}
                  </h3>
                  <span style={{ 
                    backgroundColor: fase.status === 'concluido' ? '#16a34a20' : 
                                   fase.status === 'em_andamento' ? '#f59e0b20' : '#e5e7eb',
                    color: fase.status === 'concluido' ? '#16a34a' : 
                           fase.status === 'em_andamento' ? '#f59e0b' : '#666',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px'
                  }}>
                    Progresso: {fase.progresso || 0}%
                  </span>
                </div>

                {/* Barra de progresso */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${fase.progresso || 0}%`,
                    height: '100%',
                    backgroundColor: fase.status === 'concluido' ? '#16a34a' : '#1E3A8A',
                    transition: 'width 0.3s'
                  }} />
                </div>

                {/* Itens da fase */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {fase.itens?.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '4px'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.concluido}
                        onChange={(e) => handleConcluirItem(item.id, e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{
                        flex: 1,
                        textDecoration: item.concluido ? 'line-through' : 'none',
                        color: item.concluido ? '#999' : '#333'
                      }}>
                        {item.descricao}
                      </span>
                      {item.data_conclusao && (
                        <small style={{ color: '#999' }}>
                          {new Date(item.data_conclusao).toLocaleDateString()}
                        </small>
                      )}
                    </div>
                  ))}

                  {/* Botão para adicionar item (mock por enquanto) */}
                  <Botao
                    variant="secondary"
                    size="sm"
                    style={{ alignSelf: 'flex-start', marginTop: '10px' }}
                    onClick={() => {
                      const descricao = prompt('Descrição do item:');
                      if (descricao) {
                        adicionarItem({
                          fase_id: fase.id,
                          descricao,
                          ordem: (fase.itens?.length || 0) + 1
                        }).then(() => {
                          toast.success('Item adicionado!');
                          handleSelecionarProjeto(projetoAtual.id);
                        });
                      }
                    }}
                  >
                    + Adicionar item
                  </Botao>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
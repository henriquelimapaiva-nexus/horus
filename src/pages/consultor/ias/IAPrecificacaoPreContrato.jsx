// src/pages/consultor/ias/IAPrecificacaoPreContrato.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Botao from '../../../components/ui/Botao';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import api from '../../../api/api';
import toast from 'react-hot-toast';
import ModalNegociacao from './ModalNegociacao';

export default function IAPrecificacaoPreContrato() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const [carregandoContrato, setCarregandoContrato] = useState(false);
  const [resultado, setResultado] = useState(null);
  
  // Estado para o modal de negociação (MANTIDOS)
  const [mostrarModalNegociacao, setMostrarModalNegociacao] = useState(false);
  const [opcaoNegociacao, setOpcaoNegociacao] = useState('aceitar');
  const [valorNegociado, setValorNegociado] = useState('');
  const [motivoNegociacao, setMotivoNegociacao] = useState('');

  // Dados do cliente (estimativas)
  const [dadosCliente, setDadosCliente] = useState({
    empresa_nome: '',
    setor: '',
    numero_funcionarios: '',
    faturamento_anual: '',
    numero_linhas: '',
    problemas: [],
    urgencia: '',
    complexidade: '',
    gestor_dedicado: '',
    acesso_dados: '',
    projeto_piloto: false,
    tem_viagem: false
  });

  // Dados para o contrato (podem ser preenchidos depois)
  const [dadosContrato, setDadosContrato] = useState({
    empresa_cnpj: '',
    empresa_endereco: '',
    empresa_cidade: '',
    empresa_estado: '',
    representante_nome: '',
    representante_nacionalidade: '',
    representante_estado_civil: '',
    representante_profissao: '',
    representante_rg: '',
    representante_cpf: '',
    representante_endereco: '',
    email_contratante: '',
    semanas_diagnostico: 4,
    meses_vigencia: 2,
    prazo_entrega_semanas: 6
  });

  const setores = [
    { value: '', label: 'Selecione...' },
    { value: 'automotivo', label: 'Automotivo' },
    { value: 'metalurgico', label: 'Metalúrgico' },
    { value: 'alimenticio', label: 'Alimentício' },
    { value: 'quimico', label: 'Químico' },
    { value: 'farmaceutico', label: 'Farmacêutico' },
    { value: 'outros', label: 'Outros' }
  ];

  const problemasList = [
    { id: 'produtividade', label: 'Baixa Produtividade / Paradas' },
    { id: 'qualidade', label: 'Problemas de Qualidade / Refugo' },
    { id: 'manutencao', label: 'Manutenção / Setup demorado' },
    { id: 'rh', label: 'RH / Treinamento / Rotatividade' }
  ];

  const handleProblemaChange = (problemaId) => {
    setDadosCliente(prev => {
      const novosProblemas = prev.problemas.includes(problemaId)
        ? prev.problemas.filter(p => p !== problemaId)
        : [...prev.problemas, problemaId];
      return { ...prev, problemas: novosProblemas };
    });
  };

  const handleCalcular = async () => {
    if (!dadosCliente.empresa_nome) {
      toast.error('Informe o nome da empresa');
      return;
    }
    if (!dadosCliente.faturamento_anual || dadosCliente.faturamento_anual < 100000) {
      toast.error('Faturamento anual mínimo de R$ 100.000');
      return;
    }
    if (!dadosCliente.numero_funcionarios || dadosCliente.numero_funcionarios < 1) {
      toast.error('Informe o número de funcionários');
      return;
    }

    setCarregando(true);
    toast.loading('Calculando proposta...', { id: 'precificando' });

    try {
      const response = await api.post('/ia/precificar', dadosCliente);
      setResultado(response.data);
      toast.success('Proposta calculada com sucesso!', { id: 'precificando' });
    } catch (error) {
      console.error('Erro ao calcular:', error);
      toast.error(error.response?.data?.erro || 'Erro ao calcular proposta', { id: 'precificando' });
    } finally {
      setCarregando(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(valor || 0);
  };

  const handleAbrirModalNegociacao = () => {
    if (resultado) {
      setValorNegociado(resultado.precos.ideal.toString());
      setMostrarModalNegociacao(true);
    }
  };

  const handleGerarContrato = () => {
    let valorFinal = resultado.precos.ideal;
    
    if (opcaoNegociacao === 'negociar') {
      const novoValor = parseFloat(valorNegociado);
      if (isNaN(novoValor) || novoValor <= 0) {
        toast.error('Informe um valor válido para negociação');
        return;
      }
      valorFinal = novoValor;
    }

    setCarregandoContrato(true);
    toast.loading('Gerando contrato...', { id: 'gerandoContrato' });

    const payload = {
      empresa: {
        nome: dadosCliente.empresa_nome,
        cnpj: dadosContrato.empresa_cnpj || '[CNPJ]',
        endereco: dadosContrato.empresa_endereco || '[ENDEREÇO COMPLETO]',
        cidade: dadosContrato.empresa_cidade || '[CIDADE]',
        estado: dadosContrato.empresa_estado || '[UF]'
      },
      representante: {
        nome: dadosContrato.representante_nome || '[NOME DO REPRESENTANTE]',
        nacionalidade: dadosContrato.representante_nacionalidade || '[NACIONALIDADE]',
        estado_civil: dadosContrato.representante_estado_civil || '[ESTADO CIVIL]',
        profissao: dadosContrato.representante_profissao || '[PROFISSÃO]',
        rg: dadosContrato.representante_rg || '[RG]',
        cpf: dadosContrato.representante_cpf || '[CPF]',
        endereco: dadosContrato.representante_endereco || '[ENDEREÇO]'
      },
      valor_negociado: valorFinal,
      valor_original_ia: resultado.precos.ideal,
      prazos: {
        semanas_diagnostico: dadosContrato.semanas_diagnostico,
        meses_vigencia: dadosContrato.meses_vigencia,
        prazo_entrega_semanas: dadosContrato.prazo_entrega_semanas
      },
      contato: {
        email_contratante: dadosContrato.email_contratante || '[E-MAIL DA CONTRATANTE]',
        email_contratada: 'seu-email@nexus.com.br'
      },
      data_assinatura: new Date().toLocaleDateString('pt-BR')
    };

    api.post('/ia/gerar-contrato-pre-diagnostico', payload)
      .then(response => {
        toast.dismiss('gerandoContrato');
        toast.success('Contrato gerado com sucesso!');
        navigate('/consultor/contrato-pre-diagnostico', {
          state: { contratoData: response.data }
        });
      })
      .catch(error => {
        console.error('Erro ao gerar contrato:', error);
        toast.dismiss('gerandoContrato');
        toast.error(error.response?.data?.erro || 'Erro ao gerar contrato');
      })
      .finally(() => {
        setCarregandoContrato(false);
      });
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      
      <ModalNegociacao
        mostrar={mostrarModalNegociacao}
        onClose={() => setMostrarModalNegociacao(false)}
        resultado={resultado}
        formatarMoeda={formatarMoeda}
        dadosContrato={dadosContrato}
        setDadosContrato={setDadosContrato}
        opcaoNegociacao={opcaoNegociacao}
        setOpcaoNegociacao={setOpcaoNegociacao}
        valorNegociado={valorNegociado}
        setValorNegociado={setValorNegociado}
        motivoNegociacao={motivoNegociacao}
        setMotivoNegociacao={setMotivoNegociacao}
        carregandoContrato={carregandoContrato}
        onGerarContrato={handleGerarContrato}
      />

      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1E3A8A', marginBottom: '10px' }}>
          🤖 IA de Precificação - Nova Proposta
        </h1>
        <p style={{ color: '#666' }}>
          Preencha os dados que você sabe sobre a empresa para gerar uma proposta comercial.
          O Hórus calculará o preço justo baseado em benchmarks do setor.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        <Card titulo="📋 Dados do Cliente">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <Input
              label="Nome da Empresa *"
              value={dadosCliente.empresa_nome}
              onChange={(e) => setDadosCliente({...dadosCliente, empresa_nome: e.target.value})}
              placeholder="Ex: Metalúrgica ABC"
              required
            />

            <Select
              label="Setor Industrial *"
              value={dadosCliente.setor}
              onChange={(e) => setDadosCliente({...dadosCliente, setor: e.target.value})}
              options={setores}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <Input
                label="Número de Funcionários *"
                type="number"
                value={dadosCliente.numero_funcionarios}
                onChange={(e) => setDadosCliente({...dadosCliente, numero_funcionarios: parseInt(e.target.value) || 0})}
                placeholder="Ex: 150"
              />
              
              <Input
                label="Faturamento Anual (R$) *"
                type="number"
                value={dadosCliente.faturamento_anual}
                onChange={(e) => setDadosCliente({...dadosCliente, faturamento_anual: parseFloat(e.target.value) || 0})}
                placeholder="Ex: 10000000"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <Input
                label="Número de Linhas"
                type="number"
                min="1"
                value={dadosCliente.numero_linhas}
                onChange={(e) => setDadosCliente({...dadosCliente, numero_linhas: parseInt(e.target.value) || 1})}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 500 }}>
                Problemas Conhecidos
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {problemasList.map(problema => (
                  <label key={problema.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={dadosCliente.problemas.includes(problema.id)}
                      onChange={() => handleProblemaChange(problema.id)}
                    />
                    <span>{problema.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <Select
                label="Urgência"
                value={dadosCliente.urgencia}
                onChange={(e) => setDadosCliente({...dadosCliente, urgencia: e.target.value})}
                options={[
                  { value: '', label: 'Selecione...' }, 
                  { value: 'baixa', label: 'Baixa (6+ meses)' },
                  { value: 'normal', label: 'Normal (3-6 meses)' },
                  { value: 'alta', label: 'Alta (até 3 meses)' }
                ]}
              />
              
              <Select
                label="Complexidade"
                value={dadosCliente.complexidade}
                onChange={(e) => setDadosCliente({...dadosCliente, complexidade: e.target.value})}
                options={[
                  { value: '', label: 'Selecione...' },
                  { value: 'baixa', label: 'Baixa' },
                  { value: 'media', label: 'Média' },
                  { value: 'alta', label: 'Alta' }
                ]}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <Select
                label="Gestor Dedicado?"
                value={dadosCliente.gestor_dedicado}
                onChange={(e) => setDadosCliente({...dadosCliente, gestor_dedicado: e.target.value})}
                options={[
                  { value: '', label: 'Selecione...' },
                  { value: 'sim', label: 'Sim, dedicado' },
                  { value: 'parcial', label: 'Parcial' },
                  { value: 'nao', label: 'Não' }
                ]}
              />
              
              <Select
                label="Acesso a Dados"
                value={dadosCliente.acesso_dados}
                onChange={(e) => setDadosCliente({...dadosCliente, acesso_dados: e.target.value})}
                options={[
                  { value: '', label: 'Selecione...' },
                  { value: 'imediato', label: 'Imediato' },
                  { value: 'mediado', label: 'Mediado' },
                  { value: 'restrito', label: 'Restrito' }
                ]}
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={dadosCliente.projeto_piloto}
                  onChange={(e) => setDadosCliente({...dadosCliente, projeto_piloto: e.target.checked})}
                />
                <span>É projeto piloto (primeiro cliente)</span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={dadosCliente.tem_viagem}
                  onChange={(e) => setDadosCliente({...dadosCliente, tem_viagem: e.target.checked})}
                />
                <span>Haverá viagens/deslocamento</span>
              </label>
            </div>

            <Botao
              variant="primary"
              size="lg"
              onClick={handleCalcular}
              disabled={carregando}
              loading={carregando}
              fullWidth
            >
              {carregando ? 'Calculando...' : '💰 Calcular Proposta'}
            </Botao>
          </div>
        </Card>

        <Card titulo="💰 Proposta Comercial">
          {!resultado ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', background: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '20px' }}>🤖</span>
              <p>Preencha os dados ao lado e clique em "Calcular Proposta"</p>
              <p style={{ fontSize: '12px', marginTop: '10px' }}>O Hórus usará benchmarks do setor para gerar o valor</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ background: '#1E3A8A', color: 'white', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>PREÇO SUGERIDO (PROJETO TOTAL)</div>
                <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{formatarMoeda(resultado.precos.ideal)}</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  Faixa: {formatarMoeda(resultado.precos.minimo)} - {formatarMoeda(resultado.precos.maximo)}
                </div>
              </div>

              {resultado.precos.fase1 && (
                <div style={{ background: '#e6f7ff', padding: '15px', borderRadius: '8px', textAlign: 'center', marginTop: '5px' }}>
                  <div style={{ fontSize: '12px', color: '#1E3A8A' }}>📋 FASE 1 - DIAGNÓSTICO</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1E3A8A' }}>
                    {formatarMoeda(resultado.precos.fase1)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>
                    Valor para iniciar o diagnóstico (pago na assinatura)
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#166534' }}>Ganho Mensal</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534' }}>
                    {formatarMoeda(resultado.detalhamento.ganho_mensal_projetado)}
                  </div>
                </div>
                <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#166534' }}>ROI</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534' }}>
                    {resultado.detalhamento.roi_cliente_percentual}%
                  </div>
                </div>
                <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#166534' }}>Payback</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534' }}>
                    {resultado.detalhamento.payback_meses} meses
                  </div>
                </div>
                <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#166534' }}>Cliente Fica com</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534' }}>
                    {resultado.detalhamento.cliente_fica_percentual}%
                  </div>
                </div>
              </div>

              <div style={{ background: '#fee2e2', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#991b1b' }}>Perda Estimada Atual</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#991b1b' }}>
                  {formatarMoeda(resultado.detalhamento.perda_mensal_estimada)}/mês
                </div>
                <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '5px' }}>
                  Potencial de redução: {resultado.detalhamento.potencial_melhoria_percentual}%
                </div>
              </div>

              {resultado.acoes_sugeridas && resultado.acoes_sugeridas.length > 0 && (
                <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>⚙️ Ações Prioritárias</div>
                  {resultado.acoes_sugeridas.slice(0, 3).map((acao, idx) => (
                    <div key={idx} style={{ marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: '500' }}>{acao.titulo}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{acao.descricao}</div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>
                        <span style={{ color: '#166534' }}>Ganho: {formatarMoeda(acao.ganho_mensal)}/mês</span>
                        {' | '}
                        <span style={{ color: '#1E3A8A' }}>Investimento: {formatarMoeda(acao.investimento)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', whiteSpace: 'pre-line', fontSize: '13px', maxHeight: '300px', overflow: 'auto' }}>
                {resultado.resumo}
              </div>

              <Botao
                variant="success"
                size="lg"
                onClick={handleAbrirModalNegociacao}
                fullWidth
              >
                ➡️ Gerar Contrato (com negociação)
              </Botao>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
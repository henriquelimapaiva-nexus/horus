// src/pages/consultor/ias/IAPrecificacao.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Botao from '../../../components/ui/Botao';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import api from '../../../api/api';
import toast from 'react-hot-toast';

export default function IAPrecificacao() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [carregandoContrato, setCarregandoContrato] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  
  const [dadosCliente, setDadosCliente] = useState({
    empresaId: '',
    empresaNome: '',
    perdaMensal: '',
    urgencia: 'normal',
    complexidade: 'media',
    porte: 'medio',
    linhas: 1
  });

  // Dados para o contrato (podem ser preenchidos depois)
  const [mostrarModalContrato, setMostrarModalContrato] = useState(false);
  const [dadosContrato, setDadosContrato] = useState({
    representante_nome: '',
    representante_nacionalidade: '',
    representante_estado_civil: '',
    representante_profissao: '',
    representante_rg: '',
    representante_cpf: '',
    representante_endereco: '',
    email_contratante: '',
    prazo_implementacao_semanas: 6,
    prazo_acompanhamento_meses: 3
  });

  // Buscar empresas ao carregar
  useEffect(() => {
    api.get("/companies")
      .then(res => setEmpresas(res.data))
      .catch(err => {
        console.error("Erro ao carregar empresas:", err);
        toast.error("Erro ao carregar empresas");
      });
  }, []);

  // Quando selecionar uma empresa, buscar dados reais
  const handleEmpresaChange = async (empresaId) => {
    const empresa = empresas.find(e => e.id === parseInt(empresaId));
    
    setDadosCliente(prev => ({
      ...prev,
      empresaId,
      empresaNome: empresa?.nome || ''
    }));

    if (!empresaId) return;

    setCarregandoDados(true);
    toast.loading('Buscando dados da empresa...', { id: 'busca' });

    try {
      const linhasRes = await api.get(`/lines/${empresaId}`);
      const linhas = linhasRes.data;
      
      let perdasTotais = 0;
      
      for (const linha of linhas) {
        try {
          const postosRes = await api.get(`/work-stations/${linha.id}`).catch(() => ({ data: [] }));
          const postos = postosRes.data;
          
          const perdasRes = await api.get(`/losses/${linha.id}`).catch(() => ({ data: [] }));
          const perdas = perdasRes.data;
          
          for (const posto of postos) {
            if (posto.cargo_id) {
              const cargosRes = await api.get(`/roles/${empresaId}`).catch(() => ({ data: [] }));
              const cargo = cargosRes.data.find(c => c.id === posto.cargo_id);
              if (cargo) {
                const salario = parseFloat(cargo.salario_base) || 0;
                const encargos = parseFloat(cargo.encargos_percentual) || 70;
                const custoMensal = salario * (1 + encargos / 100);
                perdasTotais += custoMensal * 0.2;
              }
            }
          }
          
          perdas.forEach(perda => {
            perdasTotais += (perda.microparadas_minutos || 0) * 10;
            perdasTotais += (perda.refugo_pecas || 0) * 50;
          });
          
        } catch (err) {
          console.error(`Erro ao processar linha ${linha.id}:`, err);
        }
      }

      const porte = linhas.length > 5 ? 'grande' : linhas.length > 2 ? 'medio' : 'pequeno';

      setDadosCliente(prev => ({
        ...prev,
        perdaMensal: Math.round(perdasTotais).toString(),
        linhas: linhas.length,
        porte
      }));

      toast.success('Dados carregados com sucesso!', { id: 'busca' });

    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados da empresa', { id: 'busca' });
    } finally {
      setCarregandoDados(false);
    }
  };

  const calcularPreco = (dados) => {
    const perdaMensal = Number(dados.perdaMensal);
    const beneficioMensal = perdaMensal * 0.3;
    const beneficioAnual = beneficioMensal * 12;
    let precoBase = beneficioAnual * 0.3;
    
    const multiplicadores = {
      urgencia: { baixa: 0.95, normal: 1.0, alta: 1.05 },
      complexidade: { baixa: 0.95, media: 1.0, alta: 1.05 },
      porte: { pequeno: 0.9, medio: 1.0, grande: 1.05 },
      linhas: dados.linhas > 1 ? 0.95 : 1.0
    };
    
    const multUrgencia = multiplicadores.urgencia[dados.urgencia] || 1.0;
    const multComplexidade = multiplicadores.complexidade[dados.complexidade] || 1.0;
    const multPorte = multiplicadores.porte[dados.porte] || 1.0;
    const multLinhas = dados.linhas > 3 ? 0.9 : dados.linhas > 1 ? 0.95 : 1.0;
    
    let precoFinal = precoBase * multUrgencia * multComplexidade * multPorte * multLinhas;
    
    const percentualCobrado = (precoFinal / beneficioAnual) * 100;
    if (percentualCobrado > 30) {
      precoFinal = beneficioAnual * 0.3;
    }
    
    const ganhoLiquidoCliente = beneficioAnual - precoFinal;
    const roiCliente = (ganhoLiquidoCliente / precoFinal) * 100;
    const paybackMeses = precoFinal / beneficioMensal;
    
    const dadosParaProposta = {
      empresa: dados.empresaNome,
      honorarios: Math.round(precoFinal),
      percentualReducao: 30,
      mesesAcompanhamento: 3,
      perdaMensal,
      linhas: dados.linhas
    };
    
    localStorage.setItem('precoJustoProposta', JSON.stringify(dadosParaProposta));
    
    return {
      preco: Math.round(precoFinal),
      precoMinimo: Math.round(precoFinal * 0.85),
      precoPremium: Math.round(precoFinal * 1.15),
      
      beneficios: {
        mensal: Math.round(beneficioMensal),
        anual: Math.round(beneficioAnual),
        liquido: Math.round(ganhoLiquidoCliente),
        roi: roiCliente.toFixed(0) + '%',
        payback: paybackMeses.toFixed(1) + ' meses'
      },
      
      etica: {
        clienteFica: ((ganhoLiquidoCliente / beneficioAnual) * 100).toFixed(0) + '%',
        nexusGanha: ((precoFinal / beneficioAnual) * 100).toFixed(0) + '%',
        justo: percentualCobrado <= 30
      },
      
      pagamento: {
        aVista: Math.round(precoFinal * 0.95),
        parcelado6x: Math.round(precoFinal / 6 * 1.05),
        parcelado12x: Math.round(precoFinal / 12 * 1.10)
      },
      
      resumo: `
        📊 ANÁLISE HÓRUS - PRECIFICAÇÃO
        
        Investimento sugerido: R$ ${Math.round(precoFinal).toLocaleString()}
        
        Benefícios para sua empresa:
        • Ganho mensal projetado: R$ ${Math.round(beneficioMensal).toLocaleString()}
        • Ganho anual projetado: R$ ${Math.round(beneficioAnual).toLocaleString()}
        • ROI projetado: ${roiCliente.toFixed(0)}%
        • Payback: ${paybackMeses.toFixed(1)} meses
        
        Sua empresa fica com ${((ganhoLiquidoCliente / beneficioAnual) * 100).toFixed(0)}% do benefício.
        É uma parceria justa e sustentável.
      `
    };
  };

  const handleCalcular = () => {
    if (!dadosCliente.empresaId) {
      toast.error('Selecione uma empresa');
      return;
    }
    
    if (!dadosCliente.perdaMensal || dadosCliente.perdaMensal < 1000) {
      toast.error('Perda mensal mínima de R$ 1.000');
      return;
    }

    setCarregando(true);
    
    setTimeout(() => {
      const resultado = calcularPreco(dadosCliente);
      setResultado(resultado);
      setCarregando(false);
      toast.success('Precificação calculada!');
    }, 500);
  };

  const handleAbrirModalContrato = () => {
    if (!dadosCliente.empresaId) {
      toast.error('Selecione uma empresa primeiro');
      return;
    }
    setMostrarModalContrato(true);
  };

  const handleGerarContrato = async () => {
    setCarregandoContrato(true);
    toast.loading('Gerando contrato de implementação...', { id: 'contrato' });

    try {
      const payload = {
        empresa_id: parseInt(dadosCliente.empresaId),
        valor_total: resultado?.preco,
        prazo_implementacao_semanas: dadosContrato.prazo_implementacao_semanas,
        prazo_acompanhamento_meses: dadosContrato.prazo_acompanhamento_meses,
        representante: {
          nome: dadosContrato.representante_nome || '[NOME DO REPRESENTANTE]',
          nacionalidade: dadosContrato.representante_nacionalidade || '[NACIONALIDADE]',
          estado_civil: dadosContrato.representante_estado_civil || '[ESTADO CIVIL]',
          profissao: dadosContrato.representante_profissao || '[PROFISSÃO]',
          rg: dadosContrato.representante_rg || '[RG]',
          cpf: dadosContrato.representante_cpf || '[CPF]',
          endereco: dadosContrato.representante_endereco || '[ENDEREÇO]'
        },
        contato: {
          email_contratante: dadosContrato.email_contratante || '[E-MAIL DA CONTRATANTE]',
          email_contratada: 'seu-email@nexus.com.br'
        },
        data_assinatura: new Date().toLocaleDateString('pt-BR')
      };

      const response = await api.post('/ia/gerar-contrato-implementacao', payload);
      
      toast.dismiss('contrato');
      toast.success('Contrato gerado com sucesso!');
      setMostrarModalContrato(false);
      
      navigate('/consultor/contrato-implementacao', {
        state: { contratoData: response.data }
      });

    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      toast.dismiss('contrato');
      toast.error(error.response?.data?.erro || 'Erro ao gerar contrato');
    } finally {
      setCarregandoContrato(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(valor || 0);
  };

  // Modal de dados do contrato
  const ModalContrato = () => {
    if (!mostrarModalContrato) return null;

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
          padding: "30px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto"
        }}>
          <h2 style={{ color: "#1E3A8A", marginBottom: "20px" }}>
            📋 Dados para o Contrato
          </h2>

          <p style={{ marginBottom: "15px", fontSize: "14px", color: "#666" }}>
            <strong>Empresa:</strong> {dadosCliente.empresaNome}
          </p>
          <p style={{ marginBottom: "20px", fontSize: "14px", color: "#666" }}>
            <strong>Valor do projeto:</strong> {formatarMoeda(resultado?.preco)}
          </p>

          <div style={{ marginBottom: "20px" }}>
            <Input
              label="Nome do Representante"
              value={dadosContrato.representante_nome}
              onChange={(e) => setDadosContrato({...dadosContrato, representante_nome: e.target.value})}
              placeholder="Nome completo"
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
              <Input
                label="RG"
                value={dadosContrato.representante_rg}
                onChange={(e) => setDadosContrato({...dadosContrato, representante_rg: e.target.value})}
                placeholder="RG"
              />
              <Input
                label="CPF"
                value={dadosContrato.representante_cpf}
                onChange={(e) => setDadosContrato({...dadosContrato, representante_cpf: e.target.value})}
                placeholder="CPF"
              />
            </div>
            <Input
              label="E-mail da CONTRATANTE"
              type="email"
              value={dadosContrato.email_contratante}
              onChange={(e) => setDadosContrato({...dadosContrato, email_contratante: e.target.value})}
              placeholder="contato@empresa.com.br"
              style={{ marginTop: "10px" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
              <Input
                label="Prazo Implementação (semanas)"
                type="number"
                value={dadosContrato.prazo_implementacao_semanas}
                onChange={(e) => setDadosContrato({...dadosContrato, prazo_implementacao_semanas: parseInt(e.target.value) || 6})}
              />
              <Input
                label="Prazo Acompanhamento (meses)"
                type="number"
                value={dadosContrato.prazo_acompanhamento_meses}
                onChange={(e) => setDadosContrato({...dadosContrato, prazo_acompanhamento_meses: parseInt(e.target.value) || 3})}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Botao variant="secondary" onClick={() => setMostrarModalContrato(false)}>
              Cancelar
            </Botao>
            <Botao variant="primary" onClick={handleGerarContrato} loading={carregandoContrato}>
              {carregandoContrato ? 'Gerando...' : '✅ Gerar Contrato'}
            </Botao>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <ModalContrato />

      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1E3A8A', marginBottom: '10px' }}>
          🤖 IA de Precificação
        </h1>
        <p style={{ color: '#666' }}>
          Selecione uma empresa e calcule o preço justo baseado nos dados reais.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        <Card titulo="📋 Dados do Cliente">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Empresa *</label>
              <select
                value={dadosCliente.empresaId}
                onChange={(e) => handleEmpresaChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px'
                }}
                disabled={carregandoDados}
              >
                <option value="">Selecione uma empresa...</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
              {carregandoDados && <small style={{ color: '#666' }}>Carregando dados...</small>}
            </div>

            <Input
              label="Perda Mensal (R$)"
              type="number"
              value={dadosCliente.perdaMensal}
              onChange={(e) => setDadosCliente({...dadosCliente, perdaMensal: e.target.value})}
              placeholder="Calculado automaticamente"
              help="Baseado nos dados da empresa"
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <Select
                label="Urgência"
                value={dadosCliente.urgencia}
                onChange={(e) => setDadosCliente({...dadosCliente, urgencia: e.target.value})}
                options={[
                  { value: 'baixa', label: 'Baixa' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'alta', label: 'Alta' }
                ]}
              />
              
              <Select
                label="Complexidade"
                value={dadosCliente.complexidade}
                onChange={(e) => setDadosCliente({...dadosCliente, complexidade: e.target.value})}
                options={[
                  { value: 'baixa', label: 'Baixa' },
                  { value: 'media', label: 'Média' },
                  { value: 'alta', label: 'Alta' }
                ]}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <Select
                label="Porte"
                value={dadosCliente.porte}
                onChange={(e) => setDadosCliente({...dadosCliente, porte: e.target.value})}
                options={[
                  { value: 'pequeno', label: 'Pequeno' },
                  { value: 'medio', label: 'Médio' },
                  { value: 'grande', label: 'Grande' }
                ]}
              />
              
              <Input
                label="Linhas"
                type="number"
                min="1"
                value={dadosCliente.linhas}
                onChange={(e) => setDadosCliente({...dadosCliente, linhas: parseInt(e.target.value) || 1})}
              />
            </div>

            <Botao
              variant="primary"
              size="lg"
              onClick={handleCalcular}
              disabled={carregando || carregandoDados}
              loading={carregando}
              fullWidth
            >
              {carregando ? 'Calculando...' : '💰 Calcular Preço'}
            </Botao>
          </div>
        </Card>

        <Card titulo="💰 Resultado">
          {!resultado ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', background: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '20px' }}>🤖</span>
              <p>Selecione uma empresa e calcule o preço</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ background: '#1E3A8A', color: 'white', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>PREÇO SUGERIDO</div>
                <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{formatarMoeda(resultado.preco)}</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>ou 12x {formatarMoeda(resultado.pagamento.parcelado12x)}</div>
              </div>

              <div style={{ background: resultado.etica.justo ? '#16a34a20' : '#dc262620', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ color: resultado.etica.justo ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                  {resultado.etica.justo ? '✅ Proposta justa' : '⚠️ Alerta'}
                </span>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Cliente fica com {resultado.etica.clienteFica}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#166534' }}>Ganho Mensal</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534' }}>
                    {formatarMoeda(resultado.beneficios.mensal)}
                  </div>
                </div>
                <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#166534' }}>ROI</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#166534' }}>
                    {resultado.beneficios.roi}
                  </div>
                </div>
              </div>

              <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>Negociação:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#991b1b', fontWeight: 'bold' }}>{formatarMoeda(resultado.precoMinimo)}</span>
                  <span style={{ color: '#166534', fontWeight: 'bold' }}>{formatarMoeda(resultado.precoPremium)}</span>
                </div>
              </div>

              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', whiteSpace: 'pre-line', fontSize: '13px' }}>
                {resultado.resumo}
              </div>

              <Botao
                variant="success"
                size="lg"
                onClick={handleAbrirModalContrato}
                fullWidth
              >
                📄 Gerar Contrato de Implementação
              </Botao>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
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

  // Buscar empresas ao carregar
  useEffect(() => {
    api.get("/empresas")
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
      // Buscar linhas da empresa
      const linhasRes = await api.get(`/linhas/${empresaId}`);
      const linhas = linhasRes.data;
      
      // Calcular perdas totais
      let perdasTotais = 0;
      
      for (const linha of linhas) {
        try {
          // Buscar postos da linha
          const postosRes = await api.get(`/postos/${linha.id}`).catch(() => ({ data: [] }));
          const postos = postosRes.data;
          
          // Buscar perdas da linha
          const perdasRes = await api.get(`/perdas/${linha.id}`).catch(() => ({ data: [] }));
          const perdas = perdasRes.data;
          
          // Calcular custo dos postos (para estimativa de perdas)
          for (const posto of postos) {
            if (posto.cargo_id) {
              const cargosRes = await api.get(`/cargos/${empresaId}`).catch(() => ({ data: [] }));
              const cargo = cargosRes.data.find(c => c.id === posto.cargo_id);
              if (cargo) {
                const salario = parseFloat(cargo.salario_base) || 0;
                const encargos = parseFloat(cargo.encargos_percentual) || 70;
                const custoMensal = salario * (1 + encargos / 100);
                perdasTotais += custoMensal * 0.2; // Estimativa de 20% de perdas
              }
            }
          }
          
          // Adicionar perdas registradas
          perdas.forEach(perda => {
            perdasTotais += (perda.microparadas_minutos || 0) * 10; // Estimativa de R$10/minuto
            perdasTotais += (perda.refugo_pecas || 0) * 50; // Estimativa de R$50/peça
          });
          
        } catch (err) {
          console.error(`Erro ao processar linha ${linha.id}:`, err);
        }
      }

      // Definir porte baseado no número de linhas
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

  // ========================================
  // FUNÇÃO DE PRECIFICAÇÃO HÓRUS
  // ========================================
  const calcularPreco = (dados) => {
    const perdaMensal = Number(dados.perdaMensal);
    
    // 1. Benefício real para o cliente (redução de 30%)
    const beneficioMensal = perdaMensal * 0.3;
    const beneficioAnual = beneficioMensal * 12;
    
    // 2. Preço base = 30% do benefício anual
    let precoBase = beneficioAnual * 0.3;
    
    // 3. Ajustes mínimos (max 15% de variação)
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
    
    // 4. VALIDAÇÃO ÉTICA: cliente nunca paga mais de 30% do benefício
    const percentualCobrado = (precoFinal / beneficioAnual) * 100;
    if (percentualCobrado > 30) {
      precoFinal = beneficioAnual * 0.3;
    }
    
    // 5. ROI e Payback
    const ganhoLiquidoCliente = beneficioAnual - precoFinal;
    const roiCliente = (ganhoLiquidoCliente / precoFinal) * 100;
    const paybackMeses = precoFinal / beneficioMensal;
    
    // 6. Salvar no localStorage para usar na proposta
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
      toast.success('Precificação calculada e salva para a proposta!');
    }, 500);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(valor || 0);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Cabeçalho */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1E3A8A', marginBottom: '10px' }}>
          🤖 IA de Precificação
        </h1>
        <p style={{ color: '#666' }}>
          Selecione uma empresa e calcule o preço justo baseado nos dados reais.
        </p>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* FORMULÁRIO */}
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

        {/* RESULTADO */}
        <Card titulo="💰 Resultado">
          {!resultado ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', background: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '20px' }}>🤖</span>
              <p>Selecione uma empresa e calcule o preço</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Preço principal */}
              <div style={{ background: '#1E3A8A', color: 'white', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>PREÇO SUGERIDO</div>
                <div style={{ fontSize: '48px', fontWeight: 'bold' }}>{formatarMoeda(resultado.preco)}</div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>ou 12x {formatarMoeda(resultado.pagamento.parcelado12x)}</div>
              </div>

              {/* Validação ética */}
              <div style={{ background: resultado.etica.justo ? '#16a34a20' : '#dc262620', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ color: resultado.etica.justo ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                  {resultado.etica.justo ? '✅ Proposta justa' : '⚠️ Alerta'}
                </span>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Cliente fica com {resultado.etica.clienteFica}
                </div>
              </div>

              {/* Métricas */}
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

              {/* Faixa de negociação */}
              <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>Negociação:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#991b1b', fontWeight: 'bold' }}>{formatarMoeda(resultado.precoMinimo)}</span>
                  <span style={{ color: '#166534', fontWeight: 'bold' }}>{formatarMoeda(resultado.precoPremium)}</span>
                </div>
              </div>

              {/* Resumo */}
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px', whiteSpace: 'pre-line', fontSize: '13px' }}>
                {resultado.resumo}
              </div>

              {/* Mensagem de integração */}
              <div style={{ background: '#1E3A8A20', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '13px' }}>
                ✅ Preço salvo! Ao acessar a Proposta Comercial, os honorários já estarão preenchidos.
              </div>

              {/* 🟢 BOTÃO PARA IR À PROPOSTA (COM STATE) */}
              <div style={{ marginTop: '10px' }}>
                <Botao
                  variant="success"
                  size="lg"
                  onClick={() => navigate('/proposta', { 
                    state: { empresaId: dadosCliente.empresaId } 
                  })}
                  fullWidth
                >
                  ➡️ Ir para Proposta Comercial
                </Botao>
                <small style={{ color: '#666', display: 'block', textAlign: 'center', marginTop: '8px' }}>
                  O preço calculado será carregado automaticamente na proposta
                </small>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
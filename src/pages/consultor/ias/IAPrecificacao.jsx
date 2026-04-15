// src/pages/consultor/ias/IAPrecificacao.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Botao from '../../../components/ui/Botao';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import api from '../../../api/api';
import toast from 'react-hot-toast';
import logo from '../../../assets/logo.png';

export default function IAPrecificacao() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const [carregandoContrato, setCarregandoContrato] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [valoresFase1, setValoresFase1] = useState(null);
  
  // Estados para o contrato na mesma tela
  const [modoContrato, setModoContrato] = useState(false);
  const [contratoHtml, setContratoHtml] = useState('');
  
  // Estado para o modal de negociação
  const [mostrarModalNegociacao, setMostrarModalNegociacao] = useState(false);
  const [opcaoNegociacao, setOpcaoNegociacao] = useState('aceitar');
  const [valorNegociado, setValorNegociado] = useState('');
  const [motivoNegociacao, setMotivoNegociacao] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('cinquenta_cinquenta');
  const [numParcelas, setNumParcelas] = useState(6);
  const [valorParcela, setValorParcela] = useState(0);
  const [valorEntrada, setValorEntrada] = useState(0);
  const [entradaPercentual, setEntradaPercentual] = useState(50);
  
  const [empresaSelecionada, setEmpresaSelecionada] = useState({
    id: '',
    nome: ''
  });

  // Dados para o contrato
  const [dadosContrato, setDadosContrato] = useState({
    representante_nome: '',
    representante_cargo: '',
    representante_nacionalidade: '',
    representante_estado_civil: '',
    representante_profissao: '',
    representante_rg: '',
    representante_cpf: '',
    representante_endereco: '',
    email_contratante: ''
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

  // Quando selecionar uma empresa, buscar valores da Fase 1
  const handleEmpresaChange = async (empresaId) => {
    const empresa = empresas.find(e => e.id === parseInt(empresaId));
    
    setEmpresaSelecionada({
      id: empresaId,
      nome: empresa?.nome || ''
    });

    if (!empresaId) {
      setValoresFase1(null);
      return;
    }

    setCarregando(true);
    toast.loading('Buscando dados do contrato Fase 1...', { id: 'busca' });

    try {
      const response = await api.get(`/projeto/valores/${empresaId}`);
      
      if (response.data.sucesso) {
        setValoresFase1(response.data.dados);
        
        const saldo = response.data.dados.saldo_fase2e3;
        const entradaPadrao = saldo * 0.5;
        const saldoParcelado = saldo - entradaPadrao;
        const parcelasPadrao = Math.min(12, Math.max(3, Math.ceil(saldoParcelado / 5000)));
        const valorParcelaPadrao = Math.ceil(saldoParcelado / parcelasPadrao / 100) * 100;
        
        setValorNegociado(saldo.toString());
        setValorEntrada(entradaPadrao);
        setNumParcelas(parcelasPadrao);
        setValorParcela(valorParcelaPadrao);
        setEntradaPercentual(50);
        
        toast.success('Dados carregados com sucesso!', { id: 'busca' });
      } else {
        toast.error(response.data.erro || 'Erro ao buscar dados da Fase 1', { id: 'busca' });
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error(error.response?.data?.erro || 'Erro ao carregar dados da Fase 1', { id: 'busca' });
      setValoresFase1(null);
    } finally {
      setCarregando(false);
    }
  };

  const handleAbrirModalNegociacao = () => {
    if (!empresaSelecionada.id) {
      toast.error('Selecione uma empresa primeiro');
      return;
    }
    if (!valoresFase1) {
      toast.error('Aguardando carregamento dos dados');
      return;
    }
    setMostrarModalNegociacao(true);
  };

  const handleGerarContrato = async () => {
    let valorFinal = valoresFase1.saldo_fase2e3;
    
    if (opcaoNegociacao === 'negociar') {
      const novoValor = parseFloat(valorNegociado);
      if (isNaN(novoValor) || novoValor <= 0) {
        toast.error('Informe um valor válido para negociação');
        return;
      }
      valorFinal = novoValor;
    }

    setCarregandoContrato(true);
    toast.loading('Gerando contrato de implementação...', { id: 'contrato' });

    try {
      const payload = {
        empresa_id: parseInt(empresaSelecionada.id),
        valor_total: valorFinal,
        forma_pagamento: formaPagamento,
        motivo_negociacao: motivoNegociacao || null,
        num_parcelas: (formaPagamento === 'parcelado' || formaPagamento === 'especial') ? numParcelas : 0,
        valor_parcela: (formaPagamento === 'parcelado' || formaPagamento === 'especial') ? valorParcela : 0,
        valor_entrada: (formaPagamento === 'parcelado' || formaPagamento === 'especial') ? valorEntrada : 0,
        entrada_percentual: formaPagamento === 'especial' ? entradaPercentual : null,
        representante: {
          nome: dadosContrato.representante_nome || '[NOME DO REPRESENTANTE]',
          cargo: dadosContrato.representante_cargo || '[CARGO]',
          nacionalidade: dadosContrato.representante_nacionalidade || '[NACIONALIDADE]',
          estado_civil: dadosContrato.representante_estado_civil || '[ESTADO CIVIL]',
          profissao: dadosContrato.representante_profissao || '[PROFISSÃO]',
          rg: dadosContrato.representante_rg || '[RG]',
          cpf: dadosContrato.representante_cpf || '[CPF]',
          endereco: dadosContrato.representante_endereco || '[ENDEREÇO]'
        },
        contato: {
          email_contratante: dadosContrato.email_contratante || '[E-MAIL DA CONTRATANTE]',
          email_contratada: 'contato@nexusengenharia.com.br'
        },
        data_assinatura: new Date().toLocaleDateString('pt-BR')
      };

      const response = await api.post('/ia/gerar-contrato-implementacao', payload);
      
      toast.dismiss('contrato');
      toast.success('Contrato gerado com sucesso!');
      setMostrarModalNegociacao(false);
      
      // Renderizar contrato na mesma tela (não em nova aba)
      setContratoHtml(response.data.contrato);
      setModoContrato(true);

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
      minimumFractionDigits: 2
    }).format(valor || 0);
  };

  // TELA DE CONTRATO
if (modoContrato && contratoHtml) {
  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", padding: "40px" }}>
      
      <div style={{ marginBottom: "20px" }}>
        <Botao onClick={() => setModoContrato(false)}>
          ← Voltar
        </Botao>
      </div>

      <div
        className="contrato-print"
        style={{
          backgroundColor: "#ffffff",
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "50px",
          fontFamily: "Arial, sans-serif",
          lineHeight: "1.6",
          color: "#000"
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <img src={logo} alt="..." style={{ width: "180px", marginBottom: "15px", objectFit: "contain" }} />
          <h1 style={{ color: "#1E3A8A", fontSize: "26px", marginBottom: "5px" }}>NEXUS ENGENHARIA APLICADA</h1>
          <p style={{ color: "#666" }}>CONTRATO DE IMPLEMENTAÇÃO + ACOMPANHAMENTO</p>
        </div>

        <div dangerouslySetInnerHTML={{ __html: contratoHtml.replace(/\n/g, '<br>') }} />

        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <Botao onClick={() => window.print()}>🖨️ Imprimir / Salvar PDF</Botao>
        </div>

        {/* CSS PARA AJUSTAR ASSINATURAS */}
        <style>{`
          .assinatura-linha {
            border-top: 1px solid #000;
            margin: 8px 0 5px 0 !important;
          }
          .grid-assinaturas-print {
            display: flex;
            justify-content: space-between;
            gap: 30px;
            margin-top: 20px !important;
          }
          .campo-assinatura {
            flex: 1;
            text-align: center;
          }
          .testemunhas-print {
            margin-top: 25px !important;
          }
          .testemunhas-print div {
            gap: 30px !important;
          }
          .testemunhas-print p {
            margin: 3px 0 !important;
          }
        `}</style>

      </div>
    </div>
  );
}

  // Modal de negociação
  const ModalNegociacao = () => {
    if (!mostrarModalNegociacao) return null;

    const saldo = valoresFase1?.saldo_fase2e3 || 0;
    const valorImplementacao = valoresFase1?.valor_implementacao || 0;
    const valorAcompanhamentoMensal = valoresFase1?.valor_acompanhamento_mensal || 0;
    const meses = valoresFase1?.meses_acompanhamento || 6;

    const handleFormaPagamentoChange = (tipo) => {
      setFormaPagamento(tipo);
      
      if (tipo === 'a_vista') {
        setValorNegociado(saldo.toString());
      } else if (tipo === 'cinquenta_cinquenta') {
        setValorNegociado(saldo.toString());
      } else if (tipo === 'parcelado') {
        const entrada = saldo * 0.5;
        const saldoParcelado = saldo - entrada;
        let parcelas = Math.ceil(saldoParcelado / 5000);
        parcelas = Math.min(12, Math.max(3, parcelas));
        const valorParcelaCalc = Math.ceil(saldoParcelado / parcelas / 100) * 100;
        
        setEntradaPercentual(50);
        setValorEntrada(entrada);
        setNumParcelas(parcelas);
        setValorParcela(valorParcelaCalc);
        setValorNegociado(saldo.toString());
      } else if (tipo === 'especial') {
        // NÃO definir valores padrão
        setValorNegociado(saldo.toString());
      }
    };

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
          maxWidth: "550px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto"
        }}>
          <h2 style={{ color: "#1E3A8A", marginBottom: "20px" }}>
            💰 Negociação do Contrato - Fase 2+3
          </h2>

          <div style={{ 
            backgroundColor: "#f0fdf4", 
            padding: "15px", 
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #10b981"
          }}>
            <h4 style={{ marginBottom: "10px", color: "#166534" }}>📊 Discriminação do Saldo</h4>
            <p><strong>Saldo total Fase 2+3:</strong> {formatarMoeda(saldo)}</p>
            <p><strong>Implementação (Fase 2):</strong> {formatarMoeda(valorImplementacao)} (80%)</p>
            <p><strong>Acompanhamento (Fase 3):</strong> {formatarMoeda(valorAcompanhamentoMensal * meses)}</p>
            <p style={{ marginLeft: "20px", fontSize: "13px", color: "#555" }}>
              └─ {meses} meses × {formatarMoeda(valorAcompanhamentoMensal)}/mês
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <p style={{ marginBottom: "10px" }}>
              <strong>Valor base do contrato:</strong> {formatarMoeda(saldo)}
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <input
                type="radio"
                value="aceitar"
                checked={opcaoNegociacao === 'aceitar'}
                onChange={(e) => setOpcaoNegociacao(e.target.value)}
              />
              Aceitar valor sugerido: {formatarMoeda(saldo)}
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="radio"
                value="negociar"
                checked={opcaoNegociacao === 'negociar'}
                onChange={(e) => setOpcaoNegociacao(e.target.value)}
              />
              Negociar novo valor
            </label>

            {opcaoNegociacao === 'negociar' && (
              <div style={{ marginTop: "15px", marginLeft: "25px" }}>
                <Input
                  label="Novo valor (R$)"
                  type="number"
                  value={valorNegociado}
                  onChange={(e) => setValorNegociado(e.target.value)}
                  placeholder="Digite o novo valor"
                  required
                />
                <Input
                  label="Motivo da negociação (opcional)"
                  value={motivoNegociacao}
                  onChange={(e) => setMotivoNegociacao(e.target.value)}
                  placeholder="Ex: Cliente solicitou desconto, projeto piloto, etc"
                />
              </div>
            )}
          </div>

          <hr style={{ margin: "20px 0" }} />

          <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>💳 Forma de Pagamento</h3>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <input
                type="radio"
                name="forma_pagamento"
                value="a_vista"
                checked={formaPagamento === 'a_vista'}
                onChange={() => handleFormaPagamentoChange('a_vista')}
              />
              <strong>À vista</strong> - 100% na assinatura: {formatarMoeda(saldo)}
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <input
                type="radio"
                name="forma_pagamento"
                value="cinquenta_cinquenta"
                checked={formaPagamento === 'cinquenta_cinquenta'}
                onChange={() => handleFormaPagamentoChange('cinquenta_cinquenta')}
              />
              <strong>50/50</strong> - 50% na assinatura + 50% na entrega da Fase 2
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <input
                type="radio"
                name="forma_pagamento"
                value="parcelado"
                checked={formaPagamento === 'parcelado'}
                onChange={() => handleFormaPagamentoChange('parcelado')}
              />
              <strong>50% + Parcelas</strong> - 50% entrada + saldo parcelado (máx R$ 5.000/parcela)
            </label>

            {/* NOVA OPÇÃO: Condições Especiais - CORRIGIDA */}
            <label style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
              <input
                type="radio"
                name="forma_pagamento"
                value="especial"
                checked={formaPagamento === 'especial'}
                onChange={() => handleFormaPagamentoChange('especial')}
              />
              <strong>🎯 Condições Especiais</strong> - Negociar entrada e parcelas
            </label>
          </div>

          {formaPagamento === 'parcelado' && (
            <div style={{ 
              marginTop: "15px", 
              padding: "15px", 
              backgroundColor: "#f0fdf4", 
              borderRadius: "8px",
              border: "1px solid #10b981"
            }}>
              <h4 style={{ marginBottom: "10px", color: "#166534" }}>📋 Detalhes do Parcelamento</h4>
              <p><strong>Valor total:</strong> {formatarMoeda(parseFloat(valorNegociado))}</p>
              <p><strong>Entrada (50%):</strong> {formatarMoeda(valorEntrada)}</p>
              <p><strong>Saldo a parcelar:</strong> {formatarMoeda(parseFloat(valorNegociado) - valorEntrada)}</p>
              
              <div style={{ marginTop: "10px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Número de parcelas:</label>
                <select
                  value={numParcelas}
                  onChange={(e) => {
                    const parcelas = parseInt(e.target.value);
                    const saldoParcelado = parseFloat(valorNegociado) - valorEntrada;
                    const valorParcelaCalc = parcelas > 0 ? (saldoParcelado / parcelas) : 0;
                    setNumParcelas(parcelas);
                    setValorParcela(valorParcelaCalc);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "14px"
                  }}
                >
                  {[3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={n}>{n} parcela{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              
              <p style={{ marginTop: "10px" }}>
                <strong>Valor da parcela:</strong> {formatarMoeda(valorParcela)}
              </p>
              <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
                ✓ Parcela máxima de R$ 5.000<br />
                ✓ Máximo de 12 parcelas<br />
                ✓ Sem juros<br />
                ✓ Os valores da Fase 3 (Acompanhamento) estão incluídos nas parcelas
              </p>
            </div>
          )}

          {/* CONDIÇÕES ESPECIAIS - CORRIGIDO (sem arredondamento e sem valores padrão) */}
          {formaPagamento === 'especial' && (
            <div style={{ 
              marginTop: "15px", 
              padding: "15px", 
              backgroundColor: "#f0fdf4", 
              borderRadius: "8px",
              border: "1px solid #10b981"
            }}>
              <h4 style={{ marginBottom: "10px", color: "#166534" }}>📋 Negociação Personalizada</h4>
              
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  Percentual de entrada (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={entradaPercentual}
                  onChange={(e) => {
                    const percent = parseFloat(e.target.value) || 0;
                    const valorComDesconto = parseFloat(valorNegociado);
                    const valorEntradaCalc = (valorComDesconto * percent) / 100;
                    const saldoParcelado = valorComDesconto - valorEntradaCalc;
                    let parcelas = numParcelas;
                    if (parcelas === 0) parcelas = 0;
                    const valorParcelaCalc = parcelas > 0 ? (saldoParcelado / parcelas) : 0;
                    
                    setEntradaPercentual(percent);
                    setValorEntrada(valorEntradaCalc);
                    setNumParcelas(parcelas);
                    setValorParcela(valorParcelaCalc);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "14px"
                  }}
                />
                <small style={{ color: "#666" }}>Digite o percentual desejado (ex: 30 para 30%)</small>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  Número de parcelas
                </label>
                <select
                  value={numParcelas}
                  onChange={(e) => {
                    const parcelas = parseInt(e.target.value);
                    const saldoParcelado = parseFloat(valorNegociado) - valorEntrada;
                    const valorParcelaCalc = parcelas > 0 ? (saldoParcelado / parcelas) : 0;
                    setNumParcelas(parcelas);
                    setValorParcela(valorParcelaCalc);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    fontSize: "14px"
                  }}
                >
                  <option value="0">À vista (sem parcelas)</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={n}>{n} parcela{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div style={{ 
                marginTop: "15px", 
                padding: "10px", 
                backgroundColor: "#e6f7e6", 
                borderRadius: "4px"
              }}>
                <p><strong>Resumo da negociação:</strong></p>
                <p>💵 Valor total: {formatarMoeda(parseFloat(valorNegociado))}</p>
                <p>💰 Entrada ({entradaPercentual}%): {formatarMoeda(valorEntrada)}</p>
                {numParcelas > 0 && (
                  <p>📅 {numParcelas}x de {formatarMoeda(valorParcela)}</p>
                )}
                <p><strong>Total a pagar:</strong> {formatarMoeda(valorEntrada + (numParcelas * valorParcela))}</p>
              </div>

              <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
                ✓ Parcela máxima de R$ 5.000<br />
                ✓ Máximo de 12 parcelas<br />
                ✓ Sem juros<br />
                ✓ Condições especiais serão refletidas no contrato
              </p>
            </div>
          )}

          <hr style={{ margin: "20px 0" }} />

          <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>📋 Dados para o Contrato</h3>

          <div style={{ maxHeight: "300px", overflow: "auto", marginBottom: "20px" }}>
            <Input
              label="Nome do Representante"
              value={dadosContrato.representante_nome}
              onChange={(e) => setDadosContrato({...dadosContrato, representante_nome: e.target.value})}
              placeholder="Nome completo"
            />
            <Input
              label="Cargo do Representante"
              value={dadosContrato.representante_cargo}
              onChange={(e) => setDadosContrato({...dadosContrato, representante_cargo: e.target.value})}
              placeholder="Ex: Diretor, Gerente, etc."
              style={{ marginTop: "10px" }}
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
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Botao variant="secondary" onClick={() => setMostrarModalNegociacao(false)}>
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
      
      <ModalNegociacao />

      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1E3A8A', marginBottom: '10px' }}>
          Sistema de Inteligência Comercial (SIC) - Fase 2+3
        </h1>
        <p style={{ color: '#666' }}>
          Selecione uma empresa que já possui contrato de Diagnóstico (Fase 1) assinado.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        <Card titulo="📋 Dados da Empresa">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Empresa *</label>
              <select
                value={empresaSelecionada.id}
                onChange={(e) => handleEmpresaChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px'
                }}
                disabled={carregando}
              >
                <option value="">Selecione uma empresa...</option>
                {empresas.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
              {carregando && <small style={{ color: '#666' }}>Carregando dados da Fase 1...</small>}
            </div>

            {valoresFase1 && (
              <div style={{ 
                backgroundColor: "#f9fafb", 
                padding: "15px", 
                borderRadius: "8px",
                marginTop: "10px"
              }}>
                <h4 style={{ marginBottom: "10px", color: "#1E3A8A" }}>📊 Valores do Projeto</h4>
                <p><strong>Total do Projeto:</strong> {formatarMoeda(valoresFase1.valor_total_projeto)}</p>
                <p><strong>Fase 1 (Diagnóstico):</strong> {formatarMoeda(valoresFase1.valor_fase1)}</p>
                <p><strong>Saldo para Fase 2+3:</strong> {formatarMoeda(valoresFase1.saldo_fase2e3)}</p>
                <hr style={{ margin: "10px 0" }} />
                <p><strong>Implementação (Fase 2):</strong> {formatarMoeda(valoresFase1.valor_implementacao)} (80%)</p>
                <p><strong>Acompanhamento (Fase 3):</strong> {formatarMoeda(valoresFase1.valor_acompanhamento_mensal * 6)}</p>
                <p style={{ marginLeft: "20px", fontSize: "13px" }}>
                  └─ 6 meses × {formatarMoeda(valoresFase1.valor_acompanhamento_mensal)}/mês
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card titulo="💰 Próximo Passo">
          {!valoresFase1 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', background: '#f9fafb', borderRadius: '8px' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '20px' }}>📄</span>
              <p>Selecione uma empresa que já possui</p>
              <p>contrato de Diagnóstico (Fase 1) assinado.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ background: '#1E3A8A', color: 'white', padding: '30px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>VALOR DA FASE 2+3</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{formatarMoeda(valoresFase1.saldo_fase2e3)}</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '10px' }}>
                  Inclui Implementação + {valoresFase1.meses_acompanhamento || 6} meses de Acompanhamento
                </div>
              </div>

              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <p style={{ marginBottom: "10px" }}><strong>⚠️ Importante:</strong></p>
                <p style={{ fontSize: "13px", color: "#555" }}>
                  Este contrato é complementar ao Diagnóstico (Fase 1). 
                  Os valores aqui apresentados são calculados com base no contrato original.
                </p>
              </div>

              <Botao
                variant="success"
                size="lg"
                onClick={handleAbrirModalNegociacao}
                fullWidth
              >
                💰 Negociar e Gerar Contrato
              </Botao>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
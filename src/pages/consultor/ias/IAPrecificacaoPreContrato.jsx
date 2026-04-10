// src/pages/consultor/ias/IAPrecificacaoPreContrato.jsx
import { useState } from "react";
import api from "../../../api/api";
import Botao from "../../../components/ui/Botao";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Card from "../../../components/ui/Card";
import Modal from "../../../components/ui/Modal";
import toast from "react-hot-toast";

export default function IAPrecificacaoPreContrato() {
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [modalNegociacao, setModalNegociacao] = useState(false);
  const [modalParcelamento, setModalParcelamento] = useState(false);
  
  // Dados da negociação
  const [negociacao, setNegociacao] = useState({
    novo_valor: "",
    motivo: "",
    forma_pagamento: "cinquenta_cinquenta",
    num_parcelas: 0,
    valor_parcela: 0,
    entrada_percentual: 50,
    valor_entrada: 0
  });
  
  // Formulário de precificação
  const [formData, setFormData] = useState({
    empresa_nome: "",
    setor: "",
    numero_funcionarios: "",
    faturamento_anual: "",
    numero_linhas: "",
    problemas: [],
    urgencia: "",
    complexidade: "",
    gestor_dedicado: "",
    acesso_dados: "",
    projeto_piloto: false,
    tem_viagem: false
  });

  // Opções para selects
  const setores = [
    { value: "", label: "Selecione..." },
    { value: "automotivo", label: "Automotivo" },
    { value: "metalurgico", label: "Metalúrgico" },
    { value: "alimenticio", label: "Alimentício" },
    { value: "quimico", label: "Químico" },
    { value: "farmaceutico", label: "Farmacêutico" },
    { value: "outros", label: "Outros" }
  ];

  const problemasOpcoes = [
    { value: "produtividade", label: "Baixa Produtividade / Paradas" },
    { value: "qualidade", label: "Problemas de Qualidade / Refugo" },
    { value: "manutencao", label: "Manutenção / Setup demorado" },
    { value: "rh", label: "RH / Treinamento / Rotatividade" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);
    
    try {
      const response = await api.post("/ia/precificar", formData);
      setResultado(response.data);
      toast.success("Precificação calculada com sucesso!");
    } catch (error) {
      console.error("Erro ao precificar:", error);
      toast.error("Erro ao calcular precificação");
    } finally {
      setCarregando(false);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(valor || 0);
  };

  const abrirNegociacao = () => {
    const valorOriginal = resultado?.precos.diagnostico || 0;
    
    setNegociacao({
      novo_valor: valorOriginal,
      motivo: "",
      forma_pagamento: "cinquenta_cinquenta",
      num_parcelas: 0,
      valor_parcela: 0,
      entrada_percentual: 50,
      valor_entrada: valorOriginal * 0.5
    });
    setModalNegociacao(true);
  };

  const confirmarNegociacao = () => {
    setModalNegociacao(false);
    
    if (negociacao.forma_pagamento === "parcelado") {
      setModalParcelamento(true);
    } else {
      gerarContrato();
    }
  };

  const gerarContrato = async () => {
    setCarregando(true);
    try {
      const response = await api.post("/ia/gerar-contrato-pre-diagnostico", {
        empresa: {
          nome: formData.empresa_nome,
          cnpj: "",
          endereco: "",
          cidade: "",
          estado: ""
        },
        representante: {
          nome: "",
          nacionalidade: "",
          estado_civil: "",
          profissao: "",
          rg: "",
          cpf: "",
          endereco: ""
        },
        valor_negociado: parseFloat(negociacao.novo_valor),
        valor_original_ia: resultado?.precos.diagnostico,
        forma_pagamento: negociacao.forma_pagamento,
        motivo_negociacao: negociacao.motivo,
        num_parcelas: negociacao.num_parcelas,
        valor_parcela: negociacao.valor_parcela,
        valor_entrada: negociacao.valor_entrada
      });
      
      const win = window.open();
      win.document.write(`<pre>${response.data.contrato}</pre>`);
      toast.success("Contrato gerado com sucesso!");
      setModalParcelamento(false);
    } catch (error) {
      console.error("Erro ao gerar contrato:", error);
      toast.error("Erro ao gerar contrato");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ color: "#1E3A8A", marginBottom: "20px" }}>
        🤖 IA de Precificação
      </h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>
        Preencha os dados da empresa para calcular o preço do projeto
      </p>

      {/* Formulário */}
      <Card>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <Input
              label="Nome da Empresa *"
              value={formData.empresa_nome}
              onChange={(e) => setFormData({...formData, empresa_nome: e.target.value})}
              required
            />
            <Select
              label="Setor Industrial *"
              value={formData.setor}
              onChange={(e) => setFormData({...formData, setor: e.target.value})}
              options={setores}
              required
            />
            <Input
              label="Número de Funcionários"
              type="number"
              value={formData.numero_funcionarios}
              onChange={(e) => setFormData({...formData, numero_funcionarios: e.target.value})}
            />
            <Input
              label="Faturamento Anual (R$) *"
              type="number"
              value={formData.faturamento_anual}
              onChange={(e) => setFormData({...formData, faturamento_anual: e.target.value})}
              required
            />
            <Input
              label="Número de Linhas"
              type="number"
              placeholder="Ex: 1"
              value={formData.numero_linhas}
              onChange={(e) => setFormData({...formData, numero_linhas: e.target.value})}
            />
          </div>

          <div style={{ marginTop: "15px" }}>
            <label style={{ display: "block", marginBottom: "10px", fontWeight: "500" }}>Problemas Conhecidos</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {problemasOpcoes.map(opt => (
                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={formData.problemas.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({...formData, problemas: [...formData.problemas, opt.value]});
                      } else {
                        setFormData({...formData, problemas: formData.problemas.filter(p => p !== opt.value)});
                      }
                    }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "15px" }}>
            <Select
              label="Urgência"
              value={formData.urgencia}
              onChange={(e) => setFormData({...formData, urgencia: e.target.value})}
              options={[
                { value: "", label: "Selecione..." },
                { value: "baixa", label: "Baixa (mais de 6 meses)" },
                { value: "normal", label: "Normal (3-6 meses)" },
                { value: "alta", label: "Alta (até 3 meses)" }
              ]}
            />
            <Select
              label="Complexidade"
              value={formData.complexidade}
              onChange={(e) => setFormData({...formData, complexidade: e.target.value})}
              options={[
                { value: "", label: "Selecione..." },
                { value: "baixa", label: "Baixa" },
                { value: "media", label: "Média" },
                { value: "alta", label: "Alta" }
              ]}
            />
            <Select
              label="Gestor Dedicado?"
              value={formData.gestor_dedicado}
              onChange={(e) => setFormData({...formData, gestor_dedicado: e.target.value})}
              options={[
                { value: "", label: "Selecione..." },
                { value: "nao", label: "Não" },
                { value: "parcial", label: "Parcial" },
                { value: "sim", label: "Sim, dedicado" }
              ]}
            />
            <Select
              label="Acesso a Dados"
              value={formData.acesso_dados}
              onChange={(e) => setFormData({...formData, acesso_dados: e.target.value})}
              options={[
                { value: "", label: "Selecione..." },
                { value: "restrito", label: "Restrito" },
                { value: "mediado", label: "Mediado" },
                { value: "imediato", label: "Imediato" }
              ]}
            />
          </div>

          <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <input
                type="checkbox"
                checked={formData.projeto_piloto}
                onChange={(e) => setFormData({...formData, projeto_piloto: e.target.checked})}
              />
              É projeto piloto (primeiro cliente)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <input
                type="checkbox"
                checked={formData.tem_viagem}
                onChange={(e) => setFormData({...formData, tem_viagem: e.target.checked})}
              />
              Haverá viagens/deslocamento
            </label>
          </div>

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
            <Botao type="submit" loading={carregando}>
              {carregando ? "Calculando..." : "Calcular Preço"}
            </Botao>
          </div>
        </form>
      </Card>

      {/* Resultado da Precificação */}
      {resultado && (
        <Card style={{ marginTop: "30px" }}>
          <h2 style={{ color: "#1E3A8A", marginBottom: "20px" }}>📊 Resultado da Precificação</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "20px" }}>
            <div style={{ backgroundColor: "#f0fdf4", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>Total do Projeto</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E3A8A" }}>
                {formatarMoeda(resultado.precos.total_projeto)}
              </div>
            </div>
            <div style={{ backgroundColor: "#eff6ff", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>Fase 1 - Diagnóstico</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E3A8A" }}>
                {formatarMoeda(resultado.precos.diagnostico)}
              </div>
            </div>
            <div style={{ backgroundColor: "#fef3c7", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>Fase 2 - Implementação</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E3A8A" }}>
                {formatarMoeda(resultado.precos.implementacao)}
              </div>
            </div>
            <div style={{ backgroundColor: "#f3e8ff", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "#666" }}>Fase 3 - Acompanhamento (mês)</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E3A8A" }}>
                {formatarMoeda(resultado.precos.acompanhamento_mensal)}
              </div>
              <div style={{ fontSize: "11px", color: "#666" }}>Mínimo 3 meses | Máximo 12 meses</div>
            </div>
          </div>

          <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
            <p><strong>📈 Participação nos Resultados:</strong> {resultado.precos.participacao_percentual}% sobre a economia real gerada</p>
            <p><strong>💰 Salário mínimo vigente:</strong> {formatarMoeda(resultado.configuracao.salario_minimo_atual)}</p>
            <p><strong>📊 Acompanhamento mínimo:</strong> {formatarMoeda(resultado.configuracao.acompanhamento_minimo_mensal)}/mês</p>
          </div>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Botao variant="secondary" onClick={abrirNegociacao}>
              💰 Negociar Valores
            </Botao>
          </div>
        </Card>
      )}

      {/* Modal de Negociação */}
      <Modal isOpen={modalNegociacao} onClose={() => setModalNegociacao(false)} title="Negociação de Valores">
        <div style={{ marginBottom: "15px" }}>
          <p><strong>Valor original do diagnóstico:</strong> {formatarMoeda(resultado?.precos.diagnostico)}</p>
        </div>
        
        <Input
          label="Novo valor do diagnóstico (R$)"
          type="number"
          placeholder="Digite o novo valor"
          value={negociacao.novo_valor}
          onChange={(e) => {
            const novoValor = parseFloat(e.target.value) || 0;
            const entrada = novoValor * 0.5;
            setNegociacao({
              ...negociacao,
              novo_valor: e.target.value,
              valor_entrada: entrada
            });
          }}
        />
        
        <Input
          label="Motivo da negociação"
          as="textarea"
          rows={2}
          value={negociacao.motivo}
          onChange={(e) => setNegociacao({...negociacao, motivo: e.target.value})}
          placeholder="Ex: Cliente pediu desconto por ser primeiro projeto, pagamento à vista, etc."
        />
        
        <div style={{ marginTop: "15px" }}>
          <label style={{ display: "block", marginBottom: "10px", fontWeight: "500" }}>Forma de Pagamento</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="radio"
                name="forma_pagamento"
                value="a_vista"
                checked={negociacao.forma_pagamento === "a_vista"}
                onChange={(e) => setNegociacao({
                  ...negociacao, 
                  forma_pagamento: e.target.value,
                  num_parcelas: 0,
                  valor_parcela: 0
                })}
              />
              <span><strong>À vista</strong> - 100% na assinatura (10% de desconto)</span>
            </label>
            
            <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="radio"
                name="forma_pagamento"
                value="cinquenta_cinquenta"
                checked={negociacao.forma_pagamento === "cinquenta_cinquenta"}
                onChange={(e) => setNegociacao({
                  ...negociacao, 
                  forma_pagamento: e.target.value,
                  num_parcelas: 0,
                  valor_parcela: 0
                })}
              />
              <span><strong>50/50</strong> - 50% na assinatura + 50% na entrega do relatório</span>
            </label>
            
            <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="radio"
                name="forma_pagamento"
                value="parcelado"
                checked={negociacao.forma_pagamento === "parcelado"}
                onChange={(e) => {
                  const valorDiagnostico = parseFloat(negociacao.novo_valor);
                  const entrada = valorDiagnostico * 0.5;
                  const saldo = valorDiagnostico - entrada;
                  const parcelaMaxima = 5000;
                  let numParcelas = Math.ceil(saldo / parcelaMaxima);
                  numParcelas = Math.min(numParcelas, 12);
                  const valorParcela = numParcelas > 0 ? Math.ceil(saldo / numParcelas / 100) * 100 : 0;
                  
                  setNegociacao({
                    ...negociacao,
                    forma_pagamento: e.target.value,
                    num_parcelas: numParcelas,
                    valor_parcela: valorParcela,
                    entrada_percentual: 50,
                    valor_entrada: entrada
                  });
                }}
              />
              <span><strong>Parcelado</strong> - 50% entrada + parcelas mensais (máx R$ 5.000/parcela)</span>
            </label>
          </div>
        </div>
        
        {/* Campos de Parcelamento (aparecem só se selecionado) */}
        {negociacao.forma_pagamento === "parcelado" && (
          <div style={{ 
            marginTop: "15px", 
            padding: "15px", 
            backgroundColor: "#f0fdf4", 
            borderRadius: "8px",
            border: "1px solid #10b981"
          }}>
            <h4 style={{ marginBottom: "10px", color: "#166534" }}>📋 Detalhes do Parcelamento</h4>
            <p><strong>Valor do diagnóstico:</strong> {formatarMoeda(parseFloat(negociacao.novo_valor))}</p>
            <p><strong>Entrada (50%):</strong> {formatarMoeda(negociacao.valor_entrada)}</p>
            <p><strong>Saldo a parcelar:</strong> {formatarMoeda(parseFloat(negociacao.novo_valor) - negociacao.valor_entrada)}</p>
            
            <div style={{ marginTop: "10px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Número de parcelas:</label>
              <select
                value={negociacao.num_parcelas}
                onChange={(e) => {
                  const numParcelas = parseInt(e.target.value);
                  const saldo = parseFloat(negociacao.novo_valor) - negociacao.valor_entrada;
                  const valorParcela = numParcelas > 0 ? Math.ceil(saldo / numParcelas / 100) * 100 : 0;
                  setNegociacao({...negociacao, num_parcelas: numParcelas, valor_parcela: valorParcela});
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  fontSize: "14px"
                }}
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                  <option key={n} value={n}>{n} parcela{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            
            <p style={{ marginTop: "10px" }}>
              <strong>Valor da parcela:</strong> {formatarMoeda(negociacao.valor_parcela)}
            </p>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
              ✓ Parcela máxima de R$ 5.000<br />
              ✓ Máximo de 12 parcelas<br />
              ✓ Sem juros
            </p>
          </div>
        )}
        
        <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Botao variant="outline" onClick={() => setModalNegociacao(false)}>Cancelar</Botao>
          <Botao onClick={confirmarNegociacao}>Confirmar Negociação</Botao>
        </div>
      </Modal>

      {/* Modal de Parcelamento - Confirmação */}
      {resultado && (
        <Modal isOpen={modalParcelamento} onClose={() => setModalParcelamento(false)} title="Confirmação de Parcelamento">
          <div style={{ backgroundColor: "#f0fdf4", padding: "15px", borderRadius: "8px", marginBottom: "15px" }}>
            <p><strong>Valor do diagnóstico negociado:</strong> {formatarMoeda(parseFloat(negociacao.novo_valor))}</p>
            <p><strong>Entrada (50%):</strong> {formatarMoeda(negociacao.valor_entrada)}</p>
            <p><strong>Saldo parcelado:</strong> {formatarMoeda(parseFloat(negociacao.novo_valor) - negociacao.valor_entrada)}</p>
            <p><strong>Parcelas:</strong> {negociacao.num_parcelas}x de {formatarMoeda(negociacao.valor_parcela)}</p>
            <p><strong>Motivo da negociação:</strong> {negociacao.motivo || "Não informado"}</p>
          </div>
          
          <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Botao variant="outline" onClick={() => setModalParcelamento(false)}>Voltar</Botao>
            <Botao onClick={gerarContrato}>Confirmar e Gerar Contrato</Botao>
          </div>
        </Modal>
      )}
    </div>
  );
}
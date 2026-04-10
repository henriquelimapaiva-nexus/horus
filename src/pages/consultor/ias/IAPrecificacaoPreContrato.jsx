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
    forma_pagamento: "a_vista" // a_vista ou parcelado
  });
  
  // Formulário de precificação
  const [formData, setFormData] = useState({
    empresa_nome: "",
    setor: "",
    numero_funcionarios: "",
    faturamento_anual: "",
    numero_linhas: "1",
    problemas: [],
    urgencia: "normal",
    complexidade: "media",
    gestor_dedicado: "parcial",
    acesso_dados: "imediato",
    projeto_piloto: false,
    tem_viagem: false
  });

  // Opções para selects
  const setores = [
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
    setNegociacao({
      novo_valor: resultado?.precos.diagnostico || "",
      motivo: "",
      forma_pagamento: "a_vista"
    });
    setModalNegociacao(true);
  };

  const confirmarNegociacao = () => {
    setModalNegociacao(false);
    
    if (negociacao.forma_pagamento === "parcelado") {
      setModalParcelamento(true);
    } else {
      // Gerar contrato com valores negociados
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
        parcelas: resultado?.parcelamento
      });
      
      // Abrir contrato em nova janela
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
          value={negociacao.novo_valor}
          onChange={(e) => setNegociacao({...negociacao, novo_valor: e.target.value})}
        />
        
        <Input
          label="Motivo da negociação"
          as="textarea"
          rows={2}
          value={negociacao.motivo}
          onChange={(e) => setNegociacao({...negociacao, motivo: e.target.value})}
          placeholder="Ex: Cliente pediu desconto por ser primeiro projeto"
        />
        
        <Select
          label="Forma de pagamento"
          value={negociacao.forma_pagamento}
          onChange={(e) => setNegociacao({...negociacao, forma_pagamento: e.target.value})}
          options={[
            { value: "a_vista", label: "À vista (50% entrada + 50% entrega)" },
            { value: "parcelado", label: "Parcelado (50% entrada + parcelas mensais)" }
          ]}
        />
        
        <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Botao variant="outline" onClick={() => setModalNegociacao(false)}>Cancelar</Botao>
          <Botao onClick={confirmarNegociacao}>Confirmar Negociação</Botao>
        </div>
      </Modal>

      {/* Modal de Parcelamento */}
      {resultado && (
        <Modal isOpen={modalParcelamento} onClose={() => setModalParcelamento(false)} title="Parcelamento">
          <div style={{ marginBottom: "15px" }}>
            <p><strong>Valor do diagnóstico negociado:</strong> {formatarMoeda(parseFloat(negociacao.novo_valor))}</p>
          </div>
          
          <div style={{ backgroundColor: "#f0fdf4", padding: "15px", borderRadius: "8px", marginBottom: "15px" }}>
            <p><strong>Entrada (50%):</strong> {formatarMoeda(parseFloat(negociacao.novo_valor) * 0.5)}</p>
            <p><strong>Saldo a parcelar:</strong> {formatarMoeda(parseFloat(negociacao.novo_valor) * 0.5)}</p>
            <p><strong>Parcelas:</strong> {resultado.parcelamento.num_parcelas}x de {formatarMoeda(resultado.parcelamento.valor_parcela)}</p>
            <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>Máximo de 12 parcelas | Parcela máxima de R$ 5.000</p>
          </div>
          
          <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Botao variant="outline" onClick={() => setModalParcelamento(false)}>Cancelar</Botao>
            <Botao onClick={gerarContrato}>Gerar Contrato</Botao>
          </div>
        </Modal>
      )}
    </div>
  );
}
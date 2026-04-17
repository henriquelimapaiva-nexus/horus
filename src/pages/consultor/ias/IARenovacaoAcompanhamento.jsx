// src/pages/consultor/ias/IARenovacaoAcompanhamento.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import Botao from "../../../components/ui/Botao";
import Input from "../../../components/ui/Input";
import Card from "../../../components/ui/Card";
import Modal from "../../../components/ui/Modal";
import toast from "react-hot-toast";
import logo from "../../../assets/logo.png";

export default function IARenovacaoAcompanhamento() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const [carregandoContrato, setCarregandoContrato] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
  const [dadosContratoOriginal, setDadosContratoOriginal] = useState(null);
  
  const [modoContrato, setModoContrato] = useState(false);
  const [contratoHtml, setContratoHtml] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  
  const [formData, setFormData] = useState({
    meses: 3,
    forma_pagamento: "parcelado",
    valor_mensal: "",
    ganho_mensal_estimado: "",
    data_termino_contrato_original: ""
  });
  
  const [dadosContrato, setDadosContrato] = useState({
    representante: {
      nome: "",
      cargo: "",
      nacionalidade: "brasileira",
      estado_civil: "",
      profissao: "",
      rg: "",
      cpf: "",
      endereco: ""
    },
    contato: {
      email_contratante: "",
      email_contratada: "contato@nexusengenharia.com.br"
    }
  });

  useEffect(() => {
    carregarEmpresas();
  }, []);

  async function carregarEmpresas() {
    try {
      const res = await api.get("/companies");
      setEmpresas(res.data);
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      toast.error("Erro ao carregar empresas");
    }
  }

  const handleEmpresaChange = async (empresaId) => {
    const empresa = empresas.find(e => e.id === parseInt(empresaId));
    
    if (!empresaId) {
      setEmpresaSelecionada(null);
      setDadosContratoOriginal(null);
      return;
    }

    setEmpresaSelecionada(empresa);
    setCarregando(true);
    toast.loading('Buscando dados do contrato original...', { id: 'busca' });

    try {
      const response = await api.get(`/projeto/valores/${empresaId}`);
      const data = response.data;
      
      if (data.sucesso) {
        const dados = data.dados;
        setDadosContratoOriginal(dados);
        
        if (dados.valor_acompanhamento_mensal) {
          setFormData(prev => ({
            ...prev,
            valor_mensal: dados.valor_acompanhamento_mensal
          }));
        }
        
        toast.success('Dados carregados com sucesso!', { id: 'busca' });
      } else {
        toast.error(data.erro || 'Erro ao buscar dados', { id: 'busca' });
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados do contrato original', { id: 'busca' });
      setDadosContratoOriginal(null);
    } finally {
      setCarregando(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDadosContratoChange = (e) => {
    setDadosContrato({
      ...dadosContrato,
      representante: {
        ...dadosContrato.representante,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleContatoChange = (e) => {
    setDadosContrato({
      ...dadosContrato,
      contato: {
        ...dadosContrato.contato,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleGerarContrato = async () => {
    if (!formData.meses || formData.meses < 1 || formData.meses > 12) {
      toast.error("Número de meses deve ser entre 1 e 12");
      return;
    }

    if (!formData.valor_mensal || formData.valor_mensal <= 0) {
      toast.error("Valor mensal é obrigatório");
      return;
    }

    if (!formData.data_termino_contrato_original) {
      toast.error("Data de término do contrato original é obrigatória");
      return;
    }

    setCarregandoContrato(true);
    toast.loading('Gerando contrato de renovação...', { id: 'contrato' });

    try {
      const payload = {
        empresa: {
          nome: empresaSelecionada.nome,
          cnpj: empresaSelecionada.cnpj || "",
          endereco: empresaSelecionada.endereco || "",
          cidade: empresaSelecionada.cidade || "",
          estado: empresaSelecionada.estado || ""
        },
        representante: dadosContrato.representante,
        contato: dadosContrato.contato,
        meses: parseInt(formData.meses),
        valor_mensal: parseFloat(formData.valor_mensal),
        forma_pagamento: formData.forma_pagamento,
        ganho_mensal_estimado: formData.ganho_mensal_estimado ? parseFloat(formData.ganho_mensal_estimado) : null,
        data_termino_contrato_original: formData.data_termino_contrato_original
      };

      const response = await api.post('/ia/gerar-contrato-renovacao-acompanhamento', payload);
      
      toast.dismiss('contrato');
      toast.success('Contrato gerado com sucesso!');
      setMostrarModal(false);
      setContratoHtml(response.data.contrato);
      setModoContrato(true);

    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      toast.dismiss('contrato');
      toast.error('Erro ao gerar contrato');
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
          <Botao onClick={() => setModoContrato(false)}>← Voltar</Botao>
        </div>
        <div style={{ backgroundColor: "#ffffff", maxWidth: "1100px", margin: "0 auto", padding: "50px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <img src={logo} alt="Nexus" style={{ width: "180px", marginBottom: "15px" }} />
            <h1 style={{ color: "#1E3A8A", fontSize: "26px" }}>NEXUS ENGENHARIA APLICADA</h1>
            <p style={{ color: "#666" }}>CONTRATO DE PRORROGAÇÃO DE ACOMPANHAMENTO (FASE 3)</p>
          </div>
          <div dangerouslySetInnerHTML={{ __html: contratoHtml.replace(/\n/g, '<br>') }} />
          <div style={{ marginTop: "30px", textAlign: "center" }}>
            <Botao onClick={() => window.print()}>🖨️ Imprimir / Salvar PDF</Botao>
          </div>
        </div>
      </div>
    );
  }

  // RENDER PRINCIPAL
  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ color: "#1E3A8A", marginBottom: "10px" }}>Contrato de Prorrogação de Acompanhamento</h1>
        <p style={{ color: "#666" }}>Selecione uma empresa que já possui contrato de Diagnóstico (Fase 1) assinado.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        
        <Card titulo="📋 Dados da Empresa">
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Empresa *</label>
            <select
              value={empresaSelecionada?.id || ""}
              onChange={(e) => handleEmpresaChange(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
              disabled={carregando}
            >
              <option value="">Selecione uma empresa...</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nome}</option>
              ))}
            </select>
          </div>

          {dadosContratoOriginal && (
            <div style={{ backgroundColor: "#f9fafb", padding: "15px", borderRadius: "8px", marginTop: "15px" }}>
              <h4 style={{ marginBottom: "10px", color: "#1E3A8A" }}>📊 Dados do Contrato Original</h4>
              <p><strong>Total do Projeto:</strong> {formatarMoeda(dadosContratoOriginal.valor_total_projeto)}</p>
              <p><strong>Valor do Acompanhamento Mensal:</strong> {formatarMoeda(dadosContratoOriginal.valor_acompanhamento_mensal)}</p>
              <p><strong>Período de Acompanhamento:</strong> 3 meses</p>
              <p><strong>Status:</strong> {dadosContratoOriginal.status_fase1 || "Em andamento"}</p>
            </div>
          )}
        </Card>

        <Card titulo="💰 Renovação de Acompanhamento">
          {!empresaSelecionada ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}>
              <span style={{ fontSize: "48px" }}>📄</span>
              <p>Selecione uma empresa que já possui contrato de Diagnóstico (Fase 1) assinado.</p>
            </div>
          ) : (
            <Botao variant="primary" size="lg" onClick={() => setMostrarModal(true)} fullWidth>
              📝 Iniciar Renovação
            </Botao>
          )}
        </Card>
      </div>

      {/* Modal de Renovação */}
      <Modal isOpen={mostrarModal} onClose={() => setMostrarModal(false)} title="📝 Renovação de Acompanhamento">
        <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: "10px" }}>
          
          <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>⏱️ Período de Renovação</h3>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Data de término do contrato original *</label>
            <input
              type="date"
              name="data_termino_contrato_original"
              value={formData.data_termino_contrato_original}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Número de meses *</label>
            <select
              name="meses"
              value={formData.meses}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
            >
              <option value={1}>1 mês</option>
              <option value={2}>2 meses</option>
              <option value={3}>3 meses (5% desconto)</option>
              <option value={4}>4 meses</option>
              <option value={5}>5 meses</option>
              <option value={6}>6 meses (10% desconto)</option>
              <option value={7}>7 meses</option>
              <option value={8}>8 meses</option>
              <option value={9}>9 meses</option>
              <option value={10}>10 meses</option>
              <option value={11}>11 meses</option>
              <option value={12}>12 meses (15% desconto)</option>
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Valor mensal (R$) *</label>
            <input
              type="number"
              step="0.01"
              name="valor_mensal"
              value={formData.valor_mensal}
              onChange={handleChange}
              placeholder="Ex: 25569"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Forma de Pagamento</label>
            <select
              name="forma_pagamento"
              value={formData.forma_pagamento}
              onChange={handleChange}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
            >
              <option value="a_vista">À vista</option>
              <option value="parcelado">Parcelado</option>
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Ganho mensal estimado (R$) - opcional</label>
            <input
              type="number"
              step="0.01"
              name="ganho_mensal_estimado"
              value={formData.ganho_mensal_estimado}
              onChange={handleChange}
              placeholder="Ex: 50000"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>

          <hr style={{ margin: "20px 0" }} />

          <h3 style={{ color: "#1E3A8A", marginBottom: "15px" }}>👤 Dados do Representante</h3>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Nome Completo</label>
            <input
              type="text"
              name="nome"
              value={dadosContrato.representante.nome}
              onChange={handleDadosContratoChange}
              placeholder="Nome do representante legal"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Cargo</label>
            <input
              type="text"
              name="cargo"
              value={dadosContrato.representante.cargo}
              onChange={handleDadosContratoChange}
              placeholder="Ex: Diretor"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>RG</label>
              <input
                type="text"
                name="rg"
                value={dadosContrato.representante.rg}
                onChange={handleDadosContratoChange}
                placeholder="RG"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>CPF</label>
              <input
                type="text"
                name="cpf"
                value={dadosContrato.representante.cpf}
                onChange={handleDadosContratoChange}
                placeholder="CPF"
                style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>Endereço</label>
            <input
              type="text"
              name="endereco"
              value={dadosContrato.representante.endereco}
              onChange={handleDadosContratoChange}
              placeholder="Endereço residencial"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>

          <h3 style={{ color: "#1E3A8A", marginTop: "15px", marginBottom: "15px" }}>📧 Contato</h3>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>E-mail da CONTRATANTE</label>
            <input
              type="email"
              name="email_contratante"
              value={dadosContrato.contato.email_contratante}
              onChange={handleContatoChange}
              placeholder="contato@empresa.com.br"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: 500 }}>E-mail da CONTRATADA</label>
            <input
              type="email"
              name="email_contratada"
              value={dadosContrato.contato.email_contratada}
              onChange={handleContatoChange}
              placeholder="contato@nexusengenharia.com.br"
              style={{ width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid #ccc" }}
            />
          </div>
        </div>

        <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Botao variant="outline" onClick={() => setMostrarModal(false)}>Cancelar</Botao>
          <Botao onClick={handleGerarContrato} loading={carregandoContrato}>
            {carregandoContrato ? "Gerando..." : "✅ Gerar Contrato"}
          </Botao>
        </div>
      </Modal>
    </div>
  );
}
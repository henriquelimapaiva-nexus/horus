// src/pages/consultor/PropostaComercialPreContrato.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Botao from "../../components/ui/Botao";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";

export default function PropostaComercialPreContrato() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dados, setDados] = useState(null);

  useEffect(() => {
    // Pegar os dados enviados pela IA de precificação
    if (location.state?.dadosProposta) {
      setDados(location.state.dadosProposta);
    } else {
      // Tentar pegar do localStorage
      const salvos = localStorage.getItem("precoJustoProposta");
      if (salvos) {
        setDados(JSON.parse(salvos));
      }
    }
  }, [location]);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(valor || 0);
  };

  const handleGerarPDF = () => {
    // Função para gerar PDF (print da página)
    window.print();
  };

  const handleVoltar = () => {
    navigate("/consultor/ias/precificacao-pre-contrato");
  };

  if (!dados) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Nenhum dado de proposta encontrado.</p>
          <Botao onClick={handleVoltar}>Voltar para Precificação</Botao>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <Card titulo="📄 PROPOSTA COMERCIAL - NOVO CLIENTE">
        
        {/* Cabeçalho */}
        <div style={{ textAlign: "center", marginBottom: "30px", padding: "20px", background: "#f8fafc", borderRadius: "8px" }}>
          <h2 style={{ color: "#1E3A8A", marginBottom: "5px" }}>NEXUS ENGENHARIA APLICADA</h2>
          <p style={{ color: "#666" }}>Consultoria Industrial com Tecnologia Hórus</p>
          <p>{new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Empresa */}
        <div style={{ marginBottom: "25px" }}>
          <h3 style={{ borderBottom: "2px solid #1E3A8A", paddingBottom: "8px", marginBottom: "15px" }}>
            📌 Dados do Cliente
          </h3>
          <p><strong>Empresa:</strong> {dados.empresa}</p>
          <p><strong>Setor:</strong> {dados.setor || "Não informado"}</p>
          <p><strong>Linhas de produção:</strong> {dados.linhas || 1}</p>
        </div>

        {/* Diagnóstico */}
        <div style={{ marginBottom: "25px" }}>
          <h3 style={{ borderBottom: "2px solid #1E3A8A", paddingBottom: "8px", marginBottom: "15px" }}>
            🔍 Diagnóstico Preliminar
          </h3>
          <p><strong>Perda mensal estimada:</strong> {formatarMoeda(dados.perda_mensal)}</p>
          <p><strong>Potencial de redução:</strong> 15-25%</p>
          <p><strong>Ganho mensal projetado:</strong> {formatarMoeda(dados.ganho_mensal)}</p>
          <p><strong>Ganho anual projetado:</strong> {formatarMoeda(dados.ganho_mensal * 12)}</p>
        </div>

        {/* Investimento */}
        <div style={{ marginBottom: "25px", background: "#f0fdf4", padding: "20px", borderRadius: "8px" }}>
          <h3 style={{ color: "#166534", marginBottom: "15px" }}>💰 Investimento</h3>
          <p style={{ fontSize: "28px", fontWeight: "bold", color: "#166534" }}>
            {formatarMoeda(dados.honorarios)}
          </p>
          <p><strong>Forma de pagamento:</strong> 30% na assinatura, 40% na entrega do diagnóstico, 30% na conclusão</p>
        </div>

        {/* Retorno */}
        <div style={{ marginBottom: "25px" }}>
          <h3 style={{ borderBottom: "2px solid #1E3A8A", paddingBottom: "8px", marginBottom: "15px" }}>
            📊 Retorno sobre o Investimento
          </h3>
          <p><strong>ROI projetado:</strong> {dados.roi}% no primeiro ano</p>
          <p><strong>Payback:</strong> {dados.payback} meses</p>
          <p><strong>Sua empresa fica com:</strong> 85% do benefício gerado</p>
        </div>

        {/* Escopo */}
        <div style={{ marginBottom: "25px" }}>
          <h3 style={{ borderBottom: "2px solid #1E3A8A", paddingBottom: "8px", marginBottom: "15px" }}>
            📋 Escopo do Projeto
          </h3>
          <ul style={{ marginLeft: "20px" }}>
            <li>Fase 1: Diagnóstico completo (2-3 semanas)</li>
            <li>Fase 2: Implementação das melhorias (2-3 meses)</li>
            <li>Fase 3: Acompanhamento e sustentação (1-2 meses)</li>
            <li>Monitoramento contínuo via Plataforma Hórus</li>
            <li>Relatórios executivos e técnicos</li>
          </ul>
        </div>

        {/* Próximos Passos */}
        <div style={{ marginBottom: "25px" }}>
          <h3 style={{ borderBottom: "2px solid #1E3A8A", paddingBottom: "8px", marginBottom: "15px" }}>
            🎯 Próximos Passos
          </h3>
          <ol style={{ marginLeft: "20px" }}>
            <li>Assinar contrato e dar início ao diagnóstico</li>
            <li>Coletar dados reais com a plataforma Hórus</li>
            <li>Implementar melhorias e acompanhar resultados</li>
            <li>Validar ROI real vs. projetado</li>
          </ol>
        </div>

        {/* Validade */}
        <div style={{ marginTop: "30px", textAlign: "center", fontSize: "12px", color: "#666", borderTop: "1px solid #ddd", paddingTop: "20px" }}>
          <p>Esta proposta é válida por 15 dias.</p>
          <p>Proposta gerada automaticamente pela IA de Precificação Hórus.</p>
        </div>

        {/* Botões */}
        <div style={{ display: "flex", gap: "15px", marginTop: "30px", justifyContent: "center" }}>
          <Botao variant="primary" onClick={handleGerarPDF}>
            🖨️ Imprimir / Salvar PDF
          </Botao>
          <Botao variant="secondary" onClick={handleVoltar}>
            ↩️ Voltar
          </Botao>
        </div>
      </Card>
    </div>
  );
}
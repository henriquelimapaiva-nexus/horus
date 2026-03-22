// src/pages/consultor/PropostaComercialPreContrato.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Botao from "../../components/ui/Botao";
import Card from "../../components/ui/Card";
import logo from "../../assets/logo.png";

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
    window.print();
  };

  const handleVoltar = () => {
    navigate("/consultor/ias/precificacao-pre-contrato");
  };

  if (!dados) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Card>
          <p>Nenhum dado de proposta encontrado.</p>
          <Botao onClick={handleVoltar}>Voltar para Precificação</Botao>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1000px", margin: "0 auto" }}>
      <div className="relatorio-print" style={{ 
        backgroundColor: "white", 
        padding: "40px", 
        borderRadius: "8px", 
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        position: "relative"
      }}>
        
        {/* Marca d'água */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) rotate(-45deg)",
          opacity: 0.03,
          fontSize: "60px",
          color: "#1E3A8A",
          pointerEvents: "none",
          zIndex: 0,
          whiteSpace: "nowrap",
          fontWeight: "bold"
        }}>
          NEXUS
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          
          {/* Cabeçalho */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <img src={logo} alt="Nexus" style={{ width: "150px", marginBottom: "10px" }} />
            <h2 style={{ color: "#1E3A8A", margin: "0 0 5px 0" }}>
              NEXUS ENGENHARIA APLICADA
            </h2>
            <h1 style={{ color: "#1E3A8A", margin: "5px 0", fontSize: "24px" }}>
              PROPOSTA COMERCIAL
            </h1>
            <p style={{ color: "#666" }}>
              Data: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          {/* Empresa */}
          <div style={{ marginBottom: "30px" }}>
            <h2 style={{ color: "#1E3A8A", fontSize: "18px", marginBottom: "10px" }}>
              Para: {dados.empresa}
            </h2>
          </div>

          {/* Diagnóstico */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "15px" }}>
              1. DIAGNÓSTICO PRELIMINAR
            </h3>
            <div style={{ backgroundColor: "#f9fafb", padding: "20px", borderRadius: "4px" }}>
              <p><strong>📊 Perda mensal estimada:</strong> {formatarMoeda(dados.perda_mensal)}</p>
              <p><strong>📈 Ganho mensal projetado:</strong> {formatarMoeda(dados.ganho_mensal)}</p>
              <p><strong>🎯 Potencial de redução:</strong> 15-25%</p>
              <p><strong>🏭 Linhas de produção:</strong> {dados.linhas || 1}</p>
              <p><strong>🔧 Setor:</strong> {dados.setor || "Não informado"}</p>
            </div>
          </div>

          {/* Investimento */}
          <div style={{ marginBottom: "30px", backgroundColor: "#f0fdf4", padding: "20px", borderRadius: "8px" }}>
            <h3 style={{ color: "#166534", marginBottom: "15px" }}>💰 INVESTIMENTO</h3>
            <p style={{ fontSize: "28px", fontWeight: "bold", color: "#166534" }}>
              {formatarMoeda(dados.honorarios)}
            </p>
            <p><strong>Forma de pagamento:</strong> 30% na assinatura, 40% na entrega do diagnóstico, 30% na conclusão</p>
          </div>

          {/* Retorno */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "15px" }}>
              2. RETORNO SOBRE INVESTIMENTO
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", textAlign: "center" }}>
              <div style={{ backgroundColor: "#f9fafb", padding: "15px", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", color: "#666" }}>ROI</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E3A8A" }}>{dados.roi}%</div>
              </div>
              <div style={{ backgroundColor: "#f9fafb", padding: "15px", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", color: "#666" }}>Payback</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E3A8A" }}>{dados.payback} meses</div>
              </div>
              <div style={{ backgroundColor: "#f9fafb", padding: "15px", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", color: "#666" }}>Cliente Fica com</div>
                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1E3A8A" }}>85%</div>
              </div>
            </div>
          </div>

          {/* Escopo */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "15px" }}>
              3. ESCOPO DO PROJETO
            </h3>
            <ul style={{ marginLeft: "20px", lineHeight: "1.8" }}>
              <li>Fase 1: Diagnóstico completo (2-3 semanas)</li>
              <li>Fase 2: Implementação das melhorias (2-3 meses)</li>
              <li>Fase 3: Acompanhamento e sustentação (1-2 meses)</li>
              <li>Monitoramento contínuo via Plataforma Hórus</li>
              <li>Relatórios executivos e técnicos</li>
            </ul>
          </div>

          {/* Próximos Passos */}
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ color: "#1E3A8A", borderBottom: "2px solid #1E3A8A", paddingBottom: "5px", marginBottom: "15px" }}>
              4. PRÓXIMOS PASSOS
            </h3>
            <ol style={{ marginLeft: "20px", lineHeight: "1.8" }}>
              <li>Assinar contrato e dar início ao diagnóstico</li>
              <li>Coletar dados reais com a plataforma Hórus</li>
              <li>Implementar melhorias e acompanhar resultados</li>
              <li>Validar ROI real vs. projetado</li>
            </ol>
          </div>

          {/* Assinatura */}
          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <p>____________________________________</p>
            <p><strong>Eng. [Seu Nome]</strong></p>
            <p style={{ color: "#666", fontSize: "12px" }}>Consultor - Nexus Engenharia Aplicada</p>
          </div>

          {/* Validade */}
          <div style={{ marginTop: "30px", textAlign: "center", fontSize: "12px", color: "#999", borderTop: "1px solid #eee", paddingTop: "20px" }}>
            <p>Proposta válida por 15 dias</p>
            <p>Gerada automaticamente pela IA de Precificação Hórus</p>
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
        </div>
      </div>
    </div>
  );
}
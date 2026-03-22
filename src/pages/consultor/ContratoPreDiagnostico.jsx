// src/pages/consultor/ContratoPreDiagnostico.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Botao from "../../components/ui/Botao";
import Card from "../../components/ui/Card";
import logo from "../../assets/logo.png";
import toast from 'react-hot-toast';

export default function ContratoPreDiagnostico() {
  const location = useLocation();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const dados = location.state?.contratoData;
    
    if (dados) {
      setContrato(dados.contrato);
    } else {
      toast.error("Nenhum contrato encontrado. Gere um contrato primeiro.");
      navigate("/consultor/ias/precificacao-pre-contrato");
    }
  }, [location, navigate]);

  const handleImprimir = () => {
    window.print();
  };

  const handleVoltar = () => {
    navigate("/consultor/ias/precificacao-pre-contrato");
  };

  // Função para formatar o contrato em HTML
  const formatarContratoHTML = (texto) => {
    if (!texto) return "";
    
    // Quebrar em parágrafos e preservar formatação
    return texto
      .split('\n')
      .map(line => {
        if (line.trim().startsWith('CLÁUSULA') || line.trim().startsWith('ANEXO')) {
          return `<h3 style="margin-top: 20px; margin-bottom: 10px; color: #1E3A8A;">${line}</h3>`;
        } else if (line.trim().startsWith('CONTRATANTE:') || line.trim().startsWith('CONTRATADA:')) {
          return `<p style="margin-bottom: 15px;"><strong>${line.split(':')[0]}:</strong> ${line.split(':').slice(1).join(':')}</p>`;
        } else if (line.trim() === '') {
          return '<br/>';
        } else {
          return `<p style="margin: 5px 0; line-height: 1.5;">${line}</p>`;
        }
      })
      .join('');
  };

  if (!contrato) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Card>
          <p>Carregando contrato...</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1100px", margin: "0 auto" }}>
      
      {/* Botões de ação (não aparecem na impressão) */}
      <div className="no-print" style={{ 
        display: "flex", 
        gap: "15px", 
        justifyContent: "center", 
        marginBottom: "20px",
        position: "sticky",
        top: "10px",
        zIndex: 100
      }}>
        <Botao variant="primary" onClick={handleImprimir}>
          🖨️ Imprimir / Salvar PDF
        </Botao>
        <Botao variant="secondary" onClick={handleVoltar}>
          ↩️ Voltar
        </Botao>
      </div>

      {/* Conteúdo do contrato com cabeçalho estilizado */}
      <div className="contrato-content" style={{
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "12pt",
        lineHeight: "1.5"
      }}>
        
        {/* CABEÇALHO COM LOGO */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <img 
            src={logo} 
            alt="Nexus Engenharia Aplicada" 
            style={{ width: "120px", marginBottom: "10px" }}
          />
          <h1 style={{ 
            fontSize: "18pt", 
            fontWeight: "bold", 
            margin: "5px 0",
            color: "#1E3A8A"
          }}>
            NEXUS ENGENHARIA APLICADA
          </h1>
          <div style={{ 
            borderBottom: "2px solid #1E3A8A", 
            width: "80%", 
            margin: "10px auto" 
          }}></div>
        </div>

        {/* CORPO DO CONTRATO */}
        <div dangerouslySetInnerHTML={{ __html: formatarContratoHTML(contrato) }} />
        
      </div>

      {/* Estilos para impressão */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .contrato-content {
            padding: 0 !important;
            box-shadow: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          img {
            max-width: 100px !important;
          }
        }
      `}</style>
    </div>
  );
}
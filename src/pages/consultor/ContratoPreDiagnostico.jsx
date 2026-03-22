// src/pages/consultor/ContratoPreDiagnostico.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Botao from "../../components/ui/Botao";
import Card from "../../components/ui/Card";
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

      {/* Conteúdo do contrato */}
      <div className="contrato-content" style={{
        backgroundColor: "white",
        padding: "40px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "12pt",
        lineHeight: "1.5",
        whiteSpace: "pre-line"
      }}>
        <pre style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "12pt",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          margin: 0,
          background: "white",
          border: "none"
        }}>
          {contrato}
        </pre>
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
        }
      `}</style>
    </div>
  );
}
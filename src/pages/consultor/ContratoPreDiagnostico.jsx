import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Botao from "../../components/ui/Botao";
import logo from "../../assets/logo.png";
import toast from 'react-hot-toast';

export default function ContratoPreDiagnostico() {
  const location = useLocation();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState(null);

  useEffect(() => {
    const dados = location.state?.contratoData;
    if (dados && dados.contrato) {
      setContrato(dados.contrato);
    } else {
      toast.error("Nenhum contrato encontrado");
      navigate("/consultor/ias/precificacao-pre-contrato");
    }
  }, [location, navigate]);

  const handleImprimir = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Contrato Nexus</title>
        <style>
          body { margin: 2cm; font-family: 'Times New Roman'; font-size: 12pt; line-height: 1.4; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { width: 100px; margin-bottom: 10px; }
          .empresa-nome { font-size: 18pt; font-weight: bold; color: #1E3A8A; margin: 5px 0; }
          .linha { border-bottom: 2px solid #1E3A8A; width: 80%; margin: 10px auto; }
          pre { white-space: pre-wrap; font-family: 'Times New Roman'; font-size: 12pt; margin: 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logo}" class="logo" />
          <div class="empresa-nome">NEXUS ENGENHARIA APLICADA</div>
          <div class="linha"></div>
        </div>
        <pre>${contrato}</pre>
      </body>
      </html>
    `);
    doc.close();
    
    iframe.contentWindow.onload = () => {
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  if (!contrato) return null;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
        <Botao onClick={handleImprimir}>🖨️ Imprimir Contrato</Botao>
        <Botao onClick={() => navigate(-1)}>↩️ Voltar</Botao>
      </div>
      <div style={{
        background: 'white',
        padding: 40,
        borderRadius: 8,
        fontFamily: 'Times New Roman',
        fontSize: 12,
        whiteSpace: 'pre-wrap'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <img src={logo} style={{ width: 100, marginBottom: 10 }} />
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1E3A8A' }}>NEXUS ENGENHARIA APLICADA</div>
          <div style={{ borderBottom: '2px solid #1E3A8A', width: '80%', margin: '10px auto' }}></div>
        </div>
        {contrato}
      </div>
    </div>
  );
}
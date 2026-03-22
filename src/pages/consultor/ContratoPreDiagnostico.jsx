import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Botao from "../../components/ui/Botao";
import logo from "../../assets/logo.png";
import api from "../../api/api";
import toast from 'react-hot-toast';

export default function ContratoPreDiagnostico() {
  const location = useLocation();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    const dados = location.state?.contratoData;
    if (dados && dados.contrato) {
      setContrato(dados.contrato);
    } else {
      toast.error("Nenhum contrato encontrado");
      navigate("/consultor/ias/precificacao-pre-contrato");
    }
  }, [location, navigate]);

  const handleDownload = async () => {
    if (!contrato) return;
    setCarregando(true);
    toast.loading("Gerando PDF...", { id: "pdf" });

    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Contrato Nexus</title>
          <style>
            body {
              margin: 2cm;
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              width: 100px;
              margin-bottom: 10px;
            }
            .empresa-nome {
              font-size: 18pt;
              font-weight: bold;
              margin: 5px 0;
              color: #1E3A8A;
            }
            .linha {
              border-bottom: 2px solid #1E3A8A;
              width: 80%;
              margin: 10px auto;
            }
            pre {
              white-space: pre-wrap;
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
            }
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
      `;

      const res = await api.post('/ia/gerar-contrato-pdf', { contratoHtml: html }, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contrato.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF gerado!", { id: "pdf" });
    } catch (err) {
      toast.error("Erro ao gerar PDF", { id: "pdf" });
    } finally {
      setCarregando(false);
    }
  };

  if (!contrato) return null;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
        <Botao onClick={handleDownload} loading={carregando}>📄 Baixar PDF</Botao>
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
        {contrato}
      </div>
    </div>
  );
}
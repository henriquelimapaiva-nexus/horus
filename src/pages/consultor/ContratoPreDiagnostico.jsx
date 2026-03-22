import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Botao from "../../components/ui/Botao";
import Card from "../../components/ui/Card";
import logo from "../../assets/logo.png";
import api from "../../api/api";
import toast from 'react-hot-toast';

export default function ContratoPreDiagnostico() {
  const location = useLocation();
  const navigate = useNavigate();
  const [contratoTexto, setContratoTexto] = useState(null);
  const [carregandoPdf, setCarregandoPdf] = useState(false);

  useEffect(() => {
    const dados = location.state?.contratoData;
    
    if (dados && dados.contrato) {
      // CORREÇÃO: Uso de construtor de RegExp para evitar erro "Unterminated regular expression"
      const regexLimpeza = new RegExp("\\", "g");
      const textoLimpo = dados.contrato.replace(regexLimpeza, "");
      setContratoTexto(textoLimpo);
    } else {
      toast.error("Nenhum contrato encontrado.");
      navigate("/consultor/ias/precificacao-pre-contrato");
    }
  }, [location, navigate]);

  // Função para injetar semântica de contrato no HTML do PDF
  const formatarParaHtml = (texto) => {
    return texto.split('\n').map((linha) => {
      const t = linha.trim();
      if (!t) return '<br/>';
      
      // Identifica Cláusulas e Anexos para estilização de destaque
      if (t.startsWith('CLÁUSULA') || t.startsWith('ANEXO')) {
        return `<h3 style="margin-top: 25px; color: #1E3A8A; text-transform: uppercase; border-bottom: 1px solid #eee; font-family: serif;">${t}</h3>`;
      }
      
      // Destaque para o valor do contrato (R$ 70.000,00)
      if (t.includes('70.000')) {
        return `<p style="background: #f1f5f9; padding: 8px; border-left: 4px solid #1E3A8A;"><strong>${t}</strong></p>`;
      }

      return `<p style="margin: 8px 0; text-align: justify; font-family: serif;">${t}</p>`;
    }).join('');
  };

  const handleBaixarPDF = async () => {
    if (!contratoTexto) return;

    setCarregandoPdf(true);
    const toastId = toast.loading("Gerando PDF oficial...");

    try {
      const htmlCompleto = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page { size: A4; margin: 2.5cm; }
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000; background: white; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1E3A8A; padding-bottom: 10px; }
            .logo { width: 140px; margin-bottom: 5px; }
            .title { text-align: center; font-weight: bold; text-transform: uppercase; margin: 20px 0; font-size: 14pt; }
            h3 { color: #1E3A8A; font-size: 12pt; margin-top: 20px; }
            p { margin: 10px 0; text-align: justify; }
            .footer-sig { margin-top: 60px; width: 100%; }
            .sig-box { width: 45%; border-top: 1px solid #000; text-align: center; display: inline-block; margin: 40px 2%; vertical-align: top; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logo}" class="logo" />
            <div style="font-size: 18pt; font-weight: bold; color: #1E3A8A;">NEXUS ENGENHARIA APLICADA</div>
          </div>
          <div class="title">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CONSULTORIA<br/>FASE 1 (DIAGNÓSTICO)</div>
          
          ${formatarParaHtml(contratoTexto)}

          <div class="footer-sig">
            <div class="sig-box">
              <strong>CONTRATANTE</strong><br/>
              Metalúrgica ABC
            </div>
            <div class="sig-box">
              <strong>CONTRATADA</strong><br/>
              NEXUS ENGENHARIA APLICADA
            </div>
          </div>
        </body>
        </html>
      `;

      const response = await api.post('/ia/gerar-contrato-pdf', 
        { contratoHtml: htmlCompleto }, 
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Contrato_Nexus_Fase1_${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Contrato pronto para impressão!", { id: toastId });
    } catch (error) {
      console.error("Erro PDF:", error);
      toast.error("Erro ao processar PDF industrial.", { id: toastId });
    } finally {
      setCarregandoPdf(false);
    }
  };

  if (!contratoTexto) return <div style={{padding: "50px", textAlign: "center"}}>Aguardando dados...</div>;

  return (
    <div style={{ padding: "40px 20px", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      
      {/* Painel de Ações Interno */}
      <div style={{ display: "flex", gap: "15px", justifyContent: "center", marginBottom: "30px" }} className="no-print">
        <Botao variant="primary" onClick={handleBaixarPDF} loading={carregandoPdf}>
          📄 Baixar PDF Profissional
        </Botao>
        <Botao variant="secondary" onClick={() => navigate(-1)}>
          ↩️ Voltar e Ajustar
        </Botao>
      </div>

      {/* Preview do Contrato - Formato A4 Simulado */}
      <Card style={{ 
        maxWidth: "210mm", 
        margin: "0 auto", 
        padding: "2.5cm", 
        backgroundColor: "white", 
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        minHeight: "297mm"
      }}>
        <div style={{ textAlign: "center", borderBottom: "2px solid #1E3A8A", paddingBottom: "20px", marginBottom: "40px" }}>
          <img src={logo} style={{ width: "120px" }} alt="Nexus Logo" />
          <h1 style={{ color: "#1E3A8A", fontSize: "22pt", margin: "10px 0", fontFamily: "serif" }}>
            NEXUS ENGENHARIA APLICADA
          </h1>
        </div>

        <div style={{ 
          whiteSpace: "pre-line", 
          fontFamily: "'Times New Roman', Times, serif", 
          fontSize: "12pt", 
          lineHeight: "1.6", 
          color: "#1a1a1a",
          textAlign: "justify" 
        }}>
          {contratoTexto}
        </div>

        {/* Rodapé de Assinaturas no Preview */}
        <div style={{ marginTop: "80px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ width: "40%", borderTop: "1px solid #000", textAlign: "center", paddingTop: "10px" }}>
            <span style={{ fontSize: "10pt", fontWeight: "bold" }}>CONTRATANTE</span>
          </div>
          <div style={{ width: "40%", borderTop: "1px solid #000", textAlign: "center", paddingTop: "10px" }}>
            <span style={{ fontSize: "10pt", fontWeight: "bold" }}>CONTRATADA</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
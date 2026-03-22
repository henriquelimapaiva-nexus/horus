import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Botao from "../../components/ui/Botao";
import logo from "../../assets/logo.png"; // Certifique-se que o caminho está correto
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

  // Função para converter imagem em Base64 para garantir que o PDF a renderize
  const getBase64Logo = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return url; // Fallback para a URL original
    }
  };

  const handleImprimir = async () => {
    if (!contrato) return;
    setCarregando(true);
    const toastId = toast.loading("Gerando PDF oficial...");

    try {
      const logoBase64 = await getBase64Logo(logo);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page { size: A4; margin: 2cm; }
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { width: 120px; height: auto; margin-bottom: 10px; }
            .empresa-nome { font-size: 20pt; font-weight: bold; color: #1E3A8A; text-transform: uppercase; margin: 0; }
            .divisor { border-top: 2px solid #1E3A8A; width: 100%; margin: 15px auto; }
            .conteudo { white-space: pre-wrap; text-align: justify; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoBase64}" class="logo" />
            <h1 class="empresa-nome">NEXUS ENGENHARIA APLICADA</h1>
            <div class="divisor"></div>
          </div>
          <div class="conteudo">${contrato}</div>
        </body>
        </html>
      `;

      // Chamada para o seu backend que já está "perfeito"
      const res = await api.post('/ia/gerar-contrato-pdf', { contratoHtml: html }, { responseType: 'blob' });
      
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL);
      
      toast.success("PDF Gerado!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Erro na geração do documento", { id: toastId });
    } finally {
      setCarregando(false);
    }
  };

  if (!contrato) return null;

  return (
    <div style={{ padding: "40px 20px", backgroundColor: "#f4f4f4", minHeight: "100vh" }}>
      <div style={{ display: 'flex', gap: 15, justifyContent: 'center', marginBottom: 30 }}>
        <Botao onClick={handleImprimir} loading={carregando}>🖨️ Gerar PDF Profissional</Botao>
        <Botao onClick={() => navigate(-1)} variant="secundario">↩️ Voltar</Botao>
      </div>

      {/* Preview do Contrato - O que você vê aqui é o que vai para o papel */}
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        background: "white",
        padding: "2cm",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        borderRadius: "4px",
        fontFamily: "'Times New Roman', serif"
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src={logo} alt="Logo Nexus" style={{ width: 100, marginBottom: 10 }} />
          <h2 style={{ margin: 0, color: "#1E3A8A", fontSize: "24pt", fontWeight: "bold" }}>NEXUS ENGENHARIA APLICADA</h2>
          <hr style={{ border: "none", borderTop: "2px solid #1E3A8A", marginTop: 15 }} />
        </div>
        
        <div style={{ 
          fontSize: "12pt", 
          lineHeight: 1.5, 
          whiteSpace: "pre-wrap", 
          textAlign: "justify",
          color: "#333" 
        }}>
          {contrato}
        </div>
      </div>
    </div>
  );
}
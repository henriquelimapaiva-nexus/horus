import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Botao from "../../components/ui/Botao";
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

  const handleAbrirImpressao = async () => {
    if (!contrato) return;
    setCarregando(true);
    const toastId = toast.loading("Preparando documento para impressão...");

    try {
      // Envia APENAS o texto do contrato (sem cabeçalho)
      const html = `<pre style="white-space:pre-wrap;">${contrato}</pre>`;

      const res = await api.post('/ia/gerar-contrato-pdf', { contratoHtml: html }, { responseType: 'blob' });
      
      const file = new Blob([res.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);

      const printWindow = window.open(fileURL, '_blank');
      if (printWindow) {
        printWindow.focus();
        toast.success("Documento aberto para impressão!", { id: toastId });
      } else {
        toast.error("Por favor, habilite pop-ups para imprimir.", { id: toastId });
      }

    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar impressão", { id: toastId });
    } finally {
      setCarregando(false);
    }
  };

  if (!contrato) return null;

  return (
    <div style={{ padding: "40px 20px", backgroundColor: "#f4f4f4", minHeight: "100vh" }}>
      <div style={{ display: 'flex', gap: 15, justifyContent: 'center', marginBottom: 30 }}>
        <Botao onClick={handleAbrirImpressao} loading={carregando}>
          🖨️ Abrir para Impressão
        </Botao>
        <Botao onClick={() => navigate(-1)} variant="secundario">
          ↩️ Voltar
        </Botao>
      </div>

      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        background: "white",
        padding: "2cm",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        borderRadius: "4px",
        fontFamily: "'Times New Roman', serif"
      }}>
        <div style={{ fontSize: "12pt", lineHeight: 1.5, whiteSpace: "pre-wrap", textAlign: "justify", color: "#333" }}>
          {contrato}
        </div>
      </div>
    </div>
  );
}
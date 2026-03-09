// src/components/ia/PropostaIA.jsx
import { useState } from 'react';
import Botao from '../ui/Botao';
import Card from '../ui/Card';
import { gerarPropostaComIA } from '../../services/iaService';
import toast from 'react-hot-toast';

export default function PropostaIA({ dadosProposta, onTextoGerado }) {
  const [carregando, setCarregando] = useState(false);
  const [textoGerado, setTextoGerado] = useState('');
  const [modalAberto, setModalAberto] = useState(false);

  const handleGerar = async () => {
    if (!dadosProposta) {
      toast.error('Nenhuma proposta para gerar');
      return;
    }

    setCarregando(true);
    const toastId = toast.loading('🤖 IA gerando proposta...');

    try {
      const texto = await gerarPropostaComIA(dadosProposta);
      setTextoGerado(texto);
      setModalAberto(true);
      
      if (onTextoGerado) {
        onTextoGerado(texto);
      }
      
      toast.dismiss(toastId);
      toast.success('Proposta gerada com sucesso!');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Erro ao gerar proposta com IA');
    } finally {
      setCarregando(false);
    }
  };

  const copiarTexto = () => {
    navigator.clipboard.writeText(textoGerado);
    toast.success('Texto copiado!');
  };

  return (
    <>
      <Botao
        variant="primary"
        size="md"
        onClick={handleGerar}
        disabled={carregando}
        loading={carregando}
        style={{
          backgroundColor: "#7c3aed",
          color: "white"
        }}
      >
        {carregando ? 'Gerando...' : '✨ Gerar proposta com IA'}
      </Botao>

      {/* Modal com o texto gerado */}
      {modalAberto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <Card style={{ maxWidth: '800px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
            <h2 style={{ color: '#1E3A8A', marginBottom: '20px' }}>
              ✨ Proposta Gerada pela IA
            </h2>
            
            <div style={{
              whiteSpace: 'pre-line',
              lineHeight: '1.6',
              fontSize: '14px',
              backgroundColor: '#f9fafb',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              {textoGerado.replace(/\*\*/g, '').replace(/\*/g, '')}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Botao
                variant="secondary"
                onClick={() => setModalAberto(false)}
              >
                Fechar
              </Botao>
              <Botao
                variant="primary"
                onClick={copiarTexto}
              >
                Copiar texto
              </Botao>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
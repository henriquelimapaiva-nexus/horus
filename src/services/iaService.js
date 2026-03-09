// src/services/iaService.js
import api from '../api/api';

/**
 * Gera uma proposta comercial usando IA
 * @param {Object} dadosProposta - Dados da proposta gerada
 * @returns {Promise<string>} - Texto da proposta gerado pela IA
 */
export async function gerarPropostaComIA(dadosProposta) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:3001/api/ia/gerar-proposta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify({ dadosProposta })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.erro || 'Erro ao gerar proposta');
    }

    return data.proposta;
  } catch (error) {
    console.error('Erro no serviço de IA:', error);
    throw error;
  }
}
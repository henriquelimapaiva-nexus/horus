// src/services/iaService.js
import api from '../api/api';

/**
 * Gera uma proposta comercial usando IA
 * @param {Object} dadosProposta - Dados da proposta gerada
 * @returns {Promise<string>} - Texto da proposta gerado pela IA
 */
export async function gerarPropostaComIA(dadosProposta) {
  try {
    // ✅ USA O API.JS QUE JÁ TEM A URL CORRETA
    const response = await api.post('/api/ia/gerar-proposta', { dadosProposta });
    return response.data.proposta;
  } catch (error) {
    console.error('Erro no serviço de IA:', error);
    throw error;
  }
}
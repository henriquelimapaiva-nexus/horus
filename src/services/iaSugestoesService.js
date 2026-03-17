// src/services/iaSugestoesService.js
import api from '../api/api';

export async function gerarSugestoes(empresaId) {
  try {
    // ✅ CORRIGIDO: usando api.js em vez de fetch
    // ✅ O api.js já adiciona o token automaticamente via interceptor
    // ✅ A baseURL já está configurada em api.js
    
    const response = await api.get(`/ia/sugestoes/${empresaId}`);
    
    return response.data.sugestoes;
  } catch (error) {
    console.error('Erro no serviço de sugestões:', error);
    
    // ✅ Se quiser manter dados simulados como fallback
    if (error.response?.status === 404) {
      console.log('Endpoint não encontrado, retornando dados simulados');
      return {
        resumo: "Análise baseada em dados simulados. Configure o endpoint /ia/sugestoes no backend.",
        acoes: [
          {
            titulo: "Redução de Setup",
            descricao: "Implementar SMED nos principais gargalos",
            prioridade: "alta",
            ganho: "R$ 15.000/mês",
            esforco: "2 semanas",
            investimento: "R$ 8.000"
          }
        ],
        projecoes: {
          novoOEE: "78%",
          ganhoMensal: "R$ 25.000",
          tempoEstimado: "3 meses"
        }
      };
    }
    
    throw error;
  }
}
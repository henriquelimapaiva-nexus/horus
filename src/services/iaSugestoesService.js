// src/services/iaSugestoesService.js
import api from '../api/api';

export async function gerarSugestoes(empresaId) {
  try {
    const token = localStorage.getItem('token');
    
    // 🟢 URL FIXA DEFINITIVA - NÃO DEPENDE DE VARIÁVEL DE AMBIENTE
    const API_URL = 'https://horus-backend-gzcp.onrender.com';
    
    const response = await fetch(`${API_URL}/api/ia/sugestoes/${empresaId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.erro || 'Erro ao gerar sugestões');
    }

    return data.sugestoes;
  } catch (error) {
    console.error('Erro no serviço de sugestões:', error);
    throw error;
  }
}
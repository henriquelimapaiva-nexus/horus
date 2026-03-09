// src/services/iaSugestoesService.js
import api from '../api/api';

export async function gerarSugestoes(empresaId) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`http://localhost:3001/api/ia/sugestoes/${empresaId}`, {
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
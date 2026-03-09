// src/services/checklistService.js
import api from '../api/api';

export async function criarProjeto(dados) {
  try {
    // ✅ CORRIGIDO: adicionado /api/
    const response = await api.post('/api/checklist/projeto', dados);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    throw error;
  }
}

export async function listarProjetos(empresaId) {
  try {
    // ✅ CORRIGIDO: adicionado /api/
    const response = await api.get(`/api/checklist/projetos/${empresaId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao listar projetos:', error);
    throw error;
  }
}

export async function buscarProjeto(projetoId) {
  try {
    // ✅ CORRIGIDO: adicionado /api/
    const response = await api.get(`/api/checklist/projeto/${projetoId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    throw error;
  }
}

export async function adicionarItem(dados) {
  try {
    // ✅ CORRIGIDO: adicionado /api/
    const response = await api.post('/api/checklist/item', dados);
    return response.data;
  } catch (error) {
    console.error('Erro ao adicionar item:', error);
    throw error;
  }
}

export async function atualizarItem(itemId, dados) {
  try {
    // ✅ CORRIGIDO: adicionado /api/
    const response = await api.put(`/api/checklist/item/${itemId}`, dados);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    throw error;
  }
}

export async function atualizarFase(faseId, dados) {
  try {
    // ✅ CORRIGIDO: adicionado /api/
    const response = await api.put(`/api/checklist/fase/${faseId}`, dados);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar fase:', error);
    throw error;
  }
}
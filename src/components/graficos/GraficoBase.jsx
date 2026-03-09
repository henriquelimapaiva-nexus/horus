// src/components/graficos/GraficoBase.jsx
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';

// Registrar todos os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Cores padrão da Nexus
export const coresNexus = {
  primary: '#1E3A8A',
  secondary: '#2563eb',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  info: '#6b7280',
  azulClaro: '#3b82f6',
  azulEscuro: '#1e3a8a',
  verde: '#10b981',
  amarelo: '#fbbf24',
  vermelho: '#ef4444'
};

// Configurações padrão
export const opcoesPadrao = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: {
          family: 'Arial, sans-serif',
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: '#1E3A8A',
      titleColor: 'white',
      bodyColor: 'white',
      borderColor: '#1E3A8A',
      borderWidth: 1
    }
  }
};

// Função para formatar valores como percentual
export const formatarPercentual = (valor) => {
  return valor + '%';
};

// Função para formatar valores monetários
export const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
};
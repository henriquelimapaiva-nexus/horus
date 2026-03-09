// src/components/graficos/GraficoBarras.jsx
import { Bar } from 'react-chartjs-2';
import { coresNexus, opcoesPadrao } from './GraficoBase';

export default function GraficoBarras({ 
  labels, 
  valores, 
  titulo = "Gráfico de Barras",
  cor = coresNexus.primary,
  formato = 'numero' // 'numero', 'percentual', 'moeda'
}) {
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: titulo,
        data: valores,
        backgroundColor: cor,
        borderRadius: 6,
        barPercentage: 0.6
      }
    ]
  };

  const options = {
    ...opcoesPadrao,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          callback: (value) => {
            if (formato === 'percentual') return value + '%';
            if (formato === 'moeda') return 'R$ ' + value.toLocaleString('pt-BR');
            return value;
          }
        }
      }
    },
    plugins: {
      ...opcoesPadrao.plugins,
      title: {
        display: true,
        text: titulo,
        font: {
          size: 16,
          weight: 'bold'
        },
        color: coresNexus.primary,
        padding: 20
      }
    }
  };

  return (
    <div style={{ height: '300px', padding: '10px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
// src/components/graficos/GraficoLinha.jsx
import { Line } from 'react-chartjs-2';
import { coresNexus, opcoesPadrao } from './GraficoBase';

export default function GraficoLinha({ 
  labels, 
  valores, 
  titulo = "Evolução",
  cor = coresNexus.primary,
  formato = 'numero'
}) {
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: titulo,
        data: valores,
        borderColor: cor,
        backgroundColor: cor + '20',
        borderWidth: 3,
        pointBackgroundColor: cor,
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.3,
        fill: true
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
      },
      x: {
        grid: {
          display: false
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
      <Line data={chartData} options={options} />
    </div>
  );
}
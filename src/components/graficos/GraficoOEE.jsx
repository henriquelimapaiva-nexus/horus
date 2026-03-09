// src/components/graficos/GraficoOEE.jsx
import { Bar } from 'react-chartjs-2';
import { coresNexus, opcoesPadrao } from './GraficoBase';

export default function GraficoOEE({ dados, titulo = "Componentes do OEE" }) {
  const chartData = {
    labels: ['Disponibilidade', 'Performance', 'Qualidade', 'OEE Global'],
    datasets: [
      {
        label: 'Percentual (%)',
        data: [
          dados.disponibilidade || 0,
          dados.performance || 0,
          dados.qualidade || 0,
          dados.oee || 0
        ],
        backgroundColor: [
          coresNexus.primary,
          coresNexus.secondary,
          coresNexus.azulClaro,
          coresNexus.success
        ],
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
        max: 100,
        grid: {
          color: '#e5e7eb'
        },
        ticks: {
          callback: (value) => value + '%'
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
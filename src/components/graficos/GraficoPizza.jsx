// src/components/graficos/GraficoPizza.jsx
import { Pie } from 'react-chartjs-2';
import { coresNexus, opcoesPadrao } from './GraficoBase';

export default function GraficoPizza({ 
  labels, 
  valores, 
  titulo = "Distribuição",
  cores = [coresNexus.primary, coresNexus.success, coresNexus.warning, coresNexus.danger]
}) {
  const chartData = {
    labels: labels,
    datasets: [
      {
        data: valores,
        backgroundColor: cores,
        borderWidth: 0
      }
    ]
  };

  const options = {
    ...opcoesPadrao,
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
      },
      tooltip: {
        ...opcoesPadrao.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percent = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percent}%)`;
          }
        }
      }
    }
  };

  return (
    <div style={{ height: '300px', padding: '10px' }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}
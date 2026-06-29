import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip)

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { font: { size: 11 } } },
    x: { ticks: { font: { size: 11 } } },
  },
}

export function DataChart({ type, labels, values, color, yMax, yLabel }) {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: color,
        backgroundColor: type === 'line' ? color + '22' : color,
        pointRadius: 4,
        pointBackgroundColor: color,
        borderWidth: 2,
        tension: 0,
      },
    ],
  }

  const options = {
    ...baseOptions,
    scales: {
      ...baseOptions.scales,
      y: {
        ...baseOptions.scales.y,
        max: yMax,
        title: yLabel ? { display: true, text: yLabel, font: { size: 11 } } : undefined,
      },
    },
  }

  if (values.length === 0) {
    return <div className="empty-state">Log an entry to see the graph</div>
  }

  return (
    <div className="chart-wrap">
      {type === 'line' ? <Line data={data} options={options} /> : <Bar data={data} options={options} />}
    </div>
  )
}

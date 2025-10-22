// components/Charts.js
import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Charts = ({ temperatureData, vibrationData }) => {
  // ✅ Generate dynamic time labels if available
  const tempLabels =
    Array.isArray(temperatureData) && temperatureData.length
      ? temperatureData.map((_, i) => {
          const now = new Date();
          now.setMinutes(now.getMinutes() - (temperatureData.length - i - 1) * 5);
          return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        })
      : ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

  const tempChartData = {
    labels: tempLabels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: temperatureData,
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const tempChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: Math.min(...temperatureData) - 1 || 70,
        max: Math.max(...temperatureData) + 1 || 75,
        title: {
          display: true,
          text: 'Temperature (°C)',
          color: '#bcd0ff',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time',
          color: '#bcd0ff',
        },
      },
    },
  };

  const vibrationChartData = {
    labels: ['X-axis', 'Y-axis', 'Z-axis'],
    datasets: [
      {
        label: 'Vibration (mm/s)',
        data: vibrationData,
        backgroundColor: [
          'rgba(52, 152, 219, 0.7)',
          'rgba(231, 76, 60, 0.7)',
          'rgba(52, 152, 219, 0.7)',
        ],
      },
    ],
  };

  const vibrationChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        title: {
          display: true,
          text: 'Vibration (mm/s)',
          color: '#bcd0ff',
        },
      },
    },
  };

  return (
    <div className="charts">
      <div className="card">
        <div className="card-header">
          <div className="card-title">Temperature Trend</div>
        </div>
        <div className="chart-container">
          <Line data={tempChartData} options={tempChartOptions} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Vibration Analysis</div>
        </div>
        <div className="chart-container">
          <Bar data={vibrationChartData} options={vibrationChartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Charts;

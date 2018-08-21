import Chart from 'chart.js';

export default class GameChart {
  constructor(log) {
    this.log = log;

    this.init();
  }

  init() {
    this.buildCtx();
    this.buildChart();
  }

  buildCtx() {
    const canvas = document.createElement('canvas');
    canvas.id = 'chart';
    document.body.appendChild(canvas);
    
    this.ctx = document.getElementById('chart').getContext('2d');
  }

  buildChart() {
    Chart.defaults.global = {
      ...Chart.defaults.global,
      defaultFontColor: '#000',
      defaultFontFamily: "'Arial', 'Helvetica Neue', 'Helvetica', sans-serif",
      defaultFontSize: 16
    }
    new Chart(this.ctx, {
      type: 'bar',
      data: {
        labels: this.log.map((item) => item.shapeName),
        datasets: [
          {
            label: '# interacciones',
            data: this.log.map(item => item.interactions.length),
            backgroundColor: 'rgb(111, 149, 255)'
          },
          {
            type: 'line',
            label: 'tiempo total de interacciones (segundos)',
            backgroundColor: 'rgba(254, 89, 83, 0.9)',
            data: this.log
              .map(item => item.interactions)
              .map(interaction => {
                return interaction
                  .map(item => item.delta1 - item.delta0)
                  .reduce((prev, current) => prev += current, 0) / 1000
              }),
          }
        ]
      },
      options: {
        title: {
          display: true,
          text: 'LOG de partida Cheetos Dedos de Queso',
          fontSize: 24
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      }
    });
  }
}

if (typeof module !== 'undefined') {
  module.exports = GameChart
}
const chartColors = {
  red: 'rgb(255, 99, 132)',
  orange: 'rgb(255, 159, 64)',
  yellow: 'rgb(255, 205, 86)',
  green: 'rgb(75, 192, 192)',
  blue: 'rgb(54, 162, 235)',
  purple: 'rgb(153, 102, 255)',
  grey: 'rgb(201, 203, 207)'
}

const color = Chart.helpers.color

function initEmotionsChart(datasets) {
  const ctx = document.getElementById('emotions').getContext('2d')

  const config = {
    type: 'line',
    data: {
      datasets: datasets
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: 'Chart.js Time Point Data'
      },
      scales: {
        xAxes: [
          {
            type: 'time',
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'Date'
            },
            ticks: {
              major: {
                fontStyle: 'bold',
                fontColor: '#FF0000'
              }
            }
          }
        ],
        yAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
              labelString: 'value'
            }
          }
        ]
      }
    }
  }

  console.log(config)

  new Chart(ctx, config)
}

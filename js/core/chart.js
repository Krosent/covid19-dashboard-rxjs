/*
    (c) Artyom Kuznetsov. 
    Chart.js is responsible for charts rendering. This module consists of functions that used to manipulate charts.
*/

export function createLineChart() {
    let ctx = document.getElementById('line-chart').getContext('2d')
    return new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels: [],
            datasets: [
                {
                  label: 'Cases',
                  data: [],
                  hidden: false,
                  borderColor: 'rgba(255, 206, 86, 0.2)', 
                  backgroundColor: 'rgba(255, 206, 86, 0.2)',
                  yAxisID: 'y',
                },
                {
                  label: 'Recoveries',
                  data: [],
                  hidden: true,
                  borderColor: 'rgba(255, 99, 132, 0.2)', 
                  backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  yAxisID: 'y',
                },
                {
                  label: 'Deaths',
                  data: [],
                  hidden: true,
                  borderColor: 'rgba(153, 102, 255, 1)', 
                  backgroundColor: 'rgba(153, 102, 255, 1)',
                  yAxisID: 'y',
                }
              ]
        },
        // Configuration options go here
        options: {}
    })
}

export function createDoughnutChart() {
  let ctx = document.getElementById('doughnut-chart').getContext('2d')

  const COLORS = [
    '#558B2F',
    '#00ACC1',
    '#616161',
  ];

  return new Chart(ctx, {
      // The type of chart we want to create
      type: 'doughnut',

      // The data for our dataset
      data: {
          labels: ['Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated'],
          datasets: [
              {
                label: 'Vaccination Pie Chart',
                data: [],
                hidden: false,
                borderColor: COLORS, 
                backgroundColor: COLORS,
                yAxisID: 'y',
              }
            ]
      },
      // Configuration options go here
      options: {}
  })
}

export function getDatasetByTypeName(chart, typeName) {
    return chart.data.datasets.find(ds => ds.label === typeName)
}

export function updateChart(chart, dataset, newValue, newDate) {
    chart.data.labels.push(newDate) 
    dataset.data.push(newValue)
    chart.data.labels = chart.data.labels.slice(-30)
    chart.update()
}

export function clearChart(chart) {
  chart.data.labels = []
  chart.data.datasets.map(dataset => dataset.data = [])
  chart.update()
}

export function updateDoughnutChart(chart, newValue) {
  chart.data.datasets.map(ds => ds.data.push(newValue))
  chart.update()
}

export function clearDoughnutChart(chart) {
  chart.data.datasets.map(ds => ds.data = [])
}

export function updateLineChartVisibility(chart, thisDataset) {
  chart.data.datasets.filter(dataset => dataset != thisDataset).map((dataset) => {
      dataset.hidden = true
  })
  thisDataset.hidden = false
  chart.update()
}
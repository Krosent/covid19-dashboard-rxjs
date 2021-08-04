export function createChart() {
    var ctx = document.getElementById('line-chart').getContext('2d')
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

export function getDatasetByTypeName(chart, typeName) {
    return chart.data.datasets.find(ds => ds.label === typeName)
}

export function clearChart(chart) {
  chart.data.labels = []
  chart.data.datasets.map(dataset => dataset.data = [])
  chart.update()
}

export function updateLabels(newLabels) {
  chart.data.labels = []
  chart.data.labels.push(newLabels)
}



export function updateChart(chart, dataset, newValue, newDate) {
    chart.data.labels.push(newDate) 
    //chart.data.labels.push(newDate)
    dataset.data.push(newValue)
    chart.data.labels = chart.data.labels.slice(-30)
    //chart.data.datasets.map(dataset => dataset.data =  dataset.data.slice(-30))
    //clearChart(chart, dataset)
    chart.update()
}

export function updateChartVisibility(chart, thisDataset) {
  chart.data.datasets.filter(dataset => dataset != thisDataset).map((dataset) => {
      dataset.hidden = true
  })
  thisDataset.hidden = false
  chart.update()
}


function getCurrentTime() {
    const date = new Date()
    return date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()
}
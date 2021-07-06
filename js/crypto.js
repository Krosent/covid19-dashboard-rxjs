const {
    Observable,
    Subject,
    ReplaySubject,
    from,
    of,
    range,
    fromEvent,
} = rxjs
const {
    map,
    filter,
    switchMap,
    scan,
    groupBy,
    partition
} = rxjs.operators

const { webSocket } = rxjs.webSocket

let subject = webSocket("wss://ws-feed.pro.coinbase.com")
const [one, two, three, four] = subject.pipe(partition(data => data.product_id))
let currencies = ['BTC-USD', 'LTC-USD', 'DOGE-USD'] // List of currencies

function initChart() {
    var ctx = document.getElementById('line-chart').getContext('2d');
    chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
            labels: [],
            datasets: [
                {
                  label: 'BTC',
                  data: [],
                  borderColor: 'rgba(255, 206, 86, 0.2)', 
                  backgroundColor: 'rgba(255, 206, 86, 0.2)',
                  yAxisID: 'y',
                },
                /*{
                  label: 'ETH',
                  data: [],
                  borderColor: 'rgba(255, 99, 132, 0.2)',
                  backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  yAxisID: 'y',
                },
                {
                    label: 'LTC',
                    data: [],
                    borderColor: 'rgba(153, 102, 255, 1)',
                    backgroundColor: 'rgba(153, 102, 255, 1)',
                    yAxisID: 'y',
                  },
                  {
                    label: 'DOGE',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 0.2)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    yAxisID: 'y',
                  } */
              ]
        },
        // Configuration options go here
        options: {}
    });
}

function subscribeOnAllCurrencies() {
    subject.subscribe(
        msg => {
            console.log('message received: ' + JSON.stringify(msg))
            let currencyName = msg.product_id.substr(0, msg.product_id.indexOf('-'))
            pushValueToGraphChart(msg.price, currencyName)
            //pushValueToGraphChart(msg.price, msg.time, currencyValue);
            //refreshTable(getTable('currencyTableNum1'), msg.data);
        }, // Called whenever there is a message from the server.
        err => console.log(err), // Called if at any point WebSocket API signals some kind of error.
        () => console.log('complete') // Called when connection is closed (for whatever reason).
    );
}

function pushMessageToWSServer(currencies) {
    subject.next({
        "type": "subscribe",
        "product_ids": currencies,
        "channels": [
            {
                "name": "ticker",
                "product_ids": currencies
            }
        ]
    }) 
}

function pushValueToGraphChart(price, currencyValue) {
    const date = new Date()
    const currentTime = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()
    const dataset = chart.data.datasets.find(ds => ds.label == currencyValue)
    if(typeof dataset !== "undefined") {
        chart.data.labels.push(currentTime)
        dataset.data.push(price)
        updateChart()
    }
}

function updateChart() {
    chart.data.labels = chart.data.labels.slice(-30)
    chart.data.datasets.map(dataset => dataset.data =  dataset.data.slice(-30))
    chart.update()
}

function pushValueToPanel(price) {
    // TODO: if(price < )
}


// Initiate chart
console.log("Init chart function")
initChart()
console.log("Subscribe on all currencies. Default behavior")
subscribeOnAllCurrencies()
console.log("Push message to the WS that we want this kind of data")
pushMessageToWSServer(currencies)
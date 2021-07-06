import { createChart, getDatasetByCurrencyName, updateChart } from './chart.js'

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

const subject = webSocket("wss://ws-feed.pro.coinbase.com")
const [one, two, three, four] = subject.pipe(partition(data => data.product_id))
const currencies = ['BTC-USD', 'LTC-USD', 'DOGE-USD'] // List of currencies

function subscribeOnCurrencies() {
    // listener
    subject.subscribe(
        msg => {
            console.log('message received: ' + JSON.stringify(msg))
            let currencyName = msg.product_id.substr(0, msg.product_id.indexOf('-'))
            pushValueToDashboardChart(chart, msg.price, currencyName)
        },
        err => console.log(err), 
        () => console.log('complete') 
    )
}

function pushMessageToWSServer(currencies) {
    // request
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

function pushValueToDashboardChart(chart, price, currencyValue) {
    const dataset = getDatasetByCurrencyName(chart, currencyValue)
    if(typeof dataset !== "undefined") {
        updateChart(chart, dataset, price)
    }
}

console.log("Chart initialization step")
const chart = createChart() // chart is a global variable in our application
console.log("Subscribe on all currencies. Default behavior")
subscribeOnCurrencies()
console.log("Push message to the WS that we want this kind of data")
pushMessageToWSServer(currencies)
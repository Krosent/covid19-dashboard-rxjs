import { createChart, getDatasetByCurrencyName, updateChart } from './chart.js'

const {
    Observable,
    Subject,
    ReplaySubject,
    from,
    of,
    range,
    fromEvent,
    fromPromise
} = rxjs
const {
    map,
    filter,
    switchMap,
    scan,
    groupBy,
    partition,
    flatMap,
    mergeMap,
    reduce,
    last,
    distinct,
    concatMap,
    toArray
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
    if (typeof dataset !== "undefined") {
        updateChart(chart, dataset, price)
    }
}

console.log("Chart initialization step")
// TODO: Implement
let chart = createChart() // chart is a global variable in our application

/*console.log("Subscribe on all currencies. Default behavior")
subscribeOnCurrencies()
console.log("Push message to the WS that we want this kind of data")
pushMessageToWSServer(currencies)
*/

const numOfDays = 30
let src = `https://corona.lmao.ninja/v2/historical?lastdays=${numOfDays}`

// test 
function subscribeCovid() {
    let result = rxjs.from(fetch(src)
        .then((response) => { return response.json() }))
        .pipe(
            switchMap((country) => country),
            map(elem => [{ countryName: elem }]))
    result.subscribe(
        response => console.log(response), e => console.error(e)
    )
}

function currenciesList() {
    let result = rxjs.from(fetch(src).then((response) => { return response.json() }))
    result.subscribe(response => {
        // resp = response.map(country => {})
        console.log(response)
    }, e => console.error(e))
}

currenciesList()
//subscribeCovid()

function loadGlobalStats() {
    let result = rxjs.from(data)
        .pipe(removeUnnecessaryData(),
            transformEachCountryDataToGetTotalNumbers(),
            calculateGlobalStats())
    result.subscribe(response => loadGlobalStatsDOMUpdate(response), e => console.error(e))
}

function loadGlobalStatsDOMUpdate(response) {
    document.getElementById('totalCases').innerHTML = response.totalCases.toLocaleString()
    document.getElementById('totalRecoveries').innerHTML = response.totalRecoveries.toLocaleString()
    document.getElementById('totalDeaths').innerHTML = response.totalDeaths.toLocaleString()
    console.log(response)
}

function loadCountries() {
    let result = rxjs.from(data)
        .pipe(removeUnnecessaryData(), map(obj => obj.map(country => country.countryName)))
    result.subscribe(response => loadCountriesDOMUpdate(new Set(response)), e => console.error(e))
}

function loadCountriesDOMUpdate(response) {
    response.forEach(countryName => {
        let optCountry = document.createElement("option")
        optCountry.value = countryName
        optCountry.innerHTML = countryName
        document.getElementById('countriesSelect').appendChild(optCountry)
    })
}

function loadGlobalWorldDataIntoChart() {
    let result = rxjs.from(data).pipe(switchMap((country) => country),
        groupBy(country => country.country),
        mergeMap(group => group.pipe(toArray())),
        )
    result.subscribe(response => loadGlobalWorldDataIntoChartDOMUpdate(response), e => console.error(e))
}

function loadGlobalWorldDataIntoChartDOMUpdate(response) {
    console.log(response)
}


function calculateGlobalStats() {
    return map(obj => {
        const cases = obj.map(country => country.cases).reduce((cases1, cases2) => cases1 + cases2)
        const recoveries = obj.map(country => country.recoveries).reduce((cases1, cases2) => cases1 + cases2)
        const deaths = obj.map(country => country.deaths).reduce((cases1, cases2) => cases1 + cases2)
        return ({ totalCases: cases, totalRecoveries: recoveries, totalDeaths: deaths })
    })
}

function removeUnnecessaryData() {
    return map(obj => obj.map(country => ({ countryName: country.country, countryTimeline: country.timeline })))
}

function transformEachCountryDataToGetTotalNumbers() {
    return map(obj => obj.map(country => ({
        countryName: country.countryName,
        recoveries: Object.values(country.countryTimeline.recovered).slice(-1)[0],
        cases: Object.values(country.countryTimeline.cases).slice(-1)[0],
        deaths: Object.values(country.countryTimeline.deaths).slice(-1)[0]
    })))
}

function downloadData() {
    /* Returns Promise */
    return fetch(src).then((response) => { return response.json() })
}

function entryPoint() {
    data = downloadData()
    loadGlobalStats()
    loadCountries()
    loadGlobalWorldDataIntoChart()
}

var data
entryPoint()
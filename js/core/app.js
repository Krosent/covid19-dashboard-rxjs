import { createChart, getDatasetByTypeName, updateChart } from './chart.js'

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

console.log("Chart initialization step")
let chart = createChart() // chart is a global variable in our application

const numOfDays = 30
let src = `https://corona.lmao.ninja/v2/historical?lastdays=${numOfDays}`
let historicalData = "https://corona.lmao.ninja/v2/historical/all"

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
    let result = rxjs.from(downloadData(historicalData))
    
    result.subscribe(response => loadGlobalWorldDataIntoChartDOMUpdate(response), e => console.error(e))
}

function loadGlobalWorldDataIntoChartDOMUpdate(response) {
    console.log(response)

    let dataset = getDatasetByTypeName(chart, 'Cases')
    Object.entries(response.cases).map(([date,value]) => {
        updateChart(chart, dataset, value, date)
    })
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

function downloadData(source) {
    /* Returns Promise */
    return fetch(source).then((response) => { return response.json() })
}

function entryPoint() {
    data = downloadData(src)
    loadGlobalStats()
    loadCountries()
    loadGlobalWorldDataIntoChart()
}

var data
entryPoint()
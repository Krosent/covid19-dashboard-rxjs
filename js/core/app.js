import { createChart, getDatasetByTypeName, updateChart, updateChartVisibility, clearChart , updateLabels} from './chart.js'

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

    let casesDataset = getDatasetByTypeName(chart, 'Cases')
    let recoveriesDataset = getDatasetByTypeName(chart, 'Recoveries')
    let deathsDataset = getDatasetByTypeName(chart, 'Deaths')
    Object.entries(response.cases).map(([date, value]) => {
        updateChart(chart, casesDataset, value, date)
    })

    Object.entries(response.recovered).map(([date, value]) => {
        updateChart(chart, recoveriesDataset, value, date)
    })

    Object.entries(response.deaths).map(([date, value]) => {
        updateChart(chart, deathsDataset, value, date)
    })
}

function loadCountryDataIntoChart(countryName) {
    let result = rxjs.from(downloadData(src)).pipe(
        map(obj => obj.filter(country => country.country == countryName)),
        map(obj => obj.map(country => ({ name: country.country, deaths: country.timeline.deaths, 
        recovered: country.timeline.recovered,  cases: country.timeline.cases }))))

    result.subscribe(response => loadCountryDataIntoChartDOMUpdate(response), e => console.error(e))
}

function loadCountryDataIntoChartDOMUpdate(response) {
    clearChart(chart)
    const countryData = response[0]
    let casesDataset = getDatasetByTypeName(chart, 'Cases')
    let recoveriesDataset = getDatasetByTypeName(chart, 'Recoveries')
    let deathsDataset = getDatasetByTypeName(chart, 'Deaths')
    
    //updateLabels(Object.keys(countryData.cases))

    Object.entries(countryData.cases).map(([date, value]) => {
        updateChart(chart, casesDataset, value, date)
    })

    Object.entries(countryData.recovered).map(([date, value]) => {
        updateChart(chart, recoveriesDataset, value, date)
    })

    Object.entries(countryData.deaths).map(([date, value]) => {
        updateChart(chart, deathsDataset, value, date)
    })
    console.log(countryData)
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


function onDataTypeChangeSubscription() {
    let elem = document.getElementById('selectChartData')
    let chartDataTypeOptionObservable =
        rxjs.fromEvent(elem, 'change')
    chartDataTypeOptionObservable
        .subscribe(() => onDataTypeChangeDOMUpdate(), e => console.error(e))
}

function onDataTypeChangeDOMUpdate() {
    let selectionValue = document.getElementById('selectChartData').value
    let ds = getDatasetByTypeName(chart, selectionValue)
    updateChartVisibility(chart, ds)
}

function onCountryChangeSubscription() {
    let elem = document.getElementById('countriesSelect')
    let selectCountryOptionObservable = rxjs.fromEvent(elem, 'change')
    //selectCountryOptionObservable.subscribe(() => onCountryChangeDOMUpdate(), e => console.error(e))
    selectCountryOptionObservable.subscribe(response => onCountryChangeAction(response), e => console.error(e))
}

function onCountryChangeAction(response) {
    let elem = document.getElementById('countriesSelect')
    let elemValue = elem.value
    document.getElementById('numberOfDaysSelect').disabled = false

    updateStatsAndCountryName(elemValue)
    loadCountryDataIntoChart(elemValue)
}

function onNumberOfDaysChangeSubscription() {
    let elem = document.getElementById('numberOfDaysSelect')
    let numberOfDaysOptionObservable = rxjs.fromEvent(elem, 'change')
    numberOfDaysOptionObservable.subscribe(() => onNumberOfDaysChangeAction(), e => console.error(e))
}

function onNumberOfDaysChangeAction() {
    let elemValue = document.getElementById('numberOfDaysSelect').value
    updateSourceNumberOfDates(src, elemValue)

    let countriesSelect = document.getElementById('countriesSelect')
    let countriesSelectCurrentValue = countriesSelect.value
    loadCountryDataIntoChart(countriesSelectCurrentValue)
}

function filterCountry(countryName) { 
    return map(obj => obj.filter(country => country.countryName == countryName))
}

function updateStatsAndCountryName(countryName) {
    let result = rxjs.from(data)
        .pipe(removeUnnecessaryData(),
            transformEachCountryDataToGetTotalNumbers(),
            filterCountry(countryName))
    result.subscribe(response => updateStatsBlockDOMUpdate(response), e => console.error(e))
}

function updateStatsBlockDOMUpdate(response) {
    document.getElementById('countryNameEm').innerHTML = response[0].countryName
    document.getElementById('totalCases').innerHTML = response[0].cases.toLocaleString()
    document.getElementById('totalRecoveries').innerHTML = response[0].recoveries.toLocaleString()
    document.getElementById('totalDeaths').innerHTML = response[0].deaths.toLocaleString()
    console.log(response)
}

function updateSourceNumberOfDates(_src, numberOfDates) { 
    src = `https://corona.lmao.ninja/v2/historical?lastdays=${numberOfDates}`
}

function entryPoint() {
    data = downloadData(src)
    loadGlobalStats()
    loadCountries()
    loadGlobalWorldDataIntoChart()
    onDataTypeChangeSubscription()
    onCountryChangeSubscription()
    onNumberOfDaysChangeSubscription()
}

var data
var numOfDays = 30
var src = `https://corona.lmao.ninja/v2/historical?lastdays=${numOfDays}`
let historicalData = "https://corona.lmao.ninja/v2/historical/all"
entryPoint()
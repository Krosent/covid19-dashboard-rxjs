/*
    (c) Artyom Kuznetsov.
    App.js is an entry point to the JS part of the application. 
    Code is decoupled to modules. Ideally, all code that can be moved away from app.js should be moved. 
*/

import {
    createLineChart, createDoughnutChart, getDatasetByTypeName,
    updateChart, updateLineChartVisibility,
    clearChart, updateDoughnutChart, clearDoughnutChart
} from './chart.js'

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
    toArray,
    merge,
    forkJoin,
    zip
} = rxjs.operators

console.log("Chart initialization step")
// We initialize both type of charts, even though they may not be required at initial setup.
// Easy to configure now and them manipulate the objects data. 
let chart = createLineChart() // chart is a global variable in our application
let doughnutPie = createDoughnutChart()

// Loading global (worldwide) statistics about the current situation in the world. 
// The statistics demonstrates numbers starting from the begining. 
// This observable is being transformed by use of pipelining. 
function loadGlobalStats() {
    let result = rxjs
        .from(data)
        .pipe(removeUnnecessaryData(),
            transformEachCountryDataToGetTotalNumbers(),
            calculateGlobalStats())
    result.subscribe(response => loadGlobalStatsDOMUpdate(response), e => console.error(e))
}

// This is one of the steps for global stats transformation. We use mapping function to return an object in
// convinient to us format. 
function removeUnnecessaryData() {
    return map(obj => obj.map(country => ({ countryName: country.country, countryTimeline: country.timeline })))
}

// This is one of the steps for global stats transformation. We get the last values for each type of data to get 
// the latest values. For doing that we just use map operation to transform the stream.
function transformEachCountryDataToGetTotalNumbers() {
    return map(obj => obj.map(country => ({
        countryName: country.countryName,
        recoveries: Object.values(country.countryTimeline.recovered).slice(-1)[0],
        cases: Object.values(country.countryTimeline.cases).slice(-1)[0],
        deaths: Object.values(country.countryTimeline.deaths).slice(-1)[0]
    })))
}

// This is one of the steps for global stats transformation. We use reduce operation to get the total numbers
// for cases, recoveries and deaths. Then we return a new object with the statistics. 
function calculateGlobalStats() {
    return map(obj => {
        const cases = obj.map(country => country.cases).reduce((cases1, cases2) => cases1 + cases2)
        const recoveries = obj.map(country => country.recoveries).reduce((cases1, cases2) => cases1 + cases2)
        const deaths = obj.map(country => country.deaths).reduce((cases1, cases2) => cases1 + cases2)
        return ({ totalCases: cases, totalRecoveries: recoveries, totalDeaths: deaths })
    })
}

// This function is an action when we get the response from the subscription. 
// Update DOM table of global statistics.
function loadGlobalStatsDOMUpdate(response) {
    document.getElementById('totalCases').innerHTML = response.totalCases.toLocaleString()
    document.getElementById('totalRecoveries').innerHTML = response.totalRecoveries.toLocaleString()
    document.getElementById('totalDeaths').innerHTML = response.totalDeaths.toLocaleString()
    console.log(response)
}

// This function is used to load the list of countries that later on being used to select some country to get
// insides. By use of map transformation we get the country names. Then we send to DomUpdate function the response. 
// The results may get same country names, because the API duplicates countries with different regions. To solve it
// Set data structure is used for deduplication. 
function loadCountries() {
    let result = rxjs
        .from(data)
        .pipe(removeUnnecessaryData(),
            map(obj => obj.map(country => country.countryName)))
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

// This function is only used to get historical data that we demonstrate at the initial launch of application. 
// We use another end point here since they already provide with required information. No transformation required.
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

// This function is used to update the line chart when the country has been selected. 
// We transform the stream to get only required country, then we transform the output. 
function loadCountryDataIntoChart(countryName) {
    let result = rxjs.from(downloadData(src)).pipe(
        map(obj => obj.filter(country => country.country == countryName)),
        map(obj => obj.map(country => ({
            name: country.country, deaths: country.timeline.deaths,
            recovered: country.timeline.recovered, cases: country.timeline.cases
        }))))

    result.subscribe(response => loadCountryDataIntoChartDOMUpdate(response), e => console.error(e))
}

function loadCountryDataIntoChartDOMUpdate(response) {
    clearChart(chart)
    const countryData = response[0]
    let casesDataset = getDatasetByTypeName(chart, 'Cases')
    let recoveriesDataset = getDatasetByTypeName(chart, 'Recoveries')
    let deathsDataset = getDatasetByTypeName(chart, 'Deaths')

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



function downloadData(source) {
    /* Returns Promise */
    return fetch(source).then((response) => { return response.json() })
}

// This is a subscription on changes for the statistics representation line chart. 
// When the type (cases, deaths orrecoveries) has been changed we trigger the event. 
function onDataTypeChangeSubscription() {
    let elem = document.getElementById('selectChartData')
    let chartDataTypeOptionObservable = rxjs.fromEvent(elem, 'change')
    chartDataTypeOptionObservable.subscribe(() => onDataTypeChangeDOMUpdate(), e => console.error(e))
}

function onDataTypeChangeDOMUpdate() {
    let selectionValue = document.getElementById('selectChartData').value
    let ds = getDatasetByTypeName(chart, selectionValue)
    updateLineChartVisibility(chart, ds)
}

// This is a subscription on changes for country select element 
// When the country has been changed we trigger the event. 
function onCountryChangeSubscription() {
    let elem = document.getElementById('countriesSelect')
    let selectCountryOptionObservable = rxjs.fromEvent(elem, 'change')
    selectCountryOptionObservable.subscribe(() => onCountryChangeAction(), e => console.error(e))
}

// When the country has changed we enable the ability to select the granulanity of data. 
// Furthermore, we update chart and stats block. 
// Finally we also enable vaccination statistics for country right here. 
function onCountryChangeAction() {
    let elem = document.getElementById('countriesSelect')
    let elemValue = elem.value
    document.getElementById('numberOfDaysSelect').disabled = false

    updateStatsAndCountryName(elemValue)
    loadCountryDataIntoChart(elemValue)
    countryVaccinationStatusObservable(elem.value)
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

// Function to update the statistics block with latest data in accordance to selected country. 
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
}

function updateSourceNumberOfDates(_src, numberOfDates) {
    src = `https://corona.lmao.ninja/v2/historical?lastdays=${numberOfDates}`
}

// After we selected the country to get statistics we enable vaccination stats as well. 
// We use another end point to get information about vaccination for the selected country. 
// However we also wanted to be able to judge how good vaccination is going on in the selected countries. 
// So we decide also to get another end point which can give us information about population size for that country.
// We need to merge two observables that we have into one. 
// To merge them we can use merge, concat or forkJoin. We decided to use forkJoin since it gives us 
// zipped results of two observables. So what we are doing here is that we have two separate observables, transformed.
// Then we use forkJoin to get common result and then we update our DOM accordingly. 
function countryVaccinationStatusObservable(countryName) {
    let vaccinationData = downloadData(vaccinationAPI)
    let populationSizeData = downloadData(populationAPI)
    let countryVaccinationDataObs = rxjs
        .from(vaccinationData)
        .pipe(map(obj => obj.filter(current => current.country == countryName)))
    
    let countryPopulationSizeObs = rxjs
        .from(populationSizeData)
        .pipe(map(obj => obj.filter(current => current.country == countryName)))

    rxjs.forkJoin(countryPopulationSizeObs, countryVaccinationDataObs)
        .subscribe(response => countryVaccinationStatusDOMUpdate(response), e => console.error(e))
}

function countryVaccinationStatusDOMUpdate(response) {
    console.log(response)
    clearDoughnutChart(doughnutPie)
    let partiallyVaccinatedNum = response[1][0]
        .data
        .slice(-1)[0]
        .people_vaccinated
        
    let fullyVaccinatedNum = response[1][0]
        .data
        .slice(-1)[0]
        .people_fully_vaccinated

    let totalVaccinatedNumber = response[1][0]
        .data
        .slice(-1)[0]
        .total_vaccinations

    document.getElementById('partiallyVaccinated').innerHTML = partiallyVaccinatedNum.toLocaleString()
    document.getElementById('fullyVaccinated').innerHTML = fullyVaccinatedNum.toLocaleString()
    document.getElementById('totalVacinated').innerHTML = totalVaccinatedNumber.toLocaleString()
    enableVaccinationDataTableDOMUpdate()
    updateDoughnutChart(doughnutPie, fullyVaccinatedNum)
    updateDoughnutChart(doughnutPie, partiallyVaccinatedNum)
    updateDoughnutChart(doughnutPie, response[0][0].population - partiallyVaccinatedNum)
}

// AKA main method
function entryPoint() {
    data = downloadData(src)
    loadGlobalStats()
    loadCountries()
    loadGlobalWorldDataIntoChart()
    onDataTypeChangeSubscription()
    onCountryChangeSubscription()
    onNumberOfDaysChangeSubscription()
}

function enableVaccinationDataTableDOMUpdate() {
    document.getElementById("vaccination-table").style.display = "block";
}

var data
var numOfDays = 30
var src = `https://corona.lmao.ninja/v2/historical?lastdays=${numOfDays}`

// API end point routes
let historicalData = "https://corona.lmao.ninja/v2/historical/all"
let vaccinationAPI = 'https://raw.githubusercontent.com/owid/covid-19-data/master/public/data/vaccinations/vaccinations.json'
let populationAPI = 'https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-population.json'

// Start of JS execution
entryPoint()

const HOSTNAME="localhost";
const PORT=3000;

async function getRoverStats(roverName) {
    console.log("Inside method getRoverStats...");
    console.log("Rover name = " + roverName);
    const results = await fetch(`http://${HOSTNAME}:${PORT}/roverDetails/${roverName}`)
    .then(response => response.json())
    .then(data => {
        return {
            launchDate: data.launchDate,
            landingDate: data.landingDate,
            status: data.status,
            lastDate: data.maxDate
        }
    });
    return results;
}

async function getImageStats(roverName, searchDate) {
    console.log("Inside method getImageStats...");
    console.log("Rover name = " + roverName);
    console.log("Search date = " + searchDate);
    const results = await fetch(`http://${HOSTNAME}:${PORT}/photoStats/${roverName}/${searchDate}`)
    .then(response => response.json())
    .then(data => {
        // console.log("Returning...");
        // console.log(JSON.stringify(data));
        return {
            pages: data.pages,
        }
    });
    return results;
}

async function getImageUrls(roverName, searchDate, pageNumber) {
    console.log("Inside method getImageUrls...");
    console.log("\tRover name = " + roverName);
    console.log("\tSearch date = " + searchDate);
    console.log("\tPage = " + pageNumber);
    const results = await fetch(`http://${HOSTNAME}:${PORT}/photoUrls/${roverName}/${searchDate}/${pageNumber}`)
    .then(response => response.json())
    .then(data => {
        // console.log("Returning...");
        // console.log(JSON.stringify(data));
        const urlData = [];
        data.forEach(dataRecord => {
            urlData.push({imageId: dataRecord.id, imageUrl: dataRecord.src})
        })
        return urlData;
    });
    return results;
}

let store = {
    rovers: Immutable.List(['Curiosity', 'Opportunity', 'Spirit']),
    activeRover: 'Curiosity',
    searchDate: '2020-01-01',
    roverStats: Immutable.Map()
};


// add our markup to the page
const root = document.getElementById('root')

const updateStore = (store, newState) => {
    // console.log("Updating store: " + JSON.stringify(newState));
    // console.log("STORE DETAILS (BEFORE): " + JSON.stringify(store));
    store = Object.assign(store, newState);
    // console.log("STORE DETAILS (AFTER): " + JSON.stringify(store));
    render(root, store);
}

const render = async (root, state) => {
    root.innerHTML = App(state)
}


async function onSearchDateChange() {
    const newSearchDate = document.getElementById("searchDate").value;
    const roverName = store.activeRover;
    // console.log("Inside method onSearchDateChange...");
    // console.log("New search date = " + newSearchDate);
    // console.log("Rover name = " + store.activeRover);
    updateStore(store, { searchDate : newSearchDate });

    // Clear Pages Div
    const pagesDiv = document.getElementById("PagesDiv");
    while (pagesDiv.hasChildNodes()) {
        pagesDiv.removeChild(pagesDiv.childNodes[0]);
    }

    // How many pages?
    const imageStats = await getImageStats(roverName, newSearchDate);
    const totalPages = imageStats.pages;


    // Render Pages div
    const pagesDropdown = document.createElement("select");
    pagesDropdown.setAttribute("id", "PagesDropdown");
    pagesDropdown.setAttribute("onchange", `retrieveImages('${roverName}', '${newSearchDate}', document.getElementById("PagesDropdown").value)`);
    for (let i = 0; i < totalPages; i++) {
        const pagesOption = document.createElement("option");
        const pageNumber = i + 1;
        pagesOption.setAttribute("value", pageNumber);
        pagesOption.innerHTML = pageNumber;
        pagesDropdown.appendChild(pagesOption);
    }

    const pagesLabel = document.createElement("label");
    pagesLabel.innerHTML = "Pages: ";
    pagesDiv.appendChild(pagesLabel);
    pagesDiv.appendChild(pagesDropdown);

    // Simulate selection of page 1
    retrieveImages(roverName, newSearchDate, 1);

}


// Click event handler for Rover button
async function clickRover(roverName) {
    // Update activeRover
    // Update stats
    const newStats = await getRoverStats(roverName);
    const newSearchDate = newStats.lastDate;
    updateStore(store, {activeRover: roverName, roverStats : newStats, searchDate : newSearchDate});
    onSearchDateChange();
}

// Click event handler for Search button
async function retrieveImages(roverName, searchDate, pageNumber) {
    // console.log("Inside method retrieveImages...");
    // console.log("Rover name = " + roverName);
    // console.log("Search Date = " + searchDate);
    // console.log("Page Number = " + pageNumber);
    const imageUrlsDiv = document.getElementById("SearchResults");
    while (imageUrlsDiv.hasChildNodes()) {
        imageUrlsDiv.removeChild(imageUrlsDiv.childNodes[0]);
    }
    const responseUrls = await getImageUrls(roverName, searchDate, pageNumber);
    // console.log("Add image URLs..." + JSON.stringify(responseUrls));
    responseUrls.forEach(responseUrl => {

        // Draw the image
        const image = document.createElement("img");
        image.setAttribute("width", "300px");
        image.setAttribute("height", "300px");
        image.setAttribute("src", responseUrl.imageUrl);
        imageUrlsDiv.appendChild(image);
    })
}

// 1) Set Rover to "Curiosity"
async function init() {
    await clickRover("Curiosity");
}

// Create HTML Div button for the rover. Determine coloring of button based on whether the rover is 'active'.
function createSingleRoverHtmlDiv(roverName, activeRoverName) {
    const divClass = roverName == activeRoverName ? "RoverDivClassSelected" : "RoverDivClassNotSelected";
    return `<div class="${divClass}" id="RoverDiv${roverName}" onClick='clickRover("${roverName}")'>${roverName}</div>`
}

// Higher-order function to generate divs for each rover
function generateRoverHtmlDivs(roverNames, activeRoverName, callback) {
    let roversHtml = "";
    roverNames.forEach(roverName => {
        roversHtml += callback(roverName, activeRoverName);
    })
    return roversHtml;
}

// create content
const App = (state) => {
    let { rovers, activeRover, roverStats } = state
    rovers = state.rovers;
    roverStats = state.roverStats;
    activeRover = state.activeRover;

    // const roverDivs = 

    return `
        <header><title>Mars Rover Dashboard</title></header>
        <main>
            <section>
                <div class="RoverButtons">
                ${generateRoverHtmlDivs(rovers, activeRover, createSingleRoverHtmlDiv)}
                </div>
                <div id="StatsRow" class="roverStatsRow">
                    <div class="roverStats">Launch Date: ${roverStats ? roverStats.launchDate : ""}</div>
                    <div class="roverStats">Landing Date: ${roverStats ? roverStats.landingDate : ""}</div>
                    <div class="roverStats">Status: ${roverStats ? roverStats.status : ""}</div>
                    <div class="roverStats">Last Photo Date: ${roverStats ? roverStats.lastDate : ""}</div>
                </div>
                <div id="SearchCriteria" class="searchCriteriaRow">
                    <div id="SearchDate" class="searchDateDiv">
                    Image Date:
                    <input id="searchDate" type="date" onChange="onSearchDateChange()" value="${store.searchDate}" min="${roverStats.landingDate}" max="${roverStats.lastDate}"/>
                    </div>
                    <div id="PagesDiv" class="pagesDiv"></div>
                </div>
                <div id="SearchResults"></div>
            </section>
        </main>
        <footer></footer>
    `
}
init();

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    render(root, store)
})

// ------------------------------------------------------  COMPONENTS


// ------------------------------------------------------  API CALLS



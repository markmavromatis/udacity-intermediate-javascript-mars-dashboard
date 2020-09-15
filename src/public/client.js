
const HOSTNAME="localhost";
const PORT=3000;




let store = {
    rovers: Immutable.List(['Curiosity', 'Opportunity', 'Spirit']),
    activeRover: 'Curiosity',
    searchDate: '2020-01-01',
    roverStats: Immutable.Map()
};


// add our markup to the page
const root = document.getElementById('root')

const updateStore = (store, newState) => {
    store = Object.assign(store, newState);
    render(root, store);
}

const render = async (root, state) => {
    root.innerHTML = App(state)
}

// Remove previously added div children.
// Use this to clear previously added image URLs and page dropdown
function clearDivChildren(aDivTag) {
    while (aDivTag.hasChildNodes()) {
        aDivTag.removeChild(aDivTag.childNodes[0]);
    }

}


async function onSearchDateChange() {
    const newSearchDate = document.getElementById("searchDate").value;
    const roverName = store.activeRover;
    updateStore(store, { searchDate : newSearchDate });

    // Clear Pages Div
    const pagesDiv = document.getElementById("PagesDiv");
    clearDivChildren(pagesDiv);

    // How many pages?
    const pagesLabel = document.createElement("label");
    pagesLabel.innerHTML = "Pages: ";
    pagesDiv.appendChild(pagesLabel);

    const pagesDropdown = await generatePageDropdown(roverName, newSearchDate, getImageStats)
    pagesDiv.appendChild(pagesDropdown);

    // Simulate selection of page 1
    retrieveImages(roverName, newSearchDate, 1);

}


// Click event handler for Rover button
async function clickRover(roverName) {
    // Update stats
    const newStats = await getRoverStats(roverName);
    const newSearchDate = newStats.lastDate;
    updateStore(store, {activeRover: roverName, roverStats : newStats, searchDate : newSearchDate});
    // Reset the search date
    onSearchDateChange();
}

// Click event handler for Search button
async function retrieveImages(roverName, searchDate, pageNumber) {

    const imageUrlsDiv = document.getElementById("SearchResults");
    clearDivChildren(imageUrlsDiv);

    const responseUrls = await getImageUrls(roverName, searchDate, pageNumber);
    responseUrls.forEach(responseUrl => {

        // Draw the image
        const image = document.createElement("img");
        image.setAttribute("class", "marsImage")
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
    const divClass = roverName == activeRoverName ? "RoverDivClassSelected roverDiv" : "RoverDivClassNotSelected roverDiv";
    return `<div class="${divClass}" id="RoverDiv${roverName}" onClick='clickRover("${roverName}")'>${roverName}</div>`
}

// Higher-order function to generate divs HTML for each rover
function generateRoverHtmlDivs(roverNames, activeRoverName, callback) {
    let roversHtml = "";
    roverNames.forEach(roverName => {
        roversHtml += callback(roverName, activeRoverName);
    })
    return roversHtml;
}

// Higher-order function to generate the pages dropdown HTML elements
// callback is a function to retrieve the # of image pages
async function generatePageDropdown(roverName, searchDate, callback) {
    const imageStats = await callback(roverName, searchDate);
    const totalPages = imageStats.pages;

    const pagesDropdown = document.createElement("select");
    pagesDropdown.setAttribute("id", "PagesDropdown");
    pagesDropdown.setAttribute("class", "pageDropdownDiv");
    pagesDropdown.setAttribute("onchange", `retrieveImages('${roverName}', '${searchDate}', document.getElementById("PagesDropdown").value)`);
    for (let i = 0; i < totalPages; i++) {
        const pagesOption = document.createElement("option");
        const pageNumber = i + 1;
        pagesOption.setAttribute("value", pageNumber);
        pagesOption.innerHTML = pageNumber;
        pagesDropdown.appendChild(pagesOption);
    }

    return pagesDropdown;
}


// create content
const App = (state) => {
    let { rovers, activeRover, roverStats } = state
    rovers = state.rovers;
    roverStats = state.roverStats;
    activeRover = state.activeRover;

    return `
        <header><title>Mars Rover Dashboard</title></header>
        <main>
            <section>
                <div class="RoverButtons">
                ${generateRoverHtmlDivs(rovers, activeRover, createSingleRoverHtmlDiv)}
                </div>
                <div id="StatsRow" class="roverStatsRow">
                    <div class="roverStats"><label class="roverStatsLabel">Launch Date:</label><label class="roverStatsValue">${roverStats ? roverStats.launchDate : ""}</label></div>
                    <div class="roverStats"><label class="roverStatsLabel">Landing Date:</label><label class="roverStatsValue">${roverStats ? roverStats.landingDate : ""}</label></div>
                    <div class="roverStats"><label class="roverStatsLabel">Status:</label><label class="roverStatsValue">${roverStats ? roverStats.status : ""}</label></div>
                    <div class="roverStats"><label class="roverStatsLabel">Last Photo Date:</label><label class="roverStatsValue">${roverStats ? roverStats.lastDate : ""}</label></div>
                </div>
                <div id="SearchCriteria" class="searchCriteriaRow">
                    <div id="SearchDate" class="searchDateDiv">
                    <label class="searchDateDiv">Image Date:</label>
                    <input class="searchDateDiv" id="searchDate" type="date" onChange="onSearchDateChange()" value="${store.searchDate}" min="${roverStats.landingDate}" max="${roverStats.lastDate}"/>
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


// ------------------------------------------------------  API CALLS

// Download Mars Rover metadata from server
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




// Download Mars Rover image stats (total images / day) from server
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

// Download Mars Rover image URLs for a certain date / page from server
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
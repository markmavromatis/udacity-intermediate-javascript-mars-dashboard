
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
    console.log("Rover name = " + roverName);
    console.log("Search date = " + searchDate);
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
    user: { name: "Student" },
    apod: '',
    rovers: ['Curiosity', 'Opportunity', 'Spirit'],
    activeRover: 'Curiosity',
    searchDate: '2020-01-01',
    roverStats: {}
};


// add our markup to the page
const root = document.getElementById('root')

const updateStore = (store, newState) => {
    store = Object.assign(store, newState)
    render(root, store)
}

const render = async (root, state) => {
    root.innerHTML = App(state)
}


async function onSearchDateChange() {
    const newSearchDate = document.getElementById("searchDate").value;
    const roverName = store.activeRover;
    console.log("Inside method onSearchDateChange...");
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
    console.log("# PAGES = " + JSON.stringify(imageStats));
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
    console.log("Inside method clickRover...");
    const newStats = await getRoverStats(roverName);
    const newSearchDate = newStats.lastDate;
    updateStore(store, { activeRover: roverName, roverStats : newStats, searchDate : newSearchDate});
    console.log("Updating search date field.... (CLICKROVER)")
    // document.getElementById("searchDate").value = "2020-10-10";
    onSearchDateChange();
}

// Click event handler for Search button
async function retrieveImages(roverName, searchDate, pageNumber) {
    console.log("Inside method retrieveImages...");
    console.log("Rover name = " + roverName);
    console.log("Search Date = " + searchDate);
    console.log("Page Number = " + pageNumber);
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



// create content
const App = (state) => {
    let { rovers, activeRover, apod, roverStats } = state
    let roverDivs = "";
    rovers.forEach((aRover) => {
        const divClass = aRover == activeRover ? "RoverDivClassSelected" : "RoverDivClassNotSelected"
        roverDivs += `<div class="${divClass}" id="RoverDiv${aRover}" onClick='clickRover("${aRover}")'>${aRover}</div>`
    })
    console.log("ROVER STATS: " + JSON.stringify(roverStats));
    return `
        <header><title>Mars Rover Dashboard</title></header>
        <main>
            ${Greeting(store.user.name)}
            <section>
                <div class="RoverButtons">
                ${roverDivs}
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

// Pure function that renders conditional information -- THIS IS JUST AN EXAMPLE, you can delete it.
const Greeting = (name) => {
    if (name) {
        return `
            <h1>Welcome, ${name}!</h1>
        `
    }

    return `
        <h1>Hello!</h1>
    `
}

// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {

    // This image fires twice. Prevent it from referring to an invalid image URL if no apod exists.
    if (!apod) {
        return;
    }

    // If image does not already exist, or it is not from today -- request it again
    const today = new Date()
// 
    // console.log(photodate.getDate() === today.getDate());
    if (!apod || apod.date === today.getDate() ) {
        getImageOfTheDay(store)
    }
    console.log(JSON.stringify(apod));
    // check if the photo of the day is actually type video!
    if (apod.media_type === "video") {
        return (`
            <p>See today's featured video <a href="${apod.url}">here</a></p>
            <p>${apod.title}</p>
            <p>${apod.explanation}</p>
        `)
    } else {
        return (`
            <img src="${apod.image.url}" height="350px" width="100%" />
            <p>${apod.image.explanation}</p>
        `)
    }
}

// ------------------------------------------------------  API CALLS

function getFormattedDate() {
    const todayDate = new Date();
    const year = todayDate.getFullYear();
    const monthAsNumber = todayDate.getMonth() + 1;
    const monthFormatted = (monthAsNumber < 10) ? "0" + monthAsNumber: monthAsNumber;
    const dateAsNumber = todayDate.getDate();
    const dateFormatted = (dateAsNumber < 10) ? "0" + dateAsNumber: dateAsNumber;
    let yyyymmddFormat = `${year}-${monthFormatted}-${dateFormatted}`; 
    return yyyymmddFormat;
}

// Example API call
const getImageOfTheDay = (state) => {
    let { apod } = state

    let todayDate = getFormattedDate();
    fetch(`http://localhost:3000/apod/${todayDate}`)
        .then(res => res.json())
        .then(apod => {
            updateStore(store, { apod });
        })
}

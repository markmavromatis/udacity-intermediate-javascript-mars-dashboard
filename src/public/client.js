
const HOSTNAME="localhost";
const PORT=3000;

async function getRoverStats(roverName) {
    console.log("Inside method getRoverStats...");
    console.log("Rover name = " + roverName);
    const results = await fetch(`http://${HOSTNAME}:${PORT}/roverDetails/${roverName}`)
    .then(response => response.json())
    .then(data => {
        console.log("Returning...");
        console.log(JSON.stringify(data));
        return {
            launchDate: data.launchDate,
            landingDate: data.landingDate,
            status: data.status,
            lastDate: data.maxDate
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


// // Load manifest data for 3 rovers
// store.rovers.forEach(aRover => {
    
// })

// function updateRoverButtons(state) {
//     let { rovers, activeRover } = state
//     rovers.forEach((aRover) => {
//         const divClass = aRover == activeRover ? "RoverDivClassSelected" : "RoverDivClassNotSelected"
//         document.getElementById(`RoverDiv${aRover}`.classname = divClass);
//     })
// }


// Click event handler for Rover button
async function clickRover(aRover) {
    // Update activeRover
    // Update stats
    const newStats = await getRoverStats(aRover);
    updateStore(store, { activeRover: aRover, roverStats : newStats });
}

// Click event handler for Search button
async function clickSearch(roverName, searchDate) {
    if (!searchDate) {
        console.log("Search date is null!");
    } else {
        console.log("Search date: " + searchDate);
        // Remove any existing images
        const imageUrlsDiv = document.getElementById("SearchResults");
        while (imageUrlsDiv.hasChildNodes()) {
            imageUrlsDiv.removeChild(imageUrlsDiv.childNodes[0]);
        }
        const responseUrls = await getImageUrls(roverName, searchDate, 2);
        console.log("Add image URLs..." + JSON.stringify(responseUrls));
        responseUrls.forEach(responseUrl => {
            console.log(responseUrl.imageUrl);
            // Draw the image
            // newDiv.setAttribute("class", "grid-item");
            const image = document.createElement("img");
            image.setAttribute("width", "300px");
            image.setAttribute("height", "300px");
            image.setAttribute("src", responseUrl.imageUrl);
            imageUrlsDiv.appendChild(image);
        })
            // imageUrlsDiv.chi
    }
}

// 1) Set Rover to "Curiosity"
async function init() {
    await clickRover("Curiosity");
}

// Initialization logic. 
init();


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

                <div class="roverStats">Launch Date: ${roverStats ? roverStats.launchDate : ""}</div>
                <div class="roverStats">Landing Date: ${roverStats ? roverStats.landingDate : ""}</div>
                <div class="roverStats">Status: ${roverStats ? roverStats.status : ""}</div>
                <div class="roverStats">Last Photo Date: ${roverStats ? roverStats.lastDate : ""}</div>
                <div>
                Image Search Date:
                <input id="searchDate" type="date"/>
                <div id="PagesDiv"></div>
                <button id="SearchButton" onClick='clickSearch("${store.activeRover}", document.getElementById("searchDate").value)'/></div>
                <div id="SearchResults"></div>
                <h3>Put things on the page!</h3>
                <p>Here is an example section.</p>
                <p>
                    One of the most popular websites at NASA is the Astronomy Picture of the Day. In fact, this website is one of
                    the most popular websites across all federal agencies. It has the popular appeal of a Justin Bieber video.
                    This endpoint structures the APOD imagery and associated metadata so that it can be repurposed for other
                    applications. In addition, if the concept_tags parameter is set to True, then keywords derived from the image
                    explanation are returned. These keywords could be used as auto-generated hashtags for twitter or instagram feeds;
                    but generally help with discoverability of relevant imagery.
                </p>
                ${ImageOfTheDay(apod)}
            </section>
        </main>
        <footer></footer>
    `
}

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

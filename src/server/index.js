require('dotenv').config()
const { List, Map } = require("immutable");

const express = require('express')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const path = require('path')
const { resolveSrv } = require('dns')
const { response } = require('express')

const app = express()
const port = 3000

const API_KEY = process.env.API_KEY;
const NASA_API_BASE_URL = "https://api.nasa.gov/mars-photos/api/v1/";
const ROVER_NAMES = List(['Curiosity', 'Opportunity', 'Spirit'])

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', express.static(path.join(__dirname, '../public')))

// your API calls
console.log("Using API key: " + API_KEY);

// Class to model the Mars rovers and their launch/landing/camera stats
class Rover {
    constructor(manifestData) {
        this.name = manifestData.name;
        this.landingDate = manifestData.landing_date;
        this.launchDate = manifestData.launch_date;
        this.status = manifestData.status;
        this.maxDate = manifestData.max_date;

        // Setup the photo metadata (counts) for all dates
        // since this information is included in the manifest data.
        this.photosData = {};
        manifestData.photos.forEach((photoRecord) => {
            this.photosData[photoRecord.earth_date] = {};
            let newPhotoRecord = this.photosData[photoRecord.earth_date];
            newPhotoRecord.totalPhotos = photoRecord.total_photos;
        })
    }
}

// Query NASA API for rover details and store data in the Rover class
async function getRoverDetails(roverName) {
    console.log("Querying NASA API for rover manifest: " + roverName);

    const newRover = await fetch(`${NASA_API_BASE_URL}/manifests/${roverName.toLowerCase()}?api_key=${API_KEY}`)
    .then(response => response.json())
    .then(async (data) => {
        const manifestData = data.photo_manifest;
        let newRover = new Rover(manifestData);
        return newRover;
    });
    return newRover;
}

// Query NASA API for the photo URLs for a rover/data/page number.
// Return a list of URLs for the images.
async function getRoverPhotoUrls(rover, photoDate, page) {
    console.log(`Querying NASA API for photo URLs for rover/date/page: ${rover.name} / ${photoDate} / ${page}`);

    const url = `${NASA_API_BASE_URL}/rovers/${rover.name.toLowerCase()}/photos?earth_date=${photoDate}&page=${page}&api_key=${API_KEY}`;

    const photoUrls = await fetch(url)
    .then(response => response.json())
    .then(data => {
        const photoData = data.photos;
        let newPhotos = List();
        newPhotos = photoData.map((aRecord) => {return {id: aRecord.id, src : aRecord.img_src}})
        return newPhotos;
    });
    return photoUrls;
}

// Initialize data for all Rovers
async function init() {
    for (name of ROVER_NAMES) {
        rovers[name] = await getRoverDetails(name);
    }
}

let rovers = {};
console.log("Loading Rover details...");
init().then(() => {
    console.log(`Loaded data for all ${ROVER_NAMES.size} rovers!`);
});

// Routers for web services

// Query manifest details for a specific Mars Rover.
app.get('/roverDetails/:roverName', async (req, res) => {
    const roverName = req.params.roverName;

    if (rovers[roverName]) {
        const aRover = rovers[roverName];
        res.send(Map({
            name: aRover.name,
            landingDate: aRover.landingDate,
            launchDate: aRover.launchDate,
            status: aRover.status,
            maxDate: aRover.maxDate
        }));
    } else {
        res.status(404).send("Unable to identify rover: " + roverName);
    }
})

// Query image stats (count) for photos taken by a Mars Rover on a specified date.
app.get('/photoStats/:roverName/:photosDate', async (req, res) => {
    const roverName = req.params.roverName;
    const photosDate = req.params.photosDate;

    if (rovers[roverName]) {
        const aRover = rovers[roverName];
        
        let photosRecord = aRover.photosData[photosDate];
        const totalPhotos = photosRecord.totalPhotos;
        res.send({
            totalPhotos : totalPhotos,
            pages: Math.floor(totalPhotos / 25) + (totalPhotos % 25 > 0 ? 1 : 0)
        });
    } else {
        res.status(404).send("Unable to identify rover: " + roverName);
    }
})

// Query image URLs for a page (25) photos taken by a Mars Rover on a specified date.
app.get('/photoUrls/:roverName/:photosDate/:pageNumber', async (req, res) => {
    const roverName = req.params.roverName;
    const photosDate = req.params.photosDate;
    const pageNumber = req.params.pageNumber;

    if (rovers[roverName]) {
        const aRover = rovers[roverName];
        const pageRecord = await getRoverPhotoUrls(aRover, photosDate, pageNumber);
        const returnPhotos = pageRecord.map((aRecord) => {return {id: aRecord.id, src: aRecord.src}});
        res.send(returnPhotos);

    } else {
        res.status(404).send("Unable to identify rover: " + roverName);
    }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
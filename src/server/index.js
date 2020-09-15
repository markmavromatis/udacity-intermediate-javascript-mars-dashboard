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

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', express.static(path.join(__dirname, '../public')))

// your API calls
console.log("Using API key: " + API_KEY);

class Rover {
    constructor(manifestData) {
        this.name = manifestData.name;
        this.landingDate = manifestData.landing_date;
        this.launchDate = manifestData.launch_date;
        this.status = manifestData.status;
        this.maxDate = manifestData.max_date;

        // Setup the photos information for the maximum date
        this.photosData = {};
        manifestData.photos.forEach((photoRecord) => {
            this.photosData[photoRecord.earth_date] = {};
            let newPhotoRecord = this.photosData[photoRecord.earth_date];
            newPhotoRecord.totalPhotos = photoRecord.total_photos;
        })
    }
}

async function getRoverDetails(roverName) {
    console.log("Querying Rover details for rover: " + roverName);

    const newRover = await fetch(`https://api.nasa.gov/mars-photos/api/v1/manifests/${roverName.toLowerCase()}?api_key=${API_KEY}`)
    .then(response => response.json())
    .then(async (data) => {
        const manifestData = data.photo_manifest;
        let newRover = new Rover(manifestData);
        return newRover;
    });
    return newRover;
}

async function getRoverPhotoUrls(rover, photoDate, page) {
    console.log(`Querying Rover photo details for rover/date: ${rover.name} / ${photoDate}`);

    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover.name.toLowerCase()}/photos?earth_date=${photoDate}&page=${page}&api_key=${API_KEY}`;

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

const ROVER_NAMES = List(['Curiosity', 'Opportunity', 'Spirit'])
let rovers = {};
console.log("Loading Rover details...");

// Initialize data for all Rovers
async function init() {
    for (name of ROVER_NAMES) {
        rovers[name] = await getRoverDetails(name);
    }
}


init().then(() => {
    console.log(`Loaded data for all ${ROVER_NAMES.length} rovers!`);
});


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
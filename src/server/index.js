require('dotenv').config()
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
            newPhotoRecord.pages = {};
            newPhotoRecord.totalPhotos = photoRecord.total_photos;
        })
        // this.Dates[maxDate].photoCount = 
    }
}

async function getRoverDetails(roverName) {
    console.log("Querying Rover details for rover: " + roverName);

    const newRover = await fetch(`https://api.nasa.gov/mars-photos/api/v1/manifests/${roverName.toLowerCase()}?api_key=${API_KEY}`)
    .then(response => response.json())
    .then(async (data) => {
        const manifestData = data.photo_manifest;
        let newRover = new Rover(manifestData);
        await getRoverPhotoDetails(newRover, newRover.maxDate, 0)
            // .then(() => {return newRover});
        return newRover;
    });
    return newRover;
}

async function getRoverPhotoDetails(rover, photoDate, page) {
    console.log(`Querying Rover photo details for rover/date: ${rover.name} / ${photoDate}`);

    if (rover.photosData[photoDate].pages[page]) {
        // Nothing to do. We already have the data.
        return;
    }
    const url = `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover.name.toLowerCase()}/photos?earth_date=${photoDate}&page=${page}&api_key=${API_KEY}`;
    console.log("URL = " + url);
    const photoDetails = await fetch(url)
    .then(response => response.json())
    .then(data => {
        const photoData = data.photos;
        let newPhotos = [];
        newPhotos = photoData.map((aRecord) => {return {id: aRecord.id, src : aRecord.img_src}})
        rover.photosData[photoDate].pages[page] = newPhotos;
    });
}

const ROVER_NAMES = ['Curiosity', 'Opportunity', 'Spirit']
let rovers = {};
console.log("Loading Rover details...");

// Initialize data for all Rovers
async function init() {
    for (name of ROVER_NAMES) {
        console.log("Calling getRoverDetails for: " + name)
        rovers[name] = await getRoverDetails(name);
    }
}
init().then(() => {
    console.log("New rover details: " + rovers['Curiosity']);
    console.log(JSON.stringify(rovers['Curiosity']));
    console.log("DONE!");    
});

// example API call
app.get('/apod', async (req, res) => {
    try {
        let image = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`)
            .then(res => res.json())
        res.send({ image })
    } catch (err) {
        console.log('error:', err);
    }
})

app.get('/roverDetails/:roverName', async (req, res) => {
    const roverName = req.params.roverName;
    console.log("Name = " + roverName);
    console.log("Known rovers = " + Object.keys(rovers));
    if (rovers[roverName]) {
        const aRover = rovers[roverName];
        res.send({name: aRover.name});
    } else {
        res.status(404).send("Unable to identify rover: " + roverName);
    }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
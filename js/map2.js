// Global variables
let map;
let lat = 0;
let lon = 0;
let zl = 5;
let path = '../Data/listings.csv';
let markers = L.layerGroup();

let geojsonPath = '../Data/neighbourhoods.geojson';
let geojson_data;
let geojson_layer;
let zoomdata = [];
let values = [];
let datafortable = [];
let data2;

let brew = new classyBrew();
let legend = L.control({ position: 'bottomright' });
let info_panel = L.control();

let fieldtomap = 'neighborhood';

// initialize
$(document).ready(function () {
    createMap(lat, lon, zl);
    getGeoJSON();
    readCSV(path);
});

// create the map
function createMap(lat, lon, zl) {
    map = L.map('map').setView([lat, lon], zl);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

function mapCSV(data) {

    // circle options
    let circleOptions = {
        radius: 4,
        weight: 1,
        color: 'black',
        fillColor: 'red',
        fillOpacity: 1,
        zIndexOffset: 1000
    }


    // loop through each entry
    data.data.forEach(function (item, index) {

        var popup = L.responsivePopup().setContent(`${item.name}<br> Room Type: ${item.room_type}  <br> Price: ${item.price} <br> Rating: ${item.review_scores_rating} /5 <br> <a href="${item.listing_url}"><img src="${item.picture_url}"  style = "max-width: 100%"
    style = "height: auto"> </a> `);
        // create marker
        let marker = L.circleMarker([item.latitude, item.longitude], circleOptions)
            .on('click', function () {
                this.bindPopup(popup).openPopup()
            })
        // add marker to featuregroup		
        markers.addLayer(marker)
    })

    // add featuregroup to map
    markers.addTo(map)

    // fit markers to map
    //map.fitBounds(markers.getBounds())
}

// function to get the geojson data
function getGeoJSON() {

    $.getJSON(geojsonPath, function (data) {
        console.log(data)

        // put the data in a global variable
        geojson_data = data;

        // call the map function
        mapGeoJSON(fieldtomap, 7, 'Reds') // add a field to be used
    })
}

function mapGeoJSON(field, num_classes, color, scheme) {

    // clear layers in case it has been mapped already
    if (geojson_layer) {
        geojson_layer.clearLayers()
    }

    // globalize the field to map
    fieldtomap = field;

    // based on the provided field, enter each value into the array
    geojson_data.features.forEach(function (item, index) {
        if ((item.properties[field] != undefined)) {
            values.push(item.properties[field])
        }
    })

    // set up the "brew" options
    brew.setSeries(values);
    brew.setNumClasses(num_classes);
    brew.setColorCode(color);
    brew.classify(scheme);

    // create the layer and add to map
    geojson_layer = L.geoJson(geojson_data, {
        style: getStyle, //call a function to style each feature
        onEachFeature: onEachFeature // actions on each feature
    }).addTo(map);
    map.fitBounds(geojson_layer.getBounds())

    // create the infopanel
    createInfoPanel();
}

// function to read csv data
function readCSV(path) {
    Papa.parse(path, {
        header: true,
        download: true,
        complete: function (csvdata) {
            console.log(csvdata);

            // map the csvdata
            mapCSV(csvdata);
        }
    });
}

function getStyle(feature) {
    return {
        stroke: true,
        color: 'blue',
        weight: 1,
        fill: true,
        fillColor: brew.getColorInRange(feature.properties[fieldtomap]),
        fillOpacity: 0.2

    }
}

function createInfoPanel() {

    info_panel.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this.update();
        return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    info_panel.update = function (properties) {
        // if feature is highlighted
        if (properties) {
            this._div.innerHTML = `<b>${properties['neighbourhood']}`;
        }
        // if feature is not highlighted
        else {
            this._div.innerHTML = 'Hover over a neighborhood';
        }
    };

    info_panel.addTo(map);
}

// Function that defines what will happen on user interactions with each feature
function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

// on mouse over, highlight the feature
function highlightFeature(e) {
    var layer = e.target;
    info_panel.update(layer.feature.properties);
}

// on mouse out, reset the style, otherwise, it will remain highlighted
function resetHighlight(e) {
    info_panel.update() // resets infopanel
}

// on mouse click on a feature, zoom in to it
function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}

function zoomTo(e) {
    map.fitBounds(geojson_layer.getLayers()[e - 1].getBounds());
}
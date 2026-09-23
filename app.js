
// ============================================================
// GEOTARU WEB APPLICATION
// ============================================================


// ------------------------------------------------------------
// Global variables
// ------------------------------------------------------------

let map;
let suitabilityLayer;


// ------------------------------------------------------------
// Class colors
// ------------------------------------------------------------

const classColors = {

    1: "#d73027",
    2: "#fc8d59",
    3: "#fee08b",
    4: "#91cf60",
    5: "#1a9850"

};


// ------------------------------------------------------------
// Load statistics and spatial data
// ------------------------------------------------------------

async function loadGeoTARU() {

    try {

        const statsResponse =
            await fetch(
                "data/statistics.json"
            );

        const stats =
            await statsResponse.json();


        const geojsonResponse =
            await fetch(
                "data/suitability_class.geojson"
            );

        const geojson =
            await geojsonResponse.json();


        populateDashboard(stats);

        initializeMap(geojson);

    }

    catch (error) {

        console.error(
            "GeoTARU loading error:",
            error
        );

        alert(
            "Unable to load GeoTARU data."
        );

    }

}


// ------------------------------------------------------------
// Populate dashboard
// ------------------------------------------------------------

function populateDashboard(stats) {


    // Model metrics

    document.getElementById(
        "accuracy"
    ).textContent =
        formatPercent(
            stats.model.accuracy
        );


    document.getElementById(
        "kappa"
    ).textContent =
        stats.model.kappa.toFixed(3);


    document.getElementById(
        "meanSuitability"
    ).textContent =
        Number(
            stats.final_suitability.mean
        ).toFixed(3);


    document.getElementById(
        "modeledArea"
    ).textContent =
        formatNumber(
            stats.area.total_modeled_area_ha
        );


    // Model details

    document.getElementById(
        "algorithm"
    ).textContent =
        stats.model.algorithm;


    document.getElementById(
        "trees"
    ).textContent =
        stats.model.trees;


    document.getElementById(
        "samples"
    ).textContent =
        formatNumber(
            stats.model.samples
        );


    document.getElementById(
        "accuracyDetail"
    ).textContent =
        formatPercent(
            stats.model.accuracy
        );


    document.getElementById(
        "kappaDetail"
    ).textContent =
        stats.model.kappa.toFixed(3);


    createClassChart(
        stats.area.classes
    );


    createFeatureImportance(
        stats.predictors
    );

}


// ------------------------------------------------------------
// Suitability chart
// ------------------------------------------------------------

function createClassChart(classes) {

    const container =
        document.getElementById(
            "classChart"
        );

    container.innerHTML = "";


    const maxArea =
        Math.max(
            ...classes.map(
                c => Number(c.area_ha)
            ),
            1
        );


    classes.forEach(c => {

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "chart-row";


        const label =
            document.createElement(
                "div"
            );

        label.className =
            "chart-label";


        label.innerHTML = `

            <span>
                ${c.class_name}
            </span>

            <span>
                ${formatNumber(c.area_ha)}
                ha
                (${Number(c.percentage).toFixed(2)}%)
            </span>

        `;


        const track =
            document.createElement(
                "div"
            );

        track.className =
            "chart-track";


        const bar =
            document.createElement(
                "div"
            );

        bar.className =
            "chart-bar";


        bar.style.width =
            `${(Number(c.area_ha) / maxArea) * 100}%`;


        bar.style.background =
            classColors[c.class];


        track.appendChild(bar);

        row.appendChild(label);

        row.appendChild(track);

        container.appendChild(row);

    });

}


// ------------------------------------------------------------
// Feature importance
// ------------------------------------------------------------

function createFeatureImportance(predictors) {

    const container =
        document.getElementById(
            "featureImportance"
        );

    container.innerHTML = "";


    const entries =
        Object.entries(
            predictors
        ).sort(
            (a, b) => b[1] - a[1]
        );


    entries.forEach(
        ([name, value]) => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "importance-row";


            const label =
                document.createElement(
                    "div"
                );

            label.className =
                "importance-label";


            label.innerHTML = `

                <span>
                    ${name}
                </span>

                <span>
                    ${(value * 100).toFixed(1)}%
                </span>

            `;


            const track =
                document.createElement(
                    "div"
                );

            track.className =
                "importance-track";


            const bar =
                document.createElement(
                    "div"
                );

            bar.className =
                "importance-bar";


            bar.style.width =
                `${value * 100}%`;


            track.appendChild(bar);

            row.appendChild(label);

            row.appendChild(track);

            container.appendChild(row);

        }
    );

}


// ------------------------------------------------------------
// Initialize map
// ------------------------------------------------------------

function initializeMap(geojson) {


    map =
        L.map(
            "map"
        );


    // OpenStreetMap basemap

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 19,
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    ).addTo(map);


    // Suitability polygons

    suitabilityLayer =
        L.geoJSON(
            geojson,
            {

                style:
                    function(feature) {

                        const classId =
                            feature.properties.class;

                        return {

                            fillColor:
                                classColors[classId],

                            color:
                                "#555",

                            weight:
                                0.5,

                            fillOpacity:
                                0.8

                        };

                    },


                onEachFeature:
                    function(
                        feature,
                        layer
                    ) {

                        const p =
                            feature.properties;


                        layer.bindPopup(`

                            <div
                                style="
                                font-family:
                                Arial;
                                min-width:
                                170px;
                                "
                            >

                                <strong>
                                    Development
                                    Suitability
                                </strong>

                                <hr>

                                <b>Class:</b>
                                ${p.class}

                                <br>

                                <b>Category:</b>
                                ${p.class_name}

                            </div>

                        `);

                    }

            }
        ).addTo(map);


    // Zoom to data

    if (
        suitabilityLayer
            .getBounds()
            .isValid()
    ) {

        map.fitBounds(
            suitabilityLayer
                .getBounds()
        );

    }


    // Opacity control

    const opacitySlider =
        document.getElementById(
            "mapOpacity"
        );


    opacitySlider.addEventListener(
        "input",
        function() {

            suitabilityLayer.setStyle({

                fillOpacity:
                    Number(
                        this.value
                    )

            });

        }
    );

}


// ------------------------------------------------------------
// Formatting
// ------------------------------------------------------------

function formatNumber(value) {

    return Number(
        value
    ).toLocaleString(
        undefined,
        {
            maximumFractionDigits: 2
        }
    );

}


function formatPercent(value) {

    return (
        Number(value) * 100
    ).toFixed(1) + "%";

}


// ------------------------------------------------------------
// Start application
// ------------------------------------------------------------

loadGeoTARU();

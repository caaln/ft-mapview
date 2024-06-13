let map;
let openMarkers = 0;

async function initMap() {
    const [key, entities] = window.location.hash.split('|||');
    const isLatLng = /-?\d+?.\d+?,-?\d+?.\d+?/;

    if (!key || !entities) {
        return;
    }

    const {Map} = await google.maps.importLibrary("maps");
    const {AdvancedMarkerElement} = await google.maps.importLibrary("marker");
    const {Geocoder} = await google.maps.importLibrary("geocoding");
    const geocoder = new Geocoder();
    const bounds = new google.maps.LatLngBounds();

    function createMarker(map, content, position) {
        bounds.extend(position);
        const marker = new AdvancedMarkerElement({
            map,
            content,
            position,
        });

        marker.addListener('click', function () {
            const classList = marker.content.classList;
            if (classList.contains('open')) {
                classList.remove('open');
                openMarkers -= 1
                marker.zIndex = null;
            } else {
                classList.add('open');
                openMarkers += 1
                marker.zIndex = 10 + openMarkers;
            }
        });

        markers.push(marker);
    }

    const position = {lat: 54.00366, lng: -2.547855};
    map = new Map(document.getElementById("map"), {
        zoom: 4,
        center: position,
        mapId: "ancestry_map",
    });

    const markers = [];
    const promises = [];

    for (let entity of entities.split('|:|')) {
        let [address, background, icon, details] = decodeURIComponent(entity).split('|;|');

        if (isLatLng.test(address)) {
            const position = new google.maps.LatLng(...address.split(','));
            createMarker(map, buildContent(background, icon, details), position);
        } else {
            promises.push(geocoder.geocode({address}).then(function ({results}) {
                const position = results[0].geometry.location;
                createMarker(map, buildContent(background, icon, details), position);
            }));
        }
    }

    try {
        await Promise.all(promises);
    } finally {
        map.fitBounds(bounds);
    }
}

function buildContent(background, icon, details) {
    const content = document.createElement("div");

    content.classList.add("marker");
    content.style.setProperty("--marker-color", background);
    content.innerHTML = `
        <div class="icon">
            <i aria-hidden="true" class="fa fa-icon fa-${icon}" title="${icon}"></i>
            <span class="fa-sr-only">${icon}</span>
        </div>
        <div class="details">
            ${details}
        </div>
    `;
    return content;
}

async function initMap2() {
    // The location of Uluru
    const position = { lat: -25.344, lng: 131.031 };
    // Request needed libraries.
    //@ts-ignore
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    // The map, centered at Uluru
    map = new Map(document.getElementById("map"), {
        zoom: 4,
        center: position,
        mapId: "DEMO_MAP_ID",
    });

    // The marker, positioned at Uluru
    const marker = new AdvancedMarkerElement({
        map: map,
        position: position,
        title: "Uluru",
    });
}


initMap();

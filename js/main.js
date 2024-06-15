let map;
let openMarkers = 0;
const isLatLng = /-?\d+?.\d+?,-?\d+?.\d+?/;

async function initMap() {
    const [key, entities] = window.location.hash.split('|||');

    if (!key || !entities) {
        return;
    }

    const {Map} = await google.maps.importLibrary("maps");
    const {AdvancedMarkerElement} = await google.maps.importLibrary("marker");
    const {Geocoder} = await google.maps.importLibrary("geocoding");
    const geocoder = new Geocoder();
    const bounds = new google.maps.LatLngBounds();
    const markers = [];

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

    const locations = await getLocations(geocoder, entities);
    console.log(locations);

    for(const { position, items } of locations.values()) {
        createMarker(map, buildContent(items), position);
    }

    map.fitBounds(bounds);
}

async function getLocations(geocoder, entities) {
    const locations = new Map();
    const promises = [];

    for (let entity of entities.split('|:|')) {
        let [address, background, icon, details] = decodeURIComponent(entity).split('|;|');

        if (isLatLng.test(address)) {
            const position = new google.maps.LatLng(...address.split(','));
            addLocation(locations, position, background, icon, details);
        } else {
            promises.push(geocoder.geocode({address}).then(function ({results}) {
                const position = results[0].geometry.location;
                addLocation(locations, position, background, icon, details);
            }));
        }
    }

    try {
        await Promise.all(promises);
    } catch (e) {
        console.log(e);
    }

    return locations;
}

function addLocation(locations, position, background, icon, details) {
    const key = `${position.lat()},${position.lng()}`;
    const item = {background, icon, details};
    if(locations.has(key)) {
        locations.get(key).items.push(item);
    } else {
        locations.set(key, { position, items: [item] });
    }

    return locations;
}

function buildContent(items) {
    let data = null;
    let details = [];

    for(const item of items) {
        details.push(`
            <div class="line" style="--marker-color: ${item.background}">
                <div class="line-icon">
                    <i aria-hidden="true" class="fa fa-icon fa-${item.icon}" title="${item.icon}"></i>
                    <span class="fa-sr-only">${item.icon}</span>
                </div>
                <div class="line-details">
                    ${item.details}
                </div>
            </div>
        `);

        if (data === null) {
            data = item;
        } else {
            if (data.background !== item.background) {
                data.background = 'black';
            }
            if (data.icon !== item.icon) {
                data.icon = 'list';
            }
        }
    }

    const content = document.createElement("div");

    content.classList.add("marker");
    content.style.setProperty("--marker-color", data.background);
    content.innerHTML = `
        <div class="icon">
            <i aria-hidden="true" class="fa fa-icon fa-${data.icon}" title="${data.icon}"></i>
            <span class="fa-sr-only">${data.icon}</span>
        </div>
        <div class="details">
            ${details.join("")}
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

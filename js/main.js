let map;
let openMarkers = 0;
const isLatLng = /-?\d+?.\d+?,-?\d+?.\d+?/;

const markers = [];
const hiddenLegendKeys = new Set();

async function initMap() {
    const {key, pins, legend, duplicateKey} = JSON.parse(decodeURIComponent(window.location.hash.substring(1).replaceAll('^', '"')));

    if (!key || !pins) {
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
    const mapEl = document.getElementById("map");
    map = new Map(mapEl, {
        zoom: 4,
        center: position,
        mapId: "ancestry_map",
    });

    const locations = await getLocations(geocoder, pins);


    const hasComposite = [...locations.values()].some(({items}) => {
        return items.length > 1 && new Set([...items.map(({legendKey}) => legendKey)]).size > 1
    });

    const legendData = hasComposite ? {
        [duplicateKey]: ['#000000', 'Various'],
        ...legend,
    } : legend;

    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(createLegend(mapEl, legendData));

    for(const { position, items } of locations.values()) {
        createMarker(map, buildContent(legendData, items, duplicateKey), position);
    }

    map.fitBounds(bounds);
}

function createLegend(mapEl, legendData) {
    const ul = document.createElement('ul');
    ul.classList.add('legend');
    mapEl.after(ul);

    Object.entries(legendData).forEach(([key, item]) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="color" style="background-color: ${item[0]}"></div>
            <div class="label">${item[1]}</div>
        `;
        li.addEventListener('click', () => toggleLegendItem(key));
        ul.appendChild(li);
    });

    return ul;
}

async function getLocations(geocoder, entities) {
    const locations = new Map();
    const promises = [];

    for (let entity of entities) {
        let [address, legendKey, icon, details] = entity;

        if (isLatLng.test(address)) {
            const position = new google.maps.LatLng(...address.split(','));
            addLocation(locations, position, legendKey, icon, details);
        } else {
            promises.push(geocoder.geocode({address}).then(function ({results}) {
                const position = results[0].geometry.location;
                addLocation(locations, position, legendKey, icon, details);
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

function addLocation(locations, position, legendKey, icon, details) {
    const key = `${position.lat()},${position.lng()}`;
    const item = {legendKey, icon, details};
    if(locations.has(key)) {
        locations.get(key).items.push(item);
    } else {
        locations.set(key, { position, items: [item] });
    }

    return locations;
}

function buildContent(legend, items, duplicateKey) {
    let data = null;
    let details = [];

    for(const item of items) {
        const legendKey = parseInt(item.legendKey, 10);
        const color = legend[legendKey][0];
        details.push(`
            <div class="line" style="--marker-color: ${color}">
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
            if (data.legendKey !== item.legendKey) {
                data.legendKey = duplicateKey;
            }
            if (data.icon !== item.icon) {
                data.icon = 'list';
            }
        }
    }

    const content = document.createElement("div");
    content.classList.add("marker");
    content.style.setProperty("--marker-color", legend[data.legendKey][0]);
    content.dataset.legendKey = data.legendKey;
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

function toggleLegendItem(key) {
    if(hiddenLegendKeys.has(key)) {
        markers.forEach((marker) => {
            if(marker.content.dataset.legendKey === key) {
                marker.map = map;
            }
        });
        hiddenLegendKeys.delete(key);
    } else {
        markers.forEach((marker) => {
            if(marker.content.dataset.legendKey === key) {
                marker.map = null;
            }
        });
        hiddenLegendKeys.add(key);
    }

}


initMap();

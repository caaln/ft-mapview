async function geocode() {
    const [key, entities] = window.location.hash.split('|||');

    if(!key || !entities) {
        return;
    }

    const { Geocoder } = await google.maps.importLibrary("geocoding");
    const geocoder = new Geocoder();

    const promises = [];
    const geocodeResults = new Map();

    for(let address of decodeURIComponent(entities).split('|:|')) {
        console.log(address);
        promises.push(geocoder.geocode({ address }).then(function ({ results }) {
            const position = results?.[0]?.geometry?.location ?? 'Unknown';
            geocodeResults.set(address, position);
        }));
    }

    await Promise.all(promises);

    let html = '';
    for(let [k,v] of geocodeResults.entries()) {
        html += `${k}: ${v}\n`;
    }
    document.getElementById('geocode-results').innerHTML = html;
}

geocode();

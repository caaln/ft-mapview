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
        promises.push(geocoder.geocode({ address }).then(function ({ results, status }) {
            const position = results?.[0]?.geometry?.location ?? null;
            geocodeResults.set(address, position);
        }).catch(() => {
            geocodeResults.set(address, null);
        }));
    }

    await Promise.all(promises);

    let html = '';
    for(let [k,v] of geocodeResults.entries()) {
        console.log(v);
        if(!v) {
            html += `<tr><td>${k}</td><td>?</td><td>?</td></tr>\n`;
        } else {
            html += `<tr><td>${k}</td><td>${v.lat()}</td><td>${v.lng()}</td></tr>\n`;
        }
    }
    document.getElementById('geocode-results').innerHTML = `<table>${html}</table>`;
}

geocode();

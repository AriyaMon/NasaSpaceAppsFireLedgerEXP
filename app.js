/* FireLedger frontend. No credentials or private database access belong here. */
const map = L.map("map", { scrollWheelZoom: true }).setView([56.5, -106.0], 4);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let fireLayer = L.layerGroup().addTo(map);
let populationLayer = L.layerGroup().addTo(map);
let observations = [];

const selection = document.getElementById("selection");
const briefing = document.getElementById("briefing");
const roleSelect = document.getElementById("role");

const roleLabels = {
  firefighter: "Firefighter",
  medical: "Ambulance / medical",
  emergency: "Emergency responder",
  scientist: "Scientist / analyst",
  land: "Land manager"
};

function selectArea(latlng) {
  selection.textContent = `Selected coordinates: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}. No incident data is connected yet.`;
  briefing.textContent = `Area selected for ${roleLabels[roleSelect.value]}. Once the verified Canadian 2023 observation feed is published, FireLedger will summarize fire type or fuel context, FRP-based fire activity, and nearby settlement distances where those data are available.`;
}
map.on("click", event => selectArea(event.latlng));

function validCanadian2023(feature) {
  const p = feature.properties || {};
  const date = p.acq_date || p.date || p.datetime;
  const year = date ? new Date(date).getUTCFullYear() : null;
  const [lng, lat] = feature.geometry.coordinates;
  // Broad Canada bounding envelope; replace with a true national boundary test
  // in the data-preparation pipeline before publishing the production feed.
  return year === 2023 && lat >= 41 && lat <= 84 && lng >= -141 && lng <= -52;
}

function drawObservations(features) {
  fireLayer.clearLayers();
  populationLayer.clearLayers();
  observations = features.filter(f =>
    f.geometry && f.geometry.type === "Point" &&
    Array.isArray(f.geometry.coordinates) &&
    validCanadian2023(f)
  );

  observations.forEach(feature => {
    const [lng, lat] = feature.geometry.coordinates;
    const p = feature.properties || {};
    const marker = L.circleMarker([lat, lng], {
      radius: 5, color: "#8d3e25", weight: 1,
      fillColor: "#e97843", fillOpacity: 0.85
    });
    marker.bindPopup(`<strong>Fire observation</strong><br>Date: ${p.acq_date || p.date || "Not supplied"}<br>FRP: ${p.frp ?? "Not supplied"}<br><small>FRP is not fireline intensity.</small>`);
    marker.on("click", () => {
      selection.textContent = `Observation at ${lat.toFixed(4)}, ${lng.toFixed(4)} · ${p.acq_date || p.date || "Date unavailable"}`;
      briefing.textContent = "Observation selected. Role-specific interpretation requires validated fuel, intensity, and settlement datasets.";
    });
    fireLayer.addLayer(marker);

    if (p.near_population === true || p.population_proximity === true) {
      L.circleMarker([lat, lng], {
        radius: 9, color: "#9b702c", weight: 1,
        fillColor: "#e9bd67", fillOpacity: 0.18
      }).bindPopup("Population-proximity screening flag. This does not confirm exposure.")
        .addTo(populationLayer);
    }
  });
  document.querySelector(".map-status").textContent = `${observations.length} OBSERVATIONS LOADED`;
}

document.getElementById("fires-toggle").addEventListener("change", e => {
  if (e.target.checked) map.addLayer(fireLayer); else map.removeLayer(fireLayer);
});
document.getElementById("population-toggle").addEventListener("change", e => {
  if (e.target.checked) map.addLayer(populationLayer); else map.removeLayer(populationLayer);
});
roleSelect.addEventListener("change", () => {
  briefing.textContent = `Role set to ${roleLabels[roleSelect.value]}. Select an area or observation to inspect available intelligence.`;
});

// The data file will be supplied later by the processing notebook.
// Missing data is expected during the current frontend setup phase.
fetch("data/fire_observations.geojson")
  .then(response => {
    if (!response.ok) throw new Error("Observation feed not published yet");
    return response.json();
  })
  .then(data => drawObservations(data.features || []))
  .catch(() => {
    document.querySelector(".map-status").textContent = "AWAITING DATA FEED";
    briefing.textContent = "The map is ready. No fire observations are published yet; the interface will populate when the verified Canada 2023 GeoJSON feed is added.";
  });
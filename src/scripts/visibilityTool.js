import { localSiderealTime, raDecToAltAz } from "../lib/astroTime";
import { getStoredLocation, setStoredLocation } from "../lib/locationStorage";
import { showLocationPrompt } from "./locationPrompt.js";

const COMPONENT_SELECTOR = '[data-component="visibility-tool"]';
const DATA_URL = "/data/radio_sources_basic.json";

const SOURCE_ICONS = {
  "radio galaxy": "🌀",
  "supernova remnant": "💥",
  "h ii region": "☁️",
  pulsar: "⏱️",
  "galactic center": "✨",
};

const LEVEL_ICONS = {
  beginner: "🌱",
  advanced: "🚀",
};

let cachedSources = null;

async function loadSources() {
  if (cachedSources) return cachedSources;
  const resp = await fetch(DATA_URL);
  if (!resp.ok) {
    throw new Error(`Failed to load sources (${resp.status})`);
  }
  cachedSources = await resp.json();
  return cachedSources;
}

function formatAlt(deg) {
  return `${deg.toFixed(1)}°`;
}

function formatAz(deg) {
  return `${deg.toFixed(0)}°`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initVisibilityTool(root) {
  const form = root.querySelector(".vis-form");
  if (!form) return;

  const useNow = form.querySelector('input[name="useNow"]');
  const dateInput = form.querySelector('input[name="datetime"]');
  const latInput = form.querySelector('input[name="latitude"]');
  const lonInput = form.querySelector('input[name="longitude"]');
  const minElInput = form.querySelector('input[name="minElevation"]');

  const summaryField = root.querySelector('[data-field="summary"]');
  const tableBody = root.querySelector('[data-field="results"]');
  const updateLocationBtn = root.querySelector('[data-action="updateLocation"]');

  if (!useNow || !dateInput || !latInput || !lonInput || !minElInput || !tableBody || !summaryField) {
    console.warn("Visibility tool missing required elements");
    return;
  }

  const storedLocation = getStoredLocation();
  if (storedLocation) {
    latInput.value = storedLocation.latitude.toFixed(5);
    lonInput.value = storedLocation.longitude.toFixed(5);
  } else {
    summaryField.textContent = "Please set your location to see visible sources.";
    tableBody.innerHTML = `<tr><td colspan="7">Waiting for location...</td></tr>`;
  }

  if (updateLocationBtn) {
    updateLocationBtn.addEventListener("click", () => {
      showLocationPrompt();
    });
  }

  document.addEventListener("locationSaved", (e) => {
    const { latitude, longitude } = e.detail;
    latInput.value = latitude.toFixed(5);
    lonInput.value = longitude.toFixed(5);
    update();
  });


  const renderRows = (entries) => {
    if (!entries.length) {
      tableBody.innerHTML = `<tr><td colspan="7">No sources loaded.</td></tr>`;
      return;
    }

    tableBody.innerHTML = entries
      .map((entry) => {
        const visibilityLabel = entry.visible ? "Visible" : "Below horizon";
        const sourceIcon = SOURCE_ICONS[entry.type.toLowerCase()] || "📡";
        const levelIcon = LEVEL_ICONS[entry.category.toLowerCase()] || "⭐";
        return `
          <tr class="${entry.visible ? "visible" : ""}">
            <td>
              <strong>${entry.name}</strong>
              <div class="notes">${entry.notes}</div>
            </td>
            <td title="${entry.type}">
              <span class="source-icon" aria-label="${entry.type}" role="img">${sourceIcon}</span>
            </td>
            <td title="${entry.category}">
              <span class="source-icon" aria-label="${entry.category}" role="img">${levelIcon}</span>
            </td>
            <td>${formatAlt(entry.altitude)}</td>
            <td>${formatAz(entry.azimuth)}</td>
            <td>${formatTime(entry.transitDate)}</td>
            <td>${visibilityLabel}</td>
          </tr>
        `;
      })
      .join("");
  };

  const update = async () => {
    summaryField.textContent = "Computing visibility…";
    dateInput.disabled = useNow.checked;

    let sources = [];
    try {
      sources = await loadSources();
    } catch (err) {
      console.error(err);
      summaryField.textContent = "Failed to load source catalog.";
      tableBody.innerHTML = `<tr><td colspan="7">Could not load sources.</td></tr>`;
      return;
    }

    const now = new Date();
    const date = useNow.checked && !dateInput.value ? now : new Date(dateInput.value || now.toISOString());
    const latitude = Number(latInput.value) || 0;
    const longitude = Number(lonInput.value) || 0;
    const minElevation = Number(minElInput.value) || 0;
    const lst = localSiderealTime(date, { latitudeDeg: latitude, longitudeDeg: longitude });

    const entries = sources.map((src) => {
      const raHours = src.ra_deg / 15;
      const hHours = ((raHours - lst) % 24 + 24) % 24;
      const transitDate = new Date(date.getTime() + hHours * 3600 * 1000);
      const { altitude, azimuth } = raDecToAltAz(lst, src.ra_deg, src.dec_deg, {
        latitudeDeg: latitude,
        longitudeDeg: longitude,
      });
      return {
        ...src,
        altitude,
        azimuth,
        visible: altitude >= minElevation,
        transitDate,
      };
    });

    entries.sort((a, b) => {
      if (a.visible === b.visible) {
        return b.altitude - a.altitude;
      }
      return a.visible ? -1 : 1;
    });

    const visibleCount = entries.filter((e) => e.visible).length;
    summaryField.textContent = `${visibleCount} / ${entries.length} sources above ${minElevation}°`;
    renderRows(entries);
  };

  form.addEventListener("input", () => {
    const lat = Number(latInput.value);
    const lon = Number(lonInput.value);
    if (!isNaN(lat) && !isNaN(lon)) {
      setStoredLocation(lat, lon);
    }
    update();
  });

  setInterval(update, 10_000);
  update();
}

function initAll() {
  document.querySelectorAll(COMPONENT_SELECTOR).forEach((root) => {
    if (!root._visibilityInitialized) {
      initVisibilityTool(root);
      root._visibilityInitialized = true;
    }
  });
}

export default function setupVisibilityTool() {
  if (["interactive", "complete"].includes(document.readyState)) {
    initAll();
  } else {
    document.addEventListener("DOMContentLoaded", initAll, { once: true });
  }

  document.addEventListener("astro:after-swap", initAll);
  document.addEventListener("astro:page-load", initAll);
}


// Auto-run when loaded in the browser
if (typeof window !== "undefined") {
    setupVisibilityTool();
  }


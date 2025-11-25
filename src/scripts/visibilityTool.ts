import { localSiderealTime, raDecToAltAz } from "../lib/astroTime";

const COMPONENT_SELECTOR = '[data-component="visibility-tool"]';
const DATA_URL = "/data/radio_sources_basic.json";

const SOURCE_ICONS: Record<string, string> = {
  "radio galaxy": "🌀",
  "supernova remnant": "💥",
  "h ii region": "☁️",
  pulsar: "⏱️",
  "galactic center": "✨",
};

const LEVEL_ICONS: Record<string, string> = {
  beginner: "🌱",
  advanced: "🚀",
};

type RadioSource = {
  id: string;
  name: string;
  ra_deg: number;
  dec_deg: number;
  type: string;
  category: string;
  freq_ghz: number;
  notes: string;
  refs: string[];
};

type VisibilityEntry = RadioSource & {
  altitude: number;
  azimuth: number;
  visible: boolean;
  transitDate: Date;
};

let cachedSources: RadioSource[] | null = null;

async function loadSources(): Promise<RadioSource[]> {
  if (cachedSources) return cachedSources;
  const resp = await fetch(DATA_URL);
  if (!resp.ok) {
    throw new Error(`Failed to load sources (${resp.status})`);
  }
  cachedSources = await resp.json();
  return cachedSources;
}

function formatAlt(deg: number): string {
  return `${deg.toFixed(1)}°`;
}

function formatAz(deg: number): string {
  return `${deg.toFixed(0)}°`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function initVisibilityTool(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>(".vis-form");
  if (!form) return;

  const useNow = form.querySelector<HTMLInputElement>('input[name="useNow"]');
  const dateInput = form.querySelector<HTMLInputElement>('input[name="datetime"]');
  const latInput = form.querySelector<HTMLInputElement>('input[name="latitude"]');
  const lonInput = form.querySelector<HTMLInputElement>('input[name="longitude"]');
  const minElInput = form.querySelector<HTMLInputElement>('input[name="minElevation"]');

  const statusField = root.querySelector<HTMLElement>('[data-field="status"]');
  const summaryField = root.querySelector<HTMLElement>('[data-field="summary"]');
  const tableBody = root.querySelector<HTMLTableSectionElement>('[data-field="results"]');
  const useLocationBtn = root.querySelector<HTMLButtonElement>('[data-action="useLocation"]');

  if (!useNow || !dateInput || !latInput || !lonInput || !minElInput || !tableBody || !summaryField) {
    console.warn("Visibility tool missing required elements");
    return;
  }

  const setStatus = (text: string, isError = false) => {
    if (!statusField) return;
    statusField.textContent = text;
    statusField.style.color = isError ? "var(--an-pink)" : "var(--an-grey)";
  };

  const applyLocation = (lat: number, lon: number) => {
    latInput.value = lat.toFixed(3);
    lonInput.value = lon.toFixed(3);
    setStatus(`Using ${lat.toFixed(2)}, ${lon.toFixed(2)}`);
    update();
  };

  if (useLocationBtn) {
    useLocationBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        setStatus("Geolocation not supported in this browser.", true);
        return;
      }
      setStatus("Fetching location...");
      navigator.geolocation.getCurrentPosition(
        (pos) => applyLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          console.error("Geolocation error", err);
          setStatus("Could not fetch location.", true);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60_000 }
      );
    });
  }

  const renderRows = (entries: VisibilityEntry[]) => {
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

    let sources: RadioSource[] = [];
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

    const entries: VisibilityEntry[] = sources.map((src) => {
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

  form.addEventListener("input", update);
  setInterval(update, 60_000);
  update();
}

function initAll() {
  document.querySelectorAll<HTMLElement>(COMPONENT_SELECTOR).forEach((root) => {
    if (!(root as any)._visibilityInitialized) {
      initVisibilityTool(root);
      (root as any)._visibilityInitialized = true;
    }
  });
}

const readyStates: DocumentReadyState[] = ["interactive", "complete"];
if (readyStates.includes(document.readyState)) {
  initAll();
} else {
  document.addEventListener("DOMContentLoaded", initAll, { once: true });
}

document.addEventListener("astro:after-swap" as any, initAll);
document.addEventListener("astro:page-load" as any, initAll);



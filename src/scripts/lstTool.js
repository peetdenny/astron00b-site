import { localSiderealTime, hoursToHms } from "../lib/astroTime";
import { getStoredLocation, setStoredLocation } from "../lib/locationStorage";

const COMPONENT_SELECTOR = '[data-component="lst-tool"]';

function initLSTTool(root) {
  const form = root.querySelector(".lst-form");
  if (!form) return;

  const useNow = form.querySelector('input[name="useNow"]');
  const dateInput = form.querySelector('input[name="datetime"]');
  const latInput = form.querySelector('input[name="latitude"]');
  const lonInput = form.querySelector('input[name="longitude"]');

  const localField = root.querySelector('[data-field="localTime"]');
  const utcField = root.querySelector('[data-field="utcTime"]');
  const lstField = root.querySelector('[data-field="lst"]');

  const statusField = root.querySelector('[data-field="status"]');
  const useLocationBtn = root.querySelector('[data-action="useLocation"]');

  if (!useNow || !dateInput || !latInput || !lonInput || !localField || !utcField || !lstField) {
    console.warn("LST tool missing one or more required elements");
    return;
  }

  const two = (val) => String(val).padStart(2, "0");
  const formatTime = (date) => `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`;

  const setStatus = (text, isError = false) => {
    if (!statusField) return;
    statusField.textContent = text;
    statusField.style.color = isError ? "var(--an-pink)" : "var(--an-grey)";
  };

  const update = () => {
    const now = new Date();
    const useCurrent = useNow.checked;
    const date = useCurrent && !dateInput.value ? now : new Date(dateInput.value || now.toISOString());

    const latitude = Number(latInput.value) || 0;
    const longitude = Number(lonInput.value) || 0;

    const lst = localSiderealTime(date, { latitudeDeg: latitude, longitudeDeg: longitude });
    const { h, m, s } = hoursToHms(lst);

    localField.textContent = formatTime(date);
    utcField.textContent = formatTime(new Date(date.toISOString()));
    lstField.textContent = `${two(h)}:${two(m)}:${two(s)}`;

    dateInput.disabled = useCurrent;
  };

  const storedLocation = getStoredLocation();
  if (storedLocation) {
    latInput.value = storedLocation.latitude.toFixed(5);
    lonInput.value = storedLocation.longitude.toFixed(5);
  }

  const applyLocation = (lat, lon) => {
    latInput.value = lat.toFixed(5);
    lonInput.value = lon.toFixed(5);
    setStoredLocation(lat, lon);
    setStatus(`Using ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
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
        (pos) => {
          const { latitude, longitude } = pos.coords;
          applyLocation(latitude, longitude);
        },
        (err) => {
          console.error("Geolocation error", err);
          setStatus("Could not fetch location.", true);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60_000,
        }
      );
    });
  }

  form.addEventListener("input", () => {
    const lat = Number(latInput.value);
    const lon = Number(lonInput.value);
    if (!isNaN(lat) && !isNaN(lon)) {
      setStoredLocation(lat, lon);
    }
    update();
  });
  setInterval(update, 1000);
  update();
}

function initAll() {
  document.querySelectorAll(COMPONENT_SELECTOR).forEach((root) => {
    if (!root._lstInitialized) {
      initLSTTool(root);
      root._lstInitialized = true;
    }
  });
}

export default function setupLSTTool() {
  if (["interactive", "complete"].includes(document.readyState)) {
    initAll();
  } else {
    document.addEventListener("DOMContentLoaded", initAll, { once: true });
  }

  document.addEventListener("astro:after-swap", initAll);
  document.addEventListener("astro:page-load", initAll);
}



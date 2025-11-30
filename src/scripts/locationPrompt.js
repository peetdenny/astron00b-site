import { setStoredLocation, hasStoredLocation } from "../lib/locationStorage";

const COMPONENT_SELECTOR = '[data-component="location-prompt"]';
const MODAL_VISIBLE_CLASS = "modal-visible";

function showModal() {
  const modal = document.querySelector(COMPONENT_SELECTOR);
  if (modal) {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
}

function hideModal() {
  const modal = document.querySelector(COMPONENT_SELECTOR);
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "";
  }
}

function initLocationPrompt() {
  const modal = document.querySelector(COMPONENT_SELECTOR);
  if (!modal) return;

  const form = modal.querySelector(".location-form");
  const latInput = form.querySelector('input[name="latitude"]');
  const lonInput = form.querySelector('input[name="longitude"]');
  const useLocationBtn = form.querySelector('[data-action="useLocation"]');
  const statusField = form.querySelector('[data-field="status"]');

  const setStatus = (text, isError = false) => {
    if (statusField) {
      statusField.textContent = text;
      statusField.className = isError ? "status-message error" : "status-message";
    }
  };

  const saveLocation = (lat, lon) => {
    if (setStoredLocation(lat, lon)) {
      hideModal();
      const event = new CustomEvent("locationSaved", { detail: { latitude: lat, longitude: lon } });
      document.dispatchEvent(event);
      setStatus("");
    } else {
      setStatus("Failed to save location.", true);
    }
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
          latInput.value = latitude.toFixed(5);
          lonInput.value = longitude.toFixed(5);
          setStatus(`Found: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
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

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const lat = Number(latInput.value);
    const lon = Number(lonInput.value);

    if (isNaN(lat) || isNaN(lon)) {
      setStatus("Please enter valid coordinates.", true);
      return;
    }

    if (lat < -90 || lat > 90) {
      setStatus("Latitude must be between -90 and 90.", true);
      return;
    }

    if (lon < -180 || lon > 180) {
      setStatus("Longitude must be between -180 and 180.", true);
      return;
    }

    saveLocation(lat, lon);
  });

  const backdrop = modal.querySelector(".modal-backdrop");
  if (backdrop) {
    backdrop.addEventListener("click", () => {
      if (!hasStoredLocation()) {
        setStatus("Location is required to use this feature.", true);
      }
    });
  }

  if (!hasStoredLocation()) {
    showModal();
  }
}

function initAll() {
  document.querySelectorAll(COMPONENT_SELECTOR).forEach((root) => {
    if (!root._locationPromptInitialized) {
      initLocationPrompt();
      root._locationPromptInitialized = true;
    }
  });
}

export function showLocationPrompt() {
  showModal();
}

export default function setupLocationPrompt() {
  if (["interactive", "complete"].includes(document.readyState)) {
    initAll();
  } else {
    document.addEventListener("DOMContentLoaded", initAll, { once: true });
  }

  document.addEventListener("astro:after-swap", initAll);
  document.addEventListener("astro:page-load", initAll);
}

if (typeof window !== "undefined") {
  setupLocationPrompt();
}


import { localSiderealTime, hoursToHms } from "../lib/astroTime.js";
import { getStoredLocation } from "../lib/locationStorage.js";

const LST_SELECTOR = '[data-field="header-lst"]';

function updateLST() {
  const lstElement = document.querySelector(LST_SELECTOR);
  if (!lstElement) return;

  const location = getStoredLocation();
  if (!location) {
    lstElement.textContent = "LST: --:--:--";
    return;
  }

  const now = new Date();
  const lst = localSiderealTime(now, {
    latitudeDeg: location.latitude,
    longitudeDeg: location.longitude,
  });
  const { h, m, s } = hoursToHms(lst);
  const two = (val) => String(val).padStart(2, "0");
  lstElement.textContent = `LST: ${two(h)}:${two(m)}:${two(s)}`;
}

function initHeaderLST() {
  updateLST();
  setInterval(updateLST, 1000);
}

export default function setupHeaderLST() {
  if (["interactive", "complete"].includes(document.readyState)) {
    initHeaderLST();
  } else {
    document.addEventListener("DOMContentLoaded", initHeaderLST, { once: true });
  }

  document.addEventListener("astro:after-swap", initHeaderLST);
  document.addEventListener("astro:page-load", initHeaderLST);
  document.addEventListener("locationSaved", () => {
    updateLST();
  });
}

if (typeof window !== "undefined") {
  setupHeaderLST();
}


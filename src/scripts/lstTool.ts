import { localSiderealTime, hoursToHms } from "../lib/astroTime";

const COMPONENT_SELECTOR = '[data-component="lst-tool"]';

function initLSTTool(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>(".lst-form");
  if (!form) return;

  const useNow = form.querySelector<HTMLInputElement>('input[name="useNow"]');
  const dateInput = form.querySelector<HTMLInputElement>('input[name="datetime"]');
  const latInput = form.querySelector<HTMLInputElement>('input[name="latitude"]');
  const lonInput = form.querySelector<HTMLInputElement>('input[name="longitude"]');

  const localField = root.querySelector<HTMLElement>('[data-field="localTime"]');
  const utcField = root.querySelector<HTMLElement>('[data-field="utcTime"]');
  const lstField = root.querySelector<HTMLElement>('[data-field="lst"]');

  const statusField = root.querySelector<HTMLElement>('[data-field="status"]');
  const useLocationBtn = root.querySelector<HTMLButtonElement>('[data-action="useLocation"]');

  if (!useNow || !dateInput || !latInput || !lonInput || !localField || !utcField || !lstField) {
    console.warn("LST tool missing one or more required elements");
    return;
  }

  const two = (val: number) => String(val).padStart(2, "0");
  const formatTime = (date: Date) => `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`;

  const setStatus = (text: string, isError = false) => {
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

  form.addEventListener("input", update);
  setInterval(update, 1000);
  update();
}

function initAll() {
  document.querySelectorAll<HTMLElement>(COMPONENT_SELECTOR).forEach((root) => {
    if (!(root as any)._lstInitialized) {
      initLSTTool(root);
      (root as any)._lstInitialized = true;
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



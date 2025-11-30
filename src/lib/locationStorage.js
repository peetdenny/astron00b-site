const STORAGE_KEY = "astron00b_location";

export function getStoredLocation() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number" &&
      parsed.latitude >= -90 &&
      parsed.latitude <= 90 &&
      parsed.longitude >= -180 &&
      parsed.longitude <= 180
    ) {
      return { latitude: parsed.latitude, longitude: parsed.longitude };
    }
  } catch (err) {
    console.warn("Failed to parse stored location", err);
  }
  return null;
}

export function setStoredLocation(latitude, longitude) {
  try {
    const data = { latitude, longitude };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error("Failed to store location", err);
    return false;
  }
}

export function hasStoredLocation() {
  return getStoredLocation() !== null;
}

export function clearStoredLocation() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (err) {
    console.error("Failed to clear location", err);
    return false;
  }
}


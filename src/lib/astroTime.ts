export interface GeoLocation {
  latitudeDeg: number;
  longitudeDeg: number; // east positive
}

const DEG_PER_HOUR = 15;
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function toUtc(date: Date): Date {
  return new Date(date.getTime());
}

export function julianDate(date: Date): number {
  const dt = toUtc(date);
  let year = dt.getUTCFullYear();
  let month = dt.getUTCMonth() + 1; // JS months 0-11
  const dayFraction =
    dt.getUTCDate() +
    (dt.getUTCHours() +
      dt.getUTCMinutes() / 60 +
      dt.getUTCSeconds() / 3600 +
      dt.getUTCMilliseconds() / 3_600_000) /
      24;

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);

  const jd =
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    dayFraction +
    b -
    1524.5;
  return jd;
}

export function greenwichMeanSiderealTime(date: Date): number {
  const jd = julianDate(date);
  const t = (jd - 2451545.0) / 36525.0;

  const gmstSec =
    67310.54841 +
    (876600 * 3600 + 8640184.812866) * t +
    0.093104 * t * t -
    6.2e-6 * t * t * t;
  const gmstHours = ((gmstSec / 3600) % 24 + 24) % 24;
  return gmstHours;
}

export function localSiderealTime(date: Date, loc: GeoLocation): number {
  const gmst = greenwichMeanSiderealTime(date);
  const lst = (gmst + loc.longitudeDeg / DEG_PER_HOUR) % 24;
  return (lst + 24) % 24;
}

export function hoursToHms(hours: number): { h: number; m: number; s: number } {
  const totalSeconds = ((hours % 24) + 24) % 24 * 3600;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return { h, m, s };
}

function wrapHours(hours: number): number {
  return ((hours % 24) + 24) % 24;
}

export function raDecToAltAz(
  lstHours: number,
  raDeg: number,
  decDeg: number,
  loc: GeoLocation
): { altitude: number; azimuth: number } {
  const raHours = raDeg / DEG_PER_HOUR;
  const hHours = wrapHours(lstHours - raHours);
  const hRad = hHours * DEG_PER_HOUR * RAD;
  const decRad = decDeg * RAD;
  const latRad = loc.latitudeDeg * RAD;

  const sinAlt =
    Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(hRad);
  const altRad = Math.asin(sinAlt);

  const cosAz =
    (Math.sin(decRad) - Math.sin(altRad) * Math.sin(latRad)) /
    (Math.cos(altRad) * Math.cos(latRad));
  const sinAz = (-Math.cos(decRad) * Math.sin(hRad)) / Math.cos(altRad);
  const azRad = Math.atan2(sinAz, cosAz);

  return {
    altitude: altRad * DEG,
    azimuth: ((azRad * DEG) + 360) % 360,
  };
}



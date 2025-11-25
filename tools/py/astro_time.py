from __future__ import annotations

"""
Basic time and sidereal calculations for Astron00b tools.

This module is intentionally small and dependency-free so it can be
ported directly to TypeScript for the browser tools.
"""

from dataclasses import dataclass
from math import cos, sin, asin, atan2, radians, degrees
from datetime import datetime, timezone


@dataclass
class GeoLocation:
  """Geographic location with latitude and longitude in degrees."""

  latitude_deg: float
  longitude_deg: float  # east positive


def to_utc(dt: datetime) -> datetime:
  """Return a timezone-aware UTC datetime."""
  if dt.tzinfo is None:
    return dt.replace(tzinfo=timezone.utc)
  return dt.astimezone(timezone.utc)


def julian_date(dt: datetime) -> float:
  """Compute the Julian Date for a given datetime (UTC)."""
  dt_utc = to_utc(dt)
  year = dt_utc.year
  month = dt_utc.month
  day = dt_utc.day + (
    dt_utc.hour
    + dt_utc.minute / 60.0
    + dt_utc.second / 3600.0
    + dt_utc.microsecond / 3_600_000_000.0
  ) / 24.0

  if month <= 2:
    year -= 1
    month += 12

  a = year // 100
  b = 2 - a + a // 4

  jd = int(365.25 * (year + 4716)) + int(30.6001 * (month + 1)) + day + b - 1524.5
  return jd


def greenwich_mean_sidereal_time(dt: datetime) -> float:
  """Greenwich Mean Sidereal Time in hours.

  Implemented using the IAU 1982 expression with good accuracy for
  amateur planning purposes.
  """
  dt_utc = to_utc(dt)
  jd = julian_date(dt_utc)
  t = (jd - 2451545.0) / 36525.0  # centuries since J2000.0

  # GMST at 0h UT in seconds
  gmst_sec = (
    67310.54841
    + (876600.0 * 3600 + 8640184.812866) * t
    + 0.093104 * t * t
    - 6.2e-6 * t * t * t
  )
  gmst_hours = (gmst_sec / 3600.0) % 24.0
  return gmst_hours


def local_sidereal_time(dt: datetime, loc: GeoLocation) -> float:
  """Local Sidereal Time in hours [0, 24)."""
  gmst = greenwich_mean_sidereal_time(dt)
  lst = (gmst + loc.longitude_deg / 15.0) % 24.0
  return lst


def _wrap_hours(hours: float) -> float:
  return hours % 24.0


def ra_dec_to_alt_az(
  lst_hours: float, ra_hours: float, dec_deg: float, loc: GeoLocation
) -> tuple[float, float]:
  """Convert equatorial coordinates to horizontal (alt, az) in degrees.

  Returns (altitude_deg, azimuth_deg) with azimuth measured from north
  through east.
  """
  h_hours = _wrap_hours(lst_hours - ra_hours)
  h_rad = radians(h_hours * 15.0)
  dec_rad = radians(dec_deg)
  lat_rad = radians(loc.latitude_deg)

  sin_alt = sin(dec_rad) * sin(lat_rad) + cos(dec_rad) * cos(lat_rad) * cos(h_rad)
  alt_rad = asin(sin_alt)

  cos_az = (sin(dec_rad) - sin(alt_rad) * sin(lat_rad)) / (
    cos(alt_rad) * cos(lat_rad)
  )
  sin_az = -cos(dec_rad) * sin(h_rad) / cos(alt_rad)
  az_rad = atan2(sin_az, cos_az)

  alt_deg = degrees(alt_rad)
  az_deg = (degrees(az_rad) + 360.0) % 360.0
  return alt_deg, az_deg




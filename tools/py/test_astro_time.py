from __future__ import annotations

from datetime import datetime, timezone

from astro_time import GeoLocation, julian_date, greenwich_mean_sidereal_time, local_sidereal_time


def test_julian_date_j2000():
  dt = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
  jd = julian_date(dt)
  assert abs(jd - 2451545.0) < 1e-6


def test_gmst_known_value():
  # Simple sanity check – GMST for J2000 epoch should be close to 18.697374558 hours
  dt = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
  gmst = greenwich_mean_sidereal_time(dt)
  assert abs(gmst - 18.6974) < 0.01


def test_local_sidereal_time_longitude_offset():
  dt = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
  loc_gmt = GeoLocation(latitude_deg=0.0, longitude_deg=0.0)
  loc_15e = GeoLocation(latitude_deg=0.0, longitude_deg=15.0)

  gmst = greenwich_mean_sidereal_time(dt)
  lst_gmt = local_sidereal_time(dt, loc_gmt)
  lst_15e = local_sidereal_time(dt, loc_15e)

  assert abs(lst_gmt - gmst) < 1e-6
  assert abs((lst_15e - lst_gmt) - 1.0) < 1e-3




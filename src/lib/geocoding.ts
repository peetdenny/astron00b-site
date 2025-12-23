/**
 * Reverse geocoding to get country from coordinates
 * Uses Nominatim (OpenStreetMap) - free, no API key required
 */

interface NominatimResponse {
  address?: {
    country?: string;
    country_code?: string;
  };
  error?: string;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'AstroN00b/1.0'; // Required by Nominatim

/**
 * Get country from latitude/longitude coordinates
 * Returns country name or 'Unknown' if lookup fails
 */
export async function getCountryFromCoordinates(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return 'Unknown';
    }

    // Build Nominatim URL
    const url = new URL('/reverse', NOMINATIM_BASE_URL);
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', latitude.toString());
    url.searchParams.set('lon', longitude.toString());
    url.searchParams.set('zoom', '3'); // Country level
    url.searchParams.set('addressdetails', '1');

    // Make request with required User-Agent header
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status);
      return 'Unknown';
    }

    const data: NominatimResponse = await response.json();

    if (data.error) {
      console.error('Nominatim error:', data.error);
      return 'Unknown';
    }

    const country = data.address?.country;
    return country || 'Unknown';
  } catch (error) {
    console.error('Geocoding error:', error);
    return 'Unknown';
  }
}

/**
 * Simple in-memory cache for geocoding results
 * Keyed by rounded lat/long (to nearest 0.1 degree)
 */
const geocodeCache = new Map<string, string>();

/**
 * Get country with caching
 */
export async function getCountryFromCoordinatesCached(
  latitude: number,
  longitude: number
): Promise<string> {
  // Round to 0.1 degree for cache key
  const lat = Math.round(latitude * 10) / 10;
  const lon = Math.round(longitude * 10) / 10;
  const cacheKey = `${lat},${lon}`;

  // Check cache
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // Fetch and cache
  const country = await getCountryFromCoordinates(latitude, longitude);
  geocodeCache.set(cacheKey, country);

  return country;
}


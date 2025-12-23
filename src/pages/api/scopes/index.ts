import type { APIRoute } from 'astro';
import { ObjectId } from 'mongodb';
import { getUser } from '../../../lib/auth';
import { getScopesCollection, type Scope } from '../../../lib/db';
import { parseDishSize } from '../../../lib/units';
import { getCountryFromCoordinatesCached } from '../../../lib/geocoding';

/**
 * GET /api/scopes - List all scopes for authenticated user
 */
export const GET: APIRoute = async ({ request }) => {
  const user = await getUser(request);

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const scopes = await getScopesCollection();
    const userScopes = await scopes
      .find({ userId: new ObjectId(user.userId) })
      .sort({ createdAt: -1 })
      .toArray();

    return new Response(JSON.stringify({ scopes: userScopes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching scopes:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch scopes' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * POST /api/scopes - Create new scope
 * Body: { name, latitude, longitude, dishSize, dishUnit }
 */
export const POST: APIRoute = async ({ request }) => {
  console.log('POST /api/scopes - Starting...');
  const user = await getUser(request);

  if (!user) {
    console.log('Unauthorized access to /api/scopes');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  console.log('User:', user.email);

  try {
    const body = await request.json();
    console.log('Request body:', body);
    const { name, latitude, longitude, dishSize, dishUnit = 'mm' } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return new Response(JSON.stringify({ error: 'Invalid latitude' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      return new Response(JSON.stringify({ error: 'Invalid longitude' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse dish size (convert to mm if needed)
    let dishSizeMm: number;
    try {
      dishSizeMm = parseDishSize(dishSize, dishUnit as 'mm' | 'inches');
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid dish size' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get country from coordinates
    console.log('Getting country from coordinates...');
    const country = await getCountryFromCoordinatesCached(lat, lon);
    console.log('Country:', country);

    // Create scope
    const newScope: Scope = {
      userId: new ObjectId(user.userId),
      name: name.trim(),
      latitude: lat,
      longitude: lon,
      country,
      dishSizeMm,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('Inserting scope into database...');
    const scopes = await getScopesCollection();
    const result = await scopes.insertOne(newScope);
    console.log('Scope inserted:', result.insertedId);

    return new Response(
      JSON.stringify({
        scope: { ...newScope, _id: result.insertedId },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating scope:', error);
    return new Response(JSON.stringify({ error: 'Failed to create scope' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


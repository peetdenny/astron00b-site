import type { APIRoute } from 'astro';
import { ObjectId } from 'mongodb';
import { getUser } from '../../../lib/auth';
import { getScopesCollection } from '../../../lib/db';
import { parseDishSize } from '../../../lib/units';
import { getCountryFromCoordinatesCached } from '../../../lib/geocoding';

/**
 * GET /api/scopes/[id] - Get single scope
 */
export const GET: APIRoute = async ({ params, request }) => {
  const user = await getUser(request);

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { id } = params;

    if (!id || !ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: 'Invalid scope ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const scopes = await getScopesCollection();
    const scope = await scopes.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user.userId),
    });

    if (!scope) {
      return new Response(JSON.stringify({ error: 'Scope not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ scope }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching scope:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch scope' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * PUT /api/scopes/[id] - Update scope
 * Body: { name?, latitude?, longitude?, dishSize?, dishUnit? }
 */
export const PUT: APIRoute = async ({ params, request }) => {
  const user = await getUser(request);

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { id } = params;

    if (!id || !ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: 'Invalid scope ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { name, latitude, longitude, dishSize, dishUnit = 'mm' } = body;

    // Build update object
    const update: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'Invalid name' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      update.name = name.trim();
    }

    if (latitude !== undefined) {
      const lat = parseFloat(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return new Response(JSON.stringify({ error: 'Invalid latitude' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      update.latitude = lat;
    }

    if (longitude !== undefined) {
      const lon = parseFloat(longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) {
        return new Response(JSON.stringify({ error: 'Invalid longitude' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      update.longitude = lon;
    }

    if (dishSize !== undefined) {
      try {
        update.dishSizeMm = parseDishSize(dishSize, dishUnit as 'mm' | 'inches');
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Invalid dish size' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Update country if coordinates changed
    if (update.latitude !== undefined || update.longitude !== undefined) {
      const scopes = await getScopesCollection();
      const currentScope = await scopes.findOne({
        _id: new ObjectId(id),
        userId: new ObjectId(user.userId),
      });

      if (!currentScope) {
        return new Response(JSON.stringify({ error: 'Scope not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const lat = update.latitude ?? currentScope.latitude;
      const lon = update.longitude ?? currentScope.longitude;
      update.country = await getCountryFromCoordinatesCached(lat, lon);
    }

    // Update scope
    const scopes = await getScopesCollection();
    const result = await scopes.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        userId: new ObjectId(user.userId),
      },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!result) {
      return new Response(JSON.stringify({ error: 'Scope not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ scope: result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating scope:', error);
    return new Response(JSON.stringify({ error: 'Failed to update scope' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * DELETE /api/scopes/[id] - Delete scope
 */
export const DELETE: APIRoute = async ({ params, request }) => {
  const user = await getUser(request);

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { id } = params;

    if (!id || !ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: 'Invalid scope ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const scopes = await getScopesCollection();
    const result = await scopes.deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(user.userId),
    });

    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ error: 'Scope not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting scope:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete scope' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


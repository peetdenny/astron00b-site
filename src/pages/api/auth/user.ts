import type { APIRoute } from 'astro';
import { getUser } from '../../../lib/auth';

/**
 * Returns the current user's session data
 * GET /api/auth/user
 */
export const GET: APIRoute = async ({ request }) => {
  const user = await getUser(request);

  if (!user) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  return new Response(JSON.stringify({ user }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};


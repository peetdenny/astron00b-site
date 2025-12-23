import type { APIRoute } from 'astro';
import { clearSessionCookie } from '../../../lib/auth';

/**
 * Logs out the user by clearing the session cookie
 * GET /api/auth/logout
 */
export const GET: APIRoute = async () => {
  const clearCookie = clearSessionCookie();

  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/',
      'Set-Cookie': clearCookie,
    },
  });
};


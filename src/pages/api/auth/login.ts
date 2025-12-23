import type { APIRoute } from 'astro';
import * as oauth from 'oauth4webapi';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.GOOGLE_CLIENT_SECRET;
const SITE_URL = import.meta.env.SITE_URL || 'http://localhost:4321';

const issuer = new URL('https://accounts.google.com');
const authorizationEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
const redirectUri = `${SITE_URL}/api/auth/callback`;

/**
 * Initiates Google OAuth flow
 * GET /api/auth/login
 */
export const GET: APIRoute = async ({ redirect }) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return new Response('OAuth not configured', { status: 500 });
  }

  // Generate state for CSRF protection
  const state = oauth.generateRandomState();
  
  // Generate code verifier for PKCE
  const codeVerifier = oauth.generateRandomCodeVerifier();
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);

  // Build authorization URL
  const authUrl = new URL(authorizationEndpoint);
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  // Store state and code verifier in cookies
  const stateCookie = `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`;
  const verifierCookie = `oauth_verifier=${codeVerifier}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`;

  // Use Headers API to set multiple cookies
  const headers = new Headers();
  headers.append('Location', authUrl.toString());
  headers.append('Set-Cookie', stateCookie);
  headers.append('Set-Cookie', verifierCookie);

  return new Response(null, {
    status: 302,
    headers,
  });
};


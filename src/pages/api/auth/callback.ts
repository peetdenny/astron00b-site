import type { APIRoute } from 'astro';
import * as oauth from 'oauth4webapi';
import { getUsersCollection, type User } from '../../../lib/db';
import { createSession, createSessionCookie } from '../../../lib/auth';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.GOOGLE_CLIENT_SECRET;
const SITE_URL = import.meta.env.SITE_URL || 'http://localhost:4321';

const tokenEndpoint = 'https://oauth2.googleapis.com/token';
const userinfoEndpoint = 'https://openidconnect.googleapis.com/v1/userinfo';
const redirectUri = `${SITE_URL}/api/auth/callback`;

const client: oauth.Client = {
  client_id: GOOGLE_CLIENT_ID!,
  client_secret: GOOGLE_CLIENT_SECRET,
  token_endpoint_auth_method: 'client_secret_post',
};

interface GoogleUserInfo {
  sub: string; // Google ID
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

/**
 * Handles OAuth callback from Google
 * GET /api/auth/callback?code=...&state=...
 */
export const GET: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);

  // Get cookies
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => {
      const [key, ...v] = c.split('=');
      return [key, v.join('=')];
    })
  );

  const savedState = cookies['oauth_state'];
  const codeVerifier = cookies['oauth_verifier'];

  // Debug logging for production troubleshooting
  console.log('OAuth Callback Debug:', {
    hasState: !!savedState,
    hasVerifier: !!codeVerifier,
    redirectUri,
    cookieHeader: cookieHeader ? 'present' : 'missing',
    allCookies: Object.keys(cookies),
    siteUrl: SITE_URL,
  });

  if (!savedState || !codeVerifier) {
    console.error('Missing OAuth cookies - state:', !!savedState, 'verifier:', !!codeVerifier);
    return new Response('Missing state or verifier', { status: 400 });
  }

  try {
    // Validate state and code manually
    const state = url.searchParams.get('state');
    const code = url.searchParams.get('code');
    
    if (state !== savedState) {
      return new Response('Invalid state parameter', { status: 400 });
    }
    
    if (!code) {
      return new Response('Missing authorization code', { status: 400 });
    }

    // Make direct token request (bypassing oauth4webapi's strict validation)
    console.log('Step 1: Exchanging code for token...');
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      code_verifier: codeVerifier,
    });

    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody.toString(),
    });
    console.log('Step 2: Token response received, status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token request failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('Step 3: Got access token');

    // Fetch user info from Google
    console.log('Step 4: Fetching user info...');
    const userinfoResponse = await fetch(userinfoEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userinfoResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo: GoogleUserInfo = await userinfoResponse.json();
    console.log('Step 5: Got user info for:', userInfo.email);

    // Create or update user in database
    console.log('Step 6: Connecting to MongoDB...');
    const users = await getUsersCollection();
    console.log('Step 7: MongoDB connected');
    
    console.log('Step 8: Looking up user...');
    let user = await users.findOne({ googleId: userInfo.sub });
    console.log('Step 9: User lookup complete, exists:', !!user);

    if (!user) {
      // Create new user
      console.log('Step 10: Creating new user...');
      const newUser: User = {
        googleId: userInfo.sub,
        email: userInfo.email,
        username: userInfo.name,
        country: '', // User will fill this in later
        picture: userInfo.picture, // Store profile photo URL
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await users.insertOne(newUser);
      console.log('Step 11: User created with ID:', result.insertedId);
      newUser._id = result.insertedId;
      user = newUser;
    } else {
      // Update existing user (including picture in case it changed)
      console.log('Step 10: Updating existing user...');
      await users.updateOne(
        { googleId: userInfo.sub },
        {
          $set: {
            email: userInfo.email,
            picture: userInfo.picture,
            username: userInfo.name,
            updatedAt: new Date(),
          },
        }
      );
      console.log('Step 11: User updated');
    }

    // Create session
    console.log('Step 12: Creating session...');
    const sessionToken = await createSession(user);
    console.log('Step 13: Session created');
    const sessionCookie = createSessionCookie(sessionToken);

    // Clear OAuth cookies
    const clearStateCookie = 'oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0';
    const clearVerifierCookie = 'oauth_verifier=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0';

    // Use Headers API to set multiple cookies
    const headers = new Headers();
    headers.append('Location', '/dashboard');
    headers.append('Set-Cookie', sessionCookie);
    headers.append('Set-Cookie', clearStateCookie);
    headers.append('Set-Cookie', clearVerifierCookie);

    // Redirect to dashboard
    console.log('Step 14: Redirecting to dashboard');
    return new Response(null, {
      status: 302,
      headers,
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 500,
    });
  }
};


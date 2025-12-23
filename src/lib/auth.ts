import { SignJWT, jwtVerify } from 'jose';
import type { User } from './db';

const SESSION_SECRET = new TextEncoder().encode(
  import.meta.env.SESSION_SECRET || 'fallback-secret-for-development-only'
);

const SESSION_COOKIE_NAME = 'astronoob_session';
const SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds

export interface SessionData {
  userId: string;
  email: string;
  username: string;
  picture?: string;
}

/**
 * Create a signed JWT session token
 */
export async function createSession(user: User): Promise<string> {
  const sessionData: SessionData = {
    userId: user._id!.toString(),
    email: user.email,
    username: user.username,
    picture: user.picture,
  };

  const token = await new SignJWT(sessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(SESSION_SECRET);

  return token;
}

/**
 * Verify and decode a session token
 */
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload as SessionData;
  } catch (error) {
    return null;
  }
}

/**
 * Get session from request cookies
 */
export function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => {
      const [key, ...v] = c.split('=');
      return [key, v.join('=')];
    })
  );

  return cookies[SESSION_COOKIE_NAME] || null;
}

/**
 * Get user session data from request
 */
export async function getUser(request: Request): Promise<SessionData | null> {
  const token = getSessionToken(request);
  if (!token) return null;
  return await verifySession(token);
}

/**
 * Create session cookie header
 */
export function createSessionCookie(token: string): string {
  const maxAge = SESSION_DURATION;
  const secure = import.meta.env.PROD ? '; Secure' : '';
  
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`;
}

/**
 * Create a cookie header to clear the session
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

/**
 * Require authentication - returns user or throws redirect response
 */
export async function requireAuth(request: Request): Promise<SessionData> {
  const user = await getUser(request);
  
  if (!user) {
    // Redirect to login
    return Response.redirect(new URL('/api/auth/login', request.url), 302) as any;
  }
  
  return user;
}


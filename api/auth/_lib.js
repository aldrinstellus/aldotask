// Shared auth helpers for the api/auth/* endpoints (Node runtime).
// Session token format: base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload, AUTH_SECRET)).
// middleware.js re-implements verification with Web Crypto — keep the format in sync.
import crypto from 'node:crypto';

export const SESSION_COOKIE = 'aldotask_session';
export const STATE_COOKIE = 'aldotask_oauth_state';
export const SESSION_TTL_SECONDS = 7 * 24 * 3600;

export function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

export function baseUrl(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

export function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function serializeCookie(name, value, { maxAge } = {}) {
  const bits = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax'];
  if (maxAge !== undefined) bits.push(`Max-Age=${maxAge}`);
  return bits.join('; ');
}

export function clearCookie(name) {
  return serializeCookie(name, '', { maxAge: 0 });
}

export function signSession(payload) {
  const secret = requireEnv('AUTH_SECRET');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function verifySessionToken(token) {
  try {
    const secret = requireEnv('AUTH_SECRET');
    const [body, mac] = String(token || '').split('.');
    if (!body || !mac) return null;
    const expected = crypto.createHmac('sha256', secret).update(body).digest();
    const given = Buffer.from(mac, 'base64url');
    if (given.length !== expected.length || !crypto.timingSafeEqual(expected, given)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Vercel Routing Middleware (framework-agnostic): protects the dashboard,
// allows /api/auth/* and static assets. Session verification mirrors the
// HMAC format minted in api/auth/callback.js (Node crypto) using Web Crypto.
const pass = () => new Response(null, { headers: { 'x-middleware-next': '1' } });

function b64(s) { return atob(s.replace(/-/g, '+').replace(/_/g, '/')); }

async function valid(raw) {
  try {
    if (!process.env.AUTH_SECRET || !process.env.ALLOWED_EMAIL) return false;
    const [p, s] = raw.split('.');
    if (!p || !s) return false;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(process.env.AUTH_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('HMAC', key, Uint8Array.from(b64(s), c => c.charCodeAt(0)), new TextEncoder().encode(p));
    const u = JSON.parse(b64(p));
    return ok && u.exp > Date.now() / 1000 && u.email.toLowerCase() === process.env.ALLOWED_EMAIL.toLowerCase();
  } catch { return false; }
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (path.startsWith('/api/auth/') || path.includes('.')) return pass();
  const raw = request.headers.get('cookie')?.match(/(?:^|;\s*)aldotask_session=([^;]+)/)?.[1];
  if (raw && await valid(decodeURIComponent(raw))) return pass();
  return Response.redirect(new URL('/api/auth/login', url), 302);
}

export const config = { matcher: ['/((?!api/auth/).*)'] };

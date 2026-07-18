function b64(s) { return atob(s.replace(/-/g,'+').replace(/_/g,'/')); }
async function valid(raw) {
  try { const [p,s] = raw.split('.'); if (!p || !s) return false; const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(process.env.AUTH_SECRET), {name:'HMAC',hash:'SHA-256'}, false, ['verify']); const ok = await crypto.subtle.verify('HMAC', key, Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0)), new TextEncoder().encode(p)); const u = JSON.parse(b64(p)); return ok && u.exp > Date.now() && u.email.toLowerCase() === process.env.ALLOWED_EMAIL.toLowerCase(); } catch { return false; }
}
export async function middleware(request) {
  const path = request.nextUrl.pathname;
  if (path.startsWith('/api/auth/') || path.startsWith('/_next/') || path.includes('.')) return new Response(null, {status:200});
  const raw = request.headers.get('cookie')?.match(/(?:^|;\s*)aldotask_session=([^;]+)/)?.[1];
  if (!(raw && await valid(raw))) return Response.redirect(new URL('/api/auth/login', request.url));
  return new Response(null, {status:200});
}
export const config = { matcher: ['/((?!api/auth/).*)'] };

import crypto from 'node:crypto';

function cookies(req) { return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(v => { const i=v.indexOf('='); return [v.slice(0,i).trim(), decodeURIComponent(v.slice(i+1))]; })); }
function sign(value) { return crypto.createHmac('sha256', process.env.AUTH_SECRET).update(value).digest('base64url'); }

export default async function handler(req, res) {
  try {
  if (!process.env.APP_URL || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET
    || !process.env.AUTH_SECRET || !process.env.ALLOWED_EMAIL) {
    return res.status(500).send('Auth is not configured on this deployment.');
  }
  const q = new URL(req.url, process.env.APP_URL).searchParams;
  const c = cookies(req);
  if (!q.get('code') || !q.get('state') || q.get('state') !== c.aldotask_oauth_state) return res.status(400).send('Invalid OAuth state');
  const token = await fetch('https://oauth2.googleapis.com/token', { method:'POST', headers:{'content-type':'application/x-www-form-urlencoded'}, body:new URLSearchParams({code:q.get('code'), client_id:process.env.GOOGLE_CLIENT_ID, client_secret:process.env.GOOGLE_CLIENT_SECRET, redirect_uri:`${process.env.APP_URL}/api/auth/callback`, grant_type:'authorization_code'}) });
  if (!token.ok) return res.status(401).send('OAuth token exchange failed');
  const data = await token.json();
  const profile = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers:{authorization:`Bearer ${data.access_token}`} });
  const user = await profile.json();
  if (!user.email || user.email.toLowerCase() !== process.env.ALLOWED_EMAIL.toLowerCase() || !user.email_verified) return res.status(403).send('Access restricted to the AldoTask owner.');
  const payload = Buffer.from(JSON.stringify({email:user.email, name:user.name || '', exp:Math.floor(Date.now()/1000)+86400})).toString('base64url');
  const session = `${payload}.${sign(payload)}`;
  res.setHeader('Set-Cookie', [`aldotask_session=${session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`, 'aldotask_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0']);
  res.redirect('/');
  } catch (err) {
    console.error('auth callback error:', err);
    return res.status(500).send('Sign-in failed. Please try again.');
  }
}

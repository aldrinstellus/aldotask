export default function handler(req, res) {
  if (!process.env.APP_URL || !process.env.GOOGLE_CLIENT_ID || !process.env.AUTH_SECRET) {
    return res.status(500).send('Auth is not configured on this deployment.');
  }
  const state = crypto.randomUUID();
  const redirect = `${process.env.APP_URL}/api/auth/callback`;
  const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, redirect_uri: redirect, response_type: 'code', scope: 'openid email profile', state, access_type: 'online', prompt: 'select_account' });
  res.setHeader('Set-Cookie', `aldotask_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

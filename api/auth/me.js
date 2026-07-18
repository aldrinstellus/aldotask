import crypto from 'node:crypto';

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const secret = process.env.AUTH_SECRET;
    const allowed = process.env.ALLOWED_EMAIL;
    if (!secret || !allowed) return res.status(401).json({ authenticated: false });
    const raw = (req.headers.cookie || '').match(/(?:^|;\s*)aldotask_session=([^;]+)/)?.[1];
    if (!raw) return res.status(401).json({ authenticated: false });
    const [payload, sig] = decodeURIComponent(raw).split('.');
    if (!payload || !sig) return res.status(401).json({ authenticated: false });
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ authenticated: false });
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!(user.exp > Date.now() / 1000) || String(user.email).toLowerCase() !== allowed.toLowerCase()) {
      return res.status(401).json({ authenticated: false });
    }
    return res.json({ authenticated: true, email: user.email, name: user.name || '' });
  } catch {
    return res.status(401).json({ authenticated: false });
  }
}

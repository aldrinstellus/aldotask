import crypto from 'node:crypto';
export default function handler(req, res) {
  const raw = (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('aldotask_session='))?.slice(17);
  if (!raw) return res.status(401).json({authenticated:false});
  const [payload, sig] = raw.split('.');
  const expected = crypto.createHmac('sha256', process.env.AUTH_SECRET).update(payload).digest('base64url');
  if (!sig || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return res.status(401).json({authenticated:false});
  const user = JSON.parse(Buffer.from(payload,'base64url').toString());
  if (user.exp < Date.now() || user.email.toLowerCase() !== process.env.ALLOWED_EMAIL.toLowerCase()) return res.status(401).json({authenticated:false});
  res.json({authenticated:true,email:user.email,name:user.name});
}

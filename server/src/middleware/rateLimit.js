const buckets = new Map();

export function rateLimit({ windowMs = 60000, max = 5, keyPrefix = 'global' } = {}) {
  return (req, res, next) => {
    const id = req.auth?.sub || req.ip;
    const key = `${keyPrefix}:${id}`;
    const now = Date.now();
    const entry = buckets.get(key) || { count: 0, reset: now + windowMs };
    if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs; }
    entry.count += 1;
    buckets.set(key, entry);
    const remaining = Math.max(0, max - entry.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ error: 'Please wait a minute before trying again.' });
    }
    next();
  };
}

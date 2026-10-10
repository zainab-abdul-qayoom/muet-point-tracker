import crypto from 'node:crypto';

// Secret key for HMAC token signing (persisted in memory or env)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be configured');
}

/**
 * Generate a signed base64 session token
 * @param {Object} payload User details { id, email, role, name, roll_no }
 * @returns {string} Signed token
 */
export function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const bodyData = {
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days expiration
  };
  const body = Buffer.from(JSON.stringify(bodyData)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Verify and decode a token
 * @param {string} token
 * @returns {Object|null} Decoded payload or null if invalid
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract and authenticate user from request headers
 * @param {Object} req Node HTTP request
 * @returns {Object|null} Authenticated user payload or null
 */
export function authenticateRequest(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) return null;

  return verifyToken(token);
}

/**
 * Hash password securely with crypto.scryptSync and a 16-byte cryptographically random salt
 * @param {string} password
 * @returns {string} Format: scrypt:<salt>:<hash>
 */
export function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

/**
 * Verify plaintext password against stored scrypt hash (or legacy plaintext with auto-upgrade support)
 * @param {string} password Plain text password to check
 * @param {string} storedHash Stored password string from database
 * @returns {boolean} True if password matches
 */
export function verifyPassword(password, storedHash) {
  if (!password || !storedHash) return false;
  try {
    if (storedHash.startsWith('scrypt:')) {
      const parts = storedHash.split(':');
      if (parts.length !== 3) return false;
      const salt = parts[1];
      const hash = parts[2];
      const computed = crypto.scryptSync(password, salt, 64).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'));
    }
    // Backward-compatibility check for existing unmigrated accounts
    return password === storedHash;
  } catch {
    return false;
  }
}


/**
 * Core Security, Cryptography & Access Control Utilities
 * Uses Web Crypto API (SubtleCrypto) for secure hashing, random tokens, and TOTP.
 */

// ==========================================
// 1. Cryptographic Hashing (PBKDF2-SHA256)
// ==========================================

const SALT_BYTES = 16;
const ITERATIONS = 100000;
const KEY_LENGTH_BITS = 256;

/**
 * Converts ArrayBuffer to Hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Converts Hex string to Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Hashes a password with PBKDF2-SHA256 and a random salt
 * Format returned: "pbkdf2:iterations:saltHex:hashHex"
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);

  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    KEY_LENGTH_BITS
  );

  const saltHex = bufferToHex(salt.buffer);
  const hashHex = bufferToHex(derivedBits);

  return `pbkdf2:${ITERATIONS}:${saltHex}:${hashHex}`;
}

/**
 * Verifies a plaintext password against a stored hashed password in constant time
 */
export async function verifyPassword(password: string, storedHash: string, optionalSalt?: string): Promise<boolean> {
  try {
    // If legacy plaintext or non-pbkdf2, support safe fallback
    if (!storedHash.startsWith('pbkdf2:')) {
      return password === storedHash;
    }

    const parts = storedHash.split(':');
    if (parts.length !== 4) return false;

    const iterations = parseInt(parts[1], 10);
    const salt = hexToBuffer(parts[2]);
    const expectedHashHex = parts[3];

    const enc = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as any,
        iterations,
        hash: 'SHA-256',
      },
      passwordKey,
      KEY_LENGTH_BITS
    );

    const actualHashHex = bufferToHex(derivedBits);

    // Constant time comparison
    if (actualHashHex.length !== expectedHashHex.length) return false;
    let diff = 0;
    for (let i = 0; i < actualHashHex.length; i++) {
      diff |= actualHashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
    }
    return diff === 0;
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * SHA-256 Hash of a string (useful for tokens)
 */
export async function sha256(data: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(data));
  return bufferToHex(digest);
}

// ==========================================
// 2. Cryptographically Secure Tokens
// ==========================================

/**
 * Generates a high-entropy random token
 */
export function generateSecureToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bufferToHex(bytes.buffer);
}

// ==========================================
// 3. Password Strength Evaluation
// ==========================================

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  isStrong: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  feedbackAr: string;
  feedbackEn: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const hasMinLength = password.length >= 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (password.length >= 8) score += 1;
  if (hasMinLength) score += 1;
  if ((hasUppercase && hasLowercase) || (hasUppercase && hasNumber) || (hasLowercase && hasNumber)) score += 1;
  if (hasNumber && hasSpecial && hasUppercase && hasLowercase) score += 1;

  const isStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  let feedbackAr = 'كلمة المرور قوية ومطابقة للمعايير';
  let feedbackEn = 'Password is strong and compliant';

  if (!hasMinLength) {
    feedbackAr = 'يجب أن لا تقل كلمة المرور عن 12 حرفاً';
    feedbackEn = 'Password must be at least 12 characters long';
  } else if (!hasUppercase || !hasLowercase) {
    feedbackAr = 'يجب أن تحتوي على حروف كبيرة (A-Z) وصغيرة (a-z)';
    feedbackEn = 'Must include both uppercase and lowercase letters';
  } else if (!hasNumber) {
    feedbackAr = 'يجب أن تحتوي على أرقام (0-9)';
    feedbackEn = 'Must include at least one number';
  } else if (!hasSpecial) {
    feedbackAr = 'يجب أن تحتوي على رموز خاصة (!@#$%^&*)';
    feedbackEn = 'Must include special symbols (!@#$%^&*)';
  }

  return {
    score,
    isStrong,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    feedbackAr,
    feedbackEn,
  };
}

// ==========================================
// 4. Rate Limiting with Progressive Lockouts
// ==========================================

interface RateLimitRecord {
  attempts: number;
  lastAttemptTime: number;
  lockedUntil: number;
}

const rateLimitStorageKey = 'frank_security_rate_limits';

function getRateLimits(): Record<string, RateLimitRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const item = localStorage.getItem(rateLimitStorageKey);
    return item ? JSON.parse(item) : {};
  } catch {
    return {};
  }
}

function saveRateLimits(data: Record<string, RateLimitRecord>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(rateLimitStorageKey, JSON.stringify(data));
  } catch {}
}

export interface RateLimitCheckResult {
  isBlocked: boolean;
  allowed?: boolean;
  remainingLockoutSeconds: number;
  lockoutExpiresAt?: number;
  failedAttempts: number;
  warningMessageAr?: string;
  warningMessageEn?: string;
}

/**
 * Checks rate limit for a specific key (e.g. `login:admin`, `forgot_pass:ip`)
 */
export function checkRateLimit(key: string, maxAttempts = 5, baseLockoutMs = 60000): RateLimitCheckResult {
  const limits = getRateLimits();
  const record = limits[key];
  const now = Date.now();

  if (!record) {
    return { isBlocked: false, allowed: true, remainingLockoutSeconds: 0, failedAttempts: 0 };
  }

  // If locked, check if time has expired
  if (record.lockedUntil > now) {
    const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      isBlocked: true,
      allowed: false,
      remainingLockoutSeconds: remainingSeconds,
      lockoutExpiresAt: record.lockedUntil,
      failedAttempts: record.attempts,
      warningMessageAr: `تم حظر المحاولات مؤقتاً لحماية الحساب. يرجى المحاولة بعد ${remainingSeconds} ثانية.`,
      warningMessageEn: `Too many failed attempts. Account temporarily locked for ${remainingSeconds}s.`,
    };
  }

  // If last attempt was more than 15 minutes ago, reset
  if (now - record.lastAttemptTime > 15 * 60 * 1000) {
    delete limits[key];
    saveRateLimits(limits);
    return { isBlocked: false, allowed: true, remainingLockoutSeconds: 0, failedAttempts: 0 };
  }

  return {
    isBlocked: false,
    allowed: true,
    remainingLockoutSeconds: 0,
    failedAttempts: record.attempts,
  };
}

/**
 * Records a failed attempt for a rate limit key
 */
export function recordFailedAttempt(key: string, maxAttempts = 5, baseLockoutMs = 60000): RateLimitCheckResult {
  const limits = getRateLimits();
  const now = Date.now();
  const record = limits[key] || { attempts: 0, lastAttemptTime: now, lockedUntil: 0 };

  record.attempts += 1;
  record.lastAttemptTime = now;

  if (record.attempts >= maxAttempts) {
    // Progressive lockout multiplier
    const multiplier = Math.pow(2, Math.min(record.attempts - maxAttempts, 4));
    record.lockedUntil = now + baseLockoutMs * multiplier;
  }

  limits[key] = record;
  saveRateLimits(limits);

  return checkRateLimit(key, maxAttempts, baseLockoutMs);
}

/**
 * Resets rate limit upon successful authentication
 */
export function clearRateLimit(key: string) {
  const limits = getRateLimits();
  if (limits[key]) {
    delete limits[key];
    saveRateLimits(limits);
  }
}

// ==========================================
// 5. TOTP (Time-Based One-Time Password / RFC 6238)
// ==========================================

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Generates a random Base32 secret for TOTP
 */
export function generateTOTPSecret(length = 20): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += BASE32_ALPHABET[bytes[i] % 32];
  }
  return secret;
}

/**
 * Decodes a Base32 string to Uint8Array
 */
function base32Decode(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return bytes;
}

/**
 * Computes 6-digit TOTP code for a given timestamp
 */
export async function computeTOTPCode(secret: string, timeStepWindow = 30, timestamp = Date.now()): Promise<string> {
  const epochSeconds = Math.floor(timestamp / 1000);
  const counter = Math.floor(epochSeconds / timeStepWindow);

  // Convert counter to 8-byte buffer (big-endian)
  const counterBytes = new Uint8Array(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = tmp & 0xff;
    tmp = Math.floor(tmp / 256);
  }

  const keyBytes = base32Decode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes as any,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
  const sigBytes = new Uint8Array(signature);

  // Dynamic truncation (RFC 4226)
  const offset = sigBytes[sigBytes.length - 1] & 0xf;
  const binary =
    ((sigBytes[offset] & 0x7f) << 24) |
    ((sigBytes[offset + 1] & 0xff) << 16) |
    ((sigBytes[offset + 2] & 0xff) << 8) |
    (sigBytes[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Validates a user-supplied 6-digit TOTP code with ±1 time step tolerance
 */
export async function verifyTOTPCode(
  secret: string,
  userCode: string,
  timeStepWindow = 30
): Promise<boolean> {
  const cleanCode = userCode.trim();
  if (cleanCode.length !== 6) return false;

  const now = Date.now();
  const windows = [-1, 0, 1]; // ±30s tolerance

  for (const offset of windows) {
    const code = await computeTOTPCode(secret, timeStepWindow, now + offset * timeStepWindow * 1000);
    if (code === cleanCode) {
      return true;
    }
  }

  return false;
}

/**
 * Builds the `otpauth://` URI for QR code generation
 */
export function buildOTPAuthURL(accountName: string, secret: string, issuer = 'FrankBurger'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

// ==========================================
// 6. Audit Logging System
// ==========================================

import { AuditAction, AuditLogEntry } from '../types';
export type { AuditAction, AuditLogEntry };

const AUDIT_LOG_STORAGE_KEY = 'frank_audit_logs_v1';

export function getLocalAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const item = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

export function saveAuditLogEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userAgent'>): AuditLogEntry {
  const fullEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${generateSecureToken(4)}`,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/Client',
    ...entry,
  };

  if (typeof window !== 'undefined') {
    try {
      const logs = getLocalAuditLogs();
      const updated = [fullEntry, ...logs.slice(0, 499)]; // Keep latest 500
      localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }

  return fullEntry;
}

// Aliases for seamless AppContext and tab integration
export const verifyTOTP = verifyTOTPCode;
export const sha256Hex = sha256;
export const recordAuditLog = saveAuditLogEntry;
export const loadAuditLogs = getLocalAuditLogs;
export const resetRateLimit = clearRateLimit;


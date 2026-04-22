import jwt from "jsonwebtoken";

// Domain validation regexes (from spec)
export const STUDENT_DOMAIN =
  /^[a-zA-Z0-9._%+-]+@students\.duet\.edu\.pk$/i;
export const TEACHER_DOMAIN = /^[a-zA-Z0-9._%+-]+@duet\.edu\.pk$/i;

export function detectRole(email: string): "STUDENT" | "TEACHER" | null {
  if (STUDENT_DOMAIN.test(email)) return "STUDENT";
  if (TEACHER_DOMAIN.test(email)) return "TEACHER";
  return null;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN";
  iat?: number;
  exp?: number;
}

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export function signAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  const secret = process.env.JWT_SECRET || "fallback-secret-if-missing";
  return jwt.sign(payload, secret, { expiresIn: "1h" });
}

export function signRefreshToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  const secret = process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret";
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    if (!token || typeof token !== "string") {
       return null;
    }
    
    // Clean token: Remove Bearer prefix if accidentally included, trim, and strip quotes
    const cleanedToken = token.replace(/^Bearer\s+/i, "").trim().replace(/^["']|["']$/g, "");
    
    const secret = process.env.JWT_SECRET || "fallback-secret-if-missing";
    return jwt.verify(cleanedToken, secret) as JWTPayload;
  } catch (error) {
    console.error("[verifyAccessToken] Failed:", error);
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret";
    return jwt.verify(token, secret) as JWTPayload;
  } catch {
    return null;
  }
}

export function getServerAuthToken(req: Request): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    // Return token after stripping 'Bearer ' and trimming
    return authHeader.split(" ")[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

// Generate cryptographically random 6-digit OTP
export function generateOTP(): string {
  const { randomInt } = require("crypto");
  return String(randomInt(100000, 999999));
}

// Generate Group ID: GRP-{YEAR}-{6-char alphanumeric}
export function generateGroupId(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let hash = "";
  for (let i = 0; i < 6; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return `GRP-${year}-${hash}`;
}

// Normalize proposal title for duplicate detection
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}



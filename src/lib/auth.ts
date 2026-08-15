import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const getAuthSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not defined");
  return new TextEncoder().encode(secret);
};

export type TokenPayload = {
  id: string;
  email: string;
  role: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: TokenPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getAuthSecret());

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}

export async function verifySession(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    return payload as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

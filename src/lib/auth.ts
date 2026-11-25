import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "./db";
import type { Role } from "@prisma/client";

const COOKIE = "eden_session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 jours

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET manquant ou trop court (32 caractères minimum)");
  return new TextEncoder().encode(s);
}

export type Session = { userId: string; role: Role; name: string };

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 11);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(user: { id: string; role: Role; name: string }) {
  const token = await new SignJWT({ role: user.role, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    // le rôle fait foi en base : un rôle changé par l'admin s'applique immédiatement
    const user = await db.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, name: true } });
    if (!user) return null;
    return { userId: user.id, role: user.role, name: user.name };
  } catch {
    return null;
  }
}

/** Exige une session (et un rôle) côté serveur. Redirige sinon. */
export async function requireUser(roles?: Role[], next = "/compte"): Promise<Session> {
  const s = await getSession();
  if (!s) redirect(`/connexion?suite=${encodeURIComponent(next)}`);
  if (roles && !roles.includes(s.role) && s.role !== "ADMIN") redirect("/acces-refuse");
  return s;
}

/** Variante pour les actions serveur : lève une erreur au lieu de rediriger. */
export async function assertRole(roles: Role[]): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Error("Connexion requise");
  if (!roles.includes(s.role) && s.role !== "ADMIN") throw new Error("Accès refusé");
  return s;
}

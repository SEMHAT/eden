"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { logActivity } from "@/lib/log";
import type { ActionState } from "./cart";

const safeNext = (v: FormDataEntryValue | null, fallback: string) => {
  const s = String(v ?? "");
  return s.startsWith("/") && !s.startsWith("//") ? s : fallback;
};

const homeFor = (role: string) => (role === "ADMIN" ? "/admin" : role === "VENDOR" ? "/vendeur" : role === "PRO" ? "/espace-pro" : "/compte");

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  // même message dans les deux cas pour ne pas révéler l'existence d'un compte
  if (!user || !(await verifyPassword(password, user.passwordHash))) return { error: "Adresse e-mail ou mot de passe incorrect." };
  await createSession(user);
  await logActivity({ actorId: user.id, actorRole: user.role, action: "login", entity: "user", entityId: user.id });
  redirect(safeNext(form.get("suite"), homeFor(user.role)));
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom").max(80),
  email: z.email("Adresse e-mail invalide").max(120),
  phone: z.string().trim().min(8, "Numéro de téléphone invalide").max(20),
  password: z.string().min(8, "8 caractères minimum").max(100),
  kind: z.enum(["CUSTOMER", "PRO", "VENDOR"]).default("CUSTOMER"),
  orgName: z.string().trim().max(120).optional(),
  shopName: z.string().trim().max(120).optional(),
  city: z.string().trim().max(60).optional(),
});

export async function register(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  const d = parsed.data;
  const email = d.email.toLowerCase();
  if (await db.user.findUnique({ where: { email } })) return { error: "Un compte existe déjà avec cette adresse." };
  if (d.kind === "PRO" && !d.orgName) return { error: "Indiquez le nom de votre organisation." };
  if (d.kind === "VENDOR" && (!d.shopName || !d.city)) return { error: "Indiquez le nom de votre boutique et votre ville." };

  const user = await db.user.create({
    data: {
      email,
      name: d.name,
      phone: d.phone,
      passwordHash: await hashPassword(d.password),
      role: d.kind,
      ...(d.kind === "PRO" ? { organization: { create: { name: d.orgName!, kind: "ENTREPRISE" } } } : {}),
      ...(d.kind === "VENDOR" ? { vendor: { create: { shopName: d.shopName!, city: d.city!, phone: d.phone, status: "PENDING" } } } : {}),
    },
  });
  await logActivity({ actorId: user.id, actorRole: user.role, action: "register", entity: "user", entityId: user.id });
  await createSession(user);
  redirect(safeNext(form.get("suite"), homeFor(user.role)));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertRole, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/log";
import type { ActionState } from "./cart";

const schema = z.object({
  product: z.string().trim().min(3, "Décrivez le produit recherché").max(200),
  link: z.union([z.url("Lien invalide").max(500), z.literal("")]).optional(),
  details: z.string().trim().max(2000).optional(),
  quantity: z.coerce.number().int().min(1).max(10000).default(1),
  budget: z.coerce.number().int().min(0).max(1_000_000_000).optional().or(z.literal("").transform(() => undefined)),
  deadline: z.string().trim().max(60).optional(),
  origin: z.string().trim().max(40).optional(),
  name: z.string().trim().min(2, "Indiquez votre nom").max(80),
  phone: z.string().trim().regex(/^[+\d][\d\s]{7,18}$/, "Numéro de téléphone invalide"),
  email: z.union([z.email("Adresse e-mail invalide"), z.literal("")]).optional(),
});

function importNumber() {
  const d = new Date();
  const ymd = `${d.getUTCFullYear().toString().slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `IMP-${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function requestImport(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  const d = parsed.data;
  const s = await getSession();
  const r = await db.importRequest.create({
    data: {
      number: importNumber(),
      userId: s?.userId,
      product: d.product,
      link: d.link || null,
      details: d.details || null,
      quantity: d.quantity,
      budget: d.budget ?? null,
      deadline: d.deadline || null,
      origin: d.origin || null,
      name: d.name,
      phone: d.phone,
      email: d.email || null,
    },
  });
  const jar = await cookies();
  const mine = (jar.get("eden_imports")?.value ?? "").split(",").filter(Boolean).slice(-19);
  jar.set("eden_imports", [...mine, r.number].join(","), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  await logActivity({ actorId: s?.userId, actorRole: s?.role ?? "GUEST", action: "import.create", entity: "import", entityId: r.id });
  redirect(`/import/${r.number}?nouvelle=1`);
}

export async function acceptImportQuote(form: FormData) {
  const number = String(form.get("number"));
  const r = await db.importRequest.findUnique({ where: { number } });
  if (!r || r.status !== "QUOTED") throw new Error("Aucune proposition à accepter");
  const s = await getSession();
  const mine = ((await cookies()).get("eden_imports")?.value ?? "").split(",");
  if (!(s?.role === "ADMIN" || (s && r.userId === s.userId) || mine.includes(number))) throw new Error("Accès refusé");
  await db.importRequest.update({ where: { number }, data: { status: "ACCEPTED" } });
  await logActivity({ actorId: s?.userId, actorRole: s?.role ?? "GUEST", action: "import.accept", entity: "import", entityId: r.id });
  revalidatePath(`/import/${number}`);
}

export async function updateImport(form: FormData) {
  const s = await assertRole(["ADMIN"]);
  const id = String(form.get("id"));
  const status = z.enum(["NEW", "SOURCING", "QUOTED", "ACCEPTED", "ORDERED", "IN_TRANSIT", "ARRIVED", "DELIVERED", "CANCELLED"]).parse(form.get("status"));
  const price = Number(String(form.get("quotedPrice") ?? "").replace(/\D/g, ""));
  const eta = Number(String(form.get("etaDays") ?? "").replace(/\D/g, ""));
  const response = String(form.get("response") ?? "").trim().slice(0, 2000) || null;
  await db.importRequest.update({
    where: { id },
    data: { status, quotedPrice: price > 0 ? price : null, etaDays: eta > 0 ? eta : null, response },
  });
  await logActivity({ actorId: s.userId, actorRole: "ADMIN", action: "import.update", entity: "import", entityId: id, data: { status } });
  revalidatePath("/admin");
}

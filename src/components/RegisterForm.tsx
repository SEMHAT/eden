"use client";
import { useState } from "react";
import clsx from "clsx";
import { register } from "@/actions/auth";
import { ActionForm } from "./ActionForm";
import { Input, Label } from "./ui";

const KINDS = [
  { id: "CUSTOMER", label: "Particulier" },
  { id: "PRO", label: "Professionnel" },
  { id: "VENDOR", label: "Vendeur partenaire" },
] as const;

export function RegisterForm({ initialKind, suite }: { initialKind: "CUSTOMER" | "PRO" | "VENDOR"; suite: string }) {
  const [kind, setKind] = useState(initialKind);
  return (
    <ActionForm action={register} submitLabel="Créer mon compte" submitClassName="w-full py-3.5" className="mt-8 rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="suite" value={suite} />
      <div className="grid grid-cols-3 gap-1 rounded-full bg-eden-ivory p-1 text-xs sm:text-sm" role="radiogroup" aria-label="Type de compte">
        {KINDS.map((k) => (
          <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)} className={clsx("rounded-full px-2 py-2 font-semibold transition", kind === k.id ? "bg-eden-green text-eden-ivory" : "text-eden-mute")}>
            {k.label}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <Label>Nom complet</Label>
          <Input name="name" required autoComplete="name" />
        </label>
        {kind === "PRO" && (
          <label className="sm:col-span-2">
            <Label>Organisation</Label>
            <Input name="orgName" required autoComplete="organization" />
          </label>
        )}
        {kind === "VENDOR" && (
          <>
            <label>
              <Label>Nom de la boutique</Label>
              <Input name="shopName" required />
            </label>
            <label>
              <Label>Ville</Label>
              <Input name="city" required defaultValue="Lomé" />
            </label>
          </>
        )}
        <label>
          <Label>E-mail</Label>
          <Input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          <Label>Téléphone</Label>
          <Input name="phone" type="tel" required autoComplete="tel" placeholder="+228" />
        </label>
        <label className="sm:col-span-2">
          <Label hint="(8 caractères minimum)">Mot de passe</Label>
          <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
      </div>
      {kind === "VENDOR" && <p className="mt-4 text-xs text-eden-mute">Votre boutique sera vérifiée par l&apos;équipe Eden avant l&apos;activation de vos offres.</p>}
    </ActionForm>
  );
}

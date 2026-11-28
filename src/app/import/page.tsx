import type { Metadata } from "next";
import { Container, Input, Label, Textarea, Select } from "@/components/ui";
import { ActionForm } from "@/components/ActionForm";
import { requestImport } from "@/actions/imports";
import { IMPORT_STEPS, ORIGINS } from "@/lib/imports";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Import sur commande" };
export const dynamic = "force-dynamic";

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ produit?: string; budget?: string }> }) {
  const sp = await searchParams;
  const s = await getSession();
  const user = s ? await db.user.findUnique({ where: { id: s.userId } }) : null;
  return (
    <>
      <section className="bg-eden-ivory">
        <Container className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow">Import sur commande</p>
            <h1 className="mt-4 font-display text-[clamp(2.4rem,1.4rem+3.6vw,4.4rem)] font-medium leading-[1] tracking-[-0.04em]">
              Introuvable ici ? <span className="serif-accent">On le fait venir.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-eden-mute">
              Un modèle précis, une configuration rare, une quantité importante : Eden le source auprès de fournisseurs fiables en Chine, à Dubaï, en Europe ou aux États-Unis, puis l&apos;achemine jusqu&apos;à Lomé.
            </p>
          </div>
          <dl className="grid gap-2 text-sm sm:grid-cols-3 sm:gap-3">
            {[
              ["Prix", "tout compris : produit, transport et douane"],
              ["Délai", "annoncé avant toute commande"],
              ["Contrôle", "à l'arrivée, avant la livraison"],
            ].map(([t, d]) => (
              <div key={t} className="flex items-baseline gap-3 rounded-2xl bg-eden-porcelain p-4 sm:block">
                <dt className="font-serif text-xl italic text-eden-botanical">{t}</dt>
                <dd className="mt-1 text-eden-mute">{d}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Container className="grid gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <section aria-labelledby="etapes">
          <h2 id="etapes" className="font-display text-2xl font-medium tracking-tight">Comment ça se passe</h2>
          <ol className="mt-6 space-y-5">
            {IMPORT_STEPS.slice(0, 7).map((st, i) => (
              <li key={st.key} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-eden-ivory font-serif text-sm italic text-eden-gold-2">{i + 1}</span>
                <span>
                  <span className="block font-medium">{st.label}</span>
                  <span className="text-sm text-eden-mute">{st.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 rounded-2xl bg-eden-ivory p-5 text-sm text-eden-mute">
            <span className="font-medium text-eden-charcoal">Achats groupés.</span> Quand plusieurs clients demandent le même modèle, Eden regroupe la commande pour faire baisser le prix de chacun.
          </p>
        </section>

        <ActionForm action={requestImport} submitLabel="Envoyer ma demande" submitClassName="w-full py-4 sm:w-auto sm:px-10" className="rounded-[2rem] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-9">
          <h2 className="font-display text-xl font-medium">Votre demande</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <Label>Produit recherché</Label>
              <Input name="product" required defaultValue={sp.produit ?? ""} placeholder="Par exemple : MacBook Pro 14 M3, 18 Go, clavier AZERTY" />
            </label>
            <label className="sm:col-span-2">
              <Label hint="(facultatif)">Lien vers le produit</Label>
              <Input name="link" type="url" placeholder="https://…" />
            </label>
            <label>
              <Label>Quantité</Label>
              <Input name="quantity" inputMode="numeric" defaultValue="1" />
            </label>
            <label>
              <Label hint="(FCFA, facultatif)">Budget</Label>
              <Input name="budget" inputMode="numeric" defaultValue={sp.budget ?? ""} />
            </label>
            <label>
              <Label hint="(facultatif)">Pour quand ?</Label>
              <Input name="deadline" placeholder="Avant la rentrée, sous 3 semaines…" />
            </label>
            <label>
              <Label>Provenance souhaitée</Label>
              <Select name="origin" defaultValue="Indifférent">
                {ORIGINS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </Select>
            </label>
            <label className="sm:col-span-2">
              <Label hint="(facultatif)">Précisions</Label>
              <Textarea name="details" placeholder="Couleur, configuration, état (neuf ou reconditionné), usage…" />
            </label>
            <label>
              <Label>Votre nom</Label>
              <Input name="name" required defaultValue={user?.name ?? ""} autoComplete="name" />
            </label>
            <label>
              <Label>Téléphone</Label>
              <Input name="phone" type="tel" required defaultValue={user?.phone ?? ""} autoComplete="tel" placeholder="+228" />
            </label>
            <label className="sm:col-span-2">
              <Label hint="(facultatif)">E-mail</Label>
              <Input name="email" type="email" defaultValue={user?.email ?? ""} autoComplete="email" />
            </label>
          </div>
          <p className="mt-4 text-xs text-eden-mute">Gratuit et sans engagement : vous ne payez rien avant d&apos;avoir accepté la proposition d&apos;Eden.</p>
        </ActionForm>
      </Container>
    </>
  );
}

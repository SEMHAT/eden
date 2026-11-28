import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import clsx from "clsx";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { IMPORT_STEPS, IMPORT_LABEL } from "@/lib/imports";
import { fcfa, dateTimeFr } from "@/lib/format";
import { Container, ButtonLink } from "@/components/ui";
import { acceptImportQuote } from "@/actions/imports";

export const metadata = { title: "Suivi d'import", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ImportTracking({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ nouvelle?: string }> }) {
  const { number } = await params;
  const fresh = (await searchParams).nouvelle === "1";
  const r = await db.importRequest.findUnique({ where: { number } });
  if (!r) notFound();
  const s = await getSession();
  const mine = ((await cookies()).get("eden_imports")?.value ?? "").split(",");
  const allowed = s?.role === "ADMIN" || (s && r.userId === s.userId) || mine.includes(number);
  const idx = IMPORT_STEPS.findIndex((st) => st.key === r.status);

  return (
    <Container className="py-12">
      {fresh && (
        <div className="mb-10 rounded-[2rem] bg-eden-ivory p-6 sm:p-9">
          <p className="eyebrow">Merci</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Demande {r.number} reçue.</h1>
          <p className="mt-2 max-w-xl text-eden-mute">Eden recherche le meilleur fournisseur et vous envoie une proposition tout compris. Gardez ce lien pour suivre votre demande.</p>
        </div>
      )}
      {!fresh && <h1 className="font-display text-3xl font-medium tracking-tight">Import {r.number}</h1>}
      <p className="mt-2 text-sm text-eden-mute">
        {r.status === "CANCELLED" ? "Demande annulée" : IMPORT_LABEL[r.status]} · mise à jour le {dateTimeFr(r.updatedAt)}
      </p>

      {r.status !== "CANCELLED" && (
        <ol className="mt-8 grid gap-2 sm:grid-cols-4 lg:grid-cols-8" aria-label="Étapes">
          {IMPORT_STEPS.map((st, i) => (
            <li key={st.key} className={clsx("rounded-2xl p-3 text-xs", i < idx ? "bg-eden-sage/25 text-[#3f5a45]" : i === idx ? "bg-eden-charcoal text-eden-porcelain" : "bg-eden-ivory text-eden-mute")}>
              <span className="font-serif italic">{i + 1}</span>
              <p className="mt-1 font-medium">{st.label}</p>
            </li>
          ))}
        </ol>
      )}

      {!allowed ? (
        <p className="mt-8 rounded-2xl bg-eden-ivory p-5 text-sm">
          Le détail de cette demande est réservé à son auteur. <Link href={`/connexion?suite=/import/${r.number}`} className="font-medium underline">Se connecter</Link>
        </p>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-soft)]">
            <h2 className="font-display text-lg font-medium">Votre demande</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-eden-mute">Produit</dt><dd className="font-medium">{r.product}</dd></div>
              {r.link && <div><dt className="text-eden-mute">Lien</dt><dd><a href={r.link} target="_blank" rel="noopener noreferrer nofollow" className="break-all underline">{r.link}</a></dd></div>}
              <div className="flex gap-8">
                <div><dt className="text-eden-mute">Quantité</dt><dd>{r.quantity}</dd></div>
                {r.budget && <div><dt className="text-eden-mute">Budget</dt><dd>{fcfa(r.budget)}</dd></div>}
                {r.origin && <div><dt className="text-eden-mute">Provenance</dt><dd>{r.origin}</dd></div>}
              </div>
              {r.deadline && <div><dt className="text-eden-mute">Échéance</dt><dd>{r.deadline}</dd></div>}
              {r.details && <div><dt className="text-eden-mute">Précisions</dt><dd className="whitespace-pre-line">{r.details}</dd></div>}
            </dl>
          </section>
          <section className="rounded-[var(--radius-card)] bg-eden-ivory p-6">
            <h2 className="font-display text-lg font-medium">La proposition d&apos;Eden</h2>
            {r.quotedPrice ? (
              <>
                <p className="mt-4 font-display text-3xl font-semibold">{fcfa(r.quotedPrice)}</p>
                <p className="text-sm text-eden-mute">Tout compris : produit, transport et douane{r.etaDays ? ` · livraison estimée sous ${r.etaDays} jours` : ""}.</p>
                {r.response && <p className="mt-4 whitespace-pre-line text-sm">{r.response}</p>}
                {r.status === "QUOTED" && (
                  <form action={acceptImportQuote} className="mt-6">
                    <input type="hidden" name="number" value={r.number} />
                    <button className="w-full rounded-full bg-eden-charcoal py-3.5 text-sm font-medium text-eden-porcelain">Accepter la proposition</button>
                    <p className="mt-2 text-center text-xs text-eden-mute">Eden vous contacte ensuite pour l&apos;acompte, avant de commander.</p>
                  </form>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-eden-mute">En préparation. Vous la verrez ici dès qu&apos;elle sera prête{r.email ? ", et nous vous contacterons" : ""}.</p>
            )}
          </section>
        </div>
      )}
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/import" variant="outline">Nouvelle demande</ButtonLink>
        <ButtonLink href="/boutique" variant="ghost">Retour à la boutique</ButtonLink>
      </div>
    </Container>
  );
}

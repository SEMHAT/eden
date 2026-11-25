import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { cardAvailability, productCardSelect, toReco } from "@/lib/catalog";
import { specRows } from "@/lib/specs";
import { explainDifference } from "@/lib/reco";
import { CONDITION_LABEL } from "@/lib/format";
import { Container, EmptyState, ButtonLink, Availability, Price, PageHeader } from "@/components/ui";
import { DeviceArt } from "@/components/DeviceArt";
import { AddToCart } from "@/components/ProductActions";
import { ClearCompare } from "@/components/ClearCompare";

export const metadata: Metadata = { title: "Comparer" };
export const dynamic = "force-dynamic";

export default async function Comparer({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const ids = ((await searchParams).ids ?? "").split(",").filter(Boolean).slice(0, 4);
  const items = ids.length ? await db.product.findMany({ where: { id: { in: ids }, active: true }, select: { ...productCardSelect, condition: true, warrantyMonths: true, reference: true } }) : [];
  const ordered = ids.map((id) => items.find((p) => p.id === id)).filter((p): p is (typeof items)[number] => Boolean(p));

  if (ordered.length < 2)
    return (
      <>
        <PageHeader title="Comparer." tagline="Côte à côte, pour décider sereinement." />
        <Container className="mt-10">
          <EmptyState title="Ajoutez au moins deux produits." text="Cochez « Comparer » sur les fiches ou dans la boutique (4 produits maximum)." action={<ButtonLink href="/boutique">Aller à la boutique</ButtonLink>} />
        </Container>
      </>
    );

  const specs = ordered.map((p) => Object.fromEntries(specRows(p.specs as Record<string, unknown>)));
  const keys = [...new Set(specs.flatMap((s) => Object.keys(s)))];
  const recos = ordered.map(toReco);
  const diffs = recos.slice(1).map((r) => ({ name: r.name, lines: explainDifference(recos[0], r) }));

  return (
    <>
      <PageHeader title="Comparer." tagline="Côte à côte, pour décider sereinement.">
        <div className="mt-4">
          <ClearCompare />
        </div>
      </PageHeader>
      <Container className="mt-8">
        <div className="overflow-x-auto rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-soft)]">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr>
                <th className="w-44" />
                {ordered.map((p) => {
                  const a = cardAvailability(p);
                  return (
                    <th key={p.id} className="p-5 text-left align-top font-normal">
                      <DeviceArt kind={p.illustration} color={p.color} className="h-28 w-28" />
                      <p className="mt-2 text-xs uppercase tracking-wider text-eden-mute">{p.brand}</p>
                      <Link href={`/produit/${p.slug}`} className="font-display text-base font-semibold hover:underline">{p.name}</Link>
                      <div className="mt-2"><Price value={a.price} className="text-lg text-eden-green" /></div>
                      <div className="mt-1"><Availability level={a.availability} compact /></div>
                      {a.price !== null && a.availability !== "OUT_OF_STOCK" && <div className="mt-3"><AddToCart productId={p.id} label="Ajouter" /></div>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {[["État", ordered.map((p) => CONDITION_LABEL[p.condition])], ["Garantie", ordered.map((p) => `${p.warrantyMonths} mois`)], ...keys.map((k) => [k, specs.map((s) => s[k] ?? "—")] as [string, string[]])].map(([k, vals]) => {
                const differ = new Set(vals).size > 1;
                return (
                  <tr key={k as string} className="border-t border-eden-charcoal/5">
                    <th scope="row" className="px-5 py-3 text-left font-medium text-eden-mute">{k}</th>
                    {(vals as string[]).map((v, i) => (
                      <td key={i} className={differ ? "px-5 py-3 font-medium" : "px-5 py-3 text-eden-mute"}>{v}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <section className="mt-10 rounded-[var(--radius-card)] bg-eden-green p-6 text-eden-ivory sm:p-8">
          <h2 className="font-display text-xl font-semibold">Ce qui les distingue</h2>
          <p className="mt-1 text-sm text-eden-ivory/70">Par rapport à {recos[0].brand} {recos[0].name} :</p>
          <ul className="mt-4 space-y-3 text-sm">
            {diffs.map((d) => (
              <li key={d.name}>
                <span className="font-semibold text-eden-gold">{d.name}</span> : {d.lines.length ? d.lines.join(", ") : "caractéristiques très proches"}.
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </>
  );
}

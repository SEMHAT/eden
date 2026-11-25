"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="rounded-full bg-eden-green px-5 py-2.5 text-sm font-semibold text-eden-ivory">
      Imprimer ou enregistrer en PDF
    </button>
  );
}

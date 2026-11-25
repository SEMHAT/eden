"use client";

export function ReplayIntro() {
  return (
    <button
      onClick={() => {
        try {
          localStorage.removeItem("eden_intro_vue");
        } catch {}
        window.location.href = "/?intro=1";
      }}
      className="inline-flex items-center gap-2 rounded-full border border-eden-charcoal/15 px-4 py-2 text-xs font-medium text-eden-charcoal/80 transition hover:border-eden-charcoal hover:text-eden-charcoal"
    >
      <span aria-hidden>▶</span> Revoir l&apos;introduction
    </button>
  );
}

"use client";
// Ambiance sonore discrète, synthétisée dans le navigateur (aucun fichier audio).
// Ne démarre qu'après un clic du visiteur.

export type Ambience = { start: () => void; stop: () => void; chime: (t: number) => void };

export function createAmbience(): Ambience {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  const nodes: OscillatorNode[] = [];
  const rung = new Set<number>();

  const bell = (freq: number, when = 0) => {
    if (!ctx || !master) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime + when);
    g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + when + 3.2);
    o.connect(g).connect(master);
    o.start(ctx.currentTime + when);
    o.stop(ctx.currentTime + when + 3.4);
  };

  return {
    start() {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      master.connect(ctx.destination);
      filter.connect(master);
      // accord doux (ré majeur 9)
      [146.83, 220, 293.66, 369.99, 440].forEach((f, i) => {
        const o = ctx!.createOscillator();
        const g = ctx!.createGain();
        o.type = i % 2 ? "triangle" : "sine";
        o.frequency.value = f;
        o.detune.value = (i - 2) * 4;
        g.gain.value = 0.05;
        o.connect(g).connect(filter);
        o.start();
        nodes.push(o);
      });
      master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2.5);
    },
    stop() {
      if (!ctx || !master) return;
      const c = ctx;
      master.gain.linearRampToValueAtTime(0, c.currentTime + 0.6);
      setTimeout(() => {
        nodes.forEach((n) => n.stop());
        nodes.length = 0;
        c.close();
      }, 700);
      ctx = null;
    },
    chime(t: number) {
      // un tintement à l'apparition de la sculpture puis des produits
      for (const [mark, f] of [[0.2, 880], [0.5, 1174.66], [0.86, 1318.5]] as const) {
        if (t >= mark && !rung.has(mark)) {
          rung.add(mark);
          bell(f);
          bell(f * 1.5, 0.12);
        }
      }
    },
  };
}

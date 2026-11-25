// Illustrations vectorielles génériques des appareils (aucun logo de marque).
// Légères et nettes à toutes les tailles ; remplacées par les photos réelles des vendeurs quand elles existent.

type Props = { kind: string; color?: string; className?: string; title?: string };

function shade(hex: string, amt: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function DeviceArt({ kind, color = "#20231F", className, title }: Props) {
  const id = `da-${kind}-${color.replace("#", "")}`;
  const light = shade(color, 40);
  const dark = shade(color, -30);
  const isLight = parseInt(color.slice(1, 3), 16) > 180;
  const screen = (
    <linearGradient id={`${id}-scr`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#f6efe2" />
      <stop offset="0.55" stopColor="#dfe7dc" />
      <stop offset="1" stopColor="#a7b9a5" />
    </linearGradient>
  );
  const body = (
    <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor={light} />
      <stop offset="1" stopColor={dark} />
    </linearGradient>
  );
  const gold = (
    <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#e3cfab" />
      <stop offset="1" stopColor="#c6a36a" />
    </linearGradient>
  );
  const shadow = <ellipse cx="100" cy="186" rx="62" ry="6" fill="#4a3f30" opacity="0.1" />;
  const wave = (x: number, y: number, w: number, h: number) => (
    <path d={`M${x} ${y + h * 0.75} C ${x + w * 0.3} ${y + h * 0.35}, ${x + w * 0.6} ${y + h * 0.95}, ${x + w} ${y + h * 0.3} L ${x + w} ${y + h} L ${x} ${y + h} Z`} fill={`url(#${id}-gold)`} opacity="0.85" />
  );

  let art: React.ReactNode;
  switch (kind) {
    case "phone":
      art = (
        <>
          {shadow}
          <rect x="62" y="14" width="76" height="164" rx="16" fill={`url(#${id}-body)`} />
          <rect x="67" y="19" width="66" height="154" rx="12" fill={`url(#${id}-scr)`} />
          {wave(67, 110, 66, 63)}
          <rect x="90" y="24" width="20" height="5" rx="2.5" fill="#000" opacity="0.7" />
          <path d="M70 22 L96 22 L72 120 Z" fill="#fff" opacity="0.06" />
        </>
      );
      break;
    case "tablet":
      art = (
        <>
          {shadow}
          <rect x="34" y="26" width="132" height="150" rx="14" fill={`url(#${id}-body)`} />
          <rect x="40" y="32" width="120" height="138" rx="9" fill={`url(#${id}-scr)`} />
          {wave(40, 100, 120, 70)}
        </>
      );
      break;
    case "laptop":
      art = (
        <>
          {shadow}
          <path d="M44 40 Q44 32 52 32 L148 32 Q156 32 156 40 L156 134 L44 134 Z" fill={`url(#${id}-body)`} />
          <rect x="50" y="38" width="100" height="90" rx="3" fill={`url(#${id}-scr)`} />
          {wave(50, 80, 100, 48)}
          <path d="M26 138 L174 138 L166 152 Q164 156 158 156 L42 156 Q36 156 34 152 Z" fill={light} />
          <rect x="86" y="138" width="28" height="4" rx="2" fill={dark} />
        </>
      );
      break;
    case "monitor":
      art = (
        <>
          {shadow}
          <rect x="22" y="30" width="156" height="100" rx="8" fill={`url(#${id}-body)`} />
          <rect x="28" y="36" width="144" height="88" rx="3" fill={`url(#${id}-scr)`} />
          {wave(28, 80, 144, 44)}
          <path d="M92 130 L108 130 L114 168 L86 168 Z" fill={dark} />
          <rect x="66" y="166" width="68" height="8" rx="4" fill={light} />
        </>
      );
      break;
    case "headphones":
      art = (
        <>
          {shadow}
          <path d="M44 112 C 40 50, 160 50, 156 112" fill="none" stroke={`url(#${id}-body)`} strokeWidth="12" strokeLinecap="round" />
          <path d="M48 108 C 46 62, 154 62, 152 108" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="2" opacity="0.8" />
          <rect x="28" y="100" width="40" height="64" rx="18" fill={`url(#${id}-body)`} />
          <rect x="132" y="100" width="40" height="64" rx="18" fill={`url(#${id}-body)`} />
          <rect x="36" y="110" width="8" height="44" rx="4" fill={`url(#${id}-gold)`} />
          <rect x="156" y="110" width="8" height="44" rx="4" fill={`url(#${id}-gold)`} />
        </>
      );
      break;
    case "earbuds":
      art = (
        <>
          {shadow}
          <rect x="56" y="70" width="88" height="96" rx="34" fill={`url(#${id}-body)`} />
          <line x1="58" y1="104" x2="142" y2="104" stroke={isLight ? "#cfcfcf" : "#000"} strokeOpacity="0.4" strokeWidth="1.5" />
          <circle cx="100" cy="134" r="3" fill="#2ecc71" opacity="0.8" />
          <g transform="translate(62 30) rotate(-12)">
            <circle cx="14" cy="16" r="14" fill={`url(#${id}-body)`} />
            <rect x="9" y="22" width="10" height="34" rx="5" fill={`url(#${id}-body)`} />
          </g>
          <g transform="translate(110 26) rotate(14)">
            <circle cx="14" cy="16" r="14" fill={`url(#${id}-body)`} />
            <rect x="9" y="22" width="10" height="34" rx="5" fill={`url(#${id}-body)`} />
          </g>
        </>
      );
      break;
    case "watch":
      art = (
        <>
          {shadow}
          <rect x="78" y="10" width="44" height="54" rx="10" fill={dark} />
          <rect x="78" y="136" width="44" height="46" rx="10" fill={dark} />
          <rect x="58" y="52" width="84" height="96" rx="26" fill={`url(#${id}-body)`} />
          <rect x="65" y="59" width="70" height="82" rx="20" fill={`url(#${id}-scr)`} />
          <circle cx="100" cy="100" r="22" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="4" strokeDasharray="100 40" />
          <rect x="142" y="86" width="6" height="18" rx="3" fill={`url(#${id}-gold)`} />
        </>
      );
      break;
    case "speaker":
      art = (
        <>
          {shadow}
          <rect x="34" y="70" width="132" height="96" rx="46" fill={`url(#${id}-body)`} />
          <circle cx="72" cy="118" r="22" fill={dark} />
          <circle cx="128" cy="118" r="22" fill={dark} />
          <circle cx="72" cy="118" r="10" fill={`url(#${id}-gold)`} />
          <circle cx="128" cy="118" r="10" fill={`url(#${id}-gold)`} />
          <rect x="80" y="76" width="40" height="5" rx="2.5" fill="#fff" opacity="0.25" />
        </>
      );
      break;
    case "controller":
      art = (
        <>
          {shadow}
          <path d="M40 92 C 44 70, 70 66, 100 70 C 130 66, 156 70, 160 92 L 172 146 C 176 166, 150 172, 138 152 L 128 136 L 72 136 L 62 152 C 50 172, 24 166, 28 146 Z" fill={`url(#${id}-body)`} />
          <rect x="58" y="96" width="30" height="9" rx="3" fill={dark} />
          <rect x="68.5" y="85.5" width="9" height="30" rx="3" fill={dark} />
          <circle cx="132" cy="90" r="6" fill={`url(#${id}-gold)`} />
          <circle cx="146" cy="102" r="6" fill="#b82e35" />
          <circle cx="118" cy="102" r="6" fill="#66866d" />
          <circle cx="132" cy="114" r="6" fill={dark} />
          <circle cx="82" cy="124" r="10" fill={dark} />
          <circle cx="118" cy="124" r="10" fill={dark} />
        </>
      );
      break;
    case "console":
      art = (
        <>
          {shadow}
          <path d="M70 22 Q 64 22 66 34 L 74 176 L 96 176 L 96 22 Z" fill={`url(#${id}-body)`} />
          <path d="M130 22 Q 136 22 134 34 L 126 176 L 104 176 L 104 22 Z" fill={`url(#${id}-body)`} />
          <rect x="96" y="22" width="8" height="154" fill="#20231f" />
          <rect x="99" y="40" width="2" height="40" fill={`url(#${id}-gold)`} />
        </>
      );
      break;
    case "powerbank":
      art = (
        <>
          {shadow}
          <rect x="60" y="22" width="80" height="156" rx="16" fill={`url(#${id}-body)`} />
          <rect x="72" y="46" width="56" height="20" rx="6" fill={`url(#${id}-scr)`} />
          <rect x="76" y="52" width="36" height="8" rx="2" fill={`url(#${id}-gold)`} />
          <rect x="86" y="160" width="28" height="6" rx="3" fill="#000" opacity="0.5" />
          <path d="M104 92 L 90 122 L 102 122 L 96 146 L 114 112 L 102 112 Z" fill={`url(#${id}-gold)`} />
        </>
      );
      break;
    case "charger":
      art = (
        <>
          {shadow}
          <rect x="66" y="58" width="68" height="100" rx="14" fill={`url(#${id}-body)`} />
          <rect x="82" y="30" width="8" height="30" rx="2" fill="#b7b7b7" />
          <rect x="110" y="30" width="8" height="30" rx="2" fill="#b7b7b7" />
          <rect x="86" y="132" width="28" height="7" rx="3" fill="#20231f" opacity="0.6" />
          <rect x="88" y="118" width="24" height="6" rx="3" fill="#20231f" opacity="0.6" />
          <circle cx="100" cy="88" r="9" fill={`url(#${id}-gold)`} />
        </>
      );
      break;
    case "ups":
      art = (
        <>
          {shadow}
          <rect x="52" y="34" width="96" height="144" rx="12" fill={`url(#${id}-body)`} />
          <circle cx="100" cy="66" r="12" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="4" />
          <line x1="100" y1="50" x2="100" y2="64" stroke={`url(#${id}-gold)`} strokeWidth="4" strokeLinecap="round" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="66" y={100 + i * 12} width="68" height="4" rx="2" fill="#000" opacity="0.35" />
          ))}
        </>
      );
      break;
    case "printer":
      art = (
        <>
          {shadow}
          <rect x="62" y="26" width="76" height="40" rx="4" fill="#fbf8f1" stroke="#e3dccb" />
          <rect x="30" y="58" width="140" height="82" rx="14" fill={`url(#${id}-body)`} />
          <rect x="44" y="140" width="112" height="34" rx="8" fill={dark} />
          <rect x="58" y="128" width="84" height="40" rx="3" fill="#fbf8f1" />
          <rect x="68" y="140" width="50" height="4" rx="2" fill="#c6a36a" />
          <rect x="68" y="150" width="64" height="4" rx="2" fill="#e3dccb" />
          <circle cx="150" cy="80" r="4" fill="#2ecc71" />
        </>
      );
      break;
    case "keyboard":
      art = (
        <>
          {shadow}
          <rect x="14" y="88" width="132" height="64" rx="10" fill={`url(#${id}-body)`} />
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 10 }).map((__, c) => <rect key={`${r}-${c}`} x={22 + c * 12} y={96 + r * 13} width="9" height="9" rx="2" fill={dark} />),
          )}
          <rect x="150" y="92" width="38" height="58" rx="19" fill={`url(#${id}-body)`} />
          <line x1="169" y1="94" x2="169" y2="112" stroke={dark} strokeWidth="2" />
        </>
      );
      break;
    case "mouse":
      art = (
        <>
          {shadow}
          <path d="M100 30 C 140 30, 152 70, 150 110 C 148 160, 126 180, 100 180 C 74 180, 52 160, 50 110 C 48 70, 60 30, 100 30 Z" fill={`url(#${id}-body)`} />
          <line x1="100" y1="32" x2="100" y2="86" stroke={dark} strokeWidth="2" />
          <rect x="95" y="50" width="10" height="24" rx="5" fill={`url(#${id}-gold)`} />
        </>
      );
      break;
    default:
      art = (
        <>
          {shadow}
          <rect x="50" y="40" width="100" height="130" rx="20" fill={`url(#${id}-body)`} />
        </>
      );
  }

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title ?? kind} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {screen}
        {body}
        {gold}
      </defs>
      {art}
    </svg>
  );
}

/* Données de DÉMONSTRATION — prix indicatifs, vendeurs fictifs.
   Elles servent à faire fonctionner la Preview ; à remplacer par le vrai catalogue avant le lancement. */
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { computeSalePrice } from "../src/lib/pricing";

const db = new PrismaClient();

const categories = [
  { slug: "smartphones", name: "Smartphones", icon: "phone", order: 1, description: "Android et iPhone, neufs ou reconditionnés.", children: [] as { slug: string; name: string; icon: string }[] },
  {
    slug: "ordinateurs", name: "Ordinateurs", icon: "laptop", order: 2, description: "Portables pour étudier, travailler, créer et jouer.",
    children: [
      { slug: "ordinateurs-portables", name: "Ordinateurs portables", icon: "laptop" },
      { slug: "tablettes", name: "Tablettes", icon: "tablet" },
    ],
  },
  {
    slug: "audio-accessoires", name: "Audio et accessoires", icon: "headphones", order: 3, description: "Casques, écouteurs, enceintes et montres.",
    children: [
      { slug: "casques", name: "Casques", icon: "headphones" },
      { slug: "ecouteurs", name: "Écouteurs", icon: "earbuds" },
      { slug: "enceintes", name: "Enceintes", icon: "speaker" },
      { slug: "montres", name: "Montres connectées", icon: "watch" },
    ],
  },
  { slug: "gaming", name: "Gaming", icon: "controller", order: 4, description: "Consoles, manettes et accessoires de jeu.", children: [] },
  { slug: "energie", name: "Énergie et recharge", icon: "powerbank", order: 5, description: "Batteries externes, chargeurs et onduleurs.", children: [] },
  {
    slug: "bureau", name: "Équipements de bureau", icon: "printer", order: 6, description: "Imprimantes, écrans, claviers et souris.",
    children: [
      { slug: "imprimantes", name: "Imprimantes", icon: "printer" },
      { slug: "ecrans", name: "Écrans", icon: "monitor" },
      { slug: "peripheriques", name: "Claviers et souris", icon: "keyboard" },
    ],
  },
];

type P = {
  name: string; brand: string; cat: string; ill: string; color?: string; price: number; specs: Prisma.InputJsonValue;
  usage: string[]; gift: string[]; desc: string; cond?: "NEUF" | "RECONDITIONNE" | "OCCASION"; pop: number; isNew?: boolean; feat?: boolean; warranty?: number;
};

const products: P[] = [
  // Smartphones
  { name: "Galaxy A15 128 Go", brand: "Samsung", cat: "smartphones", ill: "phone", color: "#1F2A44", price: 98000, pop: 88, isNew: false, specs: { chip: "Helio G99", ram: 4, storage: 128, camera: 50, battery: 5000, screen: 6.5, network: "4G" }, usage: ["etudiant", "photo", "autonomie"], gift: ["ado", "parent", "elle", "lui", "anniversaire"], desc: "Un écran Super AMOLED de 6,5 pouces, une batterie qui tient la journée et un appareil photo de 50 MP pour un usage quotidien sans compromis." },
  { name: "Galaxy A55 5G 256 Go", brand: "Samsung", cat: "smartphones", ill: "phone", color: "#BFD4E6", price: 268000, pop: 80, isNew: true, feat: true, specs: { chip: "Exynos 1480", ram: 8, storage: 256, camera: 50, battery: 5000, screen: 6.6, network: "5G" }, usage: ["photo", "gaming", "autonomie"], gift: ["elle", "lui", "diplome", "anniversaire"], desc: "Châssis en métal et verre, écran 120 Hz et 8 Go de RAM : un milieu de gamme qui fait tout bien." },
  { name: "Spark 20 Pro 256 Go", brand: "Tecno", cat: "smartphones", ill: "phone", color: "#2E2E2E", price: 112000, pop: 85, specs: { chip: "Helio G99", ram: 8, storage: 256, camera: 108, battery: 5000, screen: 6.78, network: "4G" }, usage: ["photo", "etudiant", "autonomie"], gift: ["ado", "lui", "elle", "anniversaire"], desc: "Un capteur principal de 108 MP et 256 Go de stockage à prix serré." },
  { name: "Hot 40 Pro 256 Go", brand: "Infinix", cat: "smartphones", ill: "phone", color: "#3A4A3E", price: 105000, pop: 82, specs: { chip: "Helio G99", ram: 8, storage: 256, camera: 108, battery: 5000, screen: 6.78, network: "4G" }, usage: ["gaming", "photo", "autonomie"], gift: ["ado", "lui", "anniversaire"], desc: "Écran 120 Hz et charge rapide 33 W, pensé pour le jeu mobile." },
  { name: "Redmi Note 13 Pro 256 Go", brand: "Xiaomi", cat: "smartphones", ill: "phone", color: "#5B3E8E", price: 175000, pop: 78, isNew: true, specs: { chip: "Helio G99-Ultra", ram: 8, storage: 256, camera: 200, battery: 5000, screen: 6.67, network: "4G" }, usage: ["photo", "autonomie"], gift: ["elle", "lui", "saint-valentin", "anniversaire"], desc: "Un capteur de 200 MP et un écran AMOLED 120 Hz pour les passionnés de photo." },
  { name: "iPhone 13 128 Go", brand: "Apple", cat: "smartphones", ill: "phone", color: "#E8E2D8", price: 285000, pop: 90, cond: "RECONDITIONNE", warranty: 6, specs: { chip: "A15 Bionic", ram: 4, storage: 128, camera: 12, battery: 3240, screen: 6.1, network: "5G" }, usage: ["photo"], gift: ["elle", "lui", "saint-valentin", "diplome"], desc: "Reconditionné et contrôlé : batterie à plus de 85 % de capacité, sans rayure visible." },
  { name: "Camon 30 5G 256 Go", brand: "Tecno", cat: "smartphones", ill: "phone", color: "#0E4D3A", price: 165000, pop: 70, isNew: true, specs: { chip: "Dimensity 7020", ram: 8, storage: 256, camera: 50, battery: 5000, screen: 6.78, network: "5G" }, usage: ["photo", "autonomie"], gift: ["elle", "lui", "anniversaire"], desc: "Selfie 50 MP et design soigné pour les créateurs de contenu." },
  { name: "Galaxy S23 FE 256 Go", brand: "Samsung", cat: "smartphones", ill: "phone", color: "#6C7A5A", price: 345000, pop: 65, specs: { chip: "Exynos 2200", ram: 8, storage: 256, camera: 50, battery: 4500, screen: 6.4, network: "5G" }, usage: ["photo", "gaming"], gift: ["lui", "elle", "diplome"], desc: "Les fonctions de la gamme S, téléobjectif compris, à un prix plus accessible." },

  // Ordinateurs portables
  { name: "IdeaPad Slim 3 15\" i5 16 Go", brand: "Lenovo", cat: "ordinateurs-portables", ill: "laptop", color: "#5F6B73", price: 315000, pop: 84, feat: true, specs: { cpu: "Intel Core i5-12450H", cpuTier: 4, ram: 16, storage: 512, storageType: "SSD", gpu: "Intel UHD", gpuDedicated: false, screen: 15.6, weight: 1.6 }, usage: ["programmation", "bureautique", "etudiant"], gift: ["diplome", "moi"], desc: "16 Go de RAM et un processeur i5 de 12e génération : de quoi coder, étudier et multiplier les onglets." },
  { name: "250 G9 i3 8 Go", brand: "HP", cat: "ordinateurs-portables", ill: "laptop", color: "#3B3F45", price: 205000, pop: 86, specs: { cpu: "Intel Core i3-1215U", cpuTier: 2, ram: 8, storage: 256, storageType: "SSD", gpu: "Intel UHD", gpuDedicated: false, screen: 15.6, weight: 1.74 }, usage: ["bureautique", "etudiant"], gift: ["ado", "diplome"], desc: "Le portable simple et fiable pour les cours et la bureautique." },
  { name: "Vostro 3520 i5 8 Go", brand: "Dell", cat: "ordinateurs-portables", ill: "laptop", color: "#2B2F33", price: 265000, pop: 72, specs: { cpu: "Intel Core i5-1235U", cpuTier: 3, ram: 8, storage: 512, storageType: "SSD", gpu: "Intel Iris Xe", gpuDedicated: false, screen: 15.6, weight: 1.66 }, usage: ["bureautique", "programmation"], gift: ["collegue", "moi"], desc: "Conçu pour les PME : robuste, clavier pavé numérique, garantie pro." },
  { name: "TUF Gaming F15 i5 RTX 3050", brand: "ASUS", cat: "ordinateurs-portables", ill: "laptop", color: "#1B1D1F", price: 485000, pop: 79, isNew: true, feat: true, specs: { cpu: "Intel Core i5-11400H", cpuTier: 4, ram: 16, storage: 512, storageType: "SSD", gpu: "NVIDIA RTX 3050", gpuDedicated: true, screen: 15.6, weight: 2.3 }, usage: ["gaming", "montage", "graphisme", "programmation"], gift: ["lui", "ado", "diplome"], desc: "Carte graphique RTX 3050 et écran 144 Hz : jeu, montage et 3D." },
  { name: "Aspire 7 Ryzen 5 GTX 1650", brand: "Acer", cat: "ordinateurs-portables", ill: "laptop", color: "#23262A", price: 395000, pop: 68, specs: { cpu: "AMD Ryzen 5 5500U", cpuTier: 4, ram: 16, storage: 512, storageType: "SSD", gpu: "NVIDIA GTX 1650", gpuDedicated: true, screen: 15.6, weight: 2.15 }, usage: ["montage", "graphisme", "gaming", "programmation"], gift: ["moi"], desc: "Une carte graphique dédiée à prix contenu pour débuter le montage." },
  { name: "MacBook Air M1 8 Go 256 Go", brand: "Apple", cat: "ordinateurs-portables", ill: "laptop", color: "#C9C9C4", price: 445000, pop: 83, cond: "RECONDITIONNE", specs: { cpu: "Apple M1", cpuTier: 4, ram: 8, storage: 256, storageType: "SSD", gpu: "M1 7 cœurs", gpuDedicated: false, screen: 13.3, weight: 1.29, autonomy: 15 }, usage: ["programmation", "voyage", "autonomie", "bureautique"], gift: ["diplome", "elle", "lui"], desc: "Reconditionné et contrôlé. Silencieux, léger et jusqu'à 15 h d'autonomie annoncée." },
  { name: "ThinkPad E14 i7 16 Go", brand: "Lenovo", cat: "ordinateurs-portables", ill: "laptop", color: "#151515", price: 525000, pop: 60, specs: { cpu: "Intel Core i7-1355U", cpuTier: 5, ram: 16, storage: 512, storageType: "SSD", gpu: "Intel Iris Xe", gpuDedicated: false, screen: 14, weight: 1.41 }, usage: ["programmation", "bureautique", "voyage", "appels"], gift: ["collegue"], desc: "Le clavier ThinkPad, un i7 et 1,4 kg : l'outil des développeurs et des cadres en déplacement." },
  { name: "Galaxy Tab A9+ 64 Go", brand: "Samsung", cat: "tablettes", ill: "tablet", color: "#7D8288", price: 135000, pop: 66, specs: { chip: "Snapdragon 695", ram: 4, storage: 64, screen: 11, battery: 7040 }, usage: ["etudiant", "autonomie"], gift: ["ado", "parent", "anniversaire"], desc: "Un grand écran de 11 pouces pour lire, réviser et regarder des vidéos." },

  // Audio et accessoires
  { name: "Tune 520BT", brand: "JBL", cat: "casques", ill: "headphones", color: "#1E1E1E", price: 32000, pop: 87, specs: { type: "Casque", wireless: true, anc: false, autonomy: 57 }, usage: ["musique", "autonomie", "appels"], gift: ["ado", "lui", "elle", "anniversaire", "merci"], desc: "Le son JBL Pure Bass et jusqu'à 57 h d'écoute." },
  { name: "WH-CH720N", brand: "Sony", cat: "casques", ill: "headphones", color: "#2A2C2E", price: 78000, pop: 74, feat: true, specs: { type: "Casque", wireless: true, anc: true, autonomy: 35 }, usage: ["musique", "voyage", "appels"], gift: ["lui", "elle", "diplome", "anniversaire"], desc: "Réduction de bruit active dans un casque léger." },
  { name: "FreePods 4", brand: "Oraimo", cat: "ecouteurs", ill: "earbuds", color: "#F2F2F2", price: 18500, pop: 89, specs: { type: "Écouteurs", wireless: true, anc: true, autonomy: 35 }, usage: ["musique", "sport", "appels"], gift: ["ado", "elle", "lui", "merci", "anniversaire"], desc: "Réduction de bruit et étui de charge, le meilleur rapport qualité-prix." },
  { name: "Galaxy Buds FE", brand: "Samsung", cat: "ecouteurs", ill: "earbuds", color: "#2F3236", price: 52000, pop: 70, specs: { type: "Écouteurs", wireless: true, anc: true, autonomy: 21 }, usage: ["musique", "sport", "appels"], gift: ["elle", "lui", "saint-valentin"], desc: "Un son équilibré et un maintien sûr pour le sport." },
  { name: "AirPods 3e génération", brand: "Apple", cat: "ecouteurs", ill: "earbuds", color: "#FFFFFF", price: 118000, pop: 76, specs: { type: "Écouteurs", wireless: true, anc: false, autonomy: 30 }, usage: ["musique", "appels"], gift: ["elle", "lui", "saint-valentin", "anniversaire"], desc: "Audio spatial et appairage instantané avec l'iPhone." },
  { name: "Flip 6", brand: "JBL", cat: "enceintes", ill: "speaker", color: "#0F4D3A", price: 85000, pop: 81, feat: true, specs: { type: "Enceinte", wireless: true, autonomy: 12, waterproof: "IP67" }, usage: ["musique", "voyage"], gift: ["lui", "ado", "fetes", "anniversaire"], desc: "Étanche, puissante et facile à emporter partout." },
  { name: "Go 3", brand: "JBL", cat: "enceintes", ill: "speaker", color: "#A80F1C", price: 32000, pop: 73, specs: { type: "Enceinte", wireless: true, autonomy: 5, waterproof: "IP67" }, usage: ["musique"], gift: ["ado", "elle", "merci"], desc: "Petite, colorée et étanche." },
  { name: "Redmi Watch 4", brand: "Xiaomi", cat: "montres", ill: "watch", color: "#262626", price: 58000, pop: 77, isNew: true, specs: { type: "Montre", screen: 1.97, autonomy: 480, gps: true }, usage: ["sport", "autonomie"], gift: ["lui", "elle", "parent", "anniversaire"], desc: "Écran AMOLED, GPS et jusqu'à 20 jours d'autonomie." },
  { name: "Galaxy Watch6 40 mm", brand: "Samsung", cat: "montres", ill: "watch", color: "#D9B36A", price: 165000, pop: 62, specs: { type: "Montre", screen: 1.3, autonomy: 40, gps: true }, usage: ["sport"], gift: ["elle", "saint-valentin", "mariage"], desc: "Suivi du sommeil et de la santé, finitions soignées." },

  // Gaming
  { name: "PlayStation 5 Slim", brand: "Sony", cat: "gaming", ill: "console", color: "#F4F4F4", price: 395000, pop: 92, feat: true, specs: { type: "Console", storage: 1000 }, usage: ["gaming"], gift: ["lui", "ado", "fetes", "anniversaire"], desc: "La console nouvelle génération, en version plus compacte." },
  { name: "Manette DualSense", brand: "Sony", cat: "gaming", ill: "controller", color: "#F4F4F4", price: 48000, pop: 80, specs: { type: "Manette", wireless: true }, usage: ["gaming"], gift: ["lui", "ado", "fetes", "merci"], desc: "Retour haptique et gâchettes adaptatives pour PS5." },
  { name: "Manette sans fil Xbox", brand: "Microsoft", cat: "gaming", ill: "controller", color: "#1F2A22", price: 42000, pop: 64, specs: { type: "Manette", wireless: true }, usage: ["gaming"], gift: ["lui", "ado"], desc: "Compatible Xbox, PC et mobile." },
  { name: "Nintendo Switch OLED", brand: "Nintendo", cat: "gaming", ill: "console", color: "#E4E4E4", price: 255000, pop: 67, isNew: true, specs: { type: "Console", storage: 64 }, usage: ["gaming", "voyage"], gift: ["ado", "fetes", "anniversaire"], desc: "Jouez sur la télé ou partout, avec un écran OLED de 7 pouces." },

  // Énergie
  { name: "Powerbank Traveler 20 000 mAh", brand: "Oraimo", cat: "energie", ill: "powerbank", color: "#1A1A1A", price: 14500, pop: 90, specs: { capacity: 20000, power: 22.5, ports: 3 }, usage: ["autonomie", "voyage"], gift: ["collegue", "parent", "merci"], desc: "Recharge un smartphone jusqu'à quatre fois." },
  { name: "PowerCore 10 000 mAh", brand: "Anker", cat: "energie", ill: "powerbank", color: "#2B2B2B", price: 21000, pop: 70, specs: { capacity: 10000, power: 12, ports: 2 }, usage: ["autonomie", "voyage"], gift: ["merci", "collegue"], desc: "Compacte et fiable, elle se glisse dans une poche." },
  { name: "Chargeur rapide 65 W GaN", brand: "Anker", cat: "energie", ill: "charger", color: "#F1F1F1", price: 28000, pop: 58, specs: { power: 65, ports: 3 }, usage: ["voyage"], gift: ["collegue"], desc: "Un seul chargeur pour le portable, le téléphone et les écouteurs." },
  { name: "Onduleur Back-UPS 650 VA", brand: "APC", cat: "energie", ill: "ups", color: "#202020", price: 62000, pop: 55, specs: { power: 360, autonomy: 0.25 }, usage: ["bureautique"], gift: [], desc: "Protège l'ordinateur et la box internet lors des coupures." },

  // Bureau
  { name: "LaserJet M111w", brand: "HP", cat: "imprimantes", ill: "printer", color: "#ECECEC", price: 95000, pop: 63, specs: { type: "Laser monochrome", wifi: true, speed: 20 }, usage: ["bureautique"], gift: [], desc: "Imprimante laser Wi-Fi compacte pour le bureau et la maison." },
  { name: "EcoTank L3250", brand: "Epson", cat: "imprimantes", ill: "printer", color: "#2C2C2C", price: 128000, pop: 69, specs: { type: "Jet d'encre couleur, multifonction", wifi: true, speed: 10 }, usage: ["bureautique", "etudiant"], gift: [], desc: "Réservoirs d'encre rechargeables : un coût par page très bas." },
  { name: "Écran 24\" Full HD IPS", brand: "Dell", cat: "ecrans", ill: "monitor", color: "#1E1E1E", price: 98000, pop: 61, specs: { screen: 24, resolution: "1920 x 1080", refresh: 75 }, usage: ["bureautique", "programmation"], gift: [], desc: "Un deuxième écran qui change la façon de travailler." },
  { name: "Clavier et souris MK270", brand: "Logitech", cat: "peripheriques", ill: "keyboard", color: "#222222", price: 19500, pop: 66, specs: { wireless: true, layout: "AZERTY" }, usage: ["bureautique"], gift: ["collegue"], desc: "L'ensemble sans fil simple et durable." },
  { name: "Souris MX Master 3S", brand: "Logitech", cat: "peripheriques", ill: "mouse", color: "#3A3D40", price: 68000, pop: 57, isNew: true, specs: { wireless: true, dpi: 8000 }, usage: ["bureautique", "graphisme", "programmation"], gift: ["collegue", "lui"], desc: "La souris de précision des créatifs et des développeurs." },
];

const vendors = [
  { shopName: "Démo — Boutique Grand Marché", city: "Lomé", phone: "+228 90 00 00 01" },
  { shopName: "Démo — Tech Bè", city: "Lomé", phone: "+228 90 00 00 02" },
  { shopName: "Démo — Digital Tokoin", city: "Lomé", phone: "+228 90 00 00 03" },
  { shopName: "Démo — Kara Électronique", city: "Kara", phone: "+228 90 00 00 04" },
];

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/["']/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// pseudo-aléatoire reproductible
let seed = 42;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

async function main() {
  const password = process.env.DEMO_PASSWORD || randomBytes(9).toString("base64url");
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@eden.demo";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || password;

  const already = await db.product.count();
  if (already > 0 && process.env.SEED_FORCE !== "true") {
    // En démonstration, les confirmations vendeur (valables 72 h) sont renouvelées à chaque déploiement,
    // pour refléter un catalogue tenu à jour. Les offres en rupture restent en rupture.
    if (process.env.DEMO_MODE === "true") {
      const demo = await db.offer.findMany({ where: { vendor: { shopName: { startsWith: "Démo" } }, availability: { not: "OUT_OF_STOCK" } }, select: { id: true } });
      let i = 0;
      for (const o of demo) {
        if (i++ % 4 === 3) continue; // une offre sur quatre reste « à confirmer »
        await db.offer.update({ where: { id: o.id }, data: { availability: "CONFIRMED", lastConfirmedAt: new Date(Date.now() - (i % 20) * 36e5) } });
      }
      console.log(`[seed] Démonstration : confirmations vendeur renouvelées (${demo.length} offres).`);
    } else console.log(`[seed] ${already} produits déjà présents : rien à faire (SEED_FORCE=true pour réinitialiser).`);
    return;
  }
  if (already > 0) {
    await db.$transaction([
      db.vendorRequest.deleteMany(), db.orderEvent.deleteMany(), db.payment.deleteMany(), db.claim.deleteMany(),
      db.orderItem.deleteMany(), db.order.deleteMany(), db.cartItem.deleteMany(), db.cart.deleteMany(),
      db.favorite.deleteMany(), db.offer.deleteMany(), db.product.deleteMany(), db.category.deleteMany({ where: { parentId: { not: null } } }),
    ]);
    await db.category.deleteMany();
  }

  const hash = await bcrypt.hash(password, 11);
  const upsertUser = (email: string, name: string, role: "CUSTOMER" | "VENDOR" | "PRO" | "ADMIN", h = hash) =>
    db.user.upsert({ where: { email }, update: { role }, create: { email, name, role, passwordHash: h, phone: "+228 90 00 00 00" } });

  await upsertUser(adminEmail, "Administration Eden", "ADMIN", await bcrypt.hash(adminPassword, 11));
  await upsertUser("client@eden.demo", "Client Démo", "CUSTOMER");
  const org = await db.organization.create({ data: { name: "Démo — Cabinet Horizon", kind: "ENTREPRISE" } });
  const pro = await upsertUser("pro@eden.demo", "Acheteuse Démo", "PRO");
  await db.user.update({ where: { id: pro.id }, data: { organizationId: org.id } });

  const vendorIds: string[] = [];
  for (const [i, v] of vendors.entries()) {
    const u = await upsertUser(`vendeur${i + 1}@eden.demo`, v.shopName, "VENDOR");
    const vendor = await db.vendor.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id, ...v, status: "APPROVED", verifiedAt: new Date() },
    });
    vendorIds.push(vendor.id);
  }

  const catIds: Record<string, string> = {};
  for (const c of categories) {
    const root = await db.category.create({ data: { slug: c.slug, name: c.name, icon: c.icon, order: c.order, description: c.description } });
    catIds[c.slug] = root.id;
    for (const [j, ch] of c.children.entries()) {
      const sub = await db.category.create({ data: { ...ch, order: j, parentId: root.id } });
      catIds[ch.slug] = sub.id;
    }
  }

  const now = Date.now();
  for (const [i, p] of products.entries()) {
    const product = await db.product.create({
      data: {
        slug: slugify(`${p.brand} ${p.name}`),
        name: p.name,
        brand: p.brand,
        reference: `ED-${String(1000 + i)}`,
        categoryId: catIds[p.cat],
        description: p.desc,
        specs: p.specs,
        condition: p.cond ?? "NEUF",
        usageTags: p.usage,
        giftTags: p.gift,
        illustration: p.ill,
        color: p.color ?? "#20231F",
        warrantyMonths: p.warranty ?? 12,
        popularity: p.pop,
        isNew: p.isNew ?? false,
        isFeatured: p.feat ?? false,
      },
    });
    const n = 1 + Math.floor(rnd() * 3);
    const chosen = [...vendorIds].sort(() => rnd() - 0.5).slice(0, n);
    let best: number | null = null;
    for (const vId of chosen) {
      const purchase = Math.round((p.price * (0.86 + rnd() * 0.1)) / 500) * 500;
      const r = rnd();
      const availability = r < 0.55 ? "CONFIRMED" : r < 0.93 ? "TO_CONFIRM" : "OUT_OF_STOCK";
      const sale = computeSalePrice(purchase, 12);
      await db.offer.create({
        data: {
          productId: product.id,
          vendorId: vId,
          purchasePrice: purchase,
          salePrice: sale,
          availability,
          lastConfirmedAt: availability === "CONFIRMED" ? new Date(now - Math.floor(rnd() * 48) * 36e5) : null,
        },
      });
      if (availability !== "OUT_OF_STOCK" && (best === null || sale < best)) best = sale;
    }
    await db.product.update({ where: { id: product.id }, data: { fromPrice: best } });
  }

  await db.promoCode.upsert({ where: { code: "BIENVENUE5" }, update: {}, create: { code: "BIENVENUE5", percent: 5, maxUses: 500 } });
  await db.setting.upsert({ where: { key: "defaultMarginPct" }, update: {}, create: { key: "defaultMarginPct", value: 12 } });

  console.log("──────────────────────────────────────────────");
  console.log("[seed] Catalogue de démonstration créé.");
  console.log(`[seed] Admin : ${adminEmail}  /  mot de passe : ${process.env.SEED_ADMIN_PASSWORD ? "(SEED_ADMIN_PASSWORD)" : adminPassword}`);
  console.log(`[seed] Comptes démo (client@eden.demo, pro@eden.demo, vendeur1..4@eden.demo) : ${process.env.DEMO_PASSWORD ? "(DEMO_PASSWORD)" : password}`);
  console.log("──────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

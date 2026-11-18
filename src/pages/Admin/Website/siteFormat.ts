import type { SiteContent, SiteFont, SiteImageKind, SiteSection, SiteStatus } from "@/adapters/api";

// Mi web: labels, limits and helpers. Limits are the same as the backend
// (back/src/lib/site.ts); the backend checks them again

export const SITE_LIMITS = {
  heroTitle: 80,
  heroSubtitle: 200,
  aboutTitle: 80,
  aboutText: 2000,
  highlights: 6,
  highlightTitle: 80,
  highlightText: 300,
  faq: 12,
  faqQuestion: 200,
  faqAnswer: 1000,
  gallery: 8,
  address: 200,
  postalCode: 10,
  city: 80,
  healthRegistry: 100,
  seoTitle: 70,
  seoDescription: 160,
};

export const statusLabels: Record<SiteStatus, string> = {
  draft: "Borrador",
  published: "Publicada",
  offline: "Desconectada",
};

export const fontOptions: { value: SiteFont; label: string; hint: string; className: string }[] = [
  { value: "moderna", label: "Moderna", hint: "Limpia y actual", className: "font-sans" },
  { value: "clasica", label: "Clásica", hint: "Elegante, con remates", className: "font-serif" },
  {
    value: "redondeada",
    label: "Redondeada",
    hint: "Cercana y suave",
    className: "[font-family:ui-rounded,'SF_Pro_Rounded',system-ui,sans-serif]",
  },
];

export const sectionLabels: Record<SiteSection, { label: string; hint: string }> = {
  services: { label: "Servicios", hint: "Los de Configuración → Servicios marcados para la web." },
  team: { label: "Equipo", hint: "Los profesionales visibles en la pestaña Equipo." },
  about: { label: "Quiénes somos", hint: "El texto de presentación." },
  gallery: { label: "Galería", hint: "Solo si has subido fotos." },
  faq: { label: "Preguntas frecuentes", hint: "Solo si has escrito alguna." },
  hours: { label: "Horario", hint: "El horario de la clínica de Configuración → Horario." },
};

// Main colours to choose from (#rrggbb, as the backend requires)
export const colorPresets = [
  "#1f5144", // Kineflow green
  "#2563eb", // blue
  "#0e7490", // teal
  "#15803d", // green
  "#b45309", // amber
  "#c2410c", // terracotta
  "#be185d", // pink
  "#6d28d9", // purple
];

// Second colours: lighter, warmer tones that combine with most main colours
export const accentPresets = [
  "#f2b880", // apricot
  "#f4d35e", // sun
  "#9bd1c4", // mint
  "#a8c5f0", // sky
  "#f2a7b5", // rose
  "#c9b6e4", // lilac
  "#e07a5f", // terracotta
  "#3d405b", // ink blue
];

// Largest side of each kind of photo, in pixels
const MAX_SIDE: Record<SiteImageKind, number> = { logo: 600, cover: 2000, gallery: 1600, team: 800 };

// Resizes a photo in the browser before uploading (the backend allows 2 MB).
// WebP keeps the logo's transparency; where the browser can't make WebP,
// logos go as PNG and photos as JPEG
export async function compressSiteImage(file: File, kind: SiteImageKind): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE[kind] / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d")!;
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string, quality?: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
  const webp = await toBlob("image/webp", 0.85);
  if (webp?.type === "image/webp") return webp;
  const fallback = kind === "logo" ? await toBlob("image/png") : await toBlob("image/jpeg", 0.85);
  if (!fallback) throw new Error("No se pudo leer la imagen");
  return fallback;
}

// The most common strong colour of an image (to suggest the main colour from
// the logo). null if it's all white, black or grey
export async function dominantColor(blob: Blob): Promise<string | null> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const context = canvas.getContext("2d")!;
  context.drawImage(bitmap, 0, 0, 32, 32);
  bitmap.close();
  const { data } = context.getImageData(0, 0, 32, 32);

  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    // Skip transparent, near white, near black and grey pixels
    if (a < 128 || max > 240 || max < 30 || max - min < 40) continue;
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n++;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }
  const best = [...buckets.values()].sort((x, y) => y.n - x.n)[0];
  if (!best) return null;
  const hex = (v: number) => Math.round(v / best.n).toString(16).padStart(2, "0");
  return `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`;
}

// Same content, whatever the order of its keys (the server may reorder them)
export function sameContent(a: SiteContent, b: SiteContent) {
  const stable = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(stable)
      : value && typeof value === "object"
        ? Object.fromEntries(
            Object.entries(value)
              .filter(([, v]) => v !== undefined && v !== "")
              .sort(([x], [y]) => x.localeCompare(y))
              .map(([k, v]) => [k, stable(v)]),
          )
        : value;
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}

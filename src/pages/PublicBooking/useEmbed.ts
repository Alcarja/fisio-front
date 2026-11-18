import { useEffect } from "react";
import { useSearchParams } from "react-router";

// Embed mode (?embed=1): the booking page shown inside a clinic's own website,
// in a frame added by public/widget.js. The page drops its own title, outer
// spacing and background so it blends into the clinic's site, and tells the
// parent page its height so the frame grows with the content (no inner
// scrollbar). Only /reservar/* with embed=1 may be framed (Caddyfile).
//
// ?color=rrggbb (clinic websites, back/src/sites/pages/BookingPage.tsx): the
// clinic's colour replaces Kineflow's, and the warm paper tones turn neutral,
// so the form looks like part of that clinic's site.
const HEX = /^[0-9a-f]{6}$/i;

// Dark text on light colours, white on dark ones (same rule as the sites)
function contrastText(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#1d2422" : "#ffffff";
}

// CSS variables for a clinic's colour (shadcn tokens, src/index.css)
function clinicTheme(hex: string): Record<string, string> {
  const c = `#${hex}`;
  return {
    "--primary": c,
    "--primary-foreground": contrastText(hex),
    "--ring": `color-mix(in srgb, ${c} 50%, transparent)`,
    "--secondary": `color-mix(in srgb, ${c} 12%, white)`,
    "--secondary-foreground": `color-mix(in srgb, ${c} 70%, black)`,
    "--accent": `color-mix(in srgb, ${c} 8%, white)`,
    "--background": "#ffffff",
    "--card": "#ffffff",
    "--foreground": "#1d2422",
    "--card-foreground": "#1d2422",
    "--muted": "#f4f5f5",
    "--muted-foreground": "#5b6461",
    "--border": "#e4e7e5",
    "--input": "#dfe3e1",
  };
}

export function useEmbed(): boolean {
  const [searchParams] = useSearchParams();
  const embed = searchParams.get("embed") === "1";
  const color = searchParams.get("color");
  const hex = color && HEX.test(color) ? color : null;

  useEffect(() => {
    if (!embed) return;

    // Let the clinic's site show through around the cards
    const html = document.documentElement;
    const body = document.body;
    html.style.background = "transparent";
    body.style.background = "transparent";
    const theme = hex ? clinicTheme(hex) : {};
    for (const [name, value] of Object.entries(theme)) html.style.setProperty(name, value);

    // "*" is fine: the height reveals nothing. widget.js only accepts it
    // from https://kineflow.es
    const send = () =>
      window.parent.postMessage(
        { type: "kineflow:height", height: html.scrollHeight },
        "*",
      );
    const observer = new ResizeObserver(send);
    observer.observe(body);
    send();

    return () => {
      observer.disconnect();
      html.style.background = "";
      body.style.background = "";
      for (const name of Object.keys(theme)) html.style.removeProperty(name);
    };
  }, [embed, hex]);

  return embed;
}

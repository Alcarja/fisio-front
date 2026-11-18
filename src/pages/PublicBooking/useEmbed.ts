import { useEffect } from "react";
import { useSearchParams } from "react-router";

// Embed mode (?embed=1): the booking page shown inside a clinic's own website,
// in a frame added by public/widget.js. The page drops its own title, outer
// spacing and background so it blends into the clinic's site, and tells the
// parent page its height so the frame grows with the content (no inner
// scrollbar). Only /reservar/* with embed=1 may be framed (Caddyfile).
export function useEmbed(): boolean {
  const [searchParams] = useSearchParams();
  const embed = searchParams.get("embed") === "1";

  useEffect(() => {
    if (!embed) return;

    // Let the clinic's site show through around the cards
    const html = document.documentElement;
    const body = document.body;
    html.style.background = "transparent";
    body.style.background = "transparent";

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
    };
  }, [embed]);

  return embed;
}

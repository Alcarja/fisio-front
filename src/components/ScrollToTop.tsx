import { useEffect } from "react";
import { useLocation } from "react-router";

// Start each page at the top when the URL changes. With a #hash (e.g. the
// footer's "/#how" links), go to that section instead
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // After the new page has rendered
      const frame = requestAnimationFrame(() =>
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView(),
      );
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

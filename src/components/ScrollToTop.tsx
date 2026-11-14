import { useEffect } from "react";
import { useLocation } from "react-router";

// Start each page at the top when the URL changes
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

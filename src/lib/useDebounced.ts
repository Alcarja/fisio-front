import { useEffect, useState } from "react";

// The value a moment after it stops changing, so typing in a search box
// isn't a request per key
export function useDebounced<T>(value: T, delayMs = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

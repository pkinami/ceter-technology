"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (isModifiedClick(event)) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) {
        return;
      }

      const url = new URL(target.href, window.location.href);
      const current = `${window.location.pathname}${window.location.search}`;
      const next = `${url.pathname}${url.search}`;

      if (url.origin !== window.location.origin || next === current || target.target) {
        return;
      }

      window.clearTimeout(timeoutRef.current ?? undefined);
      setLoading(true);
      timeoutRef.current = window.setTimeout(() => setLoading(false), 5000);
    }

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.clearTimeout(timeoutRef.current ?? undefined);
    };
  }, []);

  useEffect(() => {
    window.clearTimeout(timeoutRef.current ?? undefined);
    const frame = window.requestAnimationFrame(() => setLoading(false));

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[70] h-1 bg-transparent"
    >
      <div
        className={
          loading
            ? "h-full w-full origin-left scale-x-100 bg-orange-500 opacity-100 transition-transform duration-[1200ms] ease-out"
            : "h-full w-full origin-left scale-x-0 bg-orange-500 opacity-0 transition-all duration-200"
        }
      />
    </div>
  );
}

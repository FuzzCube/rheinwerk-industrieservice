"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void; theme: "light" }) => string;
      remove: (id: string) => void;
    };
  }
}

export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!siteKey || !loaded || !container.current || !window.turnstile || widget.current) return;
    widget.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      callback: onToken,
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
      theme: "light",
    });
    return () => {
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, [loaded, onToken, siteKey]);

  if (!siteKey) return <p className="turnstile-placeholder">Spam-Schutz wird beim Vercel-Deployment aktiviert.</p>;
  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={() => setLoaded(true)} /><div ref={container} className="turnstile" /></>;
}

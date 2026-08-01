'use client';
import { useEffect, useRef } from 'react';

export default function VanillaPage({ 
  html, 
  scripts,
  inlineScripts
}: { 
  html: string, 
  scripts: string[],
  inlineScripts: string[]
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || loadedRef.current) return;
    loadedRef.current = true;

    // Load external scripts sequentially
    const loadScripts = async () => {
      for (const src of scripts) {
        if (!document.querySelector(`script[src="${src}"]`)) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = false; // Preserve order
            script.onload = () => resolve();
            script.onerror = () => resolve(); // Ignore errors to continue
            document.body.appendChild(script);
          });
        }
      }

      // Execute inline scripts
      for (const inline of inlineScripts) {
        try {
          const script = document.createElement('script');
          script.textContent = inline;
          document.body.appendChild(script);
        } catch (e) {
          console.error("Inline script error", e);
        }
      }

      // Dispatch DOMContentLoaded to trigger vanilla JS bindings
      window.dispatchEvent(new Event('DOMContentLoaded'));
      document.dispatchEvent(new Event('DOMContentLoaded'));
      window.dispatchEvent(new Event('load'));
      document.dispatchEvent(new Event('readystatechange'));
      
      // Also trigger AOS
      if ((window as any).AOS) {
        setTimeout(() => (window as any).AOS.init(), 100);
      }
    };

    loadScripts();
  }, [scripts, inlineScripts]);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: html }} />;
}

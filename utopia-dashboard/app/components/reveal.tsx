'use client';

import { useEffect, useRef, useState } from 'react';

type RevealProps = {
  children: React.ReactNode;
  /* Position in a list. Drives the cascade delay. */
  index?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'tr' | 'article';
};

/*
 * Scroll entry via IntersectionObserver. Never a scroll event listener, which
 * fires on every frame and cannot be passively batched.
 *
 * Elements reveal once and stay revealed. Re-triggering on scroll-up reads as
 * a page that will not settle.
 */
export default function Reveal({
  children,
  index = 0,
  className = '',
  as: Tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // If the browser cannot observe, show the content rather than hiding it.
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={`reveal ${className}`}
      data-revealed={revealed}
      style={{ '--reveal-index': index } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

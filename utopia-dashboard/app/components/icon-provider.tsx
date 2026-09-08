'use client';

import { IconContext } from '@phosphor-icons/react';

/*
 * One stroke weight for every icon in the app. Setting it here rather than on
 * each call site is what keeps the iconography looking like a single set.
 * Individual icons may still opt into "fill" for active or status states.
 */
export default function IconProvider({ children }: { children: React.ReactNode }) {
  return (
    <IconContext.Provider value={{ weight: 'bold' }}>
      {children}
    </IconContext.Provider>
  );
}

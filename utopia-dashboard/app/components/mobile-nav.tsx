'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Shield, MapPin, Users, Gear, ShieldWarning } from '@phosphor-icons/react';
import { useAuth } from '@/app/context/AuthContext';

/*
 * Below the sidebar breakpoint the console still needs navigation. A single
 * scrolling strip keeps every destination reachable without a drawer, which
 * would add state and a focus trap for very little gain on an internal tool.
 */
export default function MobileNav() {
  const pathname = usePathname();
  const { role } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: House },
    { name: 'Sites', href: '/sites', icon: MapPin },
    { name: 'Tracker', href: '/tracker', icon: Users },
    { name: 'Reports', href: '/reports', icon: Shield },
    { name: 'Personnel', href: '/personnel', icon: Users },
    ...(role === 'superadmin'
      ? [{ name: 'Escalations', href: '/escalations', icon: ShieldWarning }]
      : []),
    { name: 'Settings', href: '/settings', icon: Gear },
  ];

  return (
    <div className="md:hidden sticky top-0 z-40 bg-shell border-b border-shell-line">
      <div className="h-14 flex items-center px-4 gap-3">
        <img src="/images/utopia_logo.png" alt="Utopia" className="w-7 h-7 object-contain" />
        <span className="text-sm font-semibold tracking-tight text-shell-ink">Utopia</span>
      </div>
      <nav className="flex gap-1 px-3 pb-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-2 px-3 py-2 rounded-control whitespace-nowrap text-xs transition-colors duration-200 ${
                isActive
                  ? 'bg-info-bg text-info-ink font-medium'
                  : 'text-shell-muted hover:text-shell-ink'
              }`}
            >
              <Icon weight={isActive ? 'fill' : 'bold'} className="w-4 h-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

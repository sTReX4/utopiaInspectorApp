'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, Shield, MapPin, Users, Gear, SignOut, ShieldWarning } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, role } = useAuth();

  // Hardwired Nuclear Flush
  const handleForceSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Signout error:", error);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  // --- DYNAMIC NAVIGATION ARRAY ---
  const navItems = [
    { name: 'Dashboard', href: '/', icon: House },
    { name: 'Sites & Detachments', href: '/sites', icon: MapPin },
    { name: 'Inspector Tracker', href: '/tracker', icon: Users },
    { name: 'Report Extraction', href: '/reports', icon: Shield },
    { name: 'Personnel Roster', href: '/personnel', icon: Users },

    // Inject Escalations ONLY if the user is a Superadmin
    ...(role === 'superadmin' ? [{ name: 'Escalations', href: '/escalations', icon: ShieldWarning }] : []),

    { name: 'Settings', href: '/settings', icon: Gear },
  ];

  return (
    <div className="w-64 bg-shell border-r border-shell-line min-h-screen hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40">

      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-shell-line shrink-0">
        <img src="/images/utopia_logo.png" alt="Utopia" className="w-8 h-8 object-contain mr-3" />
        <span className="text-base font-semibold tracking-tight text-shell-ink">Utopia</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 flex flex-col gap-0.5 px-3">
        <p className="px-3 text-[11px] font-medium text-shell-muted mb-2">Management</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center px-3 py-2.5 rounded-control press transition-colors duration-200 ${
                isActive
                  ? 'bg-white/10 text-shell-ink font-medium'
                  : 'text-shell-muted hover:bg-white/5 hover:text-shell-ink'
              }`}
            >
              <Icon
                weight={isActive ? 'fill' : 'bold'}
                className="w-[18px] h-[18px] mr-3 shrink-0"
              />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Session */}
      <div className="border-t border-shell-line">
        <div className="p-5 border-b border-shell-line flex flex-col gap-1.5">
          <p className="text-[11px] text-shell-muted">Active session</p>
          <p className="text-xs font-medium text-shell-ink truncate font-mono" title={user?.email}>
            {user?.email || 'Authenticating...'}
          </p>
          <div className="flex items-center mt-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium tracking-[0.05em] uppercase ${
                role === 'superadmin'
                  ? 'bg-info-bg text-info-ink'
                  : 'bg-white/10 text-shell-ink'
              }`}
            >
              <Shield weight="fill" className="w-3 h-3 shrink-0" />
              {role || 'Unknown role'}
            </span>
          </div>
        </div>

        <button
          onClick={handleForceSignOut}
          className="flex items-center text-shell-muted hover:text-danger-ink hover:bg-danger-bg w-full px-6 py-4 transition-colors duration-200 press group"
        >
          <SignOut weight="bold" className="w-[18px] h-[18px] mr-3 shrink-0" />
          <span className="text-sm font-medium">Terminate Session</span>
        </button>
      </div>
    </div>
  );
}

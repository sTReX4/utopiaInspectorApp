'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Shield, MapPin, Users, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase'; 
import { useAuth } from '@/app/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, role } = useAuth();

  // HIDE SIDEBAR ON LOGIN PAGE
  if (pathname === '/login') return null;

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
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Sites & Detachments', href: '/sites', icon: MapPin },
    { name: 'Inspector Tracker', href: '/tracker', icon: Users },
    { name: 'Report Extraction', href: '/reports', icon: Shield },
    { name: 'Personnel Roster', href: '/personnel', icon: Users },
    
    // Inject Escalations ONLY if the user is a Superadmin
    ...(role === 'superadmin' ? [{ name: 'Escalations', href: '/escalations', icon: ShieldAlert }] : []),
    
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#0f172a] border-r border-slate-800 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-40">
      
      {/* Brand Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800 shrink-0">
        <img src="/images/utopia_logo.png" alt="Utopia Logo" className="w-8 h-8 object-contain mr-3" />
        <span className="text-xl font-bold tracking-wider text-white">UTOPIA</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Management</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile Area - Fixed for Dark Mode Contrast */}
      <div className="p-4 border-t border-slate-800 bg-[#0f172a]">

        {/* Live Identity Tag */}
        <div className="mb-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800 shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Active Session</p>
          <p className="text-sm font-bold text-white truncate" title={user?.email}>
            {user?.email || 'Authenticating...'}
          </p>
          <div className="flex items-center mt-1.5 pt-1.5 border-t border-slate-800">
            <Shield className={`w-3.5 h-3.5 mr-1.5 ${role === 'superadmin' ? 'text-blue-400' : 'text-emerald-400'}`} />
            <p className={`text-xs font-mono font-bold uppercase ${role === 'superadmin' ? 'text-blue-400' : 'text-emerald-400'}`}>
              {role || 'UNKNOWN ROLE'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleForceSignOut} 
          className="flex items-center text-slate-400 hover:text-red-400 hover:bg-slate-800/50 w-full px-3 py-2.5 rounded-lg transition-colors font-medium group"
        >
          <LogOut className="w-5 h-5 mr-3 text-slate-400 group-hover:text-red-400 transition-colors" />
          <span className="text-sm">Terminate Session</span>
        </button>
      </div>
    </div>
  );
}
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
  const publicRoutes = ['/login', '/terms', '/privacy'];
  if (publicRoutes.includes(pathname)) return null;

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
    <div className="w-64 bg-[#0f172a] border-r border-slate-800 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-40 selection:bg-slate-800 selection:text-white">
      
      {/* Brand Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0">
        <img src="/images/utopia_logo.png" alt="Utopia Logo" className="w-10 h-10 object-contain mr-3" />
        <span className="text-xl font-bold tracking-widest text-slate-100 uppercase">Utopia</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 flex flex-col space-y-0">
        <p className="px-6 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-3">Management</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center px-6 py-2.5 transition-none border-l-2 ${
                isActive 
                  ? 'border-white bg-slate-800 text-white font-medium' 
                  : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile Area - Flush Data Structure */}
      <div className="border-t border-slate-800 bg-[#0f172a]">

        {/* Live Identity Tag */}
        <div className="p-5 border-b border-slate-800 flex flex-col gap-1.5">
          <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Active Session</p>
          <p className="text-xs font-medium text-slate-200 truncate" title={user?.email}>
            {user?.email || 'Authenticating...'}
          </p>
          <div className="flex items-center mt-1">
            <Shield className={`w-3.5 h-3.5 mr-1.5 shrink-0 ${role === 'superadmin' ? 'text-red-500' : 'text-slate-400'}`} />
            <p className={`text-[10px] font-mono font-bold uppercase tracking-wider ${role === 'superadmin' ? 'text-red-500' : 'text-slate-400'}`}>
              {role || 'UNKNOWN ROLE'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleForceSignOut} 
          className="flex items-center text-slate-400 hover:text-red-400 hover:bg-red-950/20 w-full px-6 py-4 transition-none group"
        >
          <LogOut className="w-4 h-4 mr-3 text-slate-500 group-hover:text-red-400" />
          <span className="text-sm font-medium">Terminate Session</span>
        </button>
      </div>
    </div>
  );
}
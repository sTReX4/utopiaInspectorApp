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

  // FIX: Hardwired Nuclear Flush (Bypasses React Context entirely)
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
    <div className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-40">
      
      {/* Brand Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-gray-800 shrink-0">
        <img src="./images/utopia_logo.png" alt="Utopia Logo" className="w-8 h-8 object-contain mr-3" />
        <span className="text-xl font-bold tracking-wider">UTOPIA</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Management</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 font-semibold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile Area */}
      <div className="p-4 border-t border-slate-200/70 bg-slate-50/50">

        {/* Live Identity Tag */}
        <div className="mb-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Active Session</p>
          <p className="text-sm font-bold text-slate-900 truncate" title={user?.email}>
            {user?.email || 'Authenticating...'}
          </p>
          <div className="flex items-center mt-1.5 pt-1.5 border-t border-slate-100">
            <Shield className={`w-3.5 h-3.5 mr-1.5 ${role === 'superadmin' ? 'text-blue-600' : 'text-emerald-600'}`} />
            <p className={`text-xs font-mono font-bold uppercase ${role === 'superadmin' ? 'text-blue-700' : 'text-emerald-700'}`}>
              {role || 'UNKNOWN ROLE'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleForceSignOut} 
          className="flex items-center text-slate-500 hover:text-red-700 hover:bg-red-50 w-full px-3 py-2.5 rounded-lg transition-colors font-medium"
        >
          <LogOut className="w-5 h-5 mr-3 text-slate-400 hover:text-red-500" />
          <span className="text-sm">Terminate Session</span>
        </button>
      </div>
    </div>
  );
}
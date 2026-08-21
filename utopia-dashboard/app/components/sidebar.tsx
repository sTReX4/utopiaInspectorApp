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
    
    // Inject Escalations ONLY if the user is a Superadmin (and fixed the 's' typo)
    ...(role === 'superadmin' ? [{ name: 'Escalations', href: '/escalation', icon: ShieldAlert }] : []),
    
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-40">
      
      {/* Brand Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-gray-800">
        <div className="w-8 h-8 bg-blue-600 rounded mr-3"></div>
        <span className="text-xl font-bold tracking-wider">UTOPIA</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Management</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile Area */}
      <div className="p-4 border-t border-gray-800">

        {/* Live Identity Tag */}
        <div className="mb-4 px-3 py-3 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Active Session</p>
          <p className="text-sm font-medium text-white truncate" title={user?.email}>
            {user?.email || 'Authenticating...'}
          </p>
          <div className="flex items-center mt-1.5">
            <Shield className={`w-3 h-3 mr-1.5 ${role === 'superadmin' ? 'text-blue-400' : 'text-emerald-400'}`} />
            <p className={`text-xs font-mono font-bold uppercase ${role === 'superadmin' ? 'text-blue-400' : 'text-emerald-400'}`}>
              {role || 'UNKNOWN ROLE'}
            </p>
          </div>
        </div>

        <button 
          onClick={handleForceSignOut} 
          className="flex items-center text-gray-400 hover:text-white hover:bg-gray-800 w-full px-3 py-2.5 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium text-sm">Terminate Session</span>
        </button>
      </div>
    </div>
  );
}
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Shield, MapPin, Users, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Sites & Detachments', href: '/sites', icon: MapPin },
    { name: 'Inspector Tracker', href: '/tracker', icon: Users },
    { name: 'Report Extraction', href: '/reports', icon: Shield },
    { name: 'Settings', href: '/settings', icon: Settings }, // Placeholder for future
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
        <button className="flex items-center text-gray-400 hover:text-white w-full px-3 py-2 transition-colors">
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
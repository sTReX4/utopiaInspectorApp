'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import LivePhotoGrid from './components/livePhotoGrid';
import DashboardStats from './components/dashboardStats';

export default function DashboardHome() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [globalDate, setGlobalDate] = useState(() => new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-6">
      
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Operations Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time security audit monitoring and compliance tracking.</p>
        </div>

        <div className="relative">
          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="date"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-mono font-medium text-slate-900 bg-white cursor-pointer transition-none"
            value={globalDate}
            onChange={(e) => setGlobalDate(e.target.value)}
          />
        </div>
      </div>

      <DashboardStats 
        activeFilter={activeFilter} 
        onFilterSelect={setActiveFilter} 
        globalDate={globalDate}
      />

      <LivePhotoGrid 
        activeFilter={activeFilter} 
        globalDate={globalDate}
      />

    </div>
  );
}
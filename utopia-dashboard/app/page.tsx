'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import LivePhotoGrid from './components/livePhotoGrid';
import DashboardStats from './components/dashboardStats';

export default function DashboardHome() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  // Default to today's date formatted as YYYY-MM-DD
  const [globalDate, setGlobalDate] = useState(() => new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-6">
      
      {/* Dashboard Header with Global Date Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b micro-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Operations Overview</h1>
          <p className="text-subdued mt-1">Real-time security audit monitoring and compliance tracking.</p>
        </div>

        <div className="relative">
          <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="date"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-medium text-slate-900 bg-white cursor-pointer shadow-sm"
            value={globalDate}
            onChange={(e) => setGlobalDate(e.target.value)}
          />
        </div>
      </div>

      {/* Top KPI Counters with Filter Callback & Date Scope */}
      <DashboardStats 
        activeFilter={activeFilter} 
        onFilterSelect={setActiveFilter} 
        globalDate={globalDate}
      />

      {/* Live Photo Grid filtered dynamically by both Status and Date */}
      <LivePhotoGrid 
        activeFilter={activeFilter} 
        globalDate={globalDate}
      />

    </div>
  );
}
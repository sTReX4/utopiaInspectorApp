'use client';

import { useState, useEffect } from 'react';
import { CalendarBlank, User } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import LivePhotoGrid from '@/app/components/livePhotoGrid';
import DashboardStats from '@/app/components/dashboardStats';
import Reveal from '@/app/components/reveal';

export default function DashboardHome() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [globalDate, setGlobalDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // NEW: Inspector Dropdown States
  const [globalInspector, setGlobalInspector] = useState<string>('');
  const [inspectorOptions, setInspectorOptions] = useState<{full_name: string}[]>([]);

  useEffect(() => {
    const fetchInspectors = async () => {
      const { data } = await supabase.from('inspectors').select('full_name').order('full_name');
      if (data) setInspectorOptions(data);
    };
    fetchInspectors();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Dashboard Header */}
      <div className="flex flex-col xl:flex-row xl:justify-between items-start xl:items-center gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Operations Overview</h1>
          <p className="text-sm text-ink-muted mt-1">Real-time security audit monitoring and compliance tracking.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto shrink-0">
          
          {/* Inspector Filter */}
          <div className="relative w-full sm:w-64">
            <User className="w-4 h-4 text-ink-muted absolute left-3 top-2.5 pointer-events-none" />
            <select
              aria-label="Filter by inspector"
              className="w-full pl-9 pr-8 py-2 rounded-control border border-line outline-none focus:border-ink text-sm font-medium text-ink bg-surface appearance-none cursor-pointer transition-colors duration-200"
              value={globalInspector}
              onChange={(e) => setGlobalInspector(e.target.value)}
            >
              <option value="">-- All Inspectors --</option>
              {inspectorOptions.map((ins, idx) => (
                <option key={idx} value={ins.full_name}>{ins.full_name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {/* Date Filter */}
          <div className="relative w-full sm:w-48">
            <CalendarBlank className="w-4 h-4 text-ink-muted absolute left-3 top-2.5 pointer-events-none" />
            <input
              aria-label="Filter by date"
              type="date"
              className="w-full pl-9 pr-3 py-2 rounded-control border border-line outline-none focus:border-ink text-sm font-medium text-ink bg-surface cursor-pointer transition-colors duration-200"
              value={globalDate}
              onChange={(e) => setGlobalDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Reveal>
        <DashboardStats
          activeFilter={activeFilter}
          onFilterSelect={setActiveFilter}
          globalDate={globalDate}
          globalInspector={globalInspector}
        />
      </Reveal>

      <Reveal index={1}>
        <LivePhotoGrid
          activeFilter={activeFilter}
          globalDate={globalDate}
          globalInspector={globalInspector}
        />
      </Reveal>

    </div>
  );
}
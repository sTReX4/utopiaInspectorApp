'use client';

import { useState, useEffect } from 'react';
import { Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import LivePhotoGrid from './components/livePhotoGrid';
import DashboardStats from './components/dashboardStats';

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Operations Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time security audit monitoring and compliance tracking.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          
          {/* Inspector Filter */}
          <div className="relative w-full sm:w-64">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <select
              className="w-full pl-9 pr-8 py-2 border border-slate-200 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-mono font-medium text-slate-900 bg-white appearance-none cursor-pointer transition-none"
              value={globalInspector}
              onChange={(e) => setGlobalInspector(e.target.value)}
            >
              <option value="">-- All Inspectors --</option>
              {inspectorOptions.map((ins, idx) => (
                <option key={idx} value={ins.full_name}>{ins.full_name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          {/* Date Filter */}
          <div className="relative w-full sm:w-48">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="date"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-mono font-medium text-slate-900 bg-white cursor-pointer transition-none"
              value={globalDate}
              onChange={(e) => setGlobalDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <DashboardStats 
        activeFilter={activeFilter} 
        onFilterSelect={setActiveFilter} 
        globalDate={globalDate}
        globalInspector={globalInspector}
      />

      <LivePhotoGrid 
        activeFilter={activeFilter} 
        globalDate={globalDate}
        globalInspector={globalInspector}
      />

    </div>
  );
}
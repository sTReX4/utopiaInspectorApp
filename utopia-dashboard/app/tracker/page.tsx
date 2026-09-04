'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Clock, MapPin, ShieldCheck, Calendar } from 'lucide-react';

const TrackerMap = dynamic(() => import('../components/trackerMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-mono text-xs uppercase tracking-widest">Loading Satellite Feed...</div>
});

interface AuditRoute {
  id: string;
  inspector_name: string;
  branch_name: string;
  time_in: string;
  time_out: string;
  gps_latitude: number;
  gps_longitude: number;
}

export default function InspectorTrackerPage() {
  const [routes, setRoutes] = useState<AuditRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, [filterDate]);

  const fetchRoutes = async () => {
    setIsLoading(true);
    setSelectedRouteId(null); 

    let query = supabase
      .from('audits')
      .select('id, inspector_name, branch_name, time_in, time_out, gps_latitude, gps_longitude')
      .not('gps_latitude', 'is', null)
      .order('time_in', { ascending: false });

    if (filterDate) {
        query = query
            .gte('time_in', `${filterDate}T00:00:00Z`)
            .lte('time_in', `${filterDate}T23:59:59Z`);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching routes:', error);
    } else {
      setRoutes(data || []);
    }
    setIsLoading(false);
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 min-h-[calc(100vh-6rem)]">
      
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Live Inspector Routing</h1>
        <p className="text-sm text-slate-500 mt-1">Track field personnel locations and audit timestamps.</p>
      </div>

      {/* Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Column: The Routing Log */}
        <div className="w-full lg:w-1/3 bg-white border border-slate-200 flex flex-col overflow-hidden">
          
          {/* Header & Date Filter */}
          <div className="bg-white border-b border-slate-200 p-5 shrink-0 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2 text-slate-400" /> Daily Field Activity
            </h2>
            
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 bg-white rounded-none outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm font-mono font-medium text-slate-900 cursor-pointer transition-none"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>
          
          {/* Interactive Routing List */}
          <div className="overflow-y-auto flex-1 bg-slate-50">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <p className="text-xs font-mono uppercase tracking-widest">Querying database...</p>
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center text-slate-500 text-xs font-mono uppercase tracking-widest py-16">
                No GPS routes recorded for this date.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border-b border-slate-200">
                {routes.map((route) => (
                  <div 
                    key={route.id} 
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`p-5 cursor-pointer transition-none border-l-2 ${
                      selectedRouteId === route.id 
                      ? 'bg-white border-l-slate-900' 
                      : 'bg-transparent border-l-transparent hover:bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-slate-900 text-sm uppercase">{route.inspector_name}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 border border-slate-300 bg-white text-slate-800 uppercase tracking-widest">
                        {route.branch_name}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-2 text-slate-400" />
                          <span className="font-mono text-slate-500 uppercase tracking-widest w-8">IN</span> 
                        </div>
                        <span className="font-mono font-bold text-slate-900">{formatTime(route.time_in)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-2 text-slate-400" />
                          <span className="font-mono text-slate-500 uppercase tracking-widest w-8">OUT</span> 
                        </div>
                        <span className="font-mono font-bold text-slate-900">{formatTime(route.time_out)}</span>
                      </div>
                      <div className="flex items-center text-[10px] font-mono tracking-widest mt-2 pt-2 border-t border-slate-100 text-slate-500">
                        <MapPin className="w-3 h-3 mr-2 shrink-0" />
                        {route.gps_latitude.toFixed(4)}, {route.gps_longitude.toFixed(4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: The Map */}
        <div className="w-full lg:w-2/3 bg-slate-100 border border-slate-200 overflow-hidden relative z-0 h-[500px] lg:h-auto">
           <TrackerMap routes={routes} selectedRouteId={selectedRouteId} />
        </div>

      </div>
    </div>
  );
}
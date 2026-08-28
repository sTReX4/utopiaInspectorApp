'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Clock, MapPin, ShieldCheck, Calendar } from 'lucide-react';

// Dynamically import the map to prevent Next.js SSR crashes
const TrackerMap = dynamic(() => import('../components/trackerMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-50 animate-pulse flex items-center justify-center text-slate-400 text-sm font-medium border border-slate-100">Booting Tracking Satellite...</div>
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

  // Default to today's date formatted as YYYY-MM-DD
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
    return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="flex-1 flex flex-col space-y-6 min-h-[calc(100vh-6rem)]">
      
      {/* Header */}
      <div className="shrink-0 border-b micro-border pb-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Live Inspector Routing</h1>
        <p className="text-subdued mt-1">Track field personnel locations and audit timestamps.</p>
      </div>

      {/* Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Column: The Routing Log */}
        <div className="w-full lg:w-1/3 enterprise-card flex flex-col overflow-hidden">
          
          {/* Header & Date Filter */}
          <div className="bg-slate-50 border-b border-slate-200 p-5 shrink-0 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2 text-blue-600" /> Daily Field Activity
            </h2>
            
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 bg-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500/40 text-sm font-medium text-slate-900 cursor-pointer shadow-sm"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>
          
          {/* Interactive Routing List */}
          <div className="overflow-y-auto flex-1 p-4 space-y-3 bg-slate-50/30">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mb-3"></div>
                <p className="text-sm font-medium">Loading routing data...</p>
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center text-slate-500 text-sm font-medium py-12">
                No GPS routes recorded for this date.
              </div>
            ) : (
              routes.map((route) => (
                <div 
                  key={route.id} 
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    selectedRouteId === route.id 
                    ? 'bg-blue-50/50 border-blue-600 ring-1 ring-blue-600 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-slate-900 text-sm">{route.inspector_name}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        selectedRouteId === route.id ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-200/60' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/60'
                    }`}>
                      {route.branch_name}
                    </span>
                  </div>
                  
                  <div className={`space-y-1.5 mt-3 border-t pt-3 ${selectedRouteId === route.id ? 'border-blue-200/60' : 'border-slate-100'}`}>
                    <div className="flex items-center text-xs text-slate-600">
                      <Clock className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                      <span className="font-medium text-slate-500 w-10">IN:</span> 
                      <span className="font-medium">{formatTime(route.time_in)}</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-600">
                      <Clock className="w-3.5 h-3.5 mr-2 text-red-500" />
                      <span className="font-medium text-slate-500 w-10">OUT:</span> 
                      <span className="font-medium">{formatTime(route.time_out)}</span>
                    </div>
                    <div className={`flex items-center text-[11px] font-mono tracking-wide mt-2 pt-2 border-t ${selectedRouteId === route.id ? 'border-blue-100 text-blue-700' : 'border-slate-100 text-slate-400'}`}>
                      <MapPin className="w-3.5 h-3.5 mr-2" />
                      {route.gps_latitude.toFixed(4)}, {route.gps_longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: The Map */}
        <div className="w-full lg:w-2/3 enterprise-card overflow-hidden relative z-0 h-[500px] lg:h-auto">
           <TrackerMap routes={routes} selectedRouteId={selectedRouteId} />
        </div>

      </div>
    </div>
  );
}
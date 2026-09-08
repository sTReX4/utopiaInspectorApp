'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { CalendarBlank, Clock, MapPin, ShieldCheck } from '@phosphor-icons/react';

const TrackerMap = dynamic(() => import('@/app/components/trackerMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-surface border border-line flex items-center justify-center text-ink-muted text-xs">Loading Satellite Feed...</div>
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
      <div className="shrink-0 border-b border-line pb-5">
        <h1 className="text-xl font-bold tracking-tight text-ink">Live Inspector Routing</h1>
        <p className="text-sm text-ink-muted mt-1">Track field personnel locations and audit timestamps.</p>
      </div>

      {/* Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Column: The Routing Log */}
        <div className="w-full lg:w-1/3 bg-surface border border-line flex flex-col overflow-hidden">
          
          {/* Header & Date Filter */}
          <div className="bg-surface border-b border-line p-5 shrink-0 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-ink flex items-center">
              <ShieldCheck className="w-4 h-4 mr-2 text-ink-muted" /> Daily Field Activity
            </h2>
            
            <div className="relative">
              <CalendarBlank className="w-4 h-4 text-ink-muted absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                className="w-full pl-9 pr-3 py-2.5 border border-line bg-surface rounded-control outline-none focus:border-ink focus:ring-1 focus:ring-info-ink text-sm font-medium text-ink cursor-pointer transition-colors duration-200"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>
          
          {/* Interactive Routing List */}
          <div className="overflow-y-auto flex-1 bg-canvas">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-ink-muted">
                <p className="text-xs">Querying database...</p>
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center text-ink-muted text-xs py-16">
                No GPS routes recorded for this date.
              </div>
            ) : (
              <div className="divide-y divide-line border-b border-line">
                {routes.map((route) => (
                  <div 
                    key={route.id} 
                    onClick={() => setSelectedRouteId(route.id)}
                    className={`p-5 cursor-pointer transition-colors duration-200 border-l-2 ${
                      selectedRouteId === route.id 
                      ? 'bg-surface border-l-ink' 
                      : 'bg-transparent border-l-transparent hover:bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-ink text-sm">{route.inspector_name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 border border-line bg-surface text-ink">
                        {route.branch_name}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mt-3 pt-3 border-t border-line">
                      <div className="flex items-center justify-between text-xs text-ink-muted">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-2 text-ink-muted" />
                          <span className="text-ink-muted w-8">IN</span> 
                        </div>
                        <span className="font-bold text-ink">{formatTime(route.time_in)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-ink-muted">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-2 text-ink-muted" />
                          <span className="text-ink-muted w-8">OUT</span> 
                        </div>
                        <span className="font-bold text-ink">{formatTime(route.time_out)}</span>
                      </div>
                      <div className="flex items-center text-xs mt-2 pt-2 border-t border-line text-ink-muted">
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
        <div className="w-full lg:w-2/3 bg-sunken border border-line overflow-hidden relative z-0 h-[500px] lg:h-auto">
           <TrackerMap routes={routes} selectedRouteId={selectedRouteId} />
        </div>

      </div>
    </div>
  );
}
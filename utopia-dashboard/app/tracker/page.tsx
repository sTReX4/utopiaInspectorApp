'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Clock, MapPin, ShieldCheck, Calendar } from 'lucide-react';

// Dynamically import the map to prevent Next.js SSR crashes
const TrackerMap = dynamic(() => import('../components/trackerMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-500 font-medium">Booting Tracking Satellite...</div>
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

  // --- NEW STATES FOR INTERACTIVITY ---
  // Default to today's date formatted as YYYY-MM-DD
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Automatically re-fetch data whenever the Date Filter changes
  useEffect(() => {
    fetchRoutes();
  }, [filterDate]);

  const fetchRoutes = async () => {
    setIsLoading(true);
    setSelectedRouteId(null); // Reset selection when fetching a new day

    let query = supabase
      .from('audits')
      .select('id, inspector_name, branch_name, time_in, time_out, gps_latitude, gps_longitude')
      .not('gps_latitude', 'is', null)
      .order('time_in', { ascending: false });

    // Apply the strict Date Filter
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
    <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col space-y-4 pb-6">
      
      {/* Header */}
      <div className="shrink-0 pt-4">
        <h1 className="text-3xl font-bold text-gray-900">Live Inspector Routing</h1>
        <p className="text-gray-600 mt-1">Track field personnel locations and audit timestamps.</p>
      </div>

      {/* Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Column: The Routing Log */}
        <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          
          {/* Header & Date Filter */}
          <div className="bg-gray-900 text-white p-4 shrink-0 flex flex-col gap-3">
            <h2 className="font-bold flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2" /> Daily Field Activity
            </h2>
            
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="date"
                className="w-full pl-9 pr-3 py-2 border border-gray-700 bg-gray-800 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm text-white cursor-pointer"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
          </div>
          
          {/* Interactive Routing List */}
          <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {isLoading ? (
              <p className="text-center text-gray-500 py-8">Loading routing data...</p>
            ) : routes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No GPS routes recorded for this date.</p>
            ) : (
              routes.map((route) => (
                <div 
                  key={route.id} 
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedRouteId === route.id 
                    ? 'bg-blue-50 border-blue-400 shadow-sm' 
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-800 text-sm">{route.inspector_name}</span>
                    <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {route.branch_name}
                    </span>
                  </div>
                  
                  <div className={`space-y-1 mt-3 border-t pt-2 ${selectedRouteId === route.id ? 'border-blue-200' : 'border-gray-200'}`}>
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock className="w-3 h-3 mr-2 text-green-600" />
                      <span className="font-medium w-12">IN:</span> {formatTime(route.time_in)}
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock className="w-3 h-3 mr-2 text-red-600" />
                      <span className="font-medium w-12">OUT:</span> {formatTime(route.time_out)}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1 pt-1 border-t border-gray-100">
                      <MapPin className="w-3 h-3 mr-2" />
                      {route.gps_latitude.toFixed(4)}, {route.gps_longitude.toFixed(4)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: The Map */}
        <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative z-0">
           {/* Passing both the routes AND the selected ID down to the map */}
           <TrackerMap routes={routes} selectedRouteId={selectedRouteId} />
        </div>

      </div>
    </div>
  );
}
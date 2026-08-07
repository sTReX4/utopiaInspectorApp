'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Clock, MapPin, User, ShieldCheck } from 'lucide-react';

// Dynamically import the map to prevent Next.js SSR crashes
const TrackerMap = dynamic(() => import('../components/trackerMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-500">Loading Tracking Map...</div>
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

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setIsLoading(true);
    // Fetch today's audits that have valid GPS data
    const { data, error } = await supabase
      .from('audits')
      .select('id, inspector_name, branch_name, time_in, time_out, gps_latitude, gps_longitude')
      .not('gps_latitude', 'is', null)
      .order('time_in', { ascending: false })
      .limit(50); // Limit to recent routes for the MVP

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
    <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col space-y-4">
      
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-3xl font-bold text-gray-900">Live Inspector Routing</h1>
        <p className="text-gray-600 mt-1">Track field personnel locations and audit timestamps.</p>
      </div>

      {/* Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Column: The Routing Log */}
        <div className="w-full lg:w-1/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-gray-900 text-white p-4 shrink-0">
            <h2 className="font-bold flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2" /> Recent Field Activity
            </h2>
          </div>
          
          <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {isLoading ? (
              <p className="text-center text-gray-500 py-8">Loading routing data...</p>
            ) : routes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No GPS routes recorded yet today.</p>
            ) : (
              routes.map((route) => (
                <div key={route.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-gray-800 text-sm">{route.inspector_name}</span>
                    <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {route.branch_name}
                    </span>
                  </div>
                  
                  <div className="space-y-1 mt-3 border-t pt-2">
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
           <TrackerMap routes={routes} />
        </div>

      </div>
    </div>
  );
}
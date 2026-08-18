'use client';

import { useState } from 'react';
import LivePhotoGrid from './components/livePhotoGrid';
import DashboardStats from './components/dashboardStats';

export default function DashboardHome() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Dashboard Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utopia Operations Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time security audit monitoring.</p>
        </div>

        {/* Top KPI Counters with Filter Callback */}
        <DashboardStats 
          activeFilter={activeFilter} 
          onFilterSelect={setActiveFilter} 
        />

        {/* Live Photo Grid filtered dynamically */}
        <LivePhotoGrid activeFilter={activeFilter} />

      </div>
    </main>
  );
}
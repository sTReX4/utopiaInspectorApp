import { supabase } from '@/lib/supabase';
import LivePhotoGrid from './components/livePhotoGrid';
import DashboardStats from './components/dashboardStats';


export const revalidate = 0;

export default async function DashboardHome() {
  const { data: audits, error } = await supabase.from('audits').select('*').order('created_at', { ascending: false });

  if (error) {
    return <div className="p-10 text-red-500">Error loading dashboard: {error.message}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Dashboard Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Utopia Operations Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time security audit monitoring.</p>
        </div>

        {/* The New Top KPI Counters */}
        <DashboardStats />

        {/* The Live Photo Grid Component */}
        <LivePhotoGrid />

        {/* Future Implementation: The Audit Data Table will go here 
        */}

      </div>
    </main>
  );
}
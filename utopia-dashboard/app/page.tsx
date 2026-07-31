import { supabase } from '@/lib/supabase';

export const revalidate = 0;

export default async function DashboardHome() {
  const { data: audits, error } = await supabase.from('audits').select('*').order('created_at', { ascending: false });

  if (error) {
    return <div className="p-10 text-red-500">Error loading dashboard: {error.message}</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Live Audit Feed</h1>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Date / Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Detachment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Inspector</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">Guard on Duty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-100 uppercase tracking-wider">GPS Coordinates</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {audits?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No audits have been submitted yet. Waiting for mobile data...
                  </td>
                </tr>
              ) : (
                audits?.map((audit) => (
                  <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(audit.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                      {audit.detachment_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {audit.inspector_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {audit.guard_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {audit.gps_latitude}, {audit.gps_longitude}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
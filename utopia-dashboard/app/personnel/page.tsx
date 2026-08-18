'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, ShieldCheck, ShieldAlert, User, ShieldX, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// TypeScript interface matching your new Supabase table
interface Guard {
  id: string;
  guard_name: string;
  lesp_number: string;
  lesp_expiry_date: string;
  assigned_branch: string | null;
  is_active: boolean;
}

export default function PersonnelPage() {
  // --- RBAC Dev Toggle ---
  const [userRole, setUserRole] = useState<'Superadmin' | 'Admin'>('Superadmin');

  const [guards, setGuards] = useState<Guard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newGuard, setNewGuard] = useState({
    guard_name: '',
    lesp_number: '',
    lesp_expiry_date: '',
    assigned_branch: ''
  });

  useEffect(() => {
    fetchGuards();
  }, []);

  const fetchGuards = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('guards')
      .select('*')
      .order('guard_name', { ascending: true });

    if (error) console.error('Error fetching guards:', error);
    else setGuards(data || []);
    setIsLoading(false);
  };

  const handleAddGuard = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from('guards')
      .insert([{
        guard_name: newGuard.guard_name,
        lesp_number: newGuard.lesp_number,
        lesp_expiry_date: newGuard.lesp_expiry_date,
        assigned_branch: newGuard.assigned_branch || null,
        is_active: true
      }])
      .select()
      .single();

    if (error) {
      alert("Error adding guard. Ensure the LESP Number is unique.");
      console.error(error);
      return;
    }

    // Update UI instantly, sort alphabetically
    const updatedGuards = [...guards, data].sort((a, b) => a.guard_name.localeCompare(b.guard_name));
    setGuards(updatedGuards); 
    setIsAddModalOpen(false); 
    setNewGuard({ guard_name: '', lesp_number: '', lesp_expiry_date: '', assigned_branch: '' }); 
  };

  // --- AUTOMATED EXPIRY LOGIC ENGINE ---
  const getExpiryStatus = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date
    const expiryDate = new Date(dateString);
    
    // Calculate difference in days
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'EXPIRED', color: 'bg-red-100 text-red-800 border-red-200', icon: <ShieldX className="w-4 h-4 mr-1" /> };
    } else if (diffDays <= 30) {
      return { label: 'EXPIRING SOON', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <ShieldAlert className="w-4 h-4 mr-1" /> };
    } else {
      return { label: 'VALID', color: 'bg-green-100 text-green-800 border-green-200', icon: <ShieldCheck className="w-4 h-4 mr-1" /> };
    }
  };

  const filteredGuards = guards.filter(guard => 
    guard.guard_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    guard.lesp_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personnel Roster & Compliance</h1>
          <p className="text-gray-600 mt-1">Manage guard records and track LESP license expirations.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* DEV ROLE TOGGLE - Remove before production */}
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg shadow-sm">
            <span className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Role:</span>
            <select 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value as 'Superadmin' | 'Admin')}
              className="text-sm bg-white border border-yellow-300 rounded px-2 py-1 outline-none text-gray-800 font-medium cursor-pointer"
            >
              <option value="Superadmin">Superadmin (HR Access)</option>
              <option value="Admin">Admin (Read-Only)</option>
            </select>
          </div>

          {/* RBAC Protected Button */}
          {userRole === 'Superadmin' ? (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5 mr-2" />
              Register Guard
            </button>
          ) : (
            <button disabled className="bg-gray-200 text-gray-500 px-4 py-2 rounded-lg font-medium flex items-center cursor-not-allowed border border-gray-300">
              <Lock className="w-4 h-4 mr-2" />
              HR Access Required
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center">
        <Search className="w-5 h-5 text-gray-400 mr-3" />
        <input 
          type="text" 
          placeholder="Search by guard name or LESP number..." 
          className="flex-1 outline-none text-gray-700"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-semibold">Guard Name</th>
              <th className="p-4 font-semibold">LESP Number</th>
              <th className="p-4 font-semibold">Expiration Date</th>
              <th className="p-4 font-semibold">Assigned Branch</th>
              <th className="p-4 font-semibold text-right">License Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading HR database...</td></tr>
            ) : filteredGuards.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No personnel records found.</td></tr>
            ) : (
              filteredGuards.map((guard) => {
                const status = getExpiryStatus(guard.lesp_expiry_date);
                return (
                  <tr key={guard.id} className={`transition-colors hover:bg-gray-50 ${!guard.is_active && 'opacity-50'}`}>
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="bg-gray-200 rounded-full p-2 mr-3">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="font-bold text-gray-900">{guard.guard_name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm text-gray-600">{guard.lesp_number}</td>
                    <td className="p-4 font-medium text-gray-800">
                      {new Date(guard.lesp_expiry_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-sm text-gray-500">{guard.assigned_branch || 'Floating / Unassigned'}</td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* === MODAL: REGISTER NEW GUARD === */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex items-center">
                <User className="w-5 h-5 mr-2" />
                Register Security Personnel
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleAddGuard} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Legal Name</label>
                <input required type="text" placeholder="e.g. Dela Cruz, Juan" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder-gray-400 bg-white" value={newGuard.guard_name} onChange={e => setNewGuard({...newGuard, guard_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">LESP License Number</label>
                <input required type="text" placeholder="e.g. LESP-2024-99812" className="w-full border p-2 rounded font-mono focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder-gray-400 bg-white" value={newGuard.lesp_number} onChange={e => setNewGuard({...newGuard, lesp_number: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">LESP Expiry Date</label>
                <input required type="date" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white" value={newGuard.lesp_expiry_date} onChange={e => setNewGuard({...newGuard, lesp_expiry_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Assigned Branch (Optional)</label>
                <input type="text" placeholder="e.g. BDO Alabang" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 placeholder-gray-400 bg-white" value={newGuard.assigned_branch} onChange={e => setNewGuard({...newGuard, assigned_branch: e.target.value})} />
                <p className="text-xs text-gray-500 mt-1">Leave blank if the guard is currently unassigned or floating.</p>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-6">
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  Save Personnel Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
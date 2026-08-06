'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DashboardStats() {
    const [stats, setStats] = useState({
        totalAudits: 0,
        noShowGuards: 0,
        missingSignatures: 0,
        uniformViolations: 0,
        activeViolations: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    // Since you don't have a Detachments table yet, we use a mock target
    const TOTAL_DETACHMENTS = 128; 

    useEffect(() => {
        fetchKpis();
    }, []);

    const fetchKpis = async () => {
        setIsLoading(true);
        
        try {
        // Execute all 5 optimized count queries at the exact same time using Promise.all
        const [
            { count: totalAudits },
            { count: noShows },
            { count: missingSigs },
            { count: uniformFails },
            { count: violations }
        ] = await Promise.all([
            // 1. Total Audits
            supabase.from('audits').select('id', { count: 'exact', head: true }),
            
            // 2. No-Show Guards (Guard absent)
            supabase.from('audits').select('id', { count: 'exact', head: true }).not('guard_present_status', 'is', null),
            
            // 3. Missing Client Signatures (Null)
            supabase.from('audits').select('id', { count: 'exact', head: true }).is('inspector_signature', null),
            
            // 4. Uniform Non-Compliance
            supabase.from('audits').select('id', { count: 'exact', head: true }).eq('uniform_status', false),

            // 5. Active Violations Logged (JSONB object is not null)
            supabase.from('audits').select('id', { count: 'exact', head: true }).not('violations_checklist', 'is', null)
        ]);

        setStats({
            totalAudits: totalAudits || 0,
            noShowGuards: noShows || 0,
            missingSignatures: missingSigs || 0,
            uniformViolations: uniformFails || 0,
            activeViolations: violations || 0,
        });

        } catch (error) {
        console.error("Error fetching KPI stats:", error);
        } finally {
        setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      
        {/* Card 1: Overall Progress */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Inspection Progress</p>
            <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-blue-600">{stats.totalAudits}</span>
            <span className="text-sm text-gray-500 font-medium">/ {TOTAL_DETACHMENTS} sites</span>
            </div>
        </div>

        {/* Card 2: Critical Emergency (No-Shows) */}
        <div className={`p-5 rounded-xl shadow-sm border flex flex-col justify-center ${stats.noShowGuards > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${stats.noShowGuards > 0 ? 'text-red-700' : 'text-gray-500'}`}>
            No-Show Guards
            </p>
            <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl font-extrabold ${stats.noShowGuards > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                {stats.noShowGuards}
            </span>
            <span className="text-sm text-gray-500 font-medium">Absent</span>
            </div>
        </div>

        {/* Card 3: Active Violations */}
        <div className={`p-5 rounded-xl shadow-sm border flex flex-col justify-center ${stats.activeViolations > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${stats.activeViolations > 0 ? 'text-orange-700' : 'text-gray-500'}`}>
            Violations Logged
            </p>
            <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl font-extrabold ${stats.activeViolations > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
                {stats.activeViolations}
            </span>
            <span className="text-sm text-gray-500 font-medium">Tickets</span>
            </div>
        </div>

        {/* Card 4: Uniform Compliance */}
        <div className={`p-5 rounded-xl shadow-sm border flex flex-col justify-center ${stats.uniformViolations > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${stats.uniformViolations > 0 ? 'text-yellow-700' : 'text-gray-500'}`}>
            Uniform Failures
            </p>
            <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-3xl font-extrabold ${stats.uniformViolations > 0 ? 'text-yellow-600' : 'text-gray-800'}`}>
                {stats.uniformViolations}
            </span>
            <span className="text-sm text-gray-500 font-medium">Non-Compliant</span>
            </div>
        </div>

        {/* Card 5: Missing Signatures */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Missing Signatures</p>
            <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-gray-800">{stats.missingSignatures}</span>
            <span className="text-sm text-gray-500 font-medium">Clients Absent</span>
            </div>
        </div>

        </div>
    );
}
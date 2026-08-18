'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DashboardStatsProps {
    activeFilter: string | null;
    onFilterSelect: (filter: string | null) => void;
}

export default function DashboardStats({ activeFilter, onFilterSelect }: DashboardStatsProps) {
    const [stats, setStats] = useState({
        totalAudits: 0,
        noShowGuards: 0,
        missingSignatures: 0,
        uniformViolations: 0,
        activeViolations: 0,
        documentIssues: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    const TOTAL_DETACHMENTS = 128; 

    // The PostgREST JSON arrow query to find ANY missing or expired license
    const docFilter = 'documents_checklist->>lto_license.eq.Expired,documents_checklist->>lto_license.eq.Missing,documents_checklist->>ddo_license.eq.Expired,documents_checklist->>ddo_license.eq.Missing,documents_checklist->>ltofp_license.eq.Expired,documents_checklist->>ltofp_license.eq.Missing,documents_checklist->>fa_license.eq.Expired,documents_checklist->>fa_license.eq.Missing,documents_checklist->>id_license.eq.Expired,documents_checklist->>id_license.eq.Missing,documents_checklist->>rlm_license.eq.Expired,documents_checklist->>rlm_license.eq.Missing';

    useEffect(() => {
        fetchKpis();
    }, []);

    const fetchKpis = async () => {
        setIsLoading(true);
        try {
            const [
                { count: totalAudits },
                { count: noShows },
                { count: missingSigs },
                { count: uniformFails },
                { count: violations },
                { count: docIssues }
            ] = await Promise.all([
                supabase.from('audits').select('id', { count: 'exact', head: true }),
                supabase.from('audits').select('id', { count: 'exact', head: true }).not('guard_present_status', 'is', null),
                supabase.from('audits').select('id', { count: 'exact', head: true }).is('inspector_signature', null),
                supabase.from('audits').select('id', { count: 'exact', head: true }).eq('uniform_status', false),
                supabase.from('audits').select('id', { count: 'exact', head: true }).not('violations_checklist', 'is', null),
                supabase.from('audits').select('id', { count: 'exact', head: true }).or(docFilter)
            ]);

            setStats({
                totalAudits: totalAudits || 0,
                noShowGuards: noShows || 0,
                missingSignatures: missingSigs || 0,
                uniformViolations: uniformFails || 0,
                activeViolations: violations || 0,
                documentIssues: docIssues || 0,
            });
        } catch (error) {
            console.error("Error fetching KPI stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    const handleToggle = (filterName: string) => {
        onFilterSelect(activeFilter === filterName ? null : filterName);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      
            {/* Card 1: Overall Progress (Clear Filter) */}
            <div 
                onClick={() => onFilterSelect(null)}
                className={`p-5 rounded-xl shadow-sm border flex flex-col justify-center cursor-pointer transition-transform hover:scale-105 ${activeFilter === null ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500 ring-offset-1' : 'bg-white border-gray-200'}`}
            >
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Inspection Progress</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-blue-600">{stats.totalAudits}</span>
                    <span className="text-sm text-gray-500 font-medium">/ {TOTAL_DETACHMENTS} sites</span>
                </div>
            </div>

            {/* Card 2: No-Shows */}
            <div 
                onClick={() => handleToggle('no-show')}
                className={`p-5 rounded-xl shadow-sm border flex flex-col justify-center cursor-pointer transition-transform hover:scale-105 
                ${stats.noShowGuards > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}
                ${activeFilter === 'no-show' ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}
            >
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
            <div 
                onClick={() => handleToggle('violations')}
                className={`p-5 rounded-xl shadow-sm border flex flex-col justify-center cursor-pointer transition-transform hover:scale-105 
                ${stats.activeViolations > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}
                ${activeFilter === 'violations' ? 'ring-2 ring-orange-500 ring-offset-1' : ''}`}
            >
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
            <div 
                onClick={() => handleToggle('uniform')}
                className={`p-5 rounded-xl shadow-sm border flex flex-col justify-center cursor-pointer transition-transform hover:scale-105 
                ${stats.uniformViolations > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}
                ${activeFilter === 'uniform' ? 'ring-2 ring-yellow-500 ring-offset-1' : ''}`}
            >
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
            
            {/* Card 5: Document Issues */}
            <div 
                onClick={() => handleToggle('documents')}
                className={`p-5 rounded-xl shadow-sm border flex flex-col justify-center cursor-pointer transition-transform hover:scale-105 
                ${stats.documentIssues > 0 ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'}
                ${activeFilter === 'documents' ? 'ring-2 ring-purple-500 ring-offset-1' : ''}`}
            >
                <p className={`text-xs font-bold uppercase tracking-wide ${stats.documentIssues > 0 ? 'text-purple-700' : 'text-gray-500'}`}>
                    Document Issues
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-3xl font-extrabold ${stats.documentIssues > 0 ? 'text-purple-600' : 'text-gray-800'}`}>
                        {stats.documentIssues}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">Expired/Missing</span>
                </div>
            </div>

            {/* Card 6: Missing Signatures */}
            <div 
                onClick={() => handleToggle('missing-sigs')}
                className={`bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center cursor-pointer transition-transform hover:scale-105
                ${activeFilter === 'missing-sigs' ? 'ring-2 ring-gray-800 ring-offset-1' : ''}`}
            >
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Missing Signatures</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-gray-800">{stats.missingSignatures}</span>
                    <span className="text-sm text-gray-500 font-medium">Clients Absent</span>
                </div>
            </div>

        </div>
    );
}
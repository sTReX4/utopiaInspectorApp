'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DashboardStatsProps {
    activeFilter: string | null;
    onFilterSelect: (filter: string | null) => void;
    globalDate: string;
}

export default function DashboardStats({ activeFilter, onFilterSelect, globalDate }: DashboardStatsProps) {
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

    const docFilter = 'documents_checklist->>lto_license.eq.Expired,documents_checklist->>lto_license.eq.Missing,documents_checklist->>ddo_license.eq.Expired,documents_checklist->>ddo_license.eq.Missing,documents_checklist->>ltofp_license.eq.Expired,documents_checklist->>ltofp_license.eq.Missing,documents_checklist->>fa_license.eq.Expired,documents_checklist->>fa_license.eq.Missing,documents_checklist->>id_license.eq.Expired,documents_checklist->>id_license.eq.Missing,documents_checklist->>rlm_license.eq.Expired,documents_checklist->>rlm_license.eq.Missing';

    useEffect(() => {
        if (globalDate) fetchKpis();
    }, [globalDate]);

    const fetchKpis = async () => {
        setIsLoading(true);
        try {
            const getBaseQuery = () => supabase
                .from('audits')
                .select('id', { count: 'exact', head: true })
                .gte('time_in', `${globalDate}T00:00:00Z`)
                .lte('time_in', `${globalDate}T23:59:59Z`);

            const [
                { count: totalAudits },
                { count: noShows },
                { count: missingSigs },
                { count: uniformFails },
                { count: violations },
                { count: docIssues }
            ] = await Promise.all([
                getBaseQuery(),
                getBaseQuery().not('guard_present_status', 'is', null),
                getBaseQuery().is('inspector_signature', null),
                getBaseQuery().eq('uniform_status', false),
                getBaseQuery().not('violations_checklist', 'is', null),
                getBaseQuery().or(docFilter)
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
            <div className="grid grid-cols-2 lg:grid-cols-6 border border-slate-200 bg-slate-200 gap-px mb-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-24 bg-white animate-pulse"></div>
                ))}
            </div>
        );
    }

    const handleToggle = (filterName: string) => {
        onFilterSelect(activeFilter === filterName ? null : filterName);
    };

    // Helper to determine text color for numbers based on state and value
    const getNumColor = (isActive: boolean, value: number) => {
        if (isActive) return 'text-white';
        if (value > 0) return 'text-red-600';
        return 'text-slate-900';
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-6 border border-slate-200 bg-slate-200 gap-px mb-6">
      
            {/* Card 1: Overall Progress */}
            <div 
                onClick={() => onFilterSelect(null)} 
                className={`p-4 flex flex-col justify-center cursor-pointer transition-none ${activeFilter === null ? 'bg-slate-900' : 'bg-white hover:bg-slate-50'}`}
            >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === null ? 'text-slate-400' : 'text-slate-500'}`}>
                    Inspection Progress
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-mono tracking-tight ${activeFilter === null ? 'text-white' : 'text-slate-900'}`}>
                        {stats.totalAudits}
                    </span>
                    <span className={`text-xs font-mono font-medium ${activeFilter === null ? 'text-slate-500' : 'text-slate-400'}`}>
                        / {TOTAL_DETACHMENTS}
                    </span>
                </div>
            </div>

            {/* Card 2: No-Shows */}
            <div 
                onClick={() => handleToggle('no-show')} 
                className={`p-4 flex flex-col justify-center cursor-pointer transition-none ${activeFilter === 'no-show' ? 'bg-slate-900' : 'bg-white hover:bg-slate-50'}`}
            >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'no-show' ? 'text-slate-400' : 'text-slate-500'}`}>
                    No-Show Guards
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-mono tracking-tight ${getNumColor(activeFilter === 'no-show', stats.noShowGuards)}`}>
                        {stats.noShowGuards}
                    </span>
                </div>
            </div>

            {/* Card 3: Active Violations */}
            <div 
                onClick={() => handleToggle('violations')} 
                className={`p-4 flex flex-col justify-center cursor-pointer transition-none ${activeFilter === 'violations' ? 'bg-slate-900' : 'bg-white hover:bg-slate-50'}`}
            >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'violations' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Violations Logged
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-mono tracking-tight ${getNumColor(activeFilter === 'violations', stats.activeViolations)}`}>
                        {stats.activeViolations}
                    </span>
                </div>
            </div>

            {/* Card 4: Uniform Compliance */}
            <div 
                onClick={() => handleToggle('uniform')} 
                className={`p-4 flex flex-col justify-center cursor-pointer transition-none ${activeFilter === 'uniform' ? 'bg-slate-900' : 'bg-white hover:bg-slate-50'}`}
            >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'uniform' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Uniform Failures
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-mono tracking-tight ${getNumColor(activeFilter === 'uniform', stats.uniformViolations)}`}>
                        {stats.uniformViolations}
                    </span>
                </div>
            </div>
            
            {/* Card 5: Document Issues */}
            <div 
                onClick={() => handleToggle('documents')} 
                className={`p-4 flex flex-col justify-center cursor-pointer transition-none ${activeFilter === 'documents' ? 'bg-slate-900' : 'bg-white hover:bg-slate-50'}`}
            >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'documents' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Document Issues
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-mono tracking-tight ${getNumColor(activeFilter === 'documents', stats.documentIssues)}`}>
                        {stats.documentIssues}
                    </span>
                </div>
            </div>

            {/* Card 6: Missing Signatures */}
            <div 
                onClick={() => handleToggle('missing-sigs')} 
                className={`p-4 flex flex-col justify-center cursor-pointer transition-none ${activeFilter === 'missing-sigs' ? 'bg-slate-900' : 'bg-white hover:bg-slate-50'}`}
            >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${activeFilter === 'missing-sigs' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Missing Signatures
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-2xl font-mono tracking-tight ${getNumColor(activeFilter === 'missing-sigs', stats.missingSignatures)}`}>
                        {stats.missingSignatures}
                    </span>
                </div>
            </div>

        </div>
    );
}
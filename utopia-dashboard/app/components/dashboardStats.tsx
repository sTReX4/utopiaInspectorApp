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
            // Reusable base query locked to the selected date
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse"></div>
                ))}
            </div>
        );
    }

    const handleToggle = (filterName: string) => {
        onFilterSelect(activeFilter === filterName ? null : filterName);
    };

    const getCardStyle = (filterName: string | null) => {
        const isActive = activeFilter === filterName;
        return `p-5 rounded-xl bg-white flex flex-col justify-center cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            isActive ? 'border border-blue-600 ring-1 ring-blue-600 shadow-sm' : 'border border-slate-200 shadow-sm'
        }`;
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      
            {/* Card 1: Overall Progress */}
            <div onClick={() => onFilterSelect(null)} className={getCardStyle(null)}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Inspection Progress
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black tracking-tight text-slate-900">
                        {stats.totalAudits}
                    </span>
                    <span className="text-sm font-medium text-slate-400">
                        / {TOTAL_DETACHMENTS} sites
                    </span>
                </div>
            </div>

            {/* Card 2: No-Shows */}
            <div onClick={() => handleToggle('no-show')} className={getCardStyle('no-show')}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    No-Show Guards
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-3xl font-black tracking-tight ${stats.noShowGuards > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                        {stats.noShowGuards}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">Absent</span>
                </div>
            </div>

            {/* Card 3: Active Violations */}
            <div onClick={() => handleToggle('violations')} className={getCardStyle('violations')}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Violations Logged
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-3xl font-black tracking-tight ${stats.activeViolations > 0 ? 'text-orange-600' : 'text-slate-900'}`}>
                        {stats.activeViolations}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">Tickets</span>
                </div>
            </div>

            {/* Card 4: Uniform Compliance */}
            <div onClick={() => handleToggle('uniform')} className={getCardStyle('uniform')}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Uniform Failures
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-3xl font-black tracking-tight ${stats.uniformViolations > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                        {stats.uniformViolations}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">Non-Compliant</span>
                </div>
            </div>
            
            {/* Card 5: Document Issues */}
            <div onClick={() => handleToggle('documents')} className={getCardStyle('documents')}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Document Issues
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-3xl font-black tracking-tight ${stats.documentIssues > 0 ? 'text-purple-600' : 'text-slate-900'}`}>
                        {stats.documentIssues}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">Expired/Missing</span>
                </div>
            </div>

            {/* Card 6: Missing Signatures */}
            <div onClick={() => handleToggle('missing-sigs')} className={getCardStyle('missing-sigs')}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Missing Signatures
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black tracking-tight text-slate-900">
                        {stats.missingSignatures}
                    </span>
                    <span className="text-sm text-slate-400 font-medium">Clients Absent</span>
                </div>
            </div>

        </div>
    );
}
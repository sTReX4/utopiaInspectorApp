'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DashboardStatsProps {
    activeFilter: string | null;
    onFilterSelect: (filter: string | null) => void;
    globalDate: string;
    globalInspector: string;
}

export default function DashboardStats({ activeFilter, onFilterSelect, globalDate, globalInspector }: DashboardStatsProps) {
    const [stats, setStats] = useState({
        totalAudits: 0,
        noShowGuards: 0,
        missingSignatures: 0,
        uniformViolations: 0,
        activeViolations: 0,
        documentIssues: 0,
        alarmResponses: 0,
    });
    const [totalDetachments, setTotalDetachments] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    const docFilter = 'documents_checklist->>lto_license.eq.Expired,documents_checklist->>lto_license.eq.Missing,documents_checklist->>ddo_license.eq.Expired,documents_checklist->>ddo_license.eq.Missing,documents_checklist->>ltofp_license.eq.Expired,documents_checklist->>ltofp_license.eq.Missing,documents_checklist->>fa_license.eq.Expired,documents_checklist->>fa_license.eq.Missing,documents_checklist->>id_license.eq.Expired,documents_checklist->>id_license.eq.Missing,documents_checklist->>rlm_license.eq.Expired,documents_checklist->>rlm_license.eq.Missing';

    useEffect(() => {
        const fetchTotalDetachments = async () => {
            const { count, error } = await supabase
                .from('detachments')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            
            if (!error && count !== null) {
                setTotalDetachments(count);
            }
        };
        fetchTotalDetachments();
    }, []);

    useEffect(() => {
        if (globalDate) fetchKpis();
    }, [globalDate, globalInspector]);

    const fetchKpis = async () => {
        setIsLoading(true);
        try {
            const getBaseQuery = () => {
                let query = supabase
                    .from('audits')
                    .select('id', { count: 'exact', head: true })
                    .gte('time_in', `${globalDate}T00:00:00Z`)
                    .lte('time_in', `${globalDate}T23:59:59Z`);
                
                if (globalInspector) {
                    query = query.eq('inspector_name', globalInspector);
                }
                
                return query;
            };

            const getGlobalProgressQuery = () => {
                return supabase
                    .from('audits')
                    .select('id', { count: 'exact', head: true })
                    .gte('time_in', `${globalDate}T00:00:00Z`)
                    .lte('time_in', `${globalDate}T23:59:59Z`);
            };

            const [
                { count: totalAudits },
                { count: noShows },
                { count: missingSigs },
                { count: uniformFails },
                { count: violations },
                { count: docIssues },
                { count: alarms }
            ] = await Promise.all([
                getGlobalProgressQuery(),
                getBaseQuery().not('guard_present_status', 'is', null),
                getBaseQuery().is('inspector_signature', null),
                getBaseQuery().eq('uniform_status', false),
                getBaseQuery().not('violations_checklist', 'is', null),
                getBaseQuery().or(docFilter),
                getBaseQuery().eq('visit_type', 'Alarm Response')
            ]);

            setStats({
                totalAudits: totalAudits || 0,
                noShowGuards: noShows || 0,
                missingSignatures: missingSigs || 0,
                uniformViolations: uniformFails || 0,
                activeViolations: violations || 0,
                documentIssues: docIssues || 0,
                alarmResponses: alarms || 0,
            });
        } catch (error) {
            console.error("Error fetching KPI stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (filterName: string) => {
        onFilterSelect(activeFilter === filterName ? null : filterName);
    };

    /*
     * One tile definition drives the whole row. The previous seven copy-pasted
     * blocks drifted apart over time, which is how the active state ended up
     * with unreadable label contrast.
     */
    const tiles: { key: string | null; label: string; value: number; total?: number }[] = [
        { key: null, label: 'Inspection Progress', value: stats.totalAudits, total: totalDetachments },
        { key: 'alarm', label: 'Alarm Responses', value: stats.alarmResponses },
        { key: 'no-show', label: 'No-Show Guards', value: stats.noShowGuards },
        { key: 'violations', label: 'Violations Logged', value: stats.activeViolations },
        { key: 'uniform', label: 'Uniform Failures', value: stats.uniformViolations },
        { key: 'documents', label: 'Document Issues', value: stats.documentIssues },
        { key: 'missing-sigs', label: 'Missing Signatures', value: stats.missingSignatures },
    ];

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 border border-line rounded-card overflow-hidden bg-line gap-px mb-6">
                {tiles.map((tile) => (
                    <div key={tile.label} className="h-24 bg-surface p-5 flex flex-col justify-center gap-2">
                        <div className="h-3 w-2/3 bg-sunken animate-pulse rounded-control"></div>
                        <div className="h-6 w-1/3 bg-sunken animate-pulse rounded-control"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 border border-line rounded-card overflow-hidden bg-line gap-px mb-6">
            {tiles.map((tile) => {
                const isActive = activeFilter === tile.key;
                /* Only counts that represent a problem turn red. A total does not. */
                const isAlert = tile.key !== null && tile.value > 0;
                return (
                    <button
                        key={tile.label}
                        type="button"
                        onClick={() => (tile.key === null ? onFilterSelect(null) : handleToggle(tile.key))}
                        aria-pressed={isActive}
                        className={`p-5 flex flex-col justify-center text-left transition-colors duration-200 ${
                            isActive ? 'bg-ink' : 'bg-surface hover:bg-sunken'
                        }`}
                    >
                        <p className={`text-xs ${isActive ? 'text-shell-muted' : 'text-ink-muted'}`}>
                            {tile.label}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1.5">
                            <span className={`text-2xl tracking-tight font-mono ${
                                isActive ? 'text-shell-ink' : isAlert ? 'text-danger-ink' : 'text-ink'
                            }`}>
                                {tile.value}
                            </span>
                            {tile.total !== undefined && (
                                <span className={`text-xs font-mono ${isActive ? 'text-shell-muted' : 'text-ink-muted'}`}>
                                    / {tile.total}
                                </span>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AuditDetailPanel from './auditDetailPanel';

interface AuditPhoto {
    id: string;
    live_photo_url: string;
    inspector_name: string;
    created_at: string;
    branch_name: string;
}

interface LivePhotoGridProps {
    activeFilter: string | null;
    globalDate: string;
    globalInspector: string;
}

export default function LivePhotoGrid({ activeFilter, globalDate, globalInspector }: LivePhotoGridProps) {
    const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
    const [photos, setPhotos] = useState<AuditPhoto[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        if (globalDate) fetchRecentPhotos();
    }, [activeFilter, globalDate, globalInspector]);

    const fetchRecentPhotos = async () => {
        setIsLoading(true);
        try {
            let query: any = supabase
                .from('audits')
                .select('id, live_photo_url, inspector_name, created_at, branch_name')
                .not('live_photo_url', 'is', null)
                .gte('time_in', `${globalDate}T00:00:00Z`)
                .lte('time_in', `${globalDate}T23:59:59Z`)
                .order('created_at', { ascending: false })
                .limit(12);

            // Apply Inspector Filter dynamically
            if (globalInspector) {
                query = query.eq('inspector_name', globalInspector);
            }

            if (activeFilter === 'no-show') {
                query = query.not('guard_present_status', 'is', null);
            } else if (activeFilter === 'violations') {
                query = query.not('violations_checklist', 'is', null);
            } else if (activeFilter === 'uniform') {
                query = query.eq('uniform_status', false);
            } else if (activeFilter === 'missing-sigs') {
                query = query.is('inspector_signature', null);
            } else if (activeFilter === 'documents') {
                const docFilter = 'documents_checklist->>lto_license.eq.Expired,documents_checklist->>lto_license.eq.Missing,documents_checklist->>ddo_license.eq.Expired,documents_checklist->>ddo_license.eq.Missing,documents_checklist->>ltofp_license.eq.Expired,documents_checklist->>ltofp_license.eq.Missing,documents_checklist->>fa_license.eq.Expired,documents_checklist->>fa_license.eq.Missing,documents_checklist->>id_license.eq.Expired,documents_checklist->>id_license.eq.Missing,documents_checklist->>rlm_license.eq.Expired,documents_checklist->>rlm_license.eq.Missing';
                query = query.or(docFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setPhotos(data || []);
        } catch (error) {
            console.error('Error fetching recent photos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true
        }).toUpperCase();
    };

    const getGridTitle = () => {
        let baseTitle = 'LIVE FEED: ALL RECORDS';
        if (activeFilter === 'no-show') baseTitle = 'LIVE FEED: NO-SHOWS';
        else if (activeFilter === 'violations') baseTitle = 'LIVE FEED: VIOLATIONS';
        else if (activeFilter === 'uniform') baseTitle = 'LIVE FEED: UNIFORM FAILURES';
        else if (activeFilter === 'missing-sigs') baseTitle = 'LIVE FEED: MISSING SIGNATURES';
        else if (activeFilter === 'documents') baseTitle = 'LIVE FEED: DOCUMENT ISSUES';
        
        return globalInspector ? `${baseTitle} (${globalInspector.toUpperCase()})` : baseTitle;
    };

    return (
        <div className="border border-slate-200 bg-white min-h-[400px] flex flex-col">
            <div className="p-6 border-b border-slate-200">
                <h2 className="text-base font-bold tracking-widest text-slate-900 uppercase">
                    {getGridTitle()}
                </h2>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs uppercase tracking-widest">
                    Querying database...
                </div>
            ) : (
                <div className="flex-1 bg-slate-200 p-px">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-px">
                        {photos.map((photo) => (
                            <div 
                                key={photo.id} 
                                onClick={() => setSelectedAuditId(photo.id)}
                                className="flex flex-col bg-white cursor-pointer transition-none hover:bg-slate-50 group relative"
                            >
                                <div className="aspect-video w-full bg-slate-100 relative border-b border-slate-200 overflow-hidden">
                                    <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-none z-10"></div>
                                    <img
                                        src={photo.live_photo_url}
                                        alt={`Guard at ${photo.branch_name}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="p-5 flex flex-col gap-3">
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-wider truncate">
                                        {photo.branch_name}
                                    </p>
                                    <div className="flex flex-col gap-2 mt-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Inspector</span>
                                            <span className="text-xs font-mono font-medium text-slate-900 uppercase truncate max-w-[150px] text-right">{photo.inspector_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                                            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Time</span>
                                            <span className="text-xs font-mono font-medium text-slate-900">{formatTime(photo.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {photos.length === 0 && (
                        <div className="w-full bg-white text-center text-slate-500 py-16 text-sm font-mono uppercase tracking-widest">
                            No records match the current filter.
                        </div>
                    )}
                </div>
            )}

            <AuditDetailPanel 
                auditId={selectedAuditId} 
                onClose={() => setSelectedAuditId(null)} 
            />
        </div>
    );
}
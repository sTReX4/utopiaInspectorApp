'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Images } from '@phosphor-icons/react';
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
                // Alarm responses carry a site condition here, not a no-show.
                query = query
                    .not('guard_present_status', 'is', null)
                    .or('visit_type.is.null,visit_type.neq.Alarm Response');
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
        let baseTitle = 'Live feed: all records';
        if (activeFilter === 'no-show') baseTitle = 'Live feed: no-shows';
        else if (activeFilter === 'violations') baseTitle = 'Live feed: violations';
        else if (activeFilter === 'uniform') baseTitle = 'Live feed: uniform failures';
        else if (activeFilter === 'missing-sigs') baseTitle = 'Live feed: missing signatures';
        else if (activeFilter === 'documents') baseTitle = 'Live feed: document issues';
        
        return globalInspector ? `${baseTitle} (${globalInspector})` : baseTitle;
    };

    return (
        <div className="border border-line rounded-card overflow-hidden bg-surface min-h-[400px] flex flex-col">
            <div className="p-6 border-b border-line">
                <h2 className="text-base font-medium text-ink">
                    {getGridTitle()}
                </h2>
            </div>

            {isLoading ? (
                <div className="flex-1 bg-sunken p-px">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-px">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex flex-col bg-surface">
                                <div className="aspect-video w-full bg-sunken animate-pulse border-b border-line"></div>
                                <div className="p-5 flex flex-col gap-3">
                                    <div className="h-4 w-2/3 bg-sunken animate-pulse rounded-control"></div>
                                    <div className="h-3 w-full bg-sunken animate-pulse rounded-control"></div>
                                    <div className="h-3 w-1/2 bg-sunken animate-pulse rounded-control"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 bg-sunken p-px">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-px">
                        {photos.map((photo) => (
                            <button
                                type="button"
                                key={photo.id}
                                onClick={() => setSelectedAuditId(photo.id)}
                                className="flex flex-col bg-surface text-left cursor-pointer transition-colors duration-200 hover:bg-sunken group relative"
                            >
                                <div className="aspect-video w-full bg-sunken relative border-b border-line overflow-hidden">
                                    <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors duration-200 z-10"></div>
                                    <img
                                        src={photo.live_photo_url}
                                        alt={`Guard at ${photo.branch_name}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="p-5 flex flex-col gap-3">
                                    <p className="text-sm font-bold text-ink truncate">
                                        {photo.branch_name}
                                    </p>
                                    <div className="flex flex-col gap-2 mt-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-ink-muted">Inspector</span>
                                            <span className="text-xs font-medium text-ink truncate max-w-[150px] text-right">{photo.inspector_name}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-line pt-2">
                                            <span className="text-xs text-ink-muted">Time</span>
                                            <span className="text-xs font-mono text-ink">{formatTime(photo.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {photos.length === 0 && (
                        <div className="w-full bg-surface flex flex-col items-center justify-center text-center py-20 px-6">
                            <Images className="w-8 h-8 text-ink-muted mb-4" />
                            <p className="text-sm font-medium text-ink">No records match the current filter</p>
                            <p className="text-sm text-ink-muted mt-1 max-w-[46ch]">
                                Try a different date, clear the inspector filter, or select another tile above.
                            </p>
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
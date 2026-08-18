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
}

export default function LivePhotoGrid({ activeFilter }: LivePhotoGridProps) {
    const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
    const [photos, setPhotos] = useState<AuditPhoto[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchRecentPhotos();
    }, [activeFilter]);

    const fetchRecentPhotos = async () => {
        setIsLoading(true);
        try {
            let query: any = supabase
                .from('audits')
                .select('id, live_photo_url, inspector_name, created_at, branch_name')
                .not('live_photo_url', 'is', null)
                .order('created_at', { ascending: false })
                .limit(12);

            if (activeFilter === 'no-show') {
                query = query.not('guard_present_status', 'is', null);
            } else if (activeFilter === 'violations') {
                query = query.not('violations_checklist', 'is', null);
            } else if (activeFilter === 'uniform') {
                query = query.eq('uniform_status', false);
            } else if (activeFilter === 'missing-sigs') {
                query = query.is('inspector_signature', null);
            } else if (activeFilter === 'documents') {
                // Check if ANY of the license fields inside the JSON contain "Expired" or "Missing"
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
        });
    };

    const getGridTitle = () => {
        if (activeFilter === 'no-show') return 'Live Guard Feed: No-Shows Only';
        if (activeFilter === 'violations') return 'Live Guard Feed: Active Violations Only';
        if (activeFilter === 'uniform') return 'Live Guard Feed: Uniform Failures Only';
        if (activeFilter === 'missing-sigs') return 'Live Guard Feed: Missing Signatures Only';
        if (activeFilter === 'documents') return 'Live Guard Feed: Document Issues Only';
        return 'Live Guard Feed: All Records';
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 min-h-[400px]">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{getGridTitle()}</h2>

            {isLoading ? (
                <div className="text-center text-gray-500 py-12">Applying filters and querying database...</div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {photos.map((photo) => (
                            <div 
                                key={photo.id} 
                                onClick={() => setSelectedAuditId(photo.id)}
                                className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:shadow-md transition-shadow cursor-pointer transform hover:-translate-y-1 duration-200"
                            >
                                <div className="h-48 w-full bg-gray-200 relative">
                                    <img
                                        src={photo.live_photo_url}
                                        alt={`Guard at ${photo.branch_name}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="p-3">
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                        {photo.branch_name}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        <span className="font-medium">Inspector:</span> {photo.inspector_name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        <span className="font-medium">Time:</span> {formatTime(photo.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {photos.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300 mt-4">
                            No live photos match the current filter.
                        </div>
                    )}
                </>
            )}

            <AuditDetailPanel 
                auditId={selectedAuditId} 
                onClose={() => setSelectedAuditId(null)} 
            />
        </div>
    );
}
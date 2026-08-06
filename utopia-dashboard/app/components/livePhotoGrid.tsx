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

export default function LivePhotoGrid() {
    const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
    const [photos, setPhotos] = useState<AuditPhoto[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchRecentPhotos();
    }, []);

    const fetchRecentPhotos = async () => {
        try {
            const { data, error } = await supabase
            .from('audits')
            .select('id, live_photo_url, inspector_name, created_at, branch_name')
            .not('live_photo_url', 'is', null)
            .order('created_at', { ascending: false })
            .limit(12);

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

    if (isLoading) {
        return <div className="p-4 text-gray-500">Loading recent photos...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Live Guard Feed</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo) => (
                    <div key={photo.id} className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:shadow-md transition-shadow">
                        <div 
                            key={photo.id} 
                            onClick={() => setSelectedAuditId(photo.id)}
                            className="flex flex-col border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:shadow-md transition-shadow cursor-pointer"
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
                    </div>
                ))}

                {photos.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-8">
                        No live photos available at the moment.
                    </div>
                )}

            </div>  

            <AuditDetailPanel 
                auditId={selectedAuditId} 
                onClose={() => setSelectedAuditId(null)} 
            />
        </div>
    );
}
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowRight, ShieldWarning } from '@phosphor-icons/react';
import AuditDetailPanel from './auditDetailPanel';

interface ActiveAlarm {
  id: string;
  branch_name: string;
  branch_code: string;
  inspector_name: string;
  time_in: string;
  incident_remarks: string;
}

export default function ActiveAlarmsBanner() {
  const [alarms, setAlarms] = useState<ActiveAlarm[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveAlarms = async () => {
      // Fetch only today's Alarm Responses
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('audits')
        .select('id, branch_name, branch_code, inspector_name, time_in, incident_remarks')
        .eq('visit_type', 'Alarm Response')
        .gte('time_in', today.toISOString())
        .order('time_in', { ascending: false });

      if (!error && data) {
        setAlarms(data);
      }
    };

    fetchActiveAlarms();

    // Subscribe to live incoming alarms
    const subscription = supabase
      .channel('public:audits')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audits', filter: "visit_type=eq.'Alarm Response'" }, (payload) => {
        setAlarms((prev) => [payload.new as ActiveAlarm, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (alarms.length === 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-2">
      {alarms.map((alarm) => (
        <div key={alarm.id} className="bg-surface border border-red-600 rounded-control p-0 flex flex-col md:flex-row shadow-none">
          <div className="bg-red-600 text-surface p-4 flex flex-col justify-center items-center md:w-48 shrink-0">
            <ShieldWarning className="w-8 h-8 mb-2" />
            <span className="text-xs font-bold text-center">Active Incident</span>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-sm font-bold text-ink tracking-wide">{alarm.branch_name}</h3>
              <span className="text-xs bg-sunken text-ink-muted px-2 py-0.5 border border-line">
                {alarm.branch_code}
              </span>
            </div>
            <p className="text-xs text-ink-muted mb-2">RESPONDER: {alarm.inspector_name} | ARRIVAL: {new Date(alarm.time_in).toLocaleTimeString()}</p>
            <p className="text-sm text-ink bg-danger-bg p-3 border border-red-100 font-medium">
              "{alarm.incident_remarks || 'Awaiting detailed resolution notes...'}"
            </p>
          </div>
          <div className="p-4 border-t md:border-t-0 md:border-l border-red-100 flex flex-col justify-center shrink-0">
            <button
              onClick={() => setSelectedAuditId(alarm.id)}
              className="bg-ink text-surface text-xs font-bold py-3 px-6 rounded-control hover:bg-[#333333] transition-colors duration-200 flex items-center justify-center gap-2"
            >
              View Report <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {selectedAuditId && (
        <AuditDetailPanel auditId={selectedAuditId} onClose={() => setSelectedAuditId(null)} />
      )}
    </div>
  );
}
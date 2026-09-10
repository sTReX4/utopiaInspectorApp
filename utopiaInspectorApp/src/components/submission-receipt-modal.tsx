import React from 'react';
import { Modal } from 'react-native';
import { ModalFrame, Row, Section } from './sheet';

/**
 * Mirrors a row of the `audits` table in Supabase, which uses snake_case
 * column names. Keep this in sync with the table definition.
 */
export interface AuditRecord {
  id: string;
  created_at: string | null;
  branch_code: string;
  branch_name: string | null;
  branch_location: string | null;
  inspector_name: string;
  guard_name: string | null;
  firearm_make: string | null;
  firearm_serial: string | null;
  lesp_expiry: string | null;
  uniform_status: boolean | null;
  remarks: string | null;
  /**
   * Only populated when the guard was a no-show; it carries the facility
   * status the inspector recorded in the guard's absence.
   */
  guard_present_status: {
    atm_online?: boolean;
    atm_offline?: boolean;
    door_secure?: boolean;
  } | null;
  incident_remarks: string | null;
  visit_type: string | null;
  escalation_status: string | null;
}

interface SubmissionReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  auditData: AuditRecord | null;
}

/**
 * What was filed, in text only. No photograph and no signatures: this is the
 * inspector's own confirmation, not the client-facing PDF.
 *
 * Shares its chrome with the detachment sheet, so a value in one reads the
 * same as a value in the other.
 */
export default function SubmissionReceiptModal({
  visible,
  onClose,
  auditData
}: SubmissionReceiptModalProps) {
  if (!auditData) return null;

  // A populated `guard_present_status` means the guard was absent from post.
  const guardAbsent = !!auditData.guard_present_status;
  const absent = 'Not applicable, guard absent';

  const submittedAt = auditData.created_at
    ? new Date(auditData.created_at).toLocaleString()
    : null;

  const firearm = [auditData.firearm_make, auditData.firearm_serial]
    .filter(Boolean)
    .join(' ');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ModalFrame title="Audit receipt" onClose={onClose}>
        <Section label="Detachment">
          <Row label="Branch code" value={auditData.branch_code} isFirst />
          <Row label="Branch name" value={auditData.branch_name} />
          <Row label="Location" value={auditData.branch_location} />
          <Row label="Submitted" value={submittedAt} />
          <Row label="Visit type" value={auditData.visit_type} />
        </Section>

        <Section label="Personnel">
          <Row
            label="Guard"
            value={guardAbsent ? 'No show, absent from post' : auditData.guard_name}
            isFirst
          />
          <Row label="Inspector" value={auditData.inspector_name} />
        </Section>

        <Section label="Compliance">
          <Row
            label="Uniform"
            value={guardAbsent ? absent : (auditData.uniform_status ? 'Compliant' : 'Not compliant')}
            tone={!guardAbsent && auditData.uniform_status ? 'ok' : undefined}
            isFirst
          />
          <Row label="Firearm" value={guardAbsent ? absent : (firearm || null)} />
          <Row label="LESP expiry" value={guardAbsent ? absent : auditData.lesp_expiry} />
          <Row label="Remarks" value={auditData.remarks} />
          {auditData.incident_remarks ? (
            <Row label="Incident" value={auditData.incident_remarks} />
          ) : null}
        </Section>
      </ModalFrame>
    </Modal>
  );
}

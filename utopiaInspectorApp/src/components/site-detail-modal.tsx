import React from 'react';
import { Modal } from 'react-native';
import { ModalFrame, Row, Section } from './sheet';

interface SiteDetailModalProps {
  visible: boolean;
  onClose: () => void;
  site: any;
}

/**
 * The full record for one detachment.
 *
 * It used to be two rounded cards inside a padded scroll view, each with its
 * own title and its own inner divider. The same content now runs as two
 * full-bleed sections of label-and-value rows, which is what the dashboard
 * does with the same record.
 */
export default function SiteDetailModal({ visible, onClose, site }: SiteDetailModalProps) {
  if (!site) return null;

  const isActive = site.status?.toLowerCase() === 'active';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ModalFrame title={site.branch_name || 'Detachment'} onClose={onClose}>
        <Section label="Detachment profile">
          <Row label="Branch code" value={site.branch_code} isFirst />
          <Row label="Branch name" value={site.branch_name} />
          <Row label="Location" value={site.location} />
          <Row label="Client" value={site.client_name} />
          <Row label="Status" value={site.status || 'Unknown'} tone={isActive ? 'ok' : undefined} />
        </Section>

        <Section label="Operational details">
          <Row label="Total guards" value={String(site.guard_count ?? 0)} isFirst />
          <Row label="Shift schedule" value={site.shift_schedule || 'Standard'} />
          <Row label="OIC or commander" value={site.oic_name || 'Unassigned'} />
          <Row label="Contact number" value={site.contact_number} />
        </Section>
      </ModalFrame>
    </Modal>
  );
}

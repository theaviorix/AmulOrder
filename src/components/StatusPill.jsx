import React from 'react';

const STATUS_CONFIG = {
  placed: { label: 'Placed', bg: 'bg-mist', text: 'text-ink', dot: 'bg-ink2' },
  accepted: { label: 'Accepted', bg: 'bg-warn/15', text: 'text-warn', dot: 'bg-warn' },
  dispatched: { label: 'Dispatched', bg: 'bg-ok/15', text: 'text-ok', dot: 'bg-ok' },
  billed: { label: 'Billed', bg: 'bg-ink', text: 'text-surface', dot: 'bg-surface' },
  rejected: { label: 'Rejected', bg: 'bg-alert/15', text: 'text-alert', dot: 'bg-alert' },
  cancelled: { label: 'Cancelled', bg: 'bg-ink2/15', text: 'text-ink2', dot: 'bg-ink2' },
  pending: { label: 'Pending link', bg: 'bg-warn/15', text: 'text-warn', dot: 'bg-warn' },
  active: { label: 'Active', bg: 'bg-ok/15', text: 'text-ok', dot: 'bg-ok' },
  blocked: { label: 'Blocked', bg: 'bg-alert/15', text: 'text-alert', dot: 'bg-alert' },
  unpaid: { label: 'Unpaid', bg: 'bg-alert/15', text: 'text-alert', dot: 'bg-alert' },
  partial: { label: 'Partial', bg: 'bg-warn/15', text: 'text-warn', dot: 'bg-warn' },
  paid: { label: 'Settled', bg: 'bg-ok/15', text: 'text-ok', dot: 'bg-ok' },
};

export default function StatusPill({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-mist', text: 'text-ink2', dot: 'bg-ink2' };
  const sizing = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${cfg.bg} ${cfg.text} ${sizing}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
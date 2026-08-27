import React from 'react';

export default function StatusBadge({ status }) {
  const formatStatus = (st) => {
    if (!st) return 'UNKNOWN';
    return st.replace(/_/g, ' ');
  };

  return <span className={`badge-status badge-${status || 'NEW'}`}>{formatStatus(status)}</span>;
}

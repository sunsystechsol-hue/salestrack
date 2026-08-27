import React from 'react';

export function LoadingState({ message = 'Loading data...' }) {
  return (
    <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      <div
        style={{
          display: 'inline-block',
          width: '28px',
          height: '28px',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '0.75rem',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{message}</p>
    </div>
  );
}

export function EmptyState({ title = 'No records found', description = 'Try adjusting your search query or status filter.' }) {
  return (
    <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', opacity: 0.6 }}>📂</div>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '0.35rem' }}>{title}</h4>
      <p style={{ fontSize: '0.85rem' }}>{description}</p>
    </div>
  );
}

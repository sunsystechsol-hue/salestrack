import React from 'react';

export default function FormField({ label, required, children, helperText, error }) {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}
      {children}
      {helperText && <p className="form-helper">{helperText}</p>}
      {error && <p className="form-helper" style={{ color: 'var(--color-danger)' }}>{error}</p>}
    </div>
  );
}

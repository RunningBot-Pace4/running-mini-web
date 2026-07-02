"use client";

export function PageLoadingOverlay({
  show = false,
  label = "Processing...",
}: {
  show?: boolean;
  label?: string;
}) {
  if (!show) return null;

  return (
    <div className="page-loading-overlay" role="status" aria-live="polite" aria-label={label}>
      <div className="page-loading-card">
        <span className="page-loading-spinner" aria-hidden="true" />
        <strong>{label}</strong>
        <small>Please do not tap again.</small>
      </div>
    </div>
  );
}

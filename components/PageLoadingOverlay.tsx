"use client";

export function PageLoadingOverlay({
  show = false,
  label = "Loading...",
}: {
  show?: boolean;
  label?: string;
}) {
  if (!show) return null;

  return (
    <div className="page-loading-overlay" role="status" aria-live="polite">
      <div className="page-loading-card">
        <span className="spinner large" aria-hidden="true" />
        <strong>{label}</strong>
        <small>Please wait a moment.</small>
      </div>
    </div>
  );
}

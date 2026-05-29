"use client";

export function PageLoadingOverlay({
  show,
  label = "Loading...",
}: {
  show?: boolean;
  label?: string;
}) {
  if (!show) return null;

  return (
    <div className="page-loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="page-loading-card">
        <span className="page-loading-runner" aria-hidden="true">🏃‍♂️</span>
        <span className="page-loading-spinner" aria-hidden="true" />
        <strong>{label}</strong>
        <small>Please wait, we are updating your running board.</small>
      </div>
    </div>
  );
}

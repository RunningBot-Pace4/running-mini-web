"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";

export function FormSubmitButton({
  children,
  pendingLabel = "Saving...",
  className,
  disabled = false,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <button className={className} type="submit" disabled={disabled || pending}>
        {pending ? (
          <span className="button-loading">
            <span className="spinner" aria-hidden="true" />
            {pendingLabel}
          </span>
        ) : (
          children
        )}
      </button>
      <PageLoadingOverlay show={pending} label={pendingLabel} />
    </>
  );
}

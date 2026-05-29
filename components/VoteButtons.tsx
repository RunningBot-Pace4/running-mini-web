"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";

type VoteStatus = "ATTEND" | "NOT_ATTEND";

type VoteButtonsProps = {
  eventId: string;
  currentStatus?: VoteStatus | null;
  action: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
};

function VoteSubmitButton({
  children,
  className,
  disabled,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <>
      <button className={className ? `vote-button ${className}` : "vote-button"} type="submit" disabled={disabled || pending}>
        {pending ? (
          <span className="button-loading">
            <span className="spinner" aria-hidden="true" />
            Saving...
          </span>
        ) : (
          children
        )}
      </button>
      <PageLoadingOverlay show={pending} label="Saving your attendance vote..." />
    </>
  );
}

function VoteForm({
  eventId,
  status,
  action,
  disabled,
  selected,
  children,
}: {
  eventId: string;
  status: VoteStatus;
  action: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
  selected?: boolean;
  children: ReactNode;
}) {
  const selectedClass =
    selected && status === "ATTEND"
      ? "selected-attend"
      : selected && status === "NOT_ATTEND"
        ? "selected-not-attend"
        : "";

  return (
    <form action={action}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="status" value={status} />
      <VoteSubmitButton className={selectedClass} disabled={disabled}>
        {children}
      </VoteSubmitButton>
    </form>
  );
}

export function VoteButtons({ eventId, currentStatus, action, disabled = false }: VoteButtonsProps) {
  return (
    <div className="row vote-actions">
      <VoteForm
        eventId={eventId}
        status="ATTEND"
        action={action}
        disabled={disabled}
        selected={currentStatus === "ATTEND"}
      >
        Attend
      </VoteForm>
      <VoteForm
        eventId={eventId}
        status="NOT_ATTEND"
        action={action}
        disabled={disabled}
        selected={currentStatus === "NOT_ATTEND"}
      >
        Not attend
      </VoteForm>
    </div>
  );
}

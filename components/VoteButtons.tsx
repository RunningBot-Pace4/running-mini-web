"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type VoteStatus = "ATTEND" | "NOT_ATTEND";

type VoteButtonsProps = {
  eventId: string;
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
    <button className={className} type="submit" disabled={disabled || pending}>
      {pending ? (
        <span className="button-loading">
          <span className="spinner" aria-hidden="true" />
          Saving...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function VoteForm({
  eventId,
  status,
  action,
  disabled,
  children,
  className,
}: {
  eventId: string;
  status: VoteStatus;
  action: (formData: FormData) => void | Promise<void>;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="status" value={status} />
      <VoteSubmitButton className={className} disabled={disabled}>
        {children}
      </VoteSubmitButton>
    </form>
  );
}

export function VoteButtons({ eventId, action, disabled = false }: VoteButtonsProps) {
  return (
    <div className="row vote-actions">
      <VoteForm eventId={eventId} status="ATTEND" action={action} disabled={disabled}>
        Attend
      </VoteForm>
      <VoteForm eventId={eventId} status="NOT_ATTEND" action={action} disabled={disabled} className="ghost">
        Not attend
      </VoteForm>
    </div>
  );
}

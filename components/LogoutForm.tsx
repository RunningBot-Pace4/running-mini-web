"use client";

import type { ReactNode } from "react";
import { FormSubmitButton } from "@/components/FormSubmitButton";

export function LogoutForm({
  action,
  className = "ghost nav-button",
  pendingLabel = "Logging out...",
  children = "Logout",
}: {
  action: () => Promise<void>;
  className?: string;
  pendingLabel?: string;
  children?: ReactNode;
}) {
  return (
    <form action={action} className="logout-form">
      <FormSubmitButton className={className} pendingLabel={pendingLabel}>
        {children}
      </FormSubmitButton>
    </form>
  );
}

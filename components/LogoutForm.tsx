"use client";

import { FormSubmitButton } from "@/components/FormSubmitButton";

export function LogoutForm({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <FormSubmitButton className="ghost nav-button" pendingLabel="Logging out...">
        Logout
      </FormSubmitButton>
    </form>
  );
}

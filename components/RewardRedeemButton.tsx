"use client";

import { useActionState } from "react";
import { FormSubmitButton } from "@/components/FormSubmitButton";

type State = { error?: string; success?: string } | undefined;

export function RewardRedeemButton({
  rewardId,
  disabled,
  action,
}: {
  rewardId: string;
  disabled?: boolean;
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form className="reward-redeem-action" action={formAction}>
      <input type="hidden" name="rewardId" value={rewardId} />
      <FormSubmitButton disabled={disabled} pendingLabel="Submitting redemption...">
        Redeem now
      </FormSubmitButton>
      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success-text">{state.success}</p>}
    </form>
  );
}

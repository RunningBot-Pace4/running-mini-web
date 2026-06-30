"use client";

import { useActionState } from "react";
import type { CSSProperties } from "react";
import { FormSubmitButton } from "@/components/FormSubmitButton";
import type { MemberTier } from "@/lib/member-progress";

type State = { error?: string; success?: string } | undefined;

export function TierBenefitsForm({
  tiers,
  action,
}: {
  tiers: MemberTier[];
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form className="tier-benefits-form" action={formAction}>
      <div className="tier-benefit-admin-grid">
        {tiers.map((tier) => (
          <article className="tier-benefit-editor" key={tier.key}>
            <input type="hidden" name={`${tier.key}_tier`} value={tier.key} />
            <div className="tier-benefit-editor-head">
              <span className="tier-benefit-dot" style={{ "--tier-color": tier.color } as CSSProperties}>{tier.emoji}</span>
              <div>
                <strong>{tier.name}</strong>
                <small>Member tier benefit setup</small>
              </div>
            </div>

            <div className="grid grid-2">
              <div>
                <label htmlFor={`${tier.key}_minPoints`}>Minimum points</label>
                <input id={`${tier.key}_minPoints`} name={`${tier.key}_minPoints`} type="number" min="0" step="1" defaultValue={tier.minPoints} required />
              </div>
              <div>
                <label htmlFor={`${tier.key}_discount`}>Benefit / discount label</label>
                <input id={`${tier.key}_discount`} name={`${tier.key}_discount`} defaultValue={tier.discount} maxLength={120} required />
              </div>
            </div>

            <div>
              <label htmlFor={`${tier.key}_benefit`}>What this tier unlocks</label>
              <textarea id={`${tier.key}_benefit`} name={`${tier.key}_benefit`} rows={3} defaultValue={tier.benefit} maxLength={500} required />
            </div>
          </article>
        ))}
      </div>

      <p className="muted">Rewards can also set a minimum tier from Admin → Create/Edit reward. This section controls the public tier benefits and point thresholds.</p>
      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success-text">{state.success}</p>}
      <FormSubmitButton pendingLabel="Saving tier benefits...">Save tier benefits</FormSubmitButton>
    </form>
  );
}

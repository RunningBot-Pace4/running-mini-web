"use client";

import { useActionState } from "react";
import { FormSubmitButton } from "@/components/FormSubmitButton";

type Reward = {
  id?: string;
  name?: string;
  type?: "ITEM" | "VOUCHER";
  description?: string | null;
  costPoints?: number;
  stockQuantity?: number | null;
  voucherCode?: string | null;
  isActive?: boolean;
};

type State = { error?: string; success?: string } | undefined;

export function RewardForm({
  reward,
  action,
}: {
  reward?: Reward;
  action: (state: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const isEdit = Boolean(reward?.id);

  return (
    <form className="form-stack reward-form" action={formAction}>
      {reward?.id && <input type="hidden" name="rewardId" value={reward.id} />}

      <div className="grid grid-2">
        <div>
          <label htmlFor={isEdit ? `rewardName-${reward?.id}` : "rewardName"}>Reward name</label>
          <input
            id={isEdit ? `rewardName-${reward?.id}` : "rewardName"}
            name="name"
            defaultValue={reward?.name || ""}
            placeholder="Example: Finisher tee / RM10 voucher"
            required
          />
        </div>
        <div>
          <label htmlFor={isEdit ? `rewardType-${reward?.id}` : "rewardType"}>Type</label>
          <select id={isEdit ? `rewardType-${reward?.id}` : "rewardType"} name="type" defaultValue={reward?.type || "ITEM"}>
            <option value="ITEM">Item</option>
            <option value="VOUCHER">Voucher</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={isEdit ? `rewardDescription-${reward?.id}` : "rewardDescription"}>Description</label>
        <textarea
          id={isEdit ? `rewardDescription-${reward?.id}` : "rewardDescription"}
          name="description"
          rows={3}
          defaultValue={reward?.description || ""}
          placeholder="Short details members should know before redeeming."
        />
      </div>

      <div className="grid grid-3">
        <div>
          <label htmlFor={isEdit ? `rewardCost-${reward?.id}` : "rewardCost"}>Points required</label>
          <input
            id={isEdit ? `rewardCost-${reward?.id}` : "rewardCost"}
            name="costPoints"
            type="number"
            min="1"
            step="1"
            defaultValue={reward?.costPoints || 50}
            required
          />
        </div>
        <div>
          <label htmlFor={isEdit ? `rewardStock-${reward?.id}` : "rewardStock"}>Stock</label>
          <input
            id={isEdit ? `rewardStock-${reward?.id}` : "rewardStock"}
            name="stockQuantity"
            type="number"
            min="0"
            step="1"
            defaultValue={reward?.stockQuantity ?? ""}
            placeholder="Blank = unlimited"
          />
        </div>
        <div>
          <label htmlFor={isEdit ? `rewardVoucher-${reward?.id}` : "rewardVoucher"}>Voucher code / note</label>
          <input
            id={isEdit ? `rewardVoucher-${reward?.id}` : "rewardVoucher"}
            name="voucherCode"
            defaultValue={reward?.voucherCode || ""}
            placeholder="Optional admin note"
          />
        </div>
      </div>

      <label className="checkbox-row compact-checkbox">
        <input name="isActive" type="checkbox" defaultChecked={reward?.isActive ?? true} />
        <span>Show this reward to members</span>
      </label>

      {state?.error && <p className="error">{state.error}</p>}
      {state?.success && <p className="success-text">{state.success}</p>}

      <FormSubmitButton pendingLabel={isEdit ? "Updating reward..." : "Creating reward..."}>
        {isEdit ? "Save reward" : "Create reward"}
      </FormSubmitButton>
    </form>
  );
}

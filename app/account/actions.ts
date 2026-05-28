"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/password";

type ChangePasswordState =
  | {
      error?: string;
      success?: string;
    }
  | undefined;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters.").max(120),
    confirmPassword: z.string().min(8, "Please confirm the new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password do not match.",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please login again before changing your password." };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Please check your password details.",
    };
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true },
  });

  if (!fullUser) return { error: "User account was not found. Please login again." };

  const currentPasswordOk = await verifyPassword(parsed.data.currentPassword, fullUser.passwordHash);
  if (!currentPasswordOk) {
    return { error: "Current password is incorrect." };
  }

  const sameAsOld = await verifyPassword(parsed.data.newPassword, fullUser.passwordHash);
  if (sameAsOld) {
    return { error: "New password must be different from your current password." };
  }

  await prisma.user.update({
    where: { id: fullUser.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  revalidatePath("/account");
  return { success: "Password changed successfully. Please use your new password next time you login." };
}

"use server";

import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const RESET_TOKEN_MINUTES = 60;

type ForgotState = { error?: string; success?: string; resetUrl?: string } | undefined;
type ResetState = { error?: string; success?: string } | undefined;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function appUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey || !from) return false;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Reset your Run Mini password",
      html: `
        <p>Hello,</p>
        <p>Click the button below to reset your Run Mini password. This link expires in ${RESET_TOKEN_MINUTES} minutes.</p>
        <p><a href="${resetUrl}">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Password reset email failed: ${response.status}`);
  }

  return true;
}

const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export async function requestPasswordResetAction(_: ForgotState, formData: FormData): Promise<ForgotState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) return { error: "Please enter a valid email address." };

  const genericSuccess = "If the email exists, a password reset link has been created.";
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (!user) return { success: genericSuccess };

  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const emailSent = await sendPasswordResetEmail(user.email, resetUrl);

  const canShowResetLink =
    process.env.NODE_ENV !== "production" || process.env.SHOW_RESET_LINK === "true";

  return {
    success: emailSent
      ? "Password reset email sent. Please check your inbox."
      : canShowResetLink
        ? "Email sending is not configured yet. Use the reset link below for testing."
        : "Password reset email is not configured yet. Please contact the admin.",
    resetUrl: canShowResetLink ? resetUrl : undefined,
  };
}

const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(120),
  confirmPassword: z.string().min(8).max(120),
});

export async function resetPasswordAction(_: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) return { error: "Please enter a valid new password with at least 8 characters." };
  if (parsed.data.password !== parsed.data.confirmPassword) return { error: "Passwords do not match." };

  const tokenHash = hashToken(parsed.data.token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { error: "This reset link is invalid or expired." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.session.deleteMany({
      where: { userId: resetToken.userId },
    }),
  ]);

  return { success: "Password updated. You can now login with your new password." };
}

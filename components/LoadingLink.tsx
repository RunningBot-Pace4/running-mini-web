"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type LoadingLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  loadingLabel?: string;
};

export function LoadingLink({ children, loadingLabel: _loadingLabel, ...props }: LoadingLinkProps) {
  return <Link {...props}>{children}</Link>;
}

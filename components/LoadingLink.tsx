"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";

type LoadingLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  loadingLabel?: string;
};

function shouldSkipLoading(event: MouseEvent<HTMLAnchorElement>, href: LoadingLinkProps["href"]) {
  if (event.defaultPrevented) return true;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return true;
  if (event.currentTarget.target && event.currentTarget.target !== "_self") return true;
  if (typeof href === "string" && href.startsWith("#")) return true;
  return false;
}

export function LoadingLink({ children, loadingLabel = "Opening...", onClick, href, ...props }: LoadingLinkProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setLoading(false), 3500);
    return () => window.clearTimeout(timer);
  }, [loading]);

  return (
    <>
      <Link
        {...props}
        href={href}
        aria-busy={loading || undefined}
        onClick={(event) => {
          onClick?.(event);
          if (!shouldSkipLoading(event, href)) setLoading(true);
        }}
      >
        {children}
      </Link>
      <PageLoadingOverlay show={loading} label={loadingLabel} />
    </>
  );
}

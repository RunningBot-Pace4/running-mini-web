"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";

type LoadingLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  loadingLabel?: string;
};

function isModifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export function LoadingLink({ children, loadingLabel = "Loading...", onClick, href, ...props }: LoadingLinkProps) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  return (
    <>
      <Link
        {...props}
        href={href}
        aria-busy={loading || undefined}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented || isModifiedClick(event) || props.target === "_blank") return;

          const hrefString = typeof href === "string" ? href : href.pathname || "";
          if (hrefString && hrefString !== pathname) setLoading(true);
        }}
      >
        {children}
      </Link>
      <PageLoadingOverlay show={loading} label={loadingLabel} />
    </>
  );
}

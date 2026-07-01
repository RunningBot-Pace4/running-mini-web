"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";

type LoadingLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  loadingLabel?: string;
};

function hrefToString(href: ComponentProps<typeof Link>["href"]) {
  if (typeof href === "string") return href;
  return href.pathname || "";
}

export function LoadingLink({ children, loadingLabel = "Loading...", onClick, target, href, ...props }: LoadingLinkProps) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const hrefString = useMemo(() => hrefToString(href), [href]);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading) return;
    const timeout = window.setTimeout(() => setLoading(false), 7000);
    return () => window.clearTimeout(timeout);
  }, [loading]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0 ||
      target === "_blank" ||
      hrefString.startsWith("#")
    ) {
      return;
    }

    setLoading(true);
  }

  return (
    <>
      <Link href={href} target={target} onClick={handleClick} {...props}>
        {children}
      </Link>
      <PageLoadingOverlay show={loading} label={loadingLabel} />
    </>
  );
}

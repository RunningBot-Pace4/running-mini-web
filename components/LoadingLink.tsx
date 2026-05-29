"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PageLoadingOverlay } from "@/components/PageLoadingOverlay";

type LoadingLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  loadingLabel?: string;
};

function hrefToString(href: LoadingLinkProps["href"]) {
  if (typeof href === "string") return href;

  const pathname = href.pathname || "";
  const query = href.query
    ? `?${new URLSearchParams(
        Object.entries(href.query).reduce<Record<string, string>>((acc, [key, value]) => {
          if (value === undefined) return acc;
          acc[key] = Array.isArray(value) ? value.join(",") : String(value);
          return acc;
        }, {}),
      ).toString()}`
    : "";
  const hash = href.hash ? `#${href.hash}` : "";

  return `${pathname}${query}${hash}`;
}

function isSameRoute(targetHref: string, currentPath: string, currentSearch: string) {
  if (!targetHref || targetHref.startsWith("#")) return true;
  if (/^(mailto:|tel:|https?:\/\/)/i.test(targetHref)) return false;

  try {
    const target = new URL(targetHref, window.location.origin);
    const current = new URL(`${currentPath}${currentSearch ? `?${currentSearch}` : ""}`, window.location.origin);

    return (
      target.pathname === current.pathname &&
      target.search === current.search &&
      // Hash-only movement should feel instant and should not freeze the page.
      (target.hash === "" || target.hash === window.location.hash)
    );
  } catch {
    return false;
  }
}

export function LoadingLink({
  children,
  className,
  loadingLabel = "Loading...",
  onClick,
  ...props
}: LoadingLinkProps) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  // Root layout links stay mounted between pages. Reset the overlay after route changes.
  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  // Safety fallback: never leave users stuck if a navigation is cancelled or blocked.
  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setLoading(false), 9000);
    return () => window.clearTimeout(timer);
  }, [loading]);

  return (
    <>
      <Link
        {...props}
        className={className}
        onClick={(event) => {
          onClick?.(event);

          const hrefValue = hrefToString(props.href);
          if (
            event.defaultPrevented ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            event.button !== 0 ||
            isSameRoute(hrefValue, pathname, window.location.search.replace(/^\?/, ""))
          ) {
            return;
          }

          setLoading(true);
        }}
      >
        {loading ? (
          <span className="button-loading">
            <span className="spinner" aria-hidden="true" />
            {loadingLabel}
          </span>
        ) : (
          children
        )}
      </Link>
      <PageLoadingOverlay show={loading} label={loadingLabel} />
    </>
  );
}

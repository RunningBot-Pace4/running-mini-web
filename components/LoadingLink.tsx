"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";

type LoadingLinkProps = ComponentProps<typeof Link> & {
  children: ReactNode;
  loadingLabel?: string;
};

export function LoadingLink({
  children,
  className,
  loadingLabel = "Loading...",
  onClick,
  ...props
}: LoadingLinkProps) {
  const [loading, setLoading] = useState(false);

  return (
    <Link
      {...props}
      className={className}
      onClick={(event) => {
        onClick?.(event);
        const hrefValue = typeof props.href === "string" ? props.href : "";
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0 ||
          hrefValue.startsWith("#")
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
  );
}

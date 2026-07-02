"use client";

import { useEffect, useRef, useState } from "react";
import { LoadingLink } from "@/components/LoadingLink";
import { LogoutForm } from "@/components/LogoutForm";

export function AccountMenu({
  name,
  role,
  logoutAction,
}: {
  name: string;
  role: "ADMIN" | "USER";
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "👤";

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="account-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="account-menu-avatar" aria-hidden="true">{initials}</span>
        <span className="account-menu-name">{name}</span>
      </button>

      {open && (
        <div className="account-menu-panel" role="menu">
          <div className="account-menu-user">
            <strong>{name}</strong>
            <small>{role === "ADMIN" ? "Administrator" : "Member"}</small>
          </div>
          <LoadingLink href="/account" role="menuitem" onClick={() => setOpen(false)}>
            My account
          </LoadingLink>
          <LogoutForm action={logoutAction} pendingLabel="Logging out..." />
        </div>
      )}
    </div>
  );
}

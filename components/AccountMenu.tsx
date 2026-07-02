"use client";

import { useEffect, useRef, useState } from "react";
import { LoadingLink } from "@/components/LoadingLink";
import { LogoutForm } from "@/components/LogoutForm";

type AccountMenuProps = {
  name: string;
  role: string;
  action: () => Promise<void>;
};

export function AccountMenu({ name, role, action }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initials = name.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <>
      {open && <button className="account-menu-backdrop" aria-label="Close account menu" onClick={() => setOpen(false)} type="button" />}
      <div className={open ? "account-menu is-open" : "account-menu"} ref={menuRef}>
        <button
          className="account-menu-trigger"
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="account-menu-avatar">{initials}</span>
          <span className="account-menu-name">{name}</span>
        </button>

        {open && (
          <div className="account-menu-panel" role="menu">
            <div className="account-menu-card-head">
              <span className="account-menu-avatar small">{initials}</span>
              <div>
                <strong>{name}</strong>
                <small>{role === "ADMIN" ? "Administrator" : "Member"}</small>
              </div>
            </div>
            <LoadingLink href="/account" role="menuitem" onClick={() => setOpen(false)}>
              My account
            </LoadingLink>
            <LogoutForm action={action} pendingLabel="Logging out..." />
          </div>
        )}
      </div>
    </>
  );
}

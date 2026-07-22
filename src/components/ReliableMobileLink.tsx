"use client";

import type { AnchorHTMLAttributes, TouchEvent } from "react";
import { useRef } from "react";

const TAP_MOVEMENT_TOLERANCE = 12;

type ReliableMobileLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

export default function ReliableMobileLink({
  href,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  children,
  ...props
}: ReliableMobileLinkProps) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchMoved = useRef(false);

  function handleTouchStart(event: TouchEvent<HTMLAnchorElement>) {
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    touchMoved.current = false;
    onTouchStart?.(event);
  }

  function handleTouchMove(event: TouchEvent<HTMLAnchorElement>) {
    const start = touchStart.current;
    const touch = event.touches[0];

    if (
      start &&
      touch &&
      (Math.abs(touch.clientX - start.x) > TAP_MOVEMENT_TOLERANCE ||
        Math.abs(touch.clientY - start.y) > TAP_MOVEMENT_TOLERANCE)
    ) {
      touchMoved.current = true;
    }

    onTouchMove?.(event);
  }

  function handleTouchEnd(event: TouchEvent<HTMLAnchorElement>) {
    onTouchEnd?.(event);

    if (event.defaultPrevented || touchMoved.current || !touchStart.current) {
      touchStart.current = null;
      return;
    }

    event.preventDefault();
    touchStart.current = null;
    window.location.assign(href);
  }

  return (
    <a
      {...props}
      href={href}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </a>
  );
}

"use client";

import type { ButtonHTMLAttributes, MouseEvent, TouchEvent } from "react";
import { useEffect, useRef } from "react";

const TAP_MOVEMENT_TOLERANCE = 12;
const STATIONARY_TOUCH_DELAY_MS = 250;

type ReliableMobileLinkProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  href: string;
};

export default function ReliableMobileLink({
  href,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onClick,
  children,
  ...props
}: ReliableMobileLinkProps) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchMoved = useRef(false);
  const navigationStarted = useRef(false);
  const stationaryTouchTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (stationaryTouchTimer.current !== null) {
        window.clearTimeout(stationaryTouchTimer.current);
      }
    };
  }, []);

  function clearStationaryTouchTimer() {
    if (stationaryTouchTimer.current === null) return;
    window.clearTimeout(stationaryTouchTimer.current);
    stationaryTouchTimer.current = null;
  }

  function navigate() {
    if (navigationStarted.current) return;
    navigationStarted.current = true;
    clearStationaryTouchTimer();
    window.location.assign(href);
  }

  function handleTouchStart(event: TouchEvent<HTMLButtonElement>) {
    clearStationaryTouchTimer();
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    touchMoved.current = false;
    navigationStarted.current = false;

    if (touchStart.current) {
      stationaryTouchTimer.current = window.setTimeout(() => {
        if (!touchMoved.current && touchStart.current) navigate();
      }, STATIONARY_TOUCH_DELAY_MS);
    }

    onTouchStart?.(event);
  }

  function handleTouchMove(event: TouchEvent<HTMLButtonElement>) {
    const start = touchStart.current;
    const touch = event.touches[0];

    if (
      start &&
      touch &&
      (Math.abs(touch.clientX - start.x) > TAP_MOVEMENT_TOLERANCE ||
        Math.abs(touch.clientY - start.y) > TAP_MOVEMENT_TOLERANCE)
    ) {
      touchMoved.current = true;
      touchStart.current = null;
      clearStationaryTouchTimer();
    }

    onTouchMove?.(event);
  }

  function handleTouchEnd(event: TouchEvent<HTMLButtonElement>) {
    onTouchEnd?.(event);

    if (event.defaultPrevented || touchMoved.current || !touchStart.current) {
      clearStationaryTouchTimer();
      touchStart.current = null;
      return;
    }

    event.preventDefault();
    touchStart.current = null;
    navigate();
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (!event.defaultPrevented) navigate();
  }

  return (
    <button
      {...props}
      type="button"
      role="link"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </button>
  );
}

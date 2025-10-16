"use client";

import { useEffect, useRef } from "react";

interface LiveAnnouncerProps {
  message: string;
  priority?: "polite" | "assertive";
  clearDelay?: number;
}

/**
 * LiveAnnouncer - Announces messages to screen readers
 * Useful for dynamic content updates that screen readers need to be aware of
 */
export function LiveAnnouncer({
  message,
  priority = "polite",
  clearDelay = 5000,
}: LiveAnnouncerProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!message || !regionRef.current) return;

    // Clear and reset to trigger announcement
    regionRef.current.textContent = "";
    setTimeout(() => {
      if (regionRef.current) {
        regionRef.current.textContent = message;
      }
    }, 100);

    // Clear after delay
    const timer = setTimeout(() => {
      if (regionRef.current) {
        regionRef.current.textContent = "";
      }
    }, clearDelay);

    return () => clearTimeout(timer);
  }, [message, clearDelay]);

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    />
  );
}

/**
 * VisuallyHidden - Hides content visually but keeps it available to screen readers
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

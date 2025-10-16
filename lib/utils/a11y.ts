/**
 * Accessibility utilities for screen readers and keyboard navigation
 */

/**
 * Announces a message to screen readers using an ARIA live region
 * @param message The message to announce
 * @param priority The priority level: "polite" (default) or "assertive"
 */
export function announce(
  message: string,
  priority: "polite" | "assertive" = "polite",
): void {
  const id = `sr-announcement-${priority}`;
  let liveRegion = document.getElementById(id);

  if (!liveRegion) {
    liveRegion = document.createElement("div");
    liveRegion.id = id;
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", priority);
    liveRegion.setAttribute("aria-atomic", "true");
    liveRegion.className = "sr-only";
    document.body.appendChild(liveRegion);
  }

  // Clear and set the message to trigger the announcement
  liveRegion.textContent = "";
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 100);

  // Clear after announcement
  setTimeout(() => {
    liveRegion.textContent = "";
  }, 5000);
}

/**
 * Creates a unique ID for accessibility attributes
 * @param prefix Optional prefix for the ID
 * @returns A unique ID string
 */
export function generateAriaId(prefix = "a11y"): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Moves focus to an element by ID
 * @param elementId The ID of the element to focus
 */
export function moveFocusToElement(elementId: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.focus();
  }
}

/**
 * Traps focus within a container (useful for modals/dialogs)
 * @param container The container element
 * @returns A cleanup function to remove the trap
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  };

  container.addEventListener("keydown", handleTabKey);

  // Focus first element
  firstFocusable?.focus();

  return () => {
    container.removeEventListener("keydown", handleTabKey);
  };
}

/**
 * Returns keyboard event helpers for common patterns
 */
export const keyboard = {
  /**
   * Checks if Enter or Space was pressed (activation keys)
   */
  isActivationKey: (e: KeyboardEvent): boolean => {
    return e.key === "Enter" || e.key === " ";
  },

  /**
   * Checks if Escape was pressed
   */
  isEscapeKey: (e: KeyboardEvent): boolean => {
    return e.key === "Escape" || e.key === "Esc";
  },

  /**
   * Handles activating a button-like element with keyboard
   */
  handleActivation: (e: KeyboardEvent, callback: () => void): void => {
    if (keyboard.isActivationKey(e)) {
      e.preventDefault();
      callback();
    }
  },
};

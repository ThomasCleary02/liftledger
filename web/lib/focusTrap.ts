const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
  );
}

/** Keep Tab cycling inside `root`. Call from a keydown listener on the document or root. */
export function trapFocusKeydown(event: KeyboardEvent, root: HTMLElement) {
  if (event.key !== "Tab") return;
  const focusable = getFocusableElements(root);
  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (event.shiftKey) {
    if (!active || active === first || !root.contains(active)) {
      event.preventDefault();
      last.focus();
    }
  } else if (!active || active === last || !root.contains(active)) {
    event.preventDefault();
    first.focus();
  }
}

export function focusInitial(root: HTMLElement, preferSelector?: string) {
  const preferred = preferSelector
    ? root.querySelector<HTMLElement>(preferSelector)
    : null;
  if (preferred) {
    preferred.focus();
    return;
  }
  const focusable = getFocusableElements(root);
  focusable[0]?.focus();
}

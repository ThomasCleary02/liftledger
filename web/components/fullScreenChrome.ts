let lockCount = 0;
let savedScrollY = 0;

/** Hide the tab bar and freeze background scroll while a full-screen sheet is open. */
export function lockFullScreenChrome() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    root.classList.add("add-modal-open");
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${savedScrollY}px`;
    body.style.width = "100%";
  }
  lockCount += 1;
  window.visualViewport?.dispatchEvent(new Event("resize"));
}

export function unlockFullScreenChrome() {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;
  const body = document.body;
  document.documentElement.classList.remove("add-modal-open");
  body.style.overflow = "";
  body.style.position = "";
  body.style.top = "";
  body.style.width = "";
  window.scrollTo(0, savedScrollY);
  window.visualViewport?.dispatchEvent(new Event("resize"));
}

export function resetFullScreenChromeForTests() {
  lockCount = 0;
  savedScrollY = 0;
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("add-modal-open");
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
}

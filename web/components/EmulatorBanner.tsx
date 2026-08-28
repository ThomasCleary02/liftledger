import { EMULATOR_UI_URL, shouldUseFirebaseEmulators } from "../lib/firebaseEmulators";

export function EmulatorBanner() {
  if (!shouldUseFirebaseEmulators()) return null;

  return (
    <div className="bg-amber-400 px-3 py-1 text-center text-xs font-medium text-black">
      Local emulators — data stays on this machine.{" "}
      <a
        href={EMULATOR_UI_URL}
        className="underline underline-offset-2"
        target="_blank"
        rel="noreferrer"
      >
        Emulator UI
      </a>
    </div>
  );
}

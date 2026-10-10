/** Single source of hex tokens for medal faces (UI grid + share PNG canvas). */

export type MedalTier = 1 | 2 | 3 | 4 | 5;

export type MedalTierHex = {
  /** Top of face gradient */
  face: string;
  /** Mid stop */
  faceMid: string;
  /** Bottom of face gradient */
  faceDeep: string;
  /** Ring / rim accent */
  rim: string;
  /** Icon / label text on the face */
  text: string;
  /** Accent for pills / highlights */
  accent: string;
};

/**
 * Vibrant, contrasting metals:
 * Bronze copper · Silver cool steel · Gold high-chroma · Platinum white+teal · Diamond ice→sapphire
 */
export const MEDAL_TIER_HEX: Record<MedalTier, MedalTierHex> = {
  1: {
    face: "#e8953a",
    faceMid: "#c46a1a",
    faceDeep: "#6b3510",
    rim: "#5c2e0a",
    text: "#fff8eb",
    accent: "#e8953a",
  },
  2: {
    face: "#f0f5fa",
    faceMid: "#a8b8c8",
    faceDeep: "#4a5d72",
    rim: "#3d4f63",
    text: "#0f172a",
    accent: "#8aa0b5",
  },
  3: {
    face: "#ffe566",
    faceMid: "#f5b800",
    faceDeep: "#b8860b",
    rim: "#8a6500",
    text: "#3f2a08",
    accent: "#ffd700",
  },
  4: {
    face: "#f5fffe",
    faceMid: "#b8e8e0",
    faceDeep: "#3d9a8f",
    rim: "#14b8a6",
    text: "#0a2f2c",
    accent: "#2dd4bf",
  },
  5: {
    face: "#a5f3fc",
    faceMid: "#22d3ee",
    faceDeep: "#1e3a8a",
    rim: "#06b6d4",
    text: "#ecfeff",
    accent: "#22d3ee",
  },
};

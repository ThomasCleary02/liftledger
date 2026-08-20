// UnitSystem type is imported from preferences to avoid duplicate exports
// Note: UnitSystem should be imported from @liftledger/shared or @liftledger/shared/preferences
import type { UnitSystem } from "../preferences";

/**
 * Convert weight from stored value (always in lbs) to display unit
 */
export function formatWeight(weight: number, unitSystem: UnitSystem): string {
  if (unitSystem === "metric") {
    const kg = weight * 0.453592;
    return `${kg.toFixed(1)} kg`;
  }
  return `${weight.toFixed(0)} lb`;
}

/**
 * Convert distance from stored value (always in miles) to display unit
 */
export function formatDistance(distance: number, unitSystem: UnitSystem): string {
  if (unitSystem === "metric") {
    const km = distance * 1.60934;
    return `${km.toFixed(2)} km`;
  }
  return `${distance.toFixed(2)} mi`;
}

/**
 * Get weight unit label
 */
export function getWeightUnit(unitSystem: UnitSystem): string {
  return unitSystem === "metric" ? "kg" : "lb";
}

/**
 * Get distance unit label
 */
export function getDistanceUnit(unitSystem: UnitSystem): string {
  return unitSystem === "metric" ? "km" : "mi";
}

const KG_PER_LB = 0.453592;
const KM_PER_MILE = 1.60934;

function trimNumber(value: number, decimals: number): string {
  const rounded = Number(value.toFixed(decimals));
  return String(rounded);
}

/** Convert a number typed in the user's unit into stored pounds. */
export function toStoredWeight(display: number, unitSystem: UnitSystem): number {
  if (!isFinite(display)) return display;
  return unitSystem === "metric" ? display / KG_PER_LB : display;
}

/** Convert stored pounds into the user's unit for form fields. */
export function toDisplayWeight(storedLbs: number, unitSystem: UnitSystem): number {
  if (!isFinite(storedLbs)) return storedLbs;
  return unitSystem === "metric" ? storedLbs * KG_PER_LB : storedLbs;
}

export function formatWeightInput(storedLbs: number, unitSystem: UnitSystem): string {
  const display = toDisplayWeight(storedLbs, unitSystem);
  return unitSystem === "metric" ? trimNumber(display, 1) : String(Math.round(display));
}

/** Convert a number typed in the user's unit into stored miles. */
export function toStoredDistance(display: number, unitSystem: UnitSystem): number {
  if (!isFinite(display)) return display;
  return unitSystem === "metric" ? display / KM_PER_MILE : display;
}

/** Convert stored miles into the user's unit for form fields. */
export function toDisplayDistance(storedMiles: number, unitSystem: UnitSystem): number {
  if (!isFinite(storedMiles)) return storedMiles;
  return unitSystem === "metric" ? storedMiles * KM_PER_MILE : storedMiles;
}

export function formatDistanceInput(storedMiles: number, unitSystem: UnitSystem): string {
  return trimNumber(toDisplayDistance(storedMiles, unitSystem), 2);
}

export function formatCardioDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return "0m";
  const totalMins = Math.round(seconds / 60);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

/** `secondsPerMile` is always stored against miles. Convert for metric display. */
export function formatPace(secondsPerMile: number, unitSystem: UnitSystem): string {
  if (!isFinite(secondsPerMile) || secondsPerMile <= 0) return "—";
  const seconds = unitSystem === "metric" ? secondsPerMile / 1.60934 : secondsPerMile;
  let mins = Math.floor(seconds / 60);
  let secs = Math.round(seconds % 60);
  if (secs === 60) {
    mins += 1;
    secs = 0;
  }
  const unit = unitSystem === "metric" ? "km" : "mi";
  return `${mins}:${secs.toString().padStart(2, "0")}/${unit}`;
}

/** `mph` is always stored against miles. Convert for metric display. */
export function formatSpeed(mph: number, unitSystem: UnitSystem): string {
  if (!isFinite(mph) || mph <= 0) return "—";
  if (unitSystem === "metric") {
    return `${(mph * 1.60934).toFixed(1)} km/h`;
  }
  return `${mph.toFixed(1)} mph`;
}

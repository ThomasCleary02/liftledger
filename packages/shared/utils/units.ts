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

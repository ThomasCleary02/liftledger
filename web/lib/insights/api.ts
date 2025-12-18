/**
 * Re-export insights API from shared package
 * 
 * @deprecated Use @liftledger/shared instead
 * This file is kept for backward compatibility.
 */

export type {
  ProgressPoint,
  ProgressRequest,
  ProgressInsight,
} from "@liftledger/shared";

export { fetchProgressInsight } from "@liftledger/shared";


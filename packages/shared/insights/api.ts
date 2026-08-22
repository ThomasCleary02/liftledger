import { format, parseISO, isValid } from "date-fns";

export interface ProgressPoint {
  date: string; // ISO 8601 or YYYY-MM-DD
  value: number;
}

export interface ProgressRequest {
  exercise: string;
  metric: string;
  history: ProgressPoint[];
}

export interface ProgressInsight {
  isNewPR: boolean;
  delta: number;
  percentChange: number;
  firstDate: string;
  latestDate: string;
  insightText: string;
}

function monthName(dateStr: string): string {
  const parsed = parseISO(dateStr);
  if (!isValid(parsed)) return dateStr;
  return format(parsed, "MMMM");
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Port of LiftLedger.Services.InsightsService.AnalyzeProgress.
 * Runs on the client; no network.
 */
export function analyzeProgress(request: ProgressRequest): ProgressInsight {
  if (!request.exercise || !request.metric || !Array.isArray(request.history)) {
    throw new Error("Invalid request: exercise, metric, and history are required");
  }
  if (request.history.length === 0) {
    throw new Error("Invalid request: history array cannot be empty");
  }

  const sortedHistory = [...request.history].sort((a, b) => a.date.localeCompare(b.date));

  if (sortedHistory.length === 1) {
    const point = sortedHistory[0];
    return {
      isNewPR: false,
      delta: 0,
      percentChange: 0,
      firstDate: point.date,
      latestDate: point.date,
      insightText: `First logged ${request.exercise}: ${point.value} ${request.metric}.`,
    };
  }

  const first = sortedHistory[0];
  const latest = sortedHistory[sortedHistory.length - 1];
  const delta = latest.value - first.value;
  const percentChange = first.value > 0 ? (delta / first.value) * 100 : 0;
  const previousValues = sortedHistory.slice(0, -1).map((p) => p.value);
  const isNewPR =
    previousValues.length === 0 || latest.value > Math.max(...previousValues);

  const allValuesSame = sortedHistory.every(
    (h) => Math.abs(h.value - first.value) < 0.001
  );

  let insightText: string;
  if (delta === 0 && sortedHistory.length <= 3 && allValuesSame) {
    insightText = "Keep logging to see your progress!";
  } else if (isNewPR && sortedHistory.length > 1) {
    insightText = `New PR! You hit ${latest.value} ${request.metric} on ${request.exercise}.`;
  } else if (delta > 0) {
    insightText = `You've increased your ${request.exercise} by ${delta} ${request.metric} since ${monthName(first.date)}`;
  } else if (delta === 0) {
    insightText = `Your ${request.exercise} has stayed consistent since ${monthName(first.date)}`;
  } else {
    insightText = `Your ${request.exercise} is down ${Math.abs(delta)} ${request.metric} since ${monthName(first.date)}`;
  }

  return {
    isNewPR,
    delta,
    percentChange: round1(percentChange),
    firstDate: first.date,
    latestDate: latest.date,
    insightText,
  };
}

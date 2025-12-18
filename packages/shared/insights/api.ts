/**
 * LiftLedger Insights API Client
 * 
 * Fetches progress insights from the LiftLedger Insights Service.
 * Insights are stateless, calculated in real-time, and returned as JSON.
 * 
 * Platform-agnostic implementation using standard fetch API.
 */

export interface ProgressPoint {
  date: string; // ISO 8601 format, e.g., "2025-03-16"
  value: number; // Numeric value of the exercise metric
}

export interface ProgressRequest {
  exercise: string; // Exercise name, e.g., "Bench Press"
  metric: string; // Metric name, e.g., "weight", "reps"
  history: ProgressPoint[]; // Array of historical logs for this exercise
}

export interface ProgressInsight {
  isNewPR: boolean; // True if latest log is a personal record
  delta: number; // LatestValue - FirstValue
  percentChange: number; // Percentage change from first to latest
  firstDate: string; // Date of first logged point
  latestDate: string; // Date of latest logged point
  insightText: string; // Human-readable insight message
}

const INSIGHTS_API_URL =
  "https://liftledgerservices-e2bcfshcf6frfycb.centralus-01.azurewebsites.net/api/insights/progress";

const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Fetch progress insight for an exercise
 * 
 * @param request - Progress request with exercise name, metric, and history
 * @returns Promise resolving to progress insight
 * @throws Error on network failure, timeout, or invalid response
 */
export async function fetchProgressInsight(
  request: ProgressRequest
): Promise<ProgressInsight> {
  // Validate request
  if (!request.exercise || !request.metric || !Array.isArray(request.history)) {
    throw new Error("Invalid request: exercise, metric, and history are required");
  }

  if (request.history.length === 0) {
    throw new Error("Invalid request: history array cannot be empty");
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(INSIGHTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error(`Bad Request: ${response.statusText}`);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (
      typeof data.isNewPR !== "boolean" ||
      typeof data.delta !== "number" ||
      typeof data.percentChange !== "number" ||
      typeof data.firstDate !== "string" ||
      typeof data.latestDate !== "string" ||
      typeof data.insightText !== "string"
    ) {
      throw new Error("Invalid response structure from insights API");
    }

    return data as ProgressInsight;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout: Insights API did not respond in time");
      }
      // Handle CORS and network errors gracefully
      if (error.message.includes("Failed to fetch") || error.message.includes("CORS")) {
        throw new Error("Network error: Unable to reach insights service");
      }
      throw error;
    }

    throw new Error("Unknown error occurred while fetching insights");
  }
}


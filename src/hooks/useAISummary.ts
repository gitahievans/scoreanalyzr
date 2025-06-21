import { useState, useCallback } from 'react';
import { ScoreData, AISummaryResponse } from '@/types/analysis';

interface UseAISummaryState {
  summary: string | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseAISummaryReturn extends UseAISummaryState {
  generateSummary: (scoreData: ScoreData, retries?: number) => Promise<void>;
  resetSummary: () => void;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export const useAISummary = (): UseAISummaryReturn => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const resetSummary = useCallback(() => {
    setSummary(null);
    setIsLoading(false);
    setError(null);
  }, []);

  const generateSummary = useCallback(
    async (scoreData: ScoreData, attempt: number = 1) => {
      setIsLoading(true);
      setError(null);
      setSummary(null); // Clear previous summary before a new attempt

      console.log(`Attempt ${attempt}: Generating AI summary for score ID ${scoreData.score?.id}`);

      try {
        if (!scoreData || !scoreData.score || !scoreData.score.results) {
          throw new Error("Complete score data with analysis results is required to generate an AI summary.");
        }

        const response = await fetch('/api/generate-summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ scoreData }), // Ensure body is { scoreData: ... }
        });

        console.log(`Response status: ${response.status}`);
        const responseBody: AISummaryResponse = await response.json();
        // console.log("Response body from API:", responseBody);

        if (!response.ok) {
          const errorMessage = responseBody.error || `API request failed with status ${response.status}`;
          const errorDetails = (responseBody as any).details || 'No additional details.';
          console.error(`API Error: ${errorMessage}`, errorDetails);
          throw new Error(`${errorMessage} Details: ${typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)}`);
        }

        if (responseBody.summary) {
          setSummary(responseBody.summary);
          console.log("AI Summary fetched successfully.");
        } else {
          // This case should ideally be covered by !response.ok, but as a fallback:
          throw new Error("Received success status but no summary in response.");
        }

      } catch (err: any) {
        console.error(`Error generating summary (attempt ${attempt}):`, err);

        // Retry logic for network errors or specific server errors (e.g., 5xx)
        // For client errors (4xx), typically we don't retry as the request itself is likely flawed.
        const httpStatusCode = err.message.match(/status (\d+)/)?.[1]; //簡易的にステータスコードを抽出
        const isRetryableError = !httpStatusCode || parseInt(httpStatusCode, 10) >= 500;


        if (isRetryableError && attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
          setTimeout(() => generateSummary(scoreData, attempt + 1), delay);
          // Keep isLoading true during retry attempts
          setError(new Error(`Failed after attempt ${attempt}. Retrying... (${err.message})`)); // Show transient error
          return; // Exit current attempt, next one will be scheduled
        } else {
          // Max retries reached or non-retryable error
          setError(new Error(err.message || 'An unknown error occurred while generating the summary.'));
          setIsLoading(false); // Stop loading only after final attempt or non-retryable error
          return; // Ensure we exit
        }
      }
      // Only set isLoading to false if not retrying and no error occurred that prevented it
      // Or if it's the final error state
      if (!error && summary) { // if error is null and summary is set
         setIsLoading(false);
      } else if (error && attempt >= MAX_RETRIES) { // if there's an error and max retries hit
         setIsLoading(false);
      }
      // If an error occurred and we're not retrying, isLoading is set to false in the catch block.
      // If successful, isLoading should be set to false.
      setIsLoading(false); // General case for success or final failure.
    },
    [] // No dependencies, relies on arguments
  );

  return { summary, isLoading, error, generateSummary, resetSummary };
};

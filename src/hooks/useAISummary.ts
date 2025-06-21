import { useState, useCallback } from 'react';
import { ScoreData } from '@/types/analysis'; // ScoreData remains the input from the component
import { AISummaryResponse, AISummaryErrorResponse } from '@/types/ai-summary'; // New structured response types

interface UseAISummaryState {
  summary: AISummaryResponse | null; // Summary is now the structured object
  isLoading: boolean;
  error: Error | null; // To store error messages/objects
}

interface UseAISummaryReturn extends UseAISummaryState {
  generateSummary: (scoreData: ScoreData) => Promise<void>; // Retries are handled internally
  resetSummary: () => void;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export const useAISummary = (): UseAISummaryReturn => {
  const [summary, setSummary] = useState<AISummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const resetSummary = useCallback(() => {
    setSummary(null);
    setIsLoading(false);
    setError(null);
  }, []);

  const generateSummaryInternal = useCallback(
    async (scoreData: ScoreData, attempt: number = 1) => {
      // This internal function handles retries. The public generateSummary won't expose attempt.
      setIsLoading(true);
      if (attempt === 1) { // Clear previous state only on the first attempt of a new generation request
        setError(null);
        setSummary(null);
      }

      console.log(`Attempt ${attempt}/${MAX_RETRIES}: Generating AI summary for score ID ${scoreData.score?.id}`);

      try {
        if (!scoreData || !scoreData.score || !scoreData.score.results) {
          // This validation should ideally happen before calling, but good as a safeguard.
          throw new Error("Complete score data with analysis results is required to generate an AI summary.");
        }

        const response = await fetch('/api/ai-summary', { // Updated API endpoint
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json', // Explicitly accept JSON
          },
          body: JSON.stringify({ scoreData }),
        });

        const responseBody = await response.json();
        // console.log(`Response status: ${response.status}`, responseBody);

        if (!response.ok) {
          // Try to parse as AISummaryErrorResponse
          const apiError = responseBody as AISummaryErrorResponse;
          const errorMessage = apiError.error || `API request failed with status ${response.status}`;
          const errorDetails = apiError.details ? (typeof apiError.details === 'string' ? apiError.details : JSON.stringify(apiError.details)) : 'No additional details.';
          console.error(`API Error: ${errorMessage}`, errorDetails);
          throw new Error(`${errorMessage} - Details: ${errorDetails}`); // Include status for retry logic
        }

        // Successfully fetched and response.ok, responseBody should be AISummaryResponse
        setSummary(responseBody as AISummaryResponse);
        setError(null); // Clear any previous transient error
        setIsLoading(false);
        console.log("AI Summary fetched and parsed successfully.");

      } catch (err: any) {
        console.error(`Error generating summary (attempt ${attempt}/${MAX_RETRIES}):`, err.message);

        let isRetryable = false;
        if (err instanceof TypeError && err.message.toLowerCase().includes('failed to fetch')) {
            // Network error
            isRetryable = true;
        } else if (err.message) {
            // Check for HTTP status codes in the error message if thrown by our !response.ok logic
            const match = err.message.match(/status (\d+)/i);
            const statusCode = match ? parseInt(match[1], 10) : null;
            if (statusCode && statusCode >= 500 && statusCode <= 599) {
                isRetryable = true;
            }
        }


        if (isRetryable && attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);
          setError(new Error(`Failed after attempt ${attempt}. Retrying... (${err.message})`)); // Show transient error
          // Keep isLoading true
          setTimeout(() => generateSummaryInternal(scoreData, attempt + 1), delay);
        } else {
          // Max retries reached or non-retryable error
          setError(new Error(err.message || 'An unknown error occurred while generating the summary.'));
          setIsLoading(false);
          setSummary(null); // Ensure summary is cleared on final error
        }
      }
    },
    [] // No external dependencies for useCallback, relies on arguments
  );

  // Public function to initiate the process
  const generateSummary = useCallback((scoreData: ScoreData) => {
    generateSummaryInternal(scoreData, 1); // Start with attempt 1
  }, [generateSummaryInternal]);


  return { summary, isLoading, error, generateSummary, resetSummary };
};

import { useState, useEffect, useCallback } from "react";
import { useScoreData } from "@/contexts/ScoreDataContext";
import {
  generateSummaryFromResults,
  GenerateSummaryFromResultsOutput,
} from "@/ai/flows/generate-summary";

interface UseScoreSummaryResult {
  summary: GenerateSummaryFromResultsOutput | null;
  isGenerating: boolean;
  error: string | null;
  generateSummary: () => Promise<void>;
  canGenerate: boolean;
}

export function useScoreSummary(): UseScoreSummaryResult {
  const { scoreData, isLoading } = useScoreData();
  const [summary, setSummary] =
    useState<GenerateSummaryFromResultsOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if we can generate a summary
  const canGenerate = Boolean(
    scoreData?.score?.processed && scoreData?.score?.results && !isLoading
  );

  // Auto-generate summary when data becomes available
  const generateSummary = useCallback(async () => {
    if (!canGenerate || !scoreData?.score?.results) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const summaryResult = await generateSummaryFromResults({
        analysisResults: scoreData.score.results,
        scoreTitle: scoreData.score.title,
      });

      setSummary(summaryResult);
    } catch (err) {
      console.error("Error generating summary:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate summary"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, scoreData]);

  // Reset summary when score data changes
  useEffect(() => {
    setSummary(null);
    setError(null);
  }, [scoreData?.score?.id]);

  return {
    summary,
    isGenerating,
    error,
    generateSummary,
    canGenerate,
  };
}

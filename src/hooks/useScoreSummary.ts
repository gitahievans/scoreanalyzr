import { useState, useCallback } from "react";
import {
  generateSummaryFromResults,
  GenerateSummaryFromResultsOutput,
} from "@/lib/generate-summary";

interface ScoreData {
  score?: {
    processed?: boolean;
    analysis_results?: any;
    title?: string;
  };
  task_status?: {
    state?: string;
  };
}

export function useScoreSummary() {
  const [summary, setSummary] =
    useState<GenerateSummaryFromResultsOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = useCallback(async (scoreData: ScoreData) => {
    if (!scoreData?.score?.analysis_results) {
      setError("No analysis results available to generate summary");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateSummaryFromResults({
        analysisResults: scoreData.score.analysis_results,
        scoreTitle: scoreData.score.title,
      });

      setSummary(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate summary";
      setError(errorMessage);
      console.error("Error generating summary:", err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const canGenerate = useCallback((scoreData: ScoreData) => {
    return Boolean(
      scoreData?.score?.processed &&
        scoreData?.score?.analysis_results &&
        scoreData?.task_status?.state !== "PENDING"
    );
  }, []);

  const clearSummary = useCallback(() => {
    setSummary(null);
    setError(null);
  }, []);

  return {
    summary,
    isGenerating,
    error,
    generateSummary,
    canGenerate,
    clearSummary,
  };
}

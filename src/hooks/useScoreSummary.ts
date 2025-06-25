// hooks/useScoreSummary.ts
import { useState, useCallback } from "react";
import { runFlow, streamFlow } from "@genkit-ai/next/client";
import { musicSummaryFlow } from "@/genkit/musicSummaryFlow";
import { GenerateSummaryFromResultsOutput } from "@/lib/generate-summary";

interface ScoreData {
  score?: {
    processed?: boolean;
    analysis_results?: any; // Your analysis results structure
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
  const [streamingText, setStreamingText] = useState<string>("");

  const generateSummary = useCallback(
    async (scoreData: ScoreData, useStreaming = false) => {
      if (!scoreData?.score?.analysis_results) {
        setError("No analysis results available to generate summary");
        return;
      }

      setIsGenerating(true);
      setError(null);
      setStreamingText("");

      try {
        if (useStreaming) {
          // Streaming approach - shows progress in real-time
          const result = streamFlow<typeof musicSummaryFlow>({
            url: "/api/generate-summary",
            input: {
              analysisResults: scoreData.score.analysis_results,
              scoreTitle: scoreData.score.title,
            },
          });

          // Process the stream chunks as they arrive
          for await (const chunk of result.stream) {
            setStreamingText((prev) => prev + chunk);
          }

          // Get the final complete response
          const finalOutput = await result.output;
          setSummary(finalOutput);
          setStreamingText(""); // Clear streaming text once complete
        } else {
          // Regular (non-streaming) approach
          const result = await runFlow<typeof musicSummaryFlow>({
            url: "/api/generate-summary",
            input: {
              analysisResults: scoreData.score.analysis_results,
              scoreTitle: scoreData.score.title,
            },
          });

          setSummary(result);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate summary";
        setError(errorMessage);
        console.error("Error generating summary:", err);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

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
    setStreamingText("");
  }, []);

  return {
    summary,
    isGenerating,
    error,
    streamingText,
    generateSummary,
    canGenerate,
    clearSummary,
  };
}

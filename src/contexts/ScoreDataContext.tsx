"use client";

import React, { createContext, useContext } from "react";
import { QueryObserverResult, useQuery } from "@tanstack/react-query";

// Moved from src/components/AnalysisDisplay.tsx
interface ScoreResults {
  key: string;
  parts: string[];
  chords: { pitch: string; offset: number }[];
  tempo: string;
  time_signature: string;
  composer: string;
  title: string;
  date: string;
  lyrics: string[];
}

// Moved from src/components/AnalysisDisplay.tsx
interface ScoreResponse {
  score: {
    id: number;
    title: string;
    composer: string;
    results: ScoreResults | null;
    processed: boolean;
    musicxml_url: string | null;
    midi_url: string | null;
  };
  task_status: {
    state: string;
    info: string | null;
  } | null;
}

interface ScoreDataContextState {
  scoreData: ScoreResponse | null | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<QueryObserverResult<ScoreResponse, Error>>;
}

export const ScoreDataContext = createContext<
  ScoreDataContextState | undefined
>(undefined);

// Moved from src/components/AnalysisDisplay.tsx
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
console.log("API_URL_FROM_CONTEXT:", API_URL);

// Moved from src/components/AnalysisDisplay.tsx
export const fetchScore = async (
  id: number,
  taskId: string
): Promise<ScoreResponse> => {
  const response = await fetch(
    `${API_URL}/api/scores/${id}/?task_id=${taskId}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch score");
  }
  const data = await response.json();
  console.log("Parsed Score data from Context:", data);
  return data;
};

interface ScoreDataProviderProps {
  scoreId: number | null;
  taskId: string | null;
  children: React.ReactNode;
}

export const ScoreDataProvider: React.FC<ScoreDataProviderProps> = ({
  scoreId,
  taskId,
  children,
}) => {
  const { data, error, isLoading, refetch } = useQuery<ScoreResponse, Error>({
    queryKey: ["score", scoreId, taskId],
    queryFn: () => fetchScore(scoreId!, taskId!),
    enabled: !!scoreId && !!taskId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data &&
        data?.task_status?.state === "PENDING" &&
        !data?.score?.processed
        ? 3000
        : false;
    },
    retry: (failureCount, errorInstance) => {
      if (failureCount >= 3) return false;

      return true;
    },
  });

  return (
    <ScoreDataContext.Provider
      value={{ scoreData: data, isLoading, error, refetch }}
    >
      {children}
    </ScoreDataContext.Provider>
  );
};

// Export ScoreDataContext, ScoreDataContextState, ScoreResponse, and ScoreDataProvider
export type { ScoreDataContextState, ScoreResponse, ScoreResults };

export const useScoreData = () => {
  const context = useContext(ScoreDataContext);
  if (context === undefined) {
    throw new Error("useScoreData must be used within a ScoreDataProvider");
  }
  return context;
};

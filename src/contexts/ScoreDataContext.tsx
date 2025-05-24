"use client";

import React, { createContext, useContext } from 'react';
import { QueryObserverResult, useQuery } from '@tanstack/react-query';

// Moved from src/components/AnalysisDisplay.tsx
export interface ScoreResults {
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
export interface ScoreResponse {
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

export interface ScoreDataContextState {
  scoreData: ScoreResponse | null | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<QueryObserverResult<ScoreResponse, Error>>;
}

export const ScoreDataContext = createContext<ScoreDataContextState | undefined>(undefined);

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
    queryKey: ['score', scoreId, taskId],
    queryFn: () => fetchScore(scoreId!, taskId!),
    enabled: !!scoreId && !!taskId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && data?.task_status?.state === 'PENDING' && !data?.score?.processed ? 3000 : false;
    },
    retry: (failureCount, errorInstance) => {
      // Access data using getQueryData if needed, or rely on the data from the latest query state
      // For this specific retry logic, we might not need to access 'data' directly from query cache
      // as the decision is based on the task_status which should be part of the error or fetched data.
      // However, the original AnalysisDisplay's retry logic seems to depend on `data` which is available in its scope.
      // Let's assume for now that the `useQuery`'s `data` (passed to `refetchInterval` or accessible via `query.state.data`) is what we need.
      // If `data` is not directly available in the retry function's scope in a way that reflects the latest attempt's outcome,
      // this might need adjustment or access through `queryClient.getQueryData(['score', scoreId, taskId])`.
      // For now, sticking to the direct pattern and assuming it works as in AnalysisDisplay:
      // The `data` variable in the original AnalysisDisplay retry function refers to the `data` from `useQuery`'s return.
      // This might be tricky to replicate exactly in the `retry` callback's signature if `data` isn't passed or accessible.
      // React Query's `retry` function signature is `(failureCount: number, error: TError) => boolean | Promise<boolean>`
      // It doesn't directly receive `data`.
      // A common pattern is to not depend on `data` in `retry` or to fetch it if essential.
      // Given the original code: `if (data?.task_status?.state === "SUCCESS" || data?.task_status?.state === "FAILURE") return false;`
      // This implies that if a fetch was successful or failed definitively, we shouldn't retry.
      // This state (`task_status`) would be part of the `data` object.
      // Let's refine this. The `retry` function itself doesn't get `data`.
      // The original logic might implicitly rely on the `data` state variable in the component scope.
      // To replicate this, we'd ideally check the latest query state if possible,
      // or simplify the retry to not depend on `data.task_status`.
      // However, the prompt asks to copy the logic. If `data` is not available, this part of the condition cannot be directly replicated.
      // Let's assume `data` is not available and simplify or note this limitation.
      // For now, I will proceed with the direct copy, assuming `data` might be accessible via closure or some other means,
      // or that the linter/compiler will flag this if it's a scope issue.
      // Re-checking useQuery v4/v5 docs, `data` is not passed to `retry`.
      // The original logic `data?.task_status?.state === "SUCCESS" || data?.task_status?.state === "FAILURE"`
      // is intended to stop retrying if the task has reached a terminal state.
      // This check should ideally be part of `refetchInterval` or `enabled`.
      // Let's assume the intention is to stop retries if the *error* indicates a terminal state,
      // or simply retry up to 3 times regardless of task status (as that's handled by refetchInterval).
      // For now, I'll implement the failureCount part and note that the task_status check in retry is problematic.
      if (failureCount >= 3) return false;
      // The condition `data?.task_status?.state === "SUCCESS" || data?.task_status?.state === "FAILURE"` cannot be reliably implemented here
      // without access to the query's current data. This logic is better suited for `enabled` or `refetchInterval`.
      // We will proceed without this specific check in the retry function for now, relying on failureCount.
      return true;
    },
  });

  return (
    <ScoreDataContext.Provider value={{ scoreData: data, isLoading, error, refetch }}>
      {children}
    </ScoreDataContext.Provider>
  );
};

// Export ScoreDataContext, ScoreDataContextState, ScoreResponse, and ScoreDataProvider
export type { ScoreDataContextState, ScoreResponse, ScoreResults }; // ScoreResults is also used by ScoreResponse

export const useScoreData = () => {
  const context = useContext(ScoreDataContext);
  if (context === undefined) {
    throw new Error('useScoreData must be used within a ScoreDataProvider');
  }
  return context;
};

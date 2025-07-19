"use client";

import React, { createContext, useContext } from "react";
import { QueryObserverResult, useQuery } from "@tanstack/react-query";
import {
  ScoreDataContextState,
  ScoreResponse,
  Score,
  TaskStatus,
  ScoreResults,
  ScoreStructure,
  NotableElements,
  Chord,
} from "@/lib/types";

export const ScoreDataContext = createContext<
  ScoreDataContextState | undefined
>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL;
console.log("API_URL_FROM_CONTEXT:", API_URL);

export const fetchScore = async (
  id: number,
  taskId: string
): Promise<ScoreResponse> => {
  const response = await fetch(
    `${API_URL}/api/scores/${id}/?task_id=${taskId}`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Create a more specific error object that includes the status code
    const error = new Error(
      errorData.message || `Server error: ${response.status}`
    );
    (error as any).status = response.status;
    (error as any).isServerError = response.status >= 500;

    throw error;
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
      const error = query.state.error;

      // Stop polling if there's a server error (5xx status codes)
      if (error && (error as any).isServerError) {
        console.log("Server error detected, stopping polling:", error.message);
        return false;
      }

      // Stop polling if there are too many consecutive errors
      if (query.state.errorUpdateCount >= 3) {
        console.log("Too many consecutive errors, stopping polling");
        return false;
      }

      // Continue polling only if the task is still pending and not processed
      return data &&
        data?.task_status?.state === "PENDING" &&
        !data?.score?.processed
        ? 3000
        : false;
    },
    retry: (failureCount, errorInstance) => {
      // Don't retry server errors (5xx) - they're likely not transient
      if ((errorInstance as any).isServerError) {
        console.log("Server error - not retrying:", errorInstance.message);
        return false;
      }

      // Retry up to 3 times for other errors (network issues, etc.)
      if (failureCount >= 3) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });

  return (
    <ScoreDataContext.Provider
      value={{ scoreData: data, isLoading, error, refetch }}
    >
      {children}
    </ScoreDataContext.Provider>
  );
};

export type {
  ScoreDataContextState,
  ScoreResponse,
  ScoreResults,
  Score,
  TaskStatus,
  ScoreStructure,
  NotableElements,
  Chord,
};

export const useScoreData = () => {
  const context = useContext(ScoreDataContext);
  if (context === undefined) {
    throw new Error("useScoreData must be used within a ScoreDataProvider");
  }
  return context;
};

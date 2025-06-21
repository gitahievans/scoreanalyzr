"use client";

import React, { createContext, useContext } from "react";
import { QueryObserverResult, useQuery } from "@tanstack/react-query";

// Updated interface to match your new backend response structure
interface Chord {
  pitch: string;
  offset: number;
}

interface Dynamics {
  values: string[];
  has_dynamics: boolean;
}

interface Accidentals {
  flats: number;
  others: number;
  sharps: number;
  naturals: number;
  has_accidentals: boolean;
}

interface Articulation {
  count: number;
  has_accent?: boolean;
  has_tenuto?: boolean;
  has_staccato?: boolean;
}

interface Articulations {
  accent: Articulation;
  tenuto: Articulation;
  staccato: Articulation;
}

interface ChartDataset {
  data: number[];
  label: string;
  backgroundColor: string[];
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartOptions {
  scales: {
    x: {
      title: {
        text: string;
        display: boolean;
      };
    };
    y: {
      title: {
        text: string;
        display: boolean;
      };
      beginAtZero: boolean;
    };
  };
  plugins: {
    title: {
      text: string;
      display: boolean;
    };
  };
}

interface NotableElementsChart {
  data: ChartData;
  type: string;
  options: ChartOptions;
}

interface Visualizations {
  notable_elements_chart: NotableElementsChart;
}

interface NotableElements {
  dynamics: Dynamics;
  accidentals: Accidentals;
  articulations: Articulations;
  visualizations: Visualizations;
}

interface ScoreStructure {
  parts: string[];
  music_type: string;
  score_type: string;
  instruments: string[];
  ensemble_type: string;
}

interface ScoreResults {
  key: string;
  parts: string[];
  chords: Chord[];
  time_signature: string;
  score_structure: ScoreStructure;
  notable_elements: NotableElements;
}

interface Score {
  id: number;
  title: string;
  lyrics: string[] | null;
  pdf_file: string | null;
  composer: string;
  year: number | undefined;
  categories: string[];
  results: ScoreResults | null;
  processed: boolean;
  musicxml_url: string | null;
  midi_url: string | null;
}

interface TaskStatus {
  state: string;
  info: string | null;
}

interface ScoreResponse {
  score: Score;
  task_status: TaskStatus;
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

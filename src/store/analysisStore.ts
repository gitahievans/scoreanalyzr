import { create } from "zustand";

interface AnalyzeScoreOutput {
  timeSignature: string;
  keySignature: string;
  tempoMarkings: string;
  dynamics: string;
  musicalInstructions: string;
  overallStructure: string;
  harmonicContent: string;
  notableFeatures: string;
}

interface AnalysisHistoryItem {
  id: string;
  scoreDataUri: string;
  analysisResult: AnalyzeScoreOutput;
  summary: string;
  fileName: string;
}

interface AnalysisState {
  analysisResult: AnalyzeScoreOutput | null;
  summary: string | null;
  analysisHistory: AnalysisHistoryItem[];
  setAnalysisResult: (result: AnalyzeScoreOutput | null) => void;
  setSummary: (summary: string | null) => void;
  addHistoryItem: (item: AnalysisHistoryItem) => void;
  clearHistory: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  analysisResult: null,
  summary: null,
  analysisHistory: [],
  setAnalysisResult: (result) => set({ analysisResult: result }),
  setSummary: (summary) => set({ summary }),
  addHistoryItem: (item) =>
    set((state) => ({
      analysisHistory: [item, ...state.analysisHistory],
    })),
  clearHistory: () =>
    set({
      analysisHistory: [],
      analysisResult: null,
      summary: null,
    }),
}));

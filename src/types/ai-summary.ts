// Types for LangChain JS AI Summary Feature

import { ScoreDataResults } from "./analysis"; // Assuming ScoreDataResults is exported from analysis.ts

// Input for the LangChain service, derived from the main ScoreData.score.results
// We select only the necessary fields to pass to the AI.
export interface AISummaryDataInput {
  title: string;
  composer: string;
  key: string;
  time_signature: string;
  parts?: string[];
  instruments?: string[];
  chords?: Array<{ pitch: string; offset: number }>; // Keep this simple
  notable_elements?: {
    accidentals?: {
      sharps: number;
      flats: number;
      naturals: number;
    };
    articulations?: any; // Keep flexible or define more strictly if consistent
    dynamics?: {
      values: string[];
    };
  };
  // Add any other specific fields from ScoreDataResults that are crucial for analysis
}

// Expected structured response from the AI
export interface AISummaryResponse {
  overview: string;           // General musical overview
  harmonicAnalysis: string;   // Chord progression insights
  technicalAnalysis: string; // Articulations, dynamics, difficulty
  musicalContext: string;     // Historical/stylistic context
  performanceNotes: string;   // Practical performance advice
}

// Interface for the error response from the API route
export interface AISummaryErrorResponse {
  error: string;
  details?: any;
}

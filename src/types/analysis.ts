// Based on the provided sample backend response

export interface Chord {
  pitch: string;
  offset: number;
}

export interface AccidentalDetails {
  sharps: number;
  flats: number;
  naturals: number;
  others: number;
  has_accidentals: boolean;
}

export interface ArticulationDetail {
  count: number;
  has_staccato?: boolean; // Making specific types optional
  has_accent?: boolean;
  has_tenuto?: boolean;
}

export interface Articulations {
  staccato: ArticulationDetail;
  accent: ArticulationDetail;
  tenuto: ArticulationDetail;
  // Add other articulations if present in data
}

export interface Dynamics {
  values: string[];
  has_dynamics: boolean;
}

export interface NotableElements {
  accidentals: AccidentalDetails;
  articulations: Articulations; // This might need further refinement based on actual data variability
  dynamics: Dynamics;
}

export interface ScoreStructure {
  score_type: string;
  ensemble_type: string;
  music_type: string;
  parts: string[];
  instruments: string[];
}

export interface ScoreResults {
  key: string;
  parts: string[];
  chords: Chord[];
  time_signature: string;
  notable_elements: NotableElements;
  score_structure: ScoreStructure;
}

export interface Score {
  id: number;
  title: string;
  composer: string;
  results: ScoreResults | null; // Results can be null if not processed
  processed: boolean;
  musicxml_url?: string; // Assuming this might exist from AnalysisDisplay
}

export interface TaskStatus {
  state: "SUCCESS" | "PENDING" | "FAILURE" | "PROCESSING"; // Added PROCESSING
  info: string | null;
}

export interface ScoreData {
  score: Score | null; // Score can be null initially
  task_status: TaskStatus;
}

// Request to our API route
// This is still relevant as the input to the /api/ai-summary route will be the full ScoreData object.
export interface AISummaryRequest {
  scoreData: ScoreData;
}

// For structured AI output, if we want the AI to return a JSON object
// This has been moved to src/types/ai-summary.ts as a structured response.
// The old AISummaryResponse (string summary) is no longer needed here.
// export interface StructuredAISummary {
// This is a more advanced approach, for now, we'll expect a text summary.
// export interface StructuredAISummary {
//   musicalOverview: string;
//   harmonicAnalysis: string;
//   performanceCharacteristics: string;
//   structuralInsights: string;
//   educationalContext: string;
// }

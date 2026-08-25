import { QueryObserverResult } from "@tanstack/react-query";

export interface Chord {
  pitch: string;
  offset: number;
}

export interface Dynamics {
  values: string[];
  has_dynamics: boolean;
}

export interface Accidentals {
  flats: number;
  others: number;
  sharps: number;
  naturals: number;
  has_accidentals: boolean;
}

export interface Articulation {
  count: number;
  has_accent?: boolean;
  has_tenuto?: boolean;
  has_staccato?: boolean;
}

export interface Articulations {
  accent: Articulation;
  tenuto: Articulation;
  staccato: Articulation;
}

export interface ChartDataset {
  data: number[];
  label: string;
  backgroundColor: string[];
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartOptions {
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

export interface NotableElementsChart {
  data: ChartData;
  type: string;
  options: ChartOptions;
}

export interface Visualizations {
  notable_elements_chart: NotableElementsChart;
}

export interface NotableElements {
  dynamics: Dynamics;
  accidentals: Accidentals;
  articulations: Articulations;
  visualizations: Visualizations;
}

export interface ScoreStructure {
  parts: string[];
  music_type: string;
  score_type: string;
  instruments: string[];
  ensemble_type: string;
}

export interface ScoreResults {
  key: string;
  parts: string[];
  chords: Chord[];
  time_signature: string;
  score_structure: ScoreStructure;
  notable_elements: NotableElements;
  text_content?: {
    status?: string;
    message?: string;
    cleaned_text?: string;
    other_text?: string[];
  };
  error?: string;
  stage?: string;
  error_type?: string;
  audio_transcription?: {
    transcription_quality?: string;
    detected_instrument_hint?: string;
    used_piano_split?: boolean;
    cleanup_summary?: {
      raw_note_events?: number;
      cleaned_note_events?: number;
      piano_split_threshold?: number;
    };
  };
  score_cleanup?: {
    applied?: boolean;
    source?: string;
    transcription_quality?: string;
    detected_instrument_hint?: string;
    used_piano_split?: boolean;
    cleanup_summary?: {
      raw_note_events?: number;
      cleaned_note_events?: number;
      piano_split_threshold?: number;
    };
  };
}

export interface Score {
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
  source_type: "pdf" | "image" | "audio";
  source_audio_url?: string | null;
  playback_midi_url?: string | null;
}

export interface TaskInfo {
  stage?: string;
  message?: string;
  progress_percent?: number;
  error?: string;
  error_type?: string;
}

export interface TaskStatus {
  state: string;
  info: TaskInfo | string | null;
}

export interface ScoreResponse {
  score: Score;
  task_status: TaskStatus;
}

export interface ScoreDataContextState {
  scoreData: ScoreResponse | null | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<QueryObserverResult<ScoreResponse, Error>>;
}

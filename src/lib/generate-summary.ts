// lib/generate-summary.ts
import { runFlow } from "@genkit-ai/next/client";
import { musicSummaryFlow } from "@/genkit/musicSummaryFlow";

// Keep your existing type definitions for backward compatibility
export interface GenerateSummaryFromResultsInput {
  analysisResults: {
    key: string;
    parts: string[];
    time_signature: string;
    chords: Array<{
      pitch: string;
      offset: number;
    }>;
    score_structure: {
      parts: string[];
      music_type: string;
      score_type: string;
      instruments: string[];
      ensemble_type: string;
    };
    notable_elements: {
      dynamics: {
        values: string[];
        has_dynamics: boolean;
      };
      accidentals: {
        flats: number;
        others: number;
        sharps: number;
        naturals: number;
        has_accidentals: boolean;
      };
      articulations: {
        accent: {
          count: number;
          has_accent?: boolean;
        };
        tenuto: {
          count: number;
          has_tenuto?: boolean;
        };
        staccato: {
          count: number;
          has_staccato?: boolean;
        };
      };
      visualizations: {
        notable_elements_chart: {
          data: {
            labels: string[];
            datasets: Array<{
              data: number[];
              label: string;
              backgroundColor: string[];
            }>;
          };
          type: string;
          options: any;
        };
      };
    };
  };
  scoreTitle?: string;
}

export interface GenerateSummaryFromResultsOutput {
  summary: string;
  musicalCharacteristics: string;
  harmonicAnalysis: string;
  structuralInsights: string;
  performanceNotes: string;
}

export async function generateSummaryFromResults(
  input: GenerateSummaryFromResultsInput
): Promise<GenerateSummaryFromResultsOutput> {
  try {
    // Use GenKit's runFlow instead of direct fetch
    const result = await runFlow<typeof musicSummaryFlow>({
      url: "/api/generate-summary",
      input: {
        analysisResults: input.analysisResults,
        scoreTitle: input.scoreTitle,
      },
    });

    return result;
  } catch (error) {
    console.error("Error calling GenKit music summary flow:", error);
    throw error;
  }
}

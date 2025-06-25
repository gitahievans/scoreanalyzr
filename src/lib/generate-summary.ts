// lib/generate-summary.ts (client-side utility)

// Type definitions (extract these from your server code)
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const endpoint = apiUrl.endsWith("/")
      ? `${apiUrl}api/generate-summary`
      : `${apiUrl}/api/generate-summary`;

    console.log("Making request to:", endpoint);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error calling generate summary API:", error);
    throw error;
  }
}

// app/api/generate-summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { z } from "genkit";

// Initialize AI instance (only runs on server)
const ai = genkit({
  promptDir: "./prompts",
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  model: "googleai/gemini-2.0-flash",
});

// All your existing schemas (keep them as they are)
const ScoreStructureSchema = z.object({
  parts: z.array(z.string()).describe("The instrumental parts in the piece"),
  music_type: z.string().describe("Type of music (e.g., instrumental)"),
  score_type: z.string().describe("Type of score (e.g., closed)"),
  instruments: z.array(z.string()).describe("List of instruments used"),
  ensemble_type: z.string().describe("Type of ensemble (e.g., Piano Solo)"),
});

const DynamicsSchema = z.object({
  values: z.array(z.string()).describe("Dynamic markings present in the score"),
  has_dynamics: z
    .boolean()
    .describe("Whether the score contains dynamic markings"),
});

const AccidentalsSchema = z.object({
  flats: z.number().describe("Number of flat accidentals"),
  others: z.number().describe("Number of other accidentals"),
  sharps: z.number().describe("Number of sharp accidentals"),
  naturals: z.number().describe("Number of natural accidentals"),
  has_accidentals: z
    .boolean()
    .describe("Whether the score contains accidentals"),
});

const ArticulationSchema = z.object({
  count: z.number().describe("Count of this articulation type"),
  has_accent: z.boolean().optional().describe("Whether accents are present"),
  has_tenuto: z
    .boolean()
    .optional()
    .describe("Whether tenuto marks are present"),
  has_staccato: z
    .boolean()
    .optional()
    .describe("Whether staccato marks are present"),
});

const ArticulationsSchema = z.object({
  accent: ArticulationSchema.describe("Accent articulation data"),
  tenuto: ArticulationSchema.describe("Tenuto articulation data"),
  staccato: ArticulationSchema.describe("Staccato articulation data"),
});

const ChartDatasetSchema = z.object({
  data: z.array(z.number()).describe("Chart data values"),
  label: z.string().describe("Chart dataset label"),
  backgroundColor: z.array(z.string()).describe("Chart colors"),
});

const ChartDataSchema = z.object({
  labels: z.array(z.string()).describe("Chart labels"),
  datasets: z.array(ChartDatasetSchema).describe("Chart datasets"),
});

const ChartOptionsSchema = z.object({
  scales: z.object({
    x: z.object({
      title: z.object({
        text: z.string(),
        display: z.boolean(),
      }),
    }),
    y: z.object({
      title: z.object({
        text: z.string(),
        display: z.boolean(),
      }),
      beginAtZero: z.boolean(),
    }),
  }),
  plugins: z.object({
    title: z.object({
      text: z.string(),
      display: z.boolean(),
    }),
  }),
});

const NotableElementsChartSchema = z.object({
  data: ChartDataSchema.describe("Chart data structure"),
  type: z.string().describe("Chart type (e.g., bar)"),
  options: ChartOptionsSchema.describe("Chart configuration options"),
});

const VisualizationsSchema = z.object({
  notable_elements_chart: NotableElementsChartSchema.describe(
    "Chart showing notable musical elements"
  ),
});

const NotableElementsSchema = z.object({
  dynamics: DynamicsSchema.describe("Dynamic markings analysis"),
  accidentals: AccidentalsSchema.describe("Accidentals analysis"),
  articulations: ArticulationsSchema.describe("Articulations analysis"),
  visualizations: VisualizationsSchema.describe(
    "Chart visualizations of the analysis"
  ),
});

const AnalysisResultsSchema = z.object({
  key: z.string().describe("The key signature of the piece"),
  parts: z.array(z.string()).describe("The instrumental parts in the piece"),
  time_signature: z.string().describe("The time signature of the piece"),
  chords: z
    .array(
      z.object({
        pitch: z.string().describe("The chord or pitch identification"),
        offset: z.number().describe("The timing offset of the chord"),
      })
    )
    .describe("Array of chord progressions with their timing"),
  score_structure: ScoreStructureSchema.describe(
    "Structural information about the score"
  ),
  notable_elements: NotableElementsSchema.describe(
    "Analysis of notable musical elements"
  ),
});

const GenerateSummaryFromResultsInputSchema = z.object({
  analysisResults: AnalysisResultsSchema.describe(
    "The structured analysis results from the backend"
  ),
  scoreTitle: z.string().optional().describe("The title of the score file"),
});

const GenerateSummaryFromResultsOutputSchema = z.object({
  summary: z.string().describe("A comprehensive musical summary of the piece"),
  musicalCharacteristics: z
    .string()
    .describe("Key musical characteristics and style"),
  harmonicAnalysis: z
    .string()
    .describe("Analysis of the harmonic content and progressions"),
  structuralInsights: z
    .string()
    .describe("Insights about the musical structure and form"),
  performanceNotes: z
    .string()
    .describe("Notes about performance considerations and difficulty"),
});

// Define the prompt
const prompt = ai.definePrompt({
  name: "generateSummaryFromResultsPrompt",
  input: {
    schema: GenerateSummaryFromResultsInputSchema,
  },
  output: {
    schema: GenerateSummaryFromResultsOutputSchema,
  },
  prompt: `You are an expert music analyst and educator. Based on the following structured analysis results, generate a comprehensive and insightful summary of this musical piece.

Analysis Data:
- Title: {{scoreTitle}}
- Key: {{analysisResults.key}}
- Time Signature: {{analysisResults.time_signature}}
- Ensemble Type: {{analysisResults.score_structure.ensemble_type}}
- Music Type: {{analysisResults.score_structure.music_type}}
- Instruments: {{analysisResults.score_structure.instruments}}
- Parts: {{analysisResults.parts}}
- Chord Progressions: {{analysisResults.chords}}

Musical Elements Analysis:
- Dynamics: {{analysisResults.notable_elements.dynamics.values}} (Has dynamics: {{analysisResults.notable_elements.dynamics.has_dynamics}})
- Accidentals: {{analysisResults.notable_elements.accidentals.flats}} flats, {{analysisResults.notable_elements.accidentals.sharps}} sharps, {{analysisResults.notable_elements.accidentals.naturals}} naturals
- Articulations: {{analysisResults.notable_elements.articulations.staccato.count}} staccato marks, {{analysisResults.notable_elements.articulations.accent.count}} accents

Please provide:

1. **Summary**: A comprehensive overview that would help someone understand what this piece is about, its musical style, and its significance. Consider the ensemble type, key signature, and overall character.

2. **Musical Characteristics**: Describe the key musical elements that define this piece's character and style. Include insights about the dynamics, articulations, and expressive markings found in the analysis.

3. **Harmonic Analysis**: Analyze the chord progressions and harmonic content. Identify patterns, key relationships, and harmonic techniques used. Consider the prevalence of accidentals and what they suggest about the harmonic language.

4. **Structural Insights**: Comment on the musical form, structure, and any notable compositional techniques. Use the score structure information and parts distribution to inform your analysis.

5. **Performance Notes**: Provide insights about performance considerations, difficulty level, and what musicians should be aware of when playing this piece. Consider the articulations, dynamics, and technical demands suggested by the analysis.

Focus on being educational and insightful, avoiding overly technical jargon while still providing meaningful musical analysis. Use the rich data about notable elements to provide specific insights about the piece's character and performance requirements.`,
});

// Define the flow
const generateSummaryFromResultsFlow = ai.defineFlow<
  typeof GenerateSummaryFromResultsInputSchema,
  typeof GenerateSummaryFromResultsOutputSchema
>(
  {
    name: "generateSummaryFromResultsFlow",
    inputSchema: GenerateSummaryFromResultsInputSchema,
    outputSchema: GenerateSummaryFromResultsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

// API Route Handlers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the input
    const validatedInput = GenerateSummaryFromResultsInputSchema.parse(body);

    // Generate the summary
    const result = await generateSummaryFromResultsFlow(validatedInput);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}

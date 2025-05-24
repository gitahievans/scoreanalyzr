"use server";
/**
 * @fileOverview Generates a summary of a music piece based on structured analysis results from backend.
 *
 * - generateSummaryFromResults - A function that generates the summary from backend analysis results.
 * - GenerateSummaryFromResultsInput - The input type for the generateSummaryFromResults function.
 * - GenerateSummaryFromResultsOutput - The return type for the generateSummaryFromResults function.
 */
import { ai } from "@/ai/ai-instance";
import { z } from "genkit";

// Define the structure that matches your backend response
const AnalysisResultsSchema = z.object({
  key: z.string().describe("The key signature of the piece"),
  parts: z.array(z.string()).describe("The instrumental parts in the piece"),
  tempo: z.string().describe("The tempo marking or indication"),
  time_signature: z.string().describe("The time signature of the piece"),
  chords: z
    .array(
      z.object({
        pitch: z.string().describe("The chord or pitch identification"),
        offset: z.number().describe("The timing offset of the chord"),
      })
    )
    .describe("Array of chord progressions with their timing"),
  lyrics: z.array(z.string()).describe("Lyrics found in the piece"),
  composer: z.string().describe("The composer of the piece"),
  title: z.string().describe("The title of the piece"),
  date: z.string().describe("The date or period of the piece"),
});

const GenerateSummaryFromResultsInputSchema = z.object({
  analysisResults: AnalysisResultsSchema.describe(
    "The structured analysis results from the backend"
  ),
  scoreTitle: z.string().optional().describe("The title of the score file"),
});

export type GenerateSummaryFromResultsInput = z.infer<
  typeof GenerateSummaryFromResultsInputSchema
>;

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

export type GenerateSummaryFromResultsOutput = z.infer<
  typeof GenerateSummaryFromResultsOutputSchema
>;

export async function generateSummaryFromResults(
  input: GenerateSummaryFromResultsInput
): Promise<GenerateSummaryFromResultsOutput> {
  return generateSummaryFromResultsFlow(input);
}

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
- Tempo: {{analysisResults.tempo}}
- Composer: {{analysisResults.composer}}
- Date: {{analysisResults.date}}
- Parts/Instruments: {{analysisResults.parts}}
- Lyrics: {{analysisResults.lyrics}}
- Chord Progressions: {{analysisResults.chords}}

Please provide:

1. **Summary**: A comprehensive overview that would help someone understand what this piece is about, its musical style, and its significance.

2. **Musical Characteristics**: Describe the key musical elements that define this piece's character and style.

3. **Harmonic Analysis**: Analyze the chord progressions and harmonic content. Identify patterns, key relationships, and harmonic techniques used.

4. **Structural Insights**: Comment on the musical form, structure, and any notable compositional techniques.

5. **Performance Notes**: Provide insights about performance considerations, difficulty level, and what musicians should be aware of when playing this piece.

Focus on being educational and insightful, avoiding overly technical jargon while still providing meaningful musical analysis.`,
});

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

'use server';
/**
 * @fileOverview Analyzes a music score to extract musical elements.
 *
 * - analyzeScore - A function that handles the music score analysis process.
 * - AnalyzeScoreInput - The input type for the analyzeScore function.
 * - AnalyzeScoreOutput - The return type for the analyzeScore function.
 */

'use server';

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnalyzeScoreInputSchema = z.object({
  scoreDataUri: z.string().describe('The data URI of the music score (PDF or image).'),
});
export type AnalyzeScoreInput = z.infer<typeof AnalyzeScoreInputSchema>;

const AnalyzeScoreOutputSchema = z.object({
  timeSignature: z.string().describe('The time signature of the music score.'),
  keySignature: z.string().describe('The key signature of the music score.'),
  tempoMarkings: z.string().describe('The tempo markings of the music score.'),
  dynamics: z.string().describe('The dynamics present in the music score.'),
  musicalInstructions: z.string().describe('Any musical instructions present in the music score. Pay special attention to the time signature, ensuring that it is correctly identified (e.g., 6/8, 6/16, 4/4). Look for patterns in the rhythm and meter to determine the correct time signature.'),
  overallStructure: z.string().describe('The overall structure of the piece.'),
  harmonicContent: z.string().describe('The harmonic content of the piece.'),
  notableFeatures: z.string().describe('Notable features of the piece.'),
});
export type AnalyzeScoreOutput = z.infer<typeof AnalyzeScoreOutputSchema>;

export async function analyzeScore(input: AnalyzeScoreInput): Promise<AnalyzeScoreOutput> {
  return analyzeScoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeScorePrompt',
  input: {
    schema: z.object({
      scoreDataUri: z.string().describe('The data URI of the music score (PDF or image).'),
    }),
  },
  output: {
    schema: z.object({
      timeSignature: z.string().describe('The time signature of the music score.'),
      keySignature: z.string().describe('The key signature of the music score.'),
      tempoMarkings: z.string().describe('The tempo markings of the music score.'),
      dynamics: z.string().describe('The dynamics present in the music score.'),
      musicalInstructions: z.string().describe('Any musical instructions present in the music score. Pay special attention to the time signature, ensuring that it is correctly identified (e.g., 6/8, 6/16, 4/4). Look for patterns in the rhythm and meter to determine the correct time signature.'),
      overallStructure: z.string().describe('The overall structure of the piece.'),
      harmonicContent: z.string().describe('The harmonic content of the piece.'),
      notableFeatures: z.string().describe('Notable features of the piece.'),
    }),
  },
  prompt: `You are an expert music analyst. Analyze the provided music score and extract the following musical elements:

- Time Signature: Determine the time signature of the piece.
- Key Signature: Identify the key signature of the piece.
- Tempo Markings: Extract any tempo markings present in the score.
- Dynamics: Identify the dynamics used in the piece.
- Musical Instructions: Extract any musical instructions or annotations in the score. Pay special attention to the time signature, ensuring that it is correctly identified (e.g., 6/8, 6/16, 4/4). Look for patterns in the rhythm and meter to determine the correct time signature.
- Overall Structure: Describe the overall structure of the piece (e.g., verse-chorus, sonata form).
- Harmonic Content: Summarize the harmonic content of the piece, including chord progressions and key changes.
- Notable Features: Highlight any notable or unique features of the piece.

Music Score: {{media url=scoreDataUri}}
`,
});

const analyzeScoreFlow = ai.defineFlow<
  typeof AnalyzeScoreInputSchema,
  typeof AnalyzeScoreOutputSchema
>({
  name: 'analyzeScoreFlow',
  inputSchema: AnalyzeScoreInputSchema,
  outputSchema: AnalyzeScoreOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});

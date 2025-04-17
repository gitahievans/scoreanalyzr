'use server';

/**
 * @fileOverview Generates a summary of a music piece based on its extracted musical elements.
 *
 * - generateSummary - A function that generates the summary of the music piece.
 * - GenerateSummaryInput - The input type for the generateSummary function.
 * - GenerateSummaryOutput - The return type for the generateSummary function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateSummaryInputSchema = z.object({
  musicalElements: z.string().describe('The extracted musical elements from the music score.'),
});
export type GenerateSummaryInput = z.infer<typeof GenerateSummaryInputSchema>;

const GenerateSummaryOutputSchema = z.object({
  summary: z.string().describe('The summary of the music piece, including its overall structure, harmonic content, and notable features.'),
});
export type GenerateSummaryOutput = z.infer<typeof GenerateSummaryOutputSchema>;

export async function generateSummary(input: GenerateSummaryInput): Promise<GenerateSummaryOutput> {
  return generateSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSummaryPrompt',
  input: {
    schema: z.object({
      musicalElements: z.string().describe('The extracted musical elements from the music score.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('The summary of the music piece, including its overall structure, harmonic content, and notable features.'),
    }),
  },
  prompt: `You are a music expert. Generate a summary of the music piece based on the following musical elements:

{{{musicalElements}}}

The summary should include the overall structure, harmonic content, and notable features of the piece.`, 
});

const generateSummaryFlow = ai.defineFlow<
  typeof GenerateSummaryInputSchema,
  typeof GenerateSummaryOutputSchema
>({
  name: 'generateSummaryFlow',
  inputSchema: GenerateSummaryInputSchema,
  outputSchema: GenerateSummaryOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});


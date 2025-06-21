import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import { ScoreData, Score, ScoreResults } from '@/types/analysis'; // Assuming types are in src

// Initialize Genkit plugins
// Ensure GOOGLE_GENAI_API_KEY is set in your environment
if (!process.env.GOOGLE_GENAI_API_KEY) {
  console.warn(
    "GOOGLE_GENAI_API_KEY is not set. AI features will not work."
  );
}

genkit.init({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

// Zod schema for input validation (mirroring ScoreData, but simplified for what the AI needs)
const AIScoreDataSchema = z.object({
  title: z.string().optional(),
  composer: z.string().optional(),
  key: z.string().optional(),
  time_signature: z.string().optional(),
  parts: z.array(z.string()).optional(),
  instruments: z.array(z.string()).optional(),
  chords: z.array(z.object({ pitch: z.string(), offset: z.number() })).optional(),
  notable_elements: z.object({
    accidentals: z.object({ sharps: z.number(), flats: z.number(), naturals: z.number() }).optional(),
    articulations: z.any().optional(), // Keep flexible for now
    dynamics: z.object({ values: z.array(z.string()) }).optional(),
  }).optional(),
});

// Helper function to extract relevant data for the AI
const prepareDataForAI = (scoreData: ScoreData): z.infer<typeof AIScoreDataSchema> => {
  if (!scoreData.score || !scoreData.score.results) {
    throw new Error("Score data or results are missing, cannot generate AI summary.");
  }
  const results = scoreData.score.results;
  return {
    title: scoreData.score.title,
    composer: scoreData.score.composer,
    key: results.key,
    time_signature: results.time_signature,
    parts: results.parts,
    instruments: results.score_structure?.instruments,
    chords: results.chords?.slice(0, 15), // Send a sample of chords
    notable_elements: {
      accidentals: results.notable_elements?.accidentals
        ? {
            sharps: results.notable_elements.accidentals.sharps,
            flats: results.notable_elements.accidentals.flats,
            naturals: results.notable_elements.accidentals.naturals,
          }
        : undefined,
      articulations: results.notable_elements?.articulations,
      dynamics: results.notable_elements?.dynamics
        ? { values: results.notable_elements.dynamics.values }
        : undefined,
    },
  };
};

export const generateMusicalAnalysisFlow = genkit.flow(
  {
    name: 'generateMusicalAnalysisFlow',
    inputSchema: z.custom<ScoreData>(), // Using custom to pass the full ScoreData initially
    outputSchema: z.string(),
  },
  async (scoreData) => {
    if (!process.env.GOOGLE_GENAI_API_KEY) {
        throw new Error("GOOGLE_GENAI_API_KEY is not configured. Cannot generate AI summary.");
    }

    const preparedData = prepareDataForAI(scoreData);
    const model = googleAI('gemini-1.5-flash'); // Using Gemini 1.5 Flash

    let prompt = `You are a knowledgeable musicologist. Analyze the following musical score data and provide a comprehensive yet accessible summary.
The piece is titled "${preparedData.title}" by ${preparedData.composer}.

Data:
Key: ${preparedData.key}
Time Signature: ${preparedData.time_signature}
Parts: ${preparedData.parts?.join(', ')}
Instruments: ${preparedData.instruments?.join(', ')}
Notable Accidentals: Sharps: ${preparedData.notable_elements?.accidentals?.sharps}, Flats: ${preparedData.notable_elements?.accidentals?.flats}, Naturals: ${preparedData.notable_elements?.accidentals?.naturals}
Dynamics observed: ${preparedData.notable_elements?.dynamics?.values?.join(', ')}
Sample Chords (first 15): ${JSON.stringify(preparedData.chords)}
Articulations: ${JSON.stringify(preparedData.notable_elements?.articulations)}

Based on this data, generate insights covering the following aspects:
1.  **Musical Overview**: General description of the piece. If the title is "Canon_in_D.pdf" or similar, and the key is D Major with many sharps, acknowledge it as Pachelbel's Canon in D.
2.  **Harmonic Analysis**: Insights from the chord progression. For Pachelbel's Canon, mention the characteristic bass line if identifiable from the chords.
3.  **Performance Characteristics**: Analysis of articulations (like staccato, accent, tenuto if present), dynamics, and potential technical demands.
4.  **Structural Insights**: Commentary on the likely form and instrumentation based on the data.
5.  **Educational Context**: What this piece might suggest about musical style, period, or composer techniques.

Provide the analysis as a single block of text, well-formatted with Markdown for readability (use headings like ### Musical Overview).
Be insightful and engaging for musicians, students, and music enthusiasts.
If some data is sparse or missing, make reasonable inferences or state what more information would be helpful.
Focus on providing value even with potentially incomplete data.
The output should be a string of Markdown text.
`;

    // Specific check for Pachelbel's Canon
    if (preparedData.title?.toLowerCase().includes("canon") && preparedData.title?.toLowerCase().includes("d") && preparedData.key === "D major") {
      prompt += "\nGiven the title and key, this is highly likely to be Pachelbel's Canon in D. Please tailor your analysis accordingly, looking for its characteristic features in the provided data (e.g., the famous ground bass progression in the chords: D-A-Bm-F#m-G-D-G-A).\n";
    }


    try {
      const result = await genkit.generate({
        model: model,
        prompt: prompt,
        config: {
          temperature: 0.5, // Adjust for creativity vs. factuality
        },
      });
      return result.text();
    } catch (error) {
      console.error("Error generating musical analysis with Genkit:", error);
      throw new Error(`AI generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

// Example of how to potentially run this flow (for testing or other server-side logic)
// async function testFlow() {
//   // This is placeholder data matching ScoreData structure
//   const sampleScoreData: ScoreData = {
//     score: {
//       id: 6,
//       title: "Canon_in_D.pdf",
//       composer: "Johann Pachelbel", // Corrected composer
//       processed: true,
//       musicxml_url: "/some/path/to/file.musicxml",
//       results: {
//         key: "D major",
//         parts: ["Violin I", "Violin II", "Violin III", "Cello Continuo"],
//         chords: [
//           {"pitch": "D", "offset": 0}, {"pitch": "A", "offset": 2},
//           {"pitch": "B", "offset": 0}, {"pitch": "F#", "offset": 2},
//           {"pitch": "G", "offset": 0}, {"pitch": "D", "offset": 2},
//           {"pitch": "G", "offset": 0}, {"pitch": "A", "offset": 2}
//           // ... more chords
//         ],
//         time_signature: "4/4",
//         notable_elements: {
//           accidentals: { sharps: 154, flats: 0, naturals: 4, others: 0, has_accidentals: true },
//           articulations: { // Example, adjust to actual structure
//             staccato: { count: 30, has_staccato: true },
//             accent: { count: 16, has_accent: true },
//             tenuto: { count: 1, has_tenuto: true }
//           },
//           dynamics: { values: ["f", "mf", "mp", "p"], has_dynamics: true }
//         },
//         score_structure: {
//           score_type: "ensemble",
//           ensemble_type: "Baroque Ensemble",
//           music_type: "instrumental",
//           parts: ["Violin I", "Violin II", "Violin III", "Cello Continuo"],
//           instruments: ["Violin", "Violin", "Violin", "Cello"]
//         }
//       }
//     },
//     task_status: { state: "SUCCESS", info: null }
//   };

//   try {
//     console.log("Testing generateMusicalAnalysisFlow...");
//     const summary = await generateMusicalAnalysisFlow.invoke(sampleScoreData);
//     console.log("Generated Summary:", summary);
//   } catch (e) {
//     console.error("Flow invocation error:", e);
//   }
// }

// testFlow(); // Uncomment to run a test if this file is executed directly (e.g., with ts-node)

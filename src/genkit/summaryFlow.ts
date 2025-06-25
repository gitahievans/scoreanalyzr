import { googleAI } from "@genkit-ai/googleai";
import { genkit, z } from "genkit";

// Initialize Genkit with Google AI plugin
const ai = genkit({
  plugins: [googleAI()],
});

// Define input and output schemas based on your existing interfaces
export const summaryFlow = ai.defineFlow(
  {
    name: "summaryFlow",
    inputSchema: z.object({
      analysisResults: z.object({
        key: z.string(),
        parts: z.array(z.string()),
        time_signature: z.string(),
        chords: z.array(z.object({ pitch: z.string(), offset: z.number() })),
        score_structure: z.object({
          parts: z.array(z.string()),
          music_type: z.string(),
          score_type: z.string(),
          instruments: z.array(z.string()),
          ensemble_type: z.string(),
        }),
        notable_elements: z.object({
          dynamics: z.object({
            values: z.array(z.string()),
            has_dynamics: z.boolean(),
          }),
          accidentals: z.object({
            flats: z.number(),
            others: z.number(),
            sharps: z.number(),
            naturals: z.number(),
            has_accidentals: z.boolean(),
          }),
          articulations: z.object({
            accent: z.object({
              count: z.number(),
              has_accent: z.boolean().optional(),
            }),
            tenuto: z.object({
              count: z.number(),
              has_tenuto: z.boolean().optional(),
            }),
            staccato: z.object({
              count: z.number(),
              has_staccato: z.boolean().optional(),
            }),
          }),
          visualizations: z.object({
            notable_elements_chart: z.object({
              data: z.object({
                labels: z.array(z.string()),
                datasets: z.array(
                  z.object({
                    data: z.array(z.number()),
                    label: z.string(),
                    backgroundColor: z.array(z.string()),
                  })
                ),
              }),
              type: z.string(),
              options: z.any(),
            }),
          }),
        }),
      }),
      scoreTitle: z.string().optional(),
    }),
    outputSchema: z.object({
      summary: z.string(),
      musicalCharacteristics: z.string(),
      harmonicAnalysis: z.string(),
      structuralInsights: z.string(),
      performanceNotes: z.string(),
    }),
  },
  async ({ analysisResults, scoreTitle }) => {
    // Construct a prompt for Gemini based on the input
    const prompt = `
      You are a musical analysis expert. Given the following analysis results for a musical score titled "${
        scoreTitle || "Untitled Score"
      }", generate a detailed musical analysis with the following sections:
      - Summary: A concise overview of the piece (1-2 sentences).
      - Musical Characteristics: Describe the style, mood, and notable features (2-3 sentences).
      - Harmonic Analysis: Analyze the harmonic structure, including key, modulations, and chord progressions (2-3 sentences).
      - Structural Insights: Discuss the form and structure of the piece (2-3 sentences).
      - Performance Notes: Provide guidance for performers (2-3 sentences).

      Analysis Results:
      - Key: ${analysisResults.key}
      - Parts: ${analysisResults.parts.join(", ")}
      - Time Signature: ${analysisResults.time_signature}
      - Chords: ${JSON.stringify(
        analysisResults.chords.slice(0, 5)
      )} (first 5 chords for brevity)
      - Score Structure: ${JSON.stringify(analysisResults.score_structure)}
      - Notable Elements:
        - Dynamics: ${JSON.stringify(analysisResults.notable_elements.dynamics)}
        - Accidentals: ${JSON.stringify(
          analysisResults.notable_elements.accidentals
        )}
        - Articulations: ${JSON.stringify(
          analysisResults.notable_elements.articulations
        )}
    `;

    const { text } = await ai.generate({
      model: googleAI.model("gemini-1.5-flash"), // Use Gemini 1.5 Flash
      prompt,
    });

    // Parse the response (assuming Gemini returns structured text; adjust based on actual output)
    // This is a simple parsing example; you may need to adjust based on Gemini's response format
    interface Sections {
      summary: string;
      musicalCharacteristics: string;
      harmonicAnalysis: string;
      structuralInsights: string;
      performanceNotes: string;
    }

    const sections: Sections = text.split("\n\n").reduce<Sections>(
      (acc: Sections, section: string) => {
        if (section.startsWith("Summary:"))
          acc.summary = section.replace("Summary: ", "").trim();
        if (section.startsWith("Musical Characteristics:"))
          acc.musicalCharacteristics = section
            .replace("Musical Characteristics: ", "")
            .trim();
        if (section.startsWith("Harmonic Analysis:"))
          acc.harmonicAnalysis = section
            .replace("Harmonic Analysis: ", "")
            .trim();
        if (section.startsWith("Structural Insights:"))
          acc.structuralInsights = section
            .replace("Structural Insights: ", "")
            .trim();
        if (section.startsWith("Performance Notes:"))
          acc.performanceNotes = section
            .replace("Performance Notes: ", "")
            .trim();
        return acc;
      },
      {
        summary: "",
        musicalCharacteristics: "",
        harmonicAnalysis: "",
        structuralInsights: "",
        performanceNotes: "",
      }
    );

    return sections;
  }
);

import { googleAI } from "@genkit-ai/googleai";
import { genkit, z } from "genkit";

const ai = genkit({
  plugins: [googleAI()],
});

// Define the input schema to match your existing types
const MusicAnalysisInputSchema = z.object({
  analysisResults: z.object({
    key: z.string(),
    parts: z.array(z.string()),
    time_signature: z.string(),
    chords: z.array(
      z.object({
        pitch: z.string(),
        offset: z.number(),
      })
    ),
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
});

// Define the output schema
const MusicSummaryOutputSchema = z.object({
  summary: z.string(),
  musicalCharacteristics: z.string(),
  harmonicAnalysis: z.string(),
  structuralInsights: z.string(),
  performanceNotes: z.string(),
});

export const musicSummaryFlow = ai.defineFlow(
  {
    name: "musicSummaryFlow",
    inputSchema: MusicAnalysisInputSchema,
    outputSchema: MusicSummaryOutputSchema,
    streamSchema: z.string(),
  },
  async ({ analysisResults, scoreTitle }, { sendChunk }) => {
    // Build a comprehensive prompt from the analysis data
    const prompt = `
As a professional music analyst, provide a comprehensive analysis of this musical score based on the following data:

**Basic Information:**
- Title: ${scoreTitle || "Untitled Score"}
- Key: ${analysisResults.key}
- Time Signature: ${analysisResults.time_signature}
- Parts: ${analysisResults.parts.join(", ")}

**Score Structure:**
- Music Type: ${analysisResults.score_structure.music_type}
- Score Type: ${analysisResults.score_structure.score_type}
- Instruments: ${analysisResults.score_structure.instruments.join(", ")}
- Ensemble Type: ${analysisResults.score_structure.ensemble_type}

**Notable Musical Elements:**
- Dynamics: ${
      analysisResults.notable_elements.dynamics.has_dynamics
        ? analysisResults.notable_elements.dynamics.values.join(", ")
        : "No specific dynamics marked"
    }
- Accidentals: ${analysisResults.notable_elements.accidentals.sharps} sharps, ${
      analysisResults.notable_elements.accidentals.flats
    } flats, ${analysisResults.notable_elements.accidentals.naturals} naturals
- Articulations: 
  * Staccato: ${
    analysisResults.notable_elements.articulations.staccato.count
  } occurrences
  * Accent: ${
    analysisResults.notable_elements.articulations.accent.count
  } occurrences
  * Tenuto: ${
    analysisResults.notable_elements.articulations.tenuto.count
  } occurrences

**Chord Information:**
- Total Chords: ${analysisResults.chords.length}
- Chord Progression: ${analysisResults.chords
      .slice(0, 5)
      .map((c) => c.pitch)
      .join(" → ")}${analysisResults.chords.length > 5 ? "..." : ""}

Please provide a detailed analysis in exactly 5 sections:

1. **Summary**: A concise overview of the piece (2-3 sentences)
2. **Musical Characteristics**: Describe the style, tempo implications, and overall character
3. **Harmonic Analysis**: Analyze the key, chord progressions, and harmonic language
4. **Structural Insights**: Discuss the form, organization, and compositional techniques
5. **Performance Notes**: Practical advice for performers, including technical challenges and interpretive suggestions

Format your response as a JSON object with these exact keys: "summary", "musicalCharacteristics", "harmonicAnalysis", "structuralInsights", "performanceNotes"
`;

    const { stream, response } = ai.generateStream({
      model: googleAI.model("gemini-2.0-flash-exp"),
      prompt: prompt,
      config: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.8,
      },
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      const chunkText = chunk.text;
      fullResponse += chunkText;
      sendChunk(chunkText);
    }

    const { text } = await response;

    try {
      // Try to parse the response as JSON
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const parsedResponse = JSON.parse(cleanText);

      return {
        summary: parsedResponse.summary || "Analysis completed",
        musicalCharacteristics:
          parsedResponse.musicalCharacteristics ||
          "Musical characteristics analyzed",
        harmonicAnalysis:
          parsedResponse.harmonicAnalysis || "Harmonic analysis completed",
        structuralInsights:
          parsedResponse.structuralInsights || "Structural insights provided",
        performanceNotes:
          parsedResponse.performanceNotes || "Performance notes included",
      };
    } catch (parseError) {
      console.warn(
        "Failed to parse AI response as JSON, falling back to sections"
      );

      // Fallback: try to extract sections manually
      const sections = text
        .split(/\*\*[^*]+\*\*/g)
        .filter((s) => s.trim().length > 0);

      return {
        summary:
          sections[0]?.trim() ||
          "This musical analysis provides insights into the score structure and performance characteristics.",
        musicalCharacteristics:
          sections[1]?.trim() ||
          "The piece demonstrates clear musical characteristics suitable for its intended ensemble.",
        harmonicAnalysis:
          sections[2]?.trim() ||
          `The piece is in ${analysisResults.key} with ${
            analysisResults.notable_elements.accidentals.sharps +
            analysisResults.notable_elements.accidentals.flats
          } accidentals, suggesting interesting harmonic progressions.`,
        structuralInsights:
          sections[3]?.trim() ||
          `The ${
            analysisResults.score_structure.music_type
          } structure provides clear organization for ${analysisResults.score_structure.instruments.join(
            " and "
          )} performance.`,
        performanceNotes:
          sections[4]?.trim() ||
          "Consider the articulation marks and dynamic indications for an expressive performance.",
      };
    }
  }
);

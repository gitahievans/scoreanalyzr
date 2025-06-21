import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ScoreData } from '@/types/analysis';
import { AISummaryDataInput, AISummaryErrorResponse } from '@/types/ai-summary';
import { generateStructuredMusicalAnalysis } from '@/lib/langchainService';

// Zod schema for validating the incoming request body (full ScoreData)
const ApiRequestBodySchema = z.object({
  scoreData: z.custom<ScoreData>((data) => {
    const scoreData = data as ScoreData;
    // Basic check: ensure score and results exist. More granular checks can be added.
    return !!(scoreData && scoreData.score && scoreData.score.results);
  }, { message: "Valid ScoreData object with score and results is required." }),
});

// Helper function to transform ScoreData to AISummaryDataInput
function transformScoreDataToAISummaryInput(scoreData: ScoreData): AISummaryDataInput {
  if (!scoreData.score || !scoreData.score.results) {
    // This should ideally be caught by prior validation, but as a safeguard:
    throw new Error("Cannot transform data: Score or score results are missing.");
  }
  const { title, composer, results } = scoreData.score;
  const { key, time_signature, parts, notable_elements, score_structure, chords } = results;

  return {
    title: title || "Untitled",
    composer: composer || "Unknown Composer",
    key: key || "Unknown Key",
    time_signature: time_signature || "Unknown Time Signature",
    parts: parts || undefined,
    instruments: score_structure?.instruments || undefined,
    chords: chords?.map(c => ({ pitch: c.pitch, offset: c.offset })) || undefined,
    notable_elements: notable_elements ? {
      accidentals: notable_elements.accidentals ? {
        sharps: notable_elements.accidentals.sharps,
        flats: notable_elements.accidentals.flats,
        naturals: notable_elements.accidentals.naturals,
      } : undefined,
      articulations: notable_elements.articulations || undefined, // Pass as is, or transform if needed
      dynamics: notable_elements.dynamics ? {
        values: notable_elements.dynamics.values,
      } : undefined,
    } : undefined,
  };
}

export async function POST(request: NextRequest) {
  console.log("API Route /api/ai-summary POST request received");

  if (!process.env.GOOGLE_API_KEY) {
    console.error("API Route: GOOGLE_API_KEY is not configured on the server.");
    const errorResponse: AISummaryErrorResponse = {
      error: 'AI service is not configured on the server.',
      details: 'Missing GOOGLE_API_KEY environment variable.'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }

  let validatedBody;
  try {
    const body = await request.json();
    // console.log("API Route: Request body received:", JSON.stringify(body, null, 2));

    const validationResult = ApiRequestBodySchema.safeParse(body);
    if (!validationResult.success) {
      console.error("API Route: Request body validation failed:", validationResult.error.flatten());
      const errorResponse: AISummaryErrorResponse = {
        error: "Invalid request body.",
        details: validationResult.error.flatten()
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    validatedBody = validationResult.data;
    // console.log("API Route: Validated request body:", JSON.stringify(validatedBody, null, 2));

  } catch (error) {
    console.error("API Route: Error parsing request JSON:", error);
    const errorResponse: AISummaryErrorResponse = { error: 'Invalid JSON input' };
    return NextResponse.json(errorResponse, { status: 400 });
  }

  try {
    const scoreDataForAIService = transformScoreDataToAISummaryInput(validatedBody.scoreData);
    // console.log("API Route: Data transformed for LangChain service:", JSON.stringify(scoreDataForAIService, null, 2));

    const structuredSummary = await generateStructuredMusicalAnalysis(scoreDataForAIService);
    // console.log("API Route: AI Summary generated successfully by LangChain service:", structuredSummary);

    return NextResponse.json(structuredSummary); // Returns AISummaryResponse directly

  } catch (error: any) {
    console.error('API Route: Error generating AI summary via LangChain service:', error);
    const message = error.message || 'An unexpected error occurred while generating the summary.';
    const status = error.status || 500; // Use error status if available, otherwise default to 500

    const errorResponse: AISummaryErrorResponse = {
      error: 'Failed to generate AI summary.',
      details: message
    };
    return NextResponse.json(errorResponse, { status });
  }
}

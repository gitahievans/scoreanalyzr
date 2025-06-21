import { NextRequest, NextResponse } from 'next/server';
import { generateMusicalAnalysisFlow } from '@/lib/ai/generateMusicalAnalysis';
import { ScoreData } from '@/types/analysis';
import { z } from 'zod';

// Optional: Define a Zod schema for basic validation of the incoming request body
// This ensures that the top-level structure is what we expect.
// The Genkit flow itself might have more detailed input validation.
const RequestBodySchema = z.object({
  scoreData: z.custom<ScoreData>((data) => {
    // Add more specific checks if needed, e.g., ensuring score and results exist
    const scoreData = data as ScoreData;
    if (!scoreData || !scoreData.score || !scoreData.score.results) {
      // This check could be more granular depending on minimum requirements
      // For now, we let the AI flow handle more detailed missing data scenarios
      return false;
    }
    return true;
  }, { message: "Valid ScoreData object with score and results is required." }),
});


export async function POST(request: NextRequest) {
  console.log("API Route /api/generate-summary called");

  let validatedBody;
  try {
    const body = await request.json();
    // console.log("Request body received:", JSON.stringify(body, null, 2)); // Detailed log

    // Validate the basic structure of the request body
    const validationResult = RequestBodySchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Request body validation failed:", validationResult.error.flatten());
      return NextResponse.json(
        { error: "Invalid request body.", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    validatedBody = validationResult.data;
    // console.log("Validated request body:", JSON.stringify(validatedBody, null, 2));

  } catch (error) {
    console.error("Error parsing request JSON:", error);
    return NextResponse.json({ error: 'Invalid JSON input' }, { status: 400 });
  }

  if (!process.env.GOOGLE_GENAI_API_KEY) {
    console.error("GOOGLE_GENAI_API_KEY is not configured on the server.");
    return NextResponse.json(
      { error: 'AI service is not configured on the server.' },
      { status: 500 }
    );
  }

  try {
    const scoreDataForFlow = validatedBody.scoreData;
    // console.log("Invoking generateMusicalAnalysisFlow with ScoreData:", JSON.stringify(scoreDataForFlow, null, 2));

    const summary = await generateMusicalAnalysisFlow.invoke(scoreDataForFlow);
    // console.log("AI Summary generated successfully:", summary);

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Error generating AI summary via flow:', error);
    // Check if the error is from Genkit or a general error
    const message = error.message || 'An unexpected error occurred while generating the summary.';
    const status = error.status || 500; // Use error status if available, otherwise default to 500

    return NextResponse.json(
      { error: 'Failed to generate AI summary.', details: message },
      { status: status }
    );
  }
}

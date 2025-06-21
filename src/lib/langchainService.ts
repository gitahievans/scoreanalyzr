import { GoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser, OutputFixingParser } from "langchain/output_parsers";
import { z } from "zod";
import { AISummaryDataInput, AISummaryResponse } from "@/types/ai-summary";

// Ensure GOOGLE_API_KEY is set (renamed from GOOGLE_GENAI_API_KEY as per new requirements)
if (!process.env.GOOGLE_API_KEY) {
  console.warn(
    "GOOGLE_API_KEY is not set. AI features will not work. This key is required for LangChain GoogleGenerativeAI."
  );
}

const model = new GoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  modelName: "gemini-1.5-flash-latest", // Using a specific Gemini 1.5 Flash model
  temperature: 0.4, // Adjust for balance between creativity and factuality
  maxOutputTokens: 2048, // Adjust as needed
});

// Define the Zod schema for the structured output, matching AISummaryResponse
const summaryResponseSchema = z.object({
  overview: z.string().describe("General musical overview of the piece. If it's Pachelbel's Canon in D, mention its common name and context."),
  harmonicAnalysis: z.string().describe("Insights into the chord progression, key characteristics, and any notable harmonic patterns. For Pachelbel's Canon, identify the ground bass progression D-A-Bm-F#m-G-D-G-A if evident in the data."),
  technicalAnalysis: z.string().describe("Analysis of articulations, dynamics, potential technical difficulty, and demands on the performer(s). Comment on the number of sharps/flats in relation to the key."),
  musicalContext: z.string().describe("Historical and stylistic context. For Pachelbel's Canon, place it within the Baroque period and its significance."),
  performanceNotes: z.string().describe("Practical advice or considerations for performing the piece, e.g., interpretation, common challenges."),
});

// Create a structured output parser using the Zod schema
const parser = StructuredOutputParser.fromZodSchema(summaryResponseSchema);

const generatePrompt = (data: AISummaryDataInput): string => {
  let specificInstructions = "";
  if (data.title?.toLowerCase().includes("canon") && data.title?.toLowerCase().includes("d") && data.key === "D major") {
    specificInstructions = `
This piece is very likely Pachelbel's Canon in D. Please confirm this in your overview and tailor your analysis to its well-known characteristics.
Look for the famous I-V-vi-iii-IV-I-IV-V ground bass progression (D-A-Bm-F#m-G-D-G-A in D Major) in the provided chord data.
The piece is a cornerstone of Baroque music; reflect this in the musical context.
Performance notes should consider its typical instrumentation (strings and continuo) and common interpretations.
Given the key of D Major, the high number of sharps (e.g., ${data.notable_elements?.accidentals?.sharps}) is expected.
`;
  }

  return `
You are an expert musicologist providing an analysis of a musical score.
The data provided is:
Title: ${data.title}
Composer: ${data.composer}
Key: ${data.key}
Time Signature: ${data.time_signature}
Parts: ${data.parts?.join(', ') || 'N/A'}
Instruments: ${data.instruments?.join(', ') || 'N/A'}
Sample Chords: ${data.chords ? JSON.stringify(data.chords.slice(0,10)) : 'N/A'} (first 10 shown)
Notable Accidentals: Sharps: ${data.notable_elements?.accidentals?.sharps || 0}, Flats: ${data.notable_elements?.accidentals?.flats || 0}, Naturals: ${data.notable_elements?.accidentals?.naturals || 0}
Dynamics: ${data.notable_elements?.dynamics?.values?.join(', ') || 'N/A'}
Articulations: ${data.notable_elements?.articulations ? JSON.stringify(data.notable_elements.articulations) : 'N/A'}

${specificInstructions}

Your task is to generate a structured analysis covering the following aspects.
{format_instructions}

Please provide your response as a valid JSON object that strictly adheres to this structure.
Ensure each field is a descriptive string.
`;
};

export const generateStructuredMusicalAnalysis = async (
  data: AISummaryDataInput
): Promise<AISummaryResponse> => {
  if (!process.env.GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY is not configured. Cannot generate AI summary.");
    throw new Error("AI service is not configured on the server.");
  }

  try {
    console.log("LangchainService: Generating structured musical analysis for:", data.title);
    const promptTemplate = new PromptTemplate({
      template: generatePrompt(data),
      inputVariables: [], // All variables are directly interpolated in generatePrompt
      partialVariables: { format_instructions: parser.getFormatInstructions() },
    });

    const formattedPrompt = await promptTemplate.format({});
    console.log("LangchainService: Formatted prompt being sent to AI:\n", formattedPrompt);

    const response = await model.invoke(formattedPrompt);
    let parsedResponse: AISummaryResponse;

    console.log("LangchainService: Raw AI response:\n", response);

    try {
        // Assuming 'response' from GoogleGenerativeAI is a string.
        // If it's an AIMessage, use response.content
        const aiMessageContent = typeof response === 'string' ? response : (response as any).content;
        if (typeof aiMessageContent !== 'string') {
            throw new Error("AI response content is not a string.");
        }
        parsedResponse = await parser.parse(aiMessageContent);
    } catch (parseError: any) {
        console.warn("LangchainService: Initial parsing failed. Attempting to fix with OutputFixingParser.", parseError);
        const outputFixingParser = OutputFixingParser.fromLLM(model, parser);
        // Again, ensure the content passed to the fixer is a string
        const aiMessageContentForFixer = typeof response === 'string' ? response : (response as any).content;
        if (typeof aiMessageContentForFixer !== 'string') {
            throw new Error("AI response content for fixer is not a string.");
        }
        parsedResponse = await outputFixingParser.parse(aiMessageContentForFixer);
        console.log("LangchainService: Response successfully parsed with OutputFixingParser.");
    }

    console.log("LangchainService: Successfully parsed AI response:", parsedResponse);
    return parsedResponse;

  } catch (error: any) {
    console.error("LangchainService: Error generating structured musical analysis:", error);
    if (error.message.includes("API key not valid")) {
        throw new Error("Invalid Google API Key. Please check your GOOGLE_API_KEY environment variable.");
    }
    throw new Error(`AI generation failed: ${error.message}`);
  }
};

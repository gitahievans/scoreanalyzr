import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define response interface (optional, for better type safety)
interface SummaryResponse {
  summary: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SummaryResponse | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { score } = req.body;

    if (!score?.analysis_results) {
      return res.status(400).json({ error: "Invalid analysis data" });
    }

    const prompt = `
      You are a music theory expert tasked with creating a beginner-friendly summary of a musical score analysis. Using the provided JSON analysis, generate a clear, concise, and engaging summary (150-200 words) that explains the key musical elements in simple terms. Include:
      - The title and composer (if available)
      - The key and time signature
      - The main instruments
      - Notable musical elements (e.g., dynamics, articulations)
      - A brief description of the piece's mood or character
      Avoid technical jargon where possible and make the summary accessible to someone new to music theory.

      Analysis JSON:
      ${JSON.stringify(score.analysis_results, null, 2)}
      Title: ${score.title || "Unknown"}
      Composer: ${score.composer || "Unknown"}
    `;

    // Make OpenAI API call
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful music theory assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const summary = chatCompletion.choices[0].message.content;
    if (!summary) {
      return res.status(500).json({ error: "Failed to generate summary" });
    }

    return res.status(200).json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

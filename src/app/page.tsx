"use client";

import { useState } from 'react';
import { analyzeScore, AnalyzeScoreOutput } from '@/ai/flows/analyze-score';
import { generateSummary } from '@/ai/flows/generate-summary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeScoreOutput | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    const file = event.target.files?.[0];

    if (file) {
      // Convert blob URL to data URL
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        setPdfUrl(dataUrl);

        try {
          const analysis = await analyzeScore({ pdfUrl: dataUrl });
          setAnalysisResult(analysis);

          const musicalElements = `
            Time Signature: ${analysis.timeSignature}
            Key Signature: ${analysis.keySignature}
            Tempo Markings: ${analysis.tempoMarkings}
            Dynamics: ${analysis.dynamics}
            Musical Instructions: ${analysis.musicalInstructions}
            Overall Structure: ${analysis.overallStructure}
            Harmonic Content: ${analysis.harmonicContent}
            Notable Features: ${analysis.notableFeatures}
          `;

          const summaryResult = await generateSummary({ musicalElements });
          setSummary(summaryResult.summary);

        } catch (error) {
          console.error("Error analyzing score:", error);
          alert("Failed to analyze score. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        console.error("Error reading file.");
        alert("Failed to read file. Please try again.");
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } else {
      setIsLoading(false); // Ensure loading is set to false if no file is selected
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Score Insights</h1>

      <div className="mb-4">
        <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="pdf-upload" />
        <label htmlFor="pdf-upload">
          <Button asChild>
            <span className="text-sm">
              {pdfUrl ? 'Change PDF' : 'Upload PDF Music Score'}
            </span>
          </Button>
        </label>
      </div>

      {isLoading && <p>Analyzing score...</p>}

      {analysisResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Musical Elements</CardTitle>
              <CardDescription>Extracted from the score</CardDescription>
            </CardHeader>
            <CardContent>
              <p><strong>Time Signature:</strong> {analysisResult.timeSignature}</p>
              <p><strong>Key Signature:</strong> {analysisResult.keySignature}</p>
              <p><strong>Tempo Markings:</strong> {analysisResult.tempoMarkings}</p>
              <p><strong>Dynamics:</strong> {analysisResult.dynamics}</p>
              <p><strong>Musical Instructions:</strong> {analysisResult.musicalInstructions}</p>
              <p><strong>Overall Structure:</strong> {analysisResult.overallStructure}</p>
              <p><strong>Harmonic Content:</strong> {analysisResult.harmonicContent}</p>
              <p><strong>Notable Features:</strong> {analysisResult.notableFeatures}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Overall structure, harmonic content, and notable features</CardDescription>
            </CardHeader>
            <CardContent>
              {summary ? <p>{summary}</p> : <p>No summary available.</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

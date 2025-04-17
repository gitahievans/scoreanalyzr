
"use client";

import { useState, useCallback } from 'react';
import { analyzeScore, AnalyzeScoreOutput } from '@/ai/flows/analyze-score';
import { generateSummary } from '@/ai/flows/generate-summary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { v4 as uuidv4 } from 'uuid';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface AnalysisHistoryItem {
  id: string;
  pdfUrl: string;
  analysisResult: AnalyzeScoreOutput;
  summary: string;
}

export default function Home() {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeScoreOutput | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    const file = event.target.files?.[0];

    if (!file) {
      setIsLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;

      try {
        const analysis = await analyzeScore({ pdfUrl: dataUrl });
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

        setPdfUrl(dataUrl);
        setAnalysisResult(analysis);
        setSummary(summaryResult.summary);

        // Store the analysis result in history
        const newItem: AnalysisHistoryItem = {
          id: uuidv4(),
          pdfUrl: dataUrl,
          analysisResult: analysis,
          summary: summaryResult.summary,
        };
        setAnalysisHistory(prevHistory => [newItem, ...prevHistory]);

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
  }, [analyzeScore, generateSummary]);

  const handleClearHistory = () => {
    setAnalysisHistory([]);
  };

  return (
    <div className="min-h-screen bg-secondary text-foreground">
      <div className="container mx-auto p-6 flex flex-col">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Score Insights</h1>
          <p className="text-muted-foreground">Upload music scores to extract key musical elements and generate summaries.</p>
        </header>

        <section className="mb-6">
          <Label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload PDF Music Score
          </Label>
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="pdf-upload"
          />
        </section>

        {isLoading && <p className="text-info">Analyzing score...</p>}

        {analysisResult && summary && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-card shadow-md rounded-lg overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Musical Elements</CardTitle>
                <CardDescription>Extracted from the score</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
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

            <Card className="bg-card shadow-md rounded-lg overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Summary</CardTitle>
                <CardDescription>Overall structure, harmonic content, and notable features</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                {summary ? <p>{summary}</p> : <p>No summary available.</p>}
              </CardContent>
            </Card>
          </section>
        )}

        <section>
          <div className="md:flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-primary mb-2 md:mb-0">Analysis History</h2>
            <Button variant="outline" size="sm" onClick={handleClearHistory}>Clear History</Button>
          </div>
          {analysisHistory.length > 0 ? (
            <ScrollArea className="rounded-md border h-[300px] md:h-[400px] bg-history-background">
               <Accordion type="multiple" className="w-full">
                {analysisHistory.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="font-medium">{item.analysisResult.timeSignature} - {item.analysisResult.keySignature}</AccordionTrigger>
                    <AccordionContent>
                      <Card className="mb-4">
                        <CardHeader>
                          <CardTitle>Analysis Result</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p><strong>Time Signature:</strong> {item.analysisResult.timeSignature}</p>
                          <p><strong>Key Signature:</strong> {item.analysisResult.keySignature}</p>
                          <p><strong>Tempo Markings:</strong> {item.analysisResult.tempoMarkings}</p>
                          <p><strong>Dynamics:</strong> {item.analysisResult.dynamics}</p>
                          <p><strong>Musical Instructions:</strong> {item.analysisResult.musicalInstructions}</p>
                          <p><strong>Overall Structure:</strong> {item.analysisResult.overallStructure}</p>
                          <p><strong>Harmonic Content:</strong> {item.analysisResult.harmonicContent}</p>
                          <p><strong>Notable Features:</strong> {item.analysisResult.notableFeatures}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p>{item.summary}</p>
                        </CardContent>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          ) : (
            <p className="text-muted-foreground">No analysis history available.</p>
          )}
        </section>
      </div>
    </div>
  );
}

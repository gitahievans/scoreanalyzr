"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { notifications } from "@mantine/notifications";
import {
  IconMusic,
  IconX,
  IconRefresh,
  IconSparkles,
  IconBrain,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScoreData } from "@/contexts/ScoreDataContext";
import { useScoreSummary } from "@/hooks/useScoreSummary"; // Import the new hook
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface AnalysisDisplayProps {
  onProcessingChange: (isProcessing: boolean) => void;
}

export default function AnalysisDisplay({
  onProcessingChange,
}: AnalysisDisplayProps) {
  const { scoreData: data, isLoading, error, refetch } = useScoreData();
  const {
    summary,
    isGenerating,
    error: summaryError,
    generateSummary,
    canGenerate,
  } = useScoreSummary();

  console.log("ScoreData from context:", data);

  useEffect(() => {
    if (data?.score?.processed || data?.task_status?.state === "FAILURE") {
      onProcessingChange(false);
    } else if (data?.task_status?.state === "PENDING" || isLoading) {
      onProcessingChange(true);
    }
  }, [data, isLoading, onProcessingChange]);

  if (error) {
    return (
      <div className="space-y-6 p-4">
        <h2 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
          <IconMusic className="h-6 w-6" /> Score Analysis Results
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error.message}</p>
            <Button className="mt-4" onClick={() => refetch()}>
              <IconRefresh className="mr-2 h-4 w-4" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoading && !data && !error) {
    return (
      <div className="space-y-6 p-4">
        <h2 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
          <IconMusic className="h-6 w-6" /> Score Analysis Results
        </h2>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">
              Upload or select a score to see analysis results.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
        <IconMusic className="h-6 w-6" /> Score Analysis Results
      </h2>

      {isLoading ||
      (data &&
        !data.score?.processed &&
        data.task_status?.state === "PENDING") ? (
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-2"></div>
            <p>
              {data?.task_status?.info ||
                "Let the magic unfold, it might take a while..."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results">Analysis Results</TabsTrigger>
            <TabsTrigger value="summary">AI Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>{data?.score?.title || "No title"}</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.score?.results ? (
                  <div className="space-y-6">
                    {/* Basic Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-600 mb-1">
                          Key Signature
                        </div>
                        <div className="text-lg font-bold text-blue-900">
                          {data.score.results.key}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="text-sm font-medium text-green-600 mb-1">
                          Time Signature
                        </div>
                        <div className="text-lg font-bold text-green-900">
                          {data.score.results.time_signature}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="text-sm font-medium text-purple-600 mb-1">
                          Tempo
                        </div>
                        <div className="text-lg font-bold text-purple-900">
                          {data.score.results.tempo}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                        <div className="text-sm font-medium text-amber-600 mb-1">
                          Parts
                        </div>
                        <div className="text-sm font-semibold text-amber-900">
                          {data.score.results.parts?.join(", ")}
                        </div>
                      </div>
                    </div>

                    {/* Chord Progression Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Chord Progression
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({data.score.results.chords?.length || 0} chords
                          detected)
                        </span>
                      </div>

                      {data.score.results.chords &&
                      data.score.results.chords.length > 0 ? (
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex flex-wrap gap-2">
                            {data.score.results.chords.map((chord, index) => (
                              <div
                                key={index}
                                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                  chord.pitch ===
                                  "Chord Symbol Cannot Be Identified"
                                    ? "bg-red-100 text-red-700 border border-red-200"
                                    : "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
                                }`}
                              >
                                <span className="font-semibold">
                                  {chord.pitch}
                                </span>
                                <span className="ml-2 text-xs opacity-75">
                                  @{chord.offset}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg border text-center text-gray-500">
                          No chord progression detected
                        </div>
                      )}
                    </div>

                    {/* Lyrics Section */}
                    {data.score.results.lyrics &&
                      data.score.results.lyrics.length > 0 &&
                      data.score.results.lyrics[0] !== "No lyrics found" && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Lyrics
                          </h3>
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="text-green-800 leading-relaxed">
                              {data.score.results.lyrics.join(" • ")}
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Additional Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-2">
                          Composer
                        </div>
                        <div className="text-gray-800">
                          {data.score.results.composer !== "No composer found"
                            ? data.score.results.composer
                            : "Unknown"}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-gray-600 mb-2">
                          Date
                        </div>
                        <div className="text-gray-800">
                          {data.score.results.date !== "No date found"
                            ? data.score.results.date
                            : "Unknown"}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <IconMusic className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-gray-500">
                      No analysis results available for this score.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBrain className="h-5 w-5" />
                  AI-Generated Musical Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!canGenerate ? (
                  <Alert>
                    <AlertDescription>
                      Analysis results are required before generating an AI
                      summary.
                    </AlertDescription>
                  </Alert>
                ) : !summary && !isGenerating ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      Generate an AI-powered musical analysis and summary of
                      this score.
                    </p>
                    <Button
                      onClick={generateSummary}
                      className="flex items-center gap-2"
                    >
                      <IconSparkles className="h-4 w-4" />
                      Generate AI Summary
                    </Button>
                  </div>
                ) : isGenerating ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-2"></div>
                    <p>Generating AI summary...</p>
                  </div>
                ) : summaryError ? (
                  <div className="space-y-4">
                    <Alert variant="destructive">
                      <AlertDescription>{summaryError}</AlertDescription>
                    </Alert>
                    <Button onClick={generateSummary} variant="outline">
                      <IconRefresh className="mr-2 h-4 w-4" /> Retry
                    </Button>
                  </div>
                ) : summary ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Summary</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {summary.summary}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Musical Characteristics
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {summary.musicalCharacteristics}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Harmonic Analysis
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {summary.harmonicAnalysis}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Structural Insights
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {summary.structuralInsights}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Performance Notes
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {summary.performanceNotes}
                      </p>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={generateSummary}
                        variant="outline"
                        size="sm"
                      >
                        <IconRefresh className="mr-2 h-4 w-4" /> Regenerate
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

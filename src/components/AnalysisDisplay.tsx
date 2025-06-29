"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScoreData } from "@/contexts/ScoreDataContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import OSMDComponent from "./OSMDComponent";
import { Brain, FileMusic, Music, RefreshCcw, Sparkles } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AnalysisDisplayProps {
  onProcessingChange: (isProcessing: boolean) => void;
}

const renderFormattedText = (text: string) => {
  // Split text into paragraphs
  const paragraphs = text.split("\n\n");

  return paragraphs
    .map((paragraph, pIndex) => {
      if (!paragraph.trim()) return null;

      // Process each paragraph for inline formatting
      const processInlineFormatting = (text: string) => {
        const parts = [];
        let currentIndex = 0;

        // Regular expression to match **bold**, ***italic***, and other patterns
        const formatRegex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
        let match;

        while ((match = formatRegex.exec(text)) !== null) {
          // Add text before the match
          if (match.index > currentIndex) {
            parts.push(text.slice(currentIndex, match.index));
          }

          const matchedText = match[0];
          const content = matchedText.replace(/\*/g, "");

          // Determine formatting based on number of asterisks
          if (matchedText.startsWith("***")) {
            parts.push(
              <strong
                key={`bold-${match.index}`}
                className="font-bold text-gray-900"
              >
                {content}
              </strong>
            );
          } else if (matchedText.startsWith("**")) {
            parts.push(
              <strong
                key={`bold-${match.index}`}
                className="font-semibold text-gray-800"
              >
                {content}
              </strong>
            );
          } else if (matchedText.startsWith("*")) {
            parts.push(
              <em
                key={`italic-${match.index}`}
                className="italic text-gray-700"
              >
                {content}
              </em>
            );
          }

          currentIndex = match.index + matchedText.length;
        }

        // Add remaining text
        if (currentIndex < text.length) {
          parts.push(text.slice(currentIndex));
        }

        return parts.length > 0 ? parts : [text];
      };

      return (
        <p key={pIndex} className="mb-4 text-gray-700 leading-relaxed">
          {processInlineFormatting(paragraph)}
        </p>
      );
    })
    .filter(Boolean);
};

export default function AnalysisDisplay({
  onProcessingChange,
}: AnalysisDisplayProps) {
  const { scoreData: data, isLoading, error, refetch } = useScoreData();
  const [musicXmlLoaded, setMusicXmlLoaded] = useState(false);
  const [musicXmlError, setMusicXmlError] = useState<string | null>(null);
  const [renderOptions] = useState({
    drawTitle: true,
    drawComposer: true,
    drawFingerings: false,
  });
  const [musicXmlContent, setMusicXmlContent] = useState<string | null>(null);
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  console.log("ScoreData from context:", data);

  useEffect(() => {
    if (data?.score?.processed || data?.task_status?.state === "FAILURE") {
      onProcessingChange(false);
    } else if (data?.task_status?.state === "PENDING" || isLoading) {
      onProcessingChange(true);
    }
  }, [data, isLoading, onProcessingChange]);

  useEffect(() => {
    if (data?.score?.processed && data?.task_status?.state !== "PENDING") {
      const fetchMusicXml = async () => {
        try {
          console.log(
            "Attempting to fetch MusicXML from:",
            `${API_URL}${data?.score?.musicxml_url}`
          );

          const response = await fetch(
            `${API_URL}${data?.score?.musicxml_url}`,
            {
              method: "GET",
              headers: {
                Accept:
                  "application/xml, text/xml, application/vnd.recordare.musicxml+xml, */*",
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              `HTTP error! status: ${response.status} - ${response.statusText}`
            );
          }

          const contentType = response.headers.get("content-type");
          console.log("Response content type:", contentType);

          const textContent = await response.text();
          console.log("Response length:", textContent.length);
          console.log("First 200 characters:", textContent.substring(0, 200));

          if (
            !textContent.trim().startsWith("<?xml") &&
            !textContent.trim().startsWith("<")
          ) {
            throw new Error("Response is not valid XML format");
          }

          if (
            !textContent.includes("score-partwise") &&
            !textContent.includes("score-timewise")
          ) {
            console.warn(
              "Warning: Content doesn't appear to be MusicXML format"
            );
          }

          setMusicXmlContent(textContent);
          setMusicXmlError(null);
          setFetchAttempts(0);
          console.log("MusicXML fetched successfully");
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          console.error("Failed to fetch MusicXML:", errorMessage);

          if (
            fetchAttempts < 3 &&
            (errorMessage.includes("network") ||
              errorMessage.includes("timeout"))
          ) {
            console.log(`Retrying fetch attempt ${fetchAttempts + 1}/3`);
            setFetchAttempts((prev) => prev + 1);
            setTimeout(() => {
              // Retry after a delay
            }, 2000 * (fetchAttempts + 1));
            return;
          }

          setMusicXmlError(`Failed to fetch MusicXML: ${errorMessage}`);
          setMusicXmlContent(null);
          setFetchAttempts(0);
        }
      };

      fetchMusicXml();
    }
  }, [data?.score?.processed, data?.task_status?.state, fetchAttempts]);

  // OSMD event handlers
  const handleMusicLoad = () => {
    console.log("MusicXML loaded successfully in OSMD");
    setMusicXmlLoaded(true);
    setMusicXmlError(null);
  };

  const handleMusicError = (error: string) => {
    console.error("OSMD Error:", error);
    setMusicXmlError(error);
    setMusicXmlLoaded(false);
  };

  // Manual retry function
  const retryFetch = () => {
    setFetchAttempts(0);
    setMusicXmlError(null);
    setMusicXmlContent(null);
    refetch();
  };

  // Create a properly structured data object for the summary generation
  const createSummaryData = () => {
    if (!data?.score?.results) return null;

    return {
      score: {
        processed: data.score.processed,
        analysis_results: data.score.results,
        title: data.score.title,
        composer: data.score.composer,
      },
      task_status: data.task_status,
    };
  };

  const handleGenerateSummary = async () => {
    // Check if we have a score ID
    if (!data?.score?.id) {
      setSummaryError("No score ID available for summary generation");
      return;
    }

    setIsGeneratingSummary(true);
    setSummaryError(null);

    try {
      const response = await fetch(`${API_URL}/api/generate-summary/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ score_id: data.score.id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Check if the response has the expected structure
      if (result.status === "success" && result.summary) {
        setSummary(result.summary);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate summary";
      setSummaryError(errorMessage);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6 p-4">
        <h2 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
          <Music className="h-6 w-6" /> Score Analysis Results
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error.message}</p>
            <Button className="mt-4" onClick={() => refetch()}>
              Retry
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
          <Music className="h-6 w-6" /> Score Analysis Results
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
        <Music className="h-6 w-6" /> Score Analysis Results
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="results">Analysis Results</TabsTrigger>
            <TabsTrigger value="musicxml">Sheet Music</TabsTrigger>
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

                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
                        <div className="text-sm font-medium text-amber-600 mb-1">
                          Parts
                        </div>
                        <div className="text-sm font-semibold text-amber-900">
                          {data.score.results.parts?.join(", ")}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                        <div className="text-sm font-medium text-purple-600 mb-1">
                          MusicXML
                        </div>
                        <div className="flex items-center gap-2">
                          <FileMusic className="h-4 w-4 text-purple-700" />
                          <span className="text-sm font-semibold text-purple-900">
                            {musicXmlContent ? "Available" : "Not Available"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Chord Progression Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          A few chords detected
                        </h3>
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
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <Music className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-gray-500">
                      No analysis results available for this score.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="musicxml">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileMusic className="h-5 w-5" />
                  Sheet Music Viewer
                </CardTitle>
                {musicXmlContent && (
                  <div className="text-sm text-gray-500">
                    Rendered from: {data?.score?.title || "Untitled Score"}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {musicXmlContent ? (
                  <div className="space-y-4">
                    {musicXmlError && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          Failed to load sheet music: {musicXmlError}
                        </AlertDescription>
                      </Alert>
                    )}

                    {musicXmlError && (
                      <Alert className="mb-4">
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <span>
                              Error loading sheet music: {musicXmlError}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={retryFetch}
                              className="ml-4"
                            >
                              Retry
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {musicXmlLoaded && !musicXmlError && (
                      <Alert>
                        <AlertDescription className="text-green-700">
                          Sheet music loaded successfully! You can scroll and
                          zoom to explore the notation.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="w-full min-h-[600px] bg-white rounded-lg border border-gray-200">
                      <OSMDComponent
                        musicXML={musicXmlContent}
                        showLoadingSpinner={true}
                        onLoad={handleMusicLoad}
                        onError={handleMusicError}
                        renderingOptions={renderOptions}
                        className="w-full h-full"
                        height={600}
                      />
                    </div>

                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <div>Use mouse wheel to zoom, click and drag to pan</div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const blob = new Blob([musicXmlContent], {
                              type: "application/xml",
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = "score.musicxml";
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          Download MusicXML
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <FileMusic className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No MusicXML Available
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      The sheet music notation is not available for this score.
                      This could happen if the analysis is still processing or
                      if the original image couldn't be converted to MusicXML
                      format.
                    </p>
                    {data?.score && !data.score.processed && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          onClick={() => refetch()}
                          className="flex items-center gap-2"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Check Again
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Generated Musical Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{summaryError}</AlertDescription>
                  </Alert>
                )}
                {isGeneratingSummary ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-3"></div>
                    <p className="text-gray-600">Generating AI summary...</p>
                  </div>
                ) : summary ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                      <div className="text-gray-800">
                        {renderFormattedText(summary)}
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={handleGenerateSummary}
                        variant="outline"
                        size="sm"
                        disabled={isGeneratingSummary}
                        className="flex items-center gap-2 hover:bg-gray-50"
                      >
                        <RefreshCcw className="h-4 w-4" /> Regenerate Summary
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Brain className="h-16 w-16 mx-auto opacity-50" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No AI Summary Yet
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Generate an AI-powered musical analysis and summary of
                      this score to get insights about its style, structure, and
                      characteristics.
                    </p>
                    <Button
                      onClick={handleGenerateSummary}
                      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      disabled={isGeneratingSummary || !data?.score?.id}
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate AI Summary
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

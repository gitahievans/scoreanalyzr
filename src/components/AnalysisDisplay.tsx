"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScoreData } from "@/contexts/ScoreDataContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import OSMDComponent from "./OSMDComponent";
import {
  Brain,
  FileMusic,
  Music,
  RefreshCcw,
  Sparkles,
  Download,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { renderFormattedText } from "@/lib/renderText";
import { Divider } from "@mantine/core";
import AnalysisResults from "./AnalysisResults";
import MidiPlayer from "./MidiPlayer";
import MusicTheoryLoader from "./MusicTheoryContent ";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AnalysisDisplayProps {
  onProcessingChange: (isProcessing: boolean) => void;
}

export default function AnalysisDisplay({
  onProcessingChange,
}: AnalysisDisplayProps) {
  const { scoreData: data, isLoading, error, refetch } = useScoreData();
  const [musicXmlLoaded, setMusicXmlLoaded] = useState(false);
  const [musicXmlError, setMusicXmlError] = useState<string | null>(null);
  const [musicXmlContent, setMusicXmlContent] = useState<string | null>(null);
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [cleanedText, setCleanedText] = useState<string | null>(null);

  // MIDI data state (only for download)
  const [midiData, setMidiData] = useState<ArrayBuffer | null>(null);
  const [midiError, setMidiError] = useState<string | null>(null);
  const [isLoadingMidi, setIsLoadingMidi] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [midiPlayer, setMidiPlayer] = useState<any>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [parsedMidi, setParsedMidi] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const isServerError = (error: any): boolean => {
    return error?.isServerError || (error?.status && error.status >= 500);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

          const textContent = await response.text();

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

      const fetchMidiData = async () => {
        if (!data?.score?.midi_url) {
          console.log("No MIDI URL available");
          return;
        }

        setIsLoadingMidi(true);
        setMidiError(null);

        try {
          const response = await fetch(`${API_URL}${data.score.midi_url}`, {
            method: "GET",
            headers: {
              Accept: "audio/midi, audio/x-midi, */*",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          console.log("MIDI data fetched, size:", arrayBuffer.byteLength);

          setMidiData(arrayBuffer);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";
          console.error("Failed to fetch MIDI:", errorMessage);
          setMidiError(`Failed to fetch MIDI: ${errorMessage}`);
        } finally {
          setIsLoadingMidi(false);
        }
      };

      fetchMusicXml();
      fetchMidiData();
    }
  }, [data?.score?.processed, data?.task_status?.state, fetchAttempts]);

  // OSMD event handlers
  const handleMusicLoad = () => {
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
    setMidiError(null);
    setMidiData(null);
    refetch();
  };

  const handleGenerateSummary = async () => {
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

      if (result.status === "success") {
        if (result.summary) {
          setSummary(result.summary);
        }
        if (result.cleaned_text) {
          setCleanedText(result.cleaned_text);
        }
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

  const handleDownloadMusicXml = () => {
    if (!musicXmlContent) return;

    const blob = new Blob([musicXmlContent], {
      type: "application/xml",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "score.musicxml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMidi = () => {
    if (!midiData) return;

    const blob = new Blob([midiData], {
      type: "audio/midi",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "score.mid";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) {
    const isServerErr = isServerError(error);

    return (
      <div className="space-y-6 p-4">
        <h2 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
          <Music className="h-6 w-6" /> Score Analysis Results
        </h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isServerErr ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Server Error
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Connection Error
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium">
                  {isServerErr
                    ? "The server encountered an error while processing your score."
                    : "Unable to connect to the server."}
                </p>
                <p className="text-red-600 text-sm mt-2">{error.message}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Try Again
                </Button>

                {isServerErr && (
                  <Button
                    variant="secondary"
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Refresh Page
                  </Button>
                )}
              </div>

              {isServerErr && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>What you can do:</strong>
                  </p>
                  <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                    <li>
                      • It is likely your file is too large or too complex. If
                      it is an image, it might be of very low resolution to be
                      processed.
                    </li>
                    <li>• Check if the file you uploaded is valid</li>
                    <li>• Try uploading a different score</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoading && !data && !error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
          <Music className="h-6 w-6" /> Score Analysis Results
        </h2>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-gray-500">
              Upload or select a score to see analysis results.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:p-6 rounded-xl">
      <h2 className="text-xl sm:text-2xl font-bold text-orange-600 flex items-center gap-2 px-2 sm:px-0">
        <Music className="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="hidden sm:inline">Score Analysis Results</span>
        <span className="sm:hidden">Analysis Results</span>
      </h2>

      {isLoading ||
      (data &&
        !data.score?.processed &&
        data.task_status?.state === "PENDING") ? (
        <MusicTheoryLoader
          message="Analyzing your music score with Audiveris..."
          className="my-custom-classes"
        />
      ) : (
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-gray-100 rounded-lg">
            <TabsTrigger
              value="results"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-3 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all min-h-[60px] sm:min-h-[40px]"
            >
              <span className="sm:hidden text-center leading-tight">
                Results
              </span>
              <span className="hidden sm:inline">Analysis Results</span>
            </TabsTrigger>
            <TabsTrigger
              value="musicxml"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-3 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all min-h-[60px] sm:min-h-[40px]"
            >
              <span className="sm:hidden text-center leading-tight">
                Sheet
                <br />
                Music
              </span>
              <span className="hidden sm:inline">Sheet Music</span>
            </TabsTrigger>
            <TabsTrigger
              value="midi"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-3 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all min-h-[60px] sm:min-h-[40px]"
            >
              <span className="sm:hidden text-center leading-tight">
                MIDI
                <br />
                Player
              </span>
              <span className="hidden sm:inline">MIDI Player</span>
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-3 text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all min-h-[60px] sm:min-h-[40px]"
            >
              <span className="sm:hidden text-center leading-tight">
                AI
                <br />
                Summary
              </span>
              <span className="hidden sm:inline">AI Summary</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="mt-6">
            <Card>
              <CardHeader className="pb-4">
                <h1 className="text-xl sm:text-2xl font-semibold px-2 sm:px-0">
                  {data?.score?.title || "No title"}
                </h1>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                {data?.score?.results ? (
                  <AnalysisResults
                    results={data.score.results}
                    musicXmlContent={musicXmlContent}
                    parsedMidi={parsedMidi}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <Music className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-gray-500 px-4">
                      No analysis results available for this score.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="musicxml" className="mt-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4">
                  <CardTitle className="flex items-center gap-2 px-2 sm:px-0">
                    <FileMusic className="h-5 w-5" />
                    Sheet Music Viewer
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2 px-2 sm:px-0">
                    {musicXmlContent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadMusicXml}
                        className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 h-10 w-full sm:w-auto"
                      >
                        <Download className="h-4 w-4" />
                        Download XML
                      </Button>
                    )}
                  </div>
                </div>
                {musicXmlContent && (
                  <div className="text-sm text-gray-500 mt-2 px-2 sm:px-0">
                    Rendered from: {data?.score?.title || "Untitled Score"}
                  </div>
                )}
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                {musicXmlContent ? (
                  <div className="space-y-4">
                    {musicXmlError && (
                      <Alert className="mb-4">
                        <AlertDescription>
                          <div className="flex flex-col gap-3">
                            <span className="text-sm">
                              It was not possible to generate MusicXML from the
                              file you uploaded.
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={retryFetch}
                              className="w-full sm:w-auto"
                            >
                              Retry
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}

                    {musicXmlLoaded && !musicXmlError && (
                      <Alert>
                        <AlertDescription className="text-green-700 text-sm">
                          Sheet music loaded successfully!
                          <span className="hidden sm:inline">
                            {" "}
                            You can scroll and zoom to explore the notation.
                          </span>
                        </AlertDescription>
                      </Alert>
                    )}

                    <OSMDComponent
                      musicXML={musicXmlContent}
                      showLoadingSpinner={true}
                      onLoad={handleMusicLoad}
                      onError={handleMusicError}
                      className="w-full h-full"
                    />

                    <div className="text-xs text-gray-500 text-center">
                      <span className="hidden sm:inline">
                        Use mouse wheel to zoom, click and drag to pan
                      </span>
                      <span className="sm:hidden">
                        Pinch to zoom, drag to pan
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 px-4">
                    <div className="text-gray-400 mb-4">
                      <FileMusic className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                      No MusicXML Available
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
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
                          className="flex items-center gap-2 w-full sm:w-auto"
                          size="sm"
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

          <TabsContent value="midi" className="mt-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 px-2 sm:px-0">
                  <Music className="h-5 w-5" />
                  MIDI Player
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <div className="space-y-4">
                  {isLoadingMidi && (
                    <Alert>
                      <AlertDescription className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                        Loading MIDI file...
                      </AlertDescription>
                    </Alert>
                  )}

                  {midiError && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-sm">
                        It was not possible to generate MIDI from the file you
                        uploaded.
                      </AlertDescription>
                    </Alert>
                  )}

                  {playbackError && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-sm">
                        {playbackError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {midiData && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadMidi}
                      className="flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 h-10 w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4" />
                      Download MIDI
                    </Button>
                  )}

                  {midiData && !midiError && parsedMidi && (
                    <Alert>
                      <AlertDescription className="text-green-700 text-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                          <span>MIDI playback ready</span>
                          <span className="hidden sm:inline">•</span>
                          <span>Duration: {formatTime(duration)}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{parsedMidi.tracks.length} track(s)</span>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <MidiPlayer
                    midiData={midiData}
                    midiError={midiError}
                    isLoadingMidi={isLoadingMidi}
                    onDownloadMidi={handleDownloadMidi}
                    API_URL={API_URL}
                    midiUrl={data?.score?.midi_url}
                  />

                  {midiData && !midiError && parsedMidi && (
                    <div className="text-orange-600 flex items-center justify-center sm:justify-start gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isPlaying
                              ? "bg-green-500 animate-pulse"
                              : "bg-gray-400"
                          }`}
                        ></div>
                        <span className="text-sm">
                          {isPlaying ? "Playing" : "Ready"} •{" "}
                          {formatTime(duration)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 px-2 sm:px-0">
                  <Brain className="h-5 w-5" />
                  AI-Generated Musical Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                {summaryError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription className="text-sm">
                      {summaryError}
                    </AlertDescription>
                  </Alert>
                )}
                {isGeneratingSummary ? (
                  <div className="flex flex-col items-center justify-center p-8 gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    <p className="text-gray-600 text-center">
                      Generating AI summary...
                    </p>
                  </div>
                ) : summary ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                      <div className="text-gray-800 space-y-4">
                        <div>{renderFormattedText(summary)}</div>
                        <Divider className="my-4" />
                        <div>{renderFormattedText(cleanedText || "")}</div>
                      </div>
                    </div>
                    <div className="flex justify-center sm:justify-end pt-2">
                      <Button
                        onClick={handleGenerateSummary}
                        variant="outline"
                        size="sm"
                        disabled={isGeneratingSummary}
                        className="flex items-center gap-2 hover:bg-gray-50 w-full sm:w-auto"
                      >
                        <RefreshCcw className="h-4 w-4" /> Regenerate Summary
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center py-8 sm:py-12 px-4">
                    <div className="text-gray-400 mb-4">
                      <Brain className="h-12 w-12 sm:h-16 sm:w-16 mx-auto opacity-50" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                      No AI Summary Yet
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500 mb-6 max-w-md mx-auto">
                      Generate an AI-powered musical analysis and summary of
                      this score to get insights about its style, structure, and
                      characteristics.
                    </p>
                    <Button
                      onClick={handleGenerateSummary}
                      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 w-full sm:w-auto"
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

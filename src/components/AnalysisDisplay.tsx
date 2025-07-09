"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { renderFormattedText } from "@/lib/renderText";
import { Divider } from "@mantine/core";
import AnalysisResults from "./AnalysisResults";
import MusicTheoryLoader from "./MusicTheoryContent ";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
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
  const [isMidiLoading, setIsMidiLoading] = useState(false); // New state for loading isLoading, setIsLoading] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (midiData && !parsedMidi) {
      initializeMidiPlayer();
    }
  }, [midiData, parsedMidi]);

  // Cleanup effect for progress tracking
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Add this function to initialize the MIDI player
  const initializeMidiPlayer = async () => {
    setIsMidiLoading(true);
    try {
      // Parse MIDI data using @tonejs/midi
      const midi = new Midi(midiData!);
      console.log("Parsed MIDI:", midi);

      // Create a polyphonic synthesizer for better sound
      const synth = new Tone.PolySynth(Tone.Synth).toDestination();

      setParsedMidi(midi);
      setMidiPlayer({ synth, midi });
      setDuration(midi.duration);
      setPlaybackError(null);
    } catch (error) {
      console.error("Failed to initialize MIDI player:", error);
      setPlaybackError("Failed to parse MIDI file");
    } finally {
      setIsMidiLoading(false);
    }
  };

  // Helper function to format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Helper function to start progress tracking
  const startProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      const transportTime = Tone.Transport.seconds;
      setCurrentTime(transportTime);

      // Auto-stop if we've reached the end
      if (transportTime >= duration) {
        stopPlayback();
      }
    }, 100); // Update every 100ms for smooth progress
  };

  // Helper function to stop progress tracking
  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Helper function to stop playback
  const stopPlayback = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    stopProgressTracking();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Add this function to handle seeking
  const handleSeek = (newTime: number) => {
    if (!midiPlayer || !parsedMidi) return;

    const wasPlaying = isPlaying;

    // Stop current playback
    if (isPlaying) {
      stopPlayback();
    }

    // Set new position
    setCurrentTime(newTime);

    // If was playing, restart from new position
    if (wasPlaying) {
      startPlaybackFromTime(newTime);
    }
  };

  // Helper function to start playback from specific time
  const startPlaybackFromTime = async (startTime: number = 0) => {
    if (!midiPlayer || !parsedMidi) return;

    try {
      // Start audio context if suspended
      if (Tone.context.state === "suspended") {
        await Tone.start();
      }

      // Clear any existing scheduled events
      Tone.Transport.cancel();

      const { synth, midi } = midiPlayer;

      // Schedule all MIDI events from the start time
      midi.tracks.forEach((track: any) => {
        track.notes.forEach((note: any) => {
          if (note.time >= startTime) {
            Tone.Transport.schedule((time: number) => {
              synth.triggerAttackRelease(
                note.name,
                note.duration,
                time,
                note.velocity
              );
            }, note.time - startTime);
          }
        });
      });

      // Start transport and progress tracking
      Tone.Transport.start();
      startProgressTracking();
      setIsPlaying(true);
    } catch (error) {
      console.error("Playback error:", error);
      setPlaybackError(
        "Playback failed: " +
          (error instanceof Error ? error.message : String(error))
      );
      setIsPlaying(false);
    }
  };

  // Add this function to handle play/pause
  const togglePlayback = async () => {
    if (!midiPlayer || !parsedMidi) return;

    if (isPlaying) {
      stopPlayback();
    } else {
      await startPlaybackFromTime(currentTime);
    }
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

      const fetchMidiData = async () => {
        if (!data?.score?.midi_url) {
          console.log("No MIDI URL available");
          return;
        }

        setIsLoadingMidi(true);
        setMidiError(null);

        try {
          console.log(
            "Fetching MIDI from:",
            `${API_URL}${data.score.midi_url}`
          );

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
    setMidiError(null);
    setMidiData(null);
    refetch();
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
          <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
            <TabsTrigger value="results" className="px-2 sm:px-4">
              <span className="hidden sm:inline">Analysis Results</span>
              <span className="sm:hidden">Results</span>
            </TabsTrigger>
            <TabsTrigger value="musicxml" className="px-2 sm:px-4">
              <span className="hidden sm:inline">Sheet Music</span>
              <span className="sm:hidden">Music</span>
            </TabsTrigger>
            <TabsTrigger value="summary" className="px-2 sm:px-4">
              <span className="hidden sm:inline">AI Summary</span>
              <span className="sm:hidden">Summary</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <h1 className="text-2xl font-semibold">
                  {data?.score?.title || "No title"}
                </h1>
              </CardHeader>
              <CardContent>
                {data?.score?.results ? (
                  <AnalysisResults
                    results={data.score.results}
                    musicXmlContent={musicXmlContent}
                  />
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <FileMusic className="h-5 w-5" />
                    Sheet Music Viewer
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* MIDI Playback Controls */}
                    {midiData && !midiError && (
                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        {/* Play/Pause and Time Display */}
                        <div className="flex items-center gap-2 justify-between sm:justify-start">
                          <div className="flex items-center gap-2">
                            <Button
                              variant={isPlaying ? "default" : "outline"}
                              size="sm"
                              onClick={togglePlayback}
                              disabled={!midiPlayer || isMidiLoading}
                              className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-9"
                            >
                              {isMidiLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                  <span className="hidden xs:inline">
                                    Loading
                                  </span>
                                </>
                              ) : isPlaying ? (
                                <>
                                  <div className="h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center">
                                    <div className="h-2 w-2 bg-white rounded-sm"></div>
                                  </div>
                                  <span className="hidden xs:inline">
                                    Pause
                                  </span>
                                </>
                              ) : (
                                <>
                                  <div className="h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center">
                                    <div className="w-0 h-0 border-l-[6px] border-l-current border-y-[4px] border-y-transparent"></div>
                                  </div>
                                  <span className="hidden xs:inline">Play</span>
                                </>
                              )}
                            </Button>

                            {/* Stop Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                stopPlayback();
                                setCurrentTime(0);
                              }}
                              disabled={!midiPlayer || isMidiLoading}
                              className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-9"
                            >
                              <div className="h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center">
                                <div className="h-2 w-2 bg-current"></div>
                              </div>
                              <span className="hidden xs:inline">Stop</span>
                            </Button>
                          </div>

                          {/* Time Display */}
                          {parsedMidi && (
                            <div className="text-xs sm:text-sm text-gray-600 font-mono">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {parsedMidi && (
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 relative">
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-orange-500 transition-all duration-100 ease-linear"
                                  style={{
                                    width: `${
                                      duration > 0
                                        ? (currentTime / duration) * 100
                                        : 0
                                    }%`,
                                  }}
                                ></div>
                              </div>
                              {/* Clickable overlay for seeking */}
                              <button
                                className="absolute inset-0 w-full h-full cursor-pointer hover:bg-black hover:bg-opacity-10 rounded-full"
                                onClick={(e) => {
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  const x = e.clientX - rect.left;
                                  const percentage = x / rect.width;
                                  const newTime = percentage * duration;
                                  handleSeek(
                                    Math.max(0, Math.min(newTime, duration))
                                  );
                                }}
                                disabled={!midiPlayer || isMidiLoading}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Download Buttons */}
                    <div className="flex gap-2">
                      {musicXmlContent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadMusicXml}
                          className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-9 w-full sm:w-auto"
                        >
                          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden xs:inline">Download</span> XML
                        </Button>
                      )}
                      {midiData && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadMidi}
                          className="flex items-center justify-center gap-1 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-9 w-full sm:w-auto"
                        >
                          <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden xs:inline">
                            Download
                          </span>{" "}
                          MIDI
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {musicXmlContent && (
                  <div className="text-sm text-gray-500 mt-2">
                    Rendered from: {data?.score?.title || "Untitled Score"}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {musicXmlContent ? (
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
                        <AlertDescription>
                          It was not possible to generate MIDI from the file you
                          uploaded.
                        </AlertDescription>
                      </Alert>
                    )}

                    {playbackError && (
                      <Alert variant="destructive">
                        <AlertDescription>{playbackError}</AlertDescription>
                      </Alert>
                    )}

                    {musicXmlError && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          It was not possible to generate MusicXML from the file
                          you uploaded.
                        </AlertDescription>
                      </Alert>
                    )}

                    {musicXmlError && (
                      <Alert className="mb-4">
                        <AlertDescription>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <span className="text-sm">
                              It was not possible to generate MusicXML from the
                              file you uploaded.
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={retryFetch}
                              className="self-start sm:self-auto"
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
                          Sheet music loaded successfully! You can scroll and
                          zoom to explore the notation.
                          {midiData && !midiError && parsedMidi && (
                            <span className="block mt-1">
                              🎵 MIDI playback ready • Duration:{" "}
                              {formatTime(duration)} •{" "}
                              {parsedMidi.tracks.length} track(s)
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Responsive OSMD container */}
                    <OSMDComponent
                      musicXML={musicXmlContent}
                      showLoadingSpinner={true}
                      onLoad={handleMusicLoad}
                      onError={handleMusicError}
                      className="w-full h-full"
                    />

                    <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 px-2">
                      <div>
                        <span className="hidden sm:inline">
                          Use mouse wheel to zoom, click and drag to pan
                        </span>
                        <span className="sm:hidden">
                          Pinch to zoom, drag to pan
                        </span>
                      </div>
                      {midiData && !midiError && parsedMidi && (
                        <div className="text-orange-600 flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                isPlaying
                                  ? "bg-green-500 animate-pulse"
                                  : "bg-gray-400"
                              }`}
                            ></div>
                            <span className="hidden sm:inline">
                              {isPlaying ? "Playing" : "Ready"} •{" "}
                              {formatTime(duration)}
                            </span>
                            <span className="sm:hidden">
                              {isPlaying ? "▶️" : "⏸️"} {formatTime(duration)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-gray-400 mb-4">
                      <FileMusic className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                      No MusicXML Available
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto px-4">
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
                      <Divider className="my-4" />
                      <div className="text-gray-800">
                        {renderFormattedText(cleanedText || "")}
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
                  <div className="flex flex-col items-center text-center py-12">
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

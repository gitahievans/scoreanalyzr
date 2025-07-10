"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download } from "lucide-react";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";

interface MidiPlayerProps {
  midiData: ArrayBuffer | null;
  midiError: string | null;
  isLoadingMidi: boolean;
  onDownloadMidi: () => void;
  API_URL: string | undefined;
  midiUrl?: string | undefined | null;
}

export default function MidiPlayer({
  midiData,
  midiError,
  isLoadingMidi,
  onDownloadMidi,
  API_URL,
  midiUrl,
}: MidiPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [midiPlayer, setMidiPlayer] = useState<any>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [parsedMidi, setParsedMidi] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMidiLoading, setIsMidiLoading] = useState(false);
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

  // Initialize the MIDI player
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
      const transportTime = Tone.getTransport().seconds;
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
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    stopProgressTracking();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Handle seeking
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
      if (Tone.getContext().state === "suspended") {
        await Tone.start();
      }

      // Clear any existing scheduled events
      Tone.getTransport().cancel();

      const { synth, midi } = midiPlayer;

      // Schedule all MIDI events from the start time
      midi.tracks.forEach((track: any) => {
        track.notes.forEach((note: any) => {
          if (note.time >= startTime) {
            Tone.getTransport().schedule((time: number) => {
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
      Tone.getTransport().start();
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

  // Handle play/pause
  const togglePlayback = async () => {
    if (!midiPlayer || !parsedMidi) return;

    if (isPlaying) {
      stopPlayback();
    } else {
      await startPlaybackFromTime(currentTime);
    }
  };

  if (!midiData && !isLoadingMidi) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 w-full sm:w-auto">
      {/* Loading and Error States */}
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
            It was not possible to generate MIDI from the file you uploaded.
          </AlertDescription>
        </Alert>
      )}

      {playbackError && (
        <Alert variant="destructive">
          <AlertDescription>{playbackError}</AlertDescription>
        </Alert>
      )}

      {/* MIDI Controls */}
      {midiData && !midiError && (
        <>
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
                    <span className="hidden xs:inline">Loading</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <div className="h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center">
                      <div className="h-2 w-2 bg-white rounded-sm"></div>
                    </div>
                    <span className="hidden xs:inline">Pause</span>
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
                        duration > 0 ? (currentTime / duration) * 100 : 0
                      }%`,
                    }}
                  ></div>
                </div>
                {/* Clickable overlay for seeking */}
                <button
                  className="absolute inset-0 w-full h-full cursor-pointer hover:bg-black hover:bg-opacity-10 rounded-full"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    const newTime = percentage * duration;
                    handleSeek(Math.max(0, Math.min(newTime, duration)));
                  }}
                  disabled={!midiPlayer || isMidiLoading}
                />
              </div>
            </div>
          )}

          {/* Status Display */}
          {parsedMidi && (
            <div className="text-orange-600 flex items-center gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isPlaying ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                ></div>
                <span className="hidden sm:inline">
                  {isPlaying ? "Playing" : "Ready"} • {formatTime(duration)}
                </span>
                <span className="sm:hidden">
                  {isPlaying ? "▶️" : "⏸️"} {formatTime(duration)}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

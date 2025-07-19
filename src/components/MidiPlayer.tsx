"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
import { createSampler, INSTRUMENTS } from "@/lib/instruments";
import {
  Download,
  Music,
  Play,
  Pause,
  Square,
  Volume2,
  Settings,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
} from "lucide-react";

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
}: MidiPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [midiPlayer, setMidiPlayer] = useState<any>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [parsedMidi, setParsedMidi] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMidiLoading, setIsMidiLoading] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<string>("piano");
  const [isInstrumentLoading, setIsInstrumentLoading] = useState(false);
  const [showInstrumentSelector, setShowInstrumentSelector] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [tempo, setTempo] = useState(120); // Default BPM
  const [originalTempo, setOriginalTempo] = useState(120); // Store original tempo
  const [volume, setVolume] = useState(80);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);

  useEffect(() => {
    if (midiData && !parsedMidi) {
      initializeMidiPlayer();
    }
  }, [midiData, parsedMidi]);

  // Reinitialize when instrument changes
  useEffect(() => {
    if (parsedMidi && midiPlayer) {
      initializeMidiPlayer();
    }
  }, [selectedInstrument]);

  // Cleanup effect for progress tracking
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Create instrument based on selection
  async function createInstrument(instrumentKey: string) {
    const instrument = INSTRUMENTS[instrumentKey as keyof typeof INSTRUMENTS];

    if (!instrument) {
      throw new Error(
        `Instrument "${instrumentKey}" is not defined in INSTRUMENTS`
      );
    }

    if (instrument?.type === "tonejs-piano") {
      return createSampler("piano").toDestination();
    } else if (instrument?.type === "sampler") {
      return createSampler(instrumentKey).toDestination();
    } else if (instrument?.type === "synth" && instrument.synthType) {
      // Synthesized instrument
      const synthInstance = new instrument.synthType();
      return new Tone.PolySynth(
        synthInstance.constructor as any
      ).toDestination();
    } else {
      throw new Error(
        `Instrument "${instrumentKey}" is missing a valid type or synthType`
      );
    }
  }

  const initializeMidiPlayer = async () => {
    setIsMidiLoading(true);
    setIsInstrumentLoading(true);

    try {
      // Parse MIDI data if not already parsed
      let midi = parsedMidi;
      if (!midi && midiData) {
        midi = new Midi(midiData);
        console.log("Parsed MIDI:", midi);
        setParsedMidi(midi);
        setDuration(midi.duration);

        // Store original tempo from MIDI file
        if (midi.header.tempos && midi.header.tempos.length > 0) {
          const midiTempo = midi.header.tempos[0].bpm;
          setOriginalTempo(midiTempo);
          setTempo(midiTempo); // Initialize with original tempo
        }
      }

      // Create selected instrument
      const instrument = await createInstrument(selectedInstrument);

      setMidiPlayer({ instrument, midi });
      setPlaybackError(null);
    } catch (error) {
      console.error("Failed to initialize MIDI player:", error);
      setPlaybackError(
        `Failed to initialize ${
          INSTRUMENTS[selectedInstrument as keyof typeof INSTRUMENTS]?.name
        }`
      );
    } finally {
      setIsMidiLoading(false);
      setIsInstrumentLoading(false);
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

      // Set the transport BPM to our current tempo
      Tone.getTransport().bpm.value = tempo;

      const { instrument, midi } = midiPlayer;

      // Schedule all MIDI events from the start time
      midi.tracks.forEach((track: any) => {
        track.notes.forEach((note: any) => {
          if (note.time >= startTime) {
            Tone.getTransport().schedule((time: number) => {
              // Use triggerAttackRelease for both samplers and synths
              if (instrument.triggerAttackRelease) {
                instrument.triggerAttackRelease(
                  note?.name,
                  note?.duration,
                  time,
                  note?.velocity
                );
              }
            }, note?.time - startTime);
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

  // Handle tempo change
  const handleTempoChange = (newTempo: number) => {
    setTempo(newTempo);

    // If currently playing, update the transport BPM in real-time
    if (isPlaying) {
      Tone.getTransport().bpm.value = newTempo;
    }

    // Recalculate duration based on tempo change
    if (parsedMidi) {
      const tempoRatio = originalTempo / newTempo;
      setDuration(parsedMidi.duration * tempoRatio);
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

  // Handle instrument change
  const handleInstrumentChange = (instrumentKey: string) => {
    if (isPlaying) {
      stopPlayback();
    }
    setSelectedInstrument(instrumentKey);
    setShowInstrumentSelector(false);
  };

  const instrumentCategories = {
    keyboards: ["piano", "electricpiano", "harpsichord", "pipeorgan"],
    strings: [
      "violin",
      "viola",
      "cello",
      "doublebass",
      "harp",
      "acousticguitar",
      "electricguitar",
      "electricbass",
    ],
    winds: ["flute", "oboe", "clarinet", "bassoon", "saxophone"],
    brass: ["trumpet", "trombone", "frenchhorn", "tuba"],
    vocal: ["choiraahs", "voiceoohs"],
    percussion: ["xylophone", "marimba", "vibraphone"],
    synth: ["synthpad", "synthstrings"],
  };

  if (!midiData && !isLoadingMidi) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Loading and Error States */}
      {isLoadingMidi && (
        <Alert className="border-orange-200 bg-orange-50">
          <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
          <AlertDescription className="text-orange-800">
            Loading MIDI file...
          </AlertDescription>
        </Alert>
      )}

      {isInstrumentLoading && (
        <Alert className="border-blue-200 bg-blue-50">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <AlertDescription className="text-blue-800">
            Loading{" "}
            {INSTRUMENTS[selectedInstrument as keyof typeof INSTRUMENTS]?.name}
            ...
          </AlertDescription>
        </Alert>
      )}

      {midiError && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-800">
            Unable to generate MIDI from the uploaded file.
          </AlertDescription>
        </Alert>
      )}

      {playbackError && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-800">
            {playbackError}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Player Interface */}
      {midiData && !midiError && (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                  <Music className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    MIDI Player
                  </h3>
                  <p className="text-orange-100 text-sm">
                    {
                      INSTRUMENTS[
                        selectedInstrument as keyof typeof INSTRUMENTS
                      ]?.name
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isPlaying ? "bg-green-400 animate-pulse" : "bg-white/50"
                  }`}
                ></div>
                <span className="text-white text-sm font-medium">
                  {isPlaying ? "Playing" : "Ready"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Progress and Time Display */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-2xl font-mono font-bold text-slate-700">
                  {formatTime(currentTime)}
                </div>
                <div className="text-lg text-slate-500 font-mono">
                  {formatTime(duration)}
                </div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="relative group">
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-100 ease-out shadow-sm"
                    style={{
                      width: `${
                        duration > 0 ? (currentTime / duration) * 100 : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <button
                  className="absolute inset-0 w-full h-full cursor-pointer hover:bg-black/5 rounded-full transition-colors"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    const newTime = percentage * duration;
                    handleSeek(Math.max(0, Math.min(newTime, duration)));
                  }}
                  disabled={!midiPlayer || isMidiLoading || isInstrumentLoading}
                />
                {/* Progress indicator dot */}
                <div
                  className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-orange-500 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    left: `${
                      duration > 0 ? (currentTime / duration) * 100 : 0
                    }%`,
                    marginLeft: "-8px",
                  }}
                ></div>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-4 mb-8">
              {/* Stop Button */}
              <Button
                variant="outline"
                size="lg"
                onClick={stopPlayback}
                disabled={!midiPlayer || isMidiLoading || isInstrumentLoading}
                className="w-14 h-14 rounded-full border-2 hover:bg-slate-700 transition-all duration-200"
              >
                <Square className="h-6 w-6" />
              </Button>

              {/* Play/Pause Button */}
              <Button
                variant={isPlaying ? "default" : "outline"}
                size="lg"
                onClick={togglePlayback}
                disabled={!midiPlayer || isMidiLoading || isInstrumentLoading}
                className={`w-20 h-20 rounded-full border-2 transition-all duration-300 shadow-lg ${
                  isPlaying
                    ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-orange-500"
                    : "hover:bg-slate-700 hover:scale-105"
                }`}
              >
                {isMidiLoading || isInstrumentLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </Button>

              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-slate-600" />
                <div className="w-20">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #f97316 0%, #f97316 ${volume}%, #e2e8f0 ${volume}%, #e2e8f0 100%)`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Instrument Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Music className="h-5 w-5 text-orange-600" />
                  <span className="font-semibold text-slate-700">
                    Instrument
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    setShowInstrumentSelector(!showInstrumentSelector)
                  }
                  className="flex items-center gap-2 hover:bg-slate-700"
                  disabled={isInstrumentLoading}
                >
                  <span>
                    {
                      INSTRUMENTS[
                        selectedInstrument as keyof typeof INSTRUMENTS
                      ]?.name
                    }
                  </span>
                  {showInstrumentSelector ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {showInstrumentSelector && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-lg max-h-96 overflow-y-auto">
                  {Object.entries(instrumentCategories).map(
                    ([category, instruments]) => (
                      <div key={category} className="mb-6 last:mb-0">
                        <h4 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide border-b border-slate-200 pb-1">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {instruments.map((key) => (
                            <Button
                              key={key}
                              variant={
                                selectedInstrument === key
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() => handleInstrumentChange(key)}
                              className={`justify-start transition-all duration-200 ${
                                selectedInstrument === key
                                  ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-orange-500"
                                  : "hover:bg-slate-700 hover:border-slate-300"
                              }`}
                              disabled={isInstrumentLoading}
                            >
                              {
                                INSTRUMENTS[key as keyof typeof INSTRUMENTS]
                                  ?.name
                              }
                            </Button>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Advanced Controls */}
            <div>
              <Button
                variant="ghost"
                onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                className="flex items-center gap-2 mb-4 hover:bg-slate-700"
              >
                <Settings className="h-4 w-4" />
                <span>Advanced Controls</span>
                {showAdvancedControls ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showAdvancedControls && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-lg">
                  {/* Tempo Control */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-slate-700">
                        Tempo: {Math.round(tempo)} BPM
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTempoChange(originalTempo)}
                        className="flex items-center gap-2 hover:bg-slate-700"
                        disabled={isInstrumentLoading}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-500 w-8">50</span>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="50"
                          max="200"
                          step="1"
                          value={tempo}
                          onChange={(e) =>
                            handleTempoChange(Number(e.target.value))
                          }
                          disabled={isInstrumentLoading}
                          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #f97316 0%, #f97316 ${
                              ((tempo - 50) / (200 - 50)) * 100
                            }%, #e2e8f0 ${
                              ((tempo - 50) / (200 - 50)) * 100
                            }%, #e2e8f0 100%)`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-500 w-8">200</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                      <span>Slower</span>
                      <span>Original: {Math.round(originalTempo)} BPM</span>
                      <span>Faster</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

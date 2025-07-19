"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Music } from "lucide-react";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";
// Uncomment this if you install @tonejs/piano
// import { Piano } from "@tonejs/piano";

// Define instrument types
type SynthInstrument = {
  name: string;
  type: "synth";
  synthType: typeof Tone.Synth | typeof Tone.AMSynth | typeof Tone.FMSynth;
};

type SamplerInstrument = {
  name: string;
  type: "sampler";
  urls: Record<string, string>;
  baseUrl: string;
};

type ToneJsPianoInstrument = {
  name: string;
  type: "tonejs-piano";
};

// Define available instruments
const INSTRUMENTS: Record<
  string,
  SynthInstrument | SamplerInstrument | ToneJsPianoInstrument
> = {
  // High-quality piano using @tonejs/piano (requires installation)
  grandPiano: {
    name: "Grand Piano (HQ)",
    type: "tonejs-piano",
  },
  piano: {
    name: "Salamander Piano",
    type: "sampler",
    urls: {
      A0: "A0.mp3",
      A1: "A1.mp3",
      A2: "A2.mp3",
      A3: "A3.mp3",
      A4: "A4.mp3",
      A5: "A5.mp3",
      A6: "A6.mp3",
      A7: "A7.mp3",
      C1: "C1.mp3",
      C2: "C2.mp3",
      C3: "C3.mp3",
      C4: "C4.mp3",
      C5: "C5.mp3",
      C6: "C6.mp3",
      C7: "C7.mp3",
      C8: "C8.mp3",
      "D#1": "Ds1.mp3",
      "D#2": "Ds2.mp3",
      "D#3": "Ds3.mp3",
      "D#4": "Ds4.mp3",
      "D#5": "Ds5.mp3",
      "D#6": "Ds6.mp3",
      "D#7": "Ds7.mp3",
      "F#1": "Fs1.mp3",
      "F#2": "Fs2.mp3",
      "F#3": "Fs3.mp3",
      "F#4": "Fs4.mp3",
      "F#5": "Fs5.mp3",
      "F#6": "Fs6.mp3",
      "F#7": "Fs7.mp3",
    },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
  },
  violin: {
    name: "Violin",
    type: "sampler",
    urls: {
      G3: "G3.mp3",
      D4: "D4.mp3",
      A4: "A4.mp3",
      E5: "E5.mp3",
      G4: "G4.mp3",
      D5: "D5.mp3",
      A5: "A5.mp3",
      E6: "E6.mp3",
    },
    baseUrl:
      "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/violin-mp3/",
  },
  cello: {
    name: "Cello",
    type: "sampler",
    urls: {
      C2: "C2.mp3",
      G2: "G2.mp3",
      D3: "D3.mp3",
      A3: "A3.mp3",
      C3: "C3.mp3",
      G3: "G3.mp3",
      D4: "D4.mp3",
      A4: "A4.mp3",
    },
    baseUrl:
      "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/cello-mp3/",
  },
  // Fallback synthesized instruments
  synth: {
    name: "Classic Synth",
    type: "synth",
    synthType: Tone.Synth,
  },
  amSynth: {
    name: "AM Synth",
    type: "synth",
    synthType: Tone.AMSynth,
  },
  fmSynth: {
    name: "FM Synth",
    type: "synth",
    synthType: Tone.FMSynth,
  },
};

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
  const createInstrument = async (instrumentKey: string) => {
    const instrument = INSTRUMENTS[instrumentKey as keyof typeof INSTRUMENTS];

    if (instrument.type === "tonejs-piano") {
      // Uncomment this block if you install @tonejs/piano
      /*
      const piano = new Piano({
        velocities: 5
      }).toDestination();
      
      return new Promise((resolve) => {
        piano.load().then(() => {
          console.log("@tonejs/piano loaded successfully");
          resolve(piano);
        });
      });
      */

      // Fallback to regular sampler for now
      console.log(
        "@tonejs/piano not installed, falling back to Salamander piano"
      );
      const pianoInstrument = INSTRUMENTS.piano as SamplerInstrument;
      return new Promise((resolve, reject) => {
        const sampler = new Tone.Sampler({
          urls: pianoInstrument.urls,
          baseUrl: pianoInstrument.baseUrl,
          onload: () => {
            console.log("Salamander Piano loaded successfully");
            resolve(sampler.toDestination());
          },
          onerror: (error) => {
            console.error("Failed to load piano:", error);
            const fallbackSynth = new Tone.PolySynth(
              Tone.Synth
            ).toDestination();
            resolve(fallbackSynth);
          },
        });
      });
    } else if (instrument.type === "sampler") {
      return new Promise((resolve, reject) => {
        const sampler = new Tone.Sampler({
          urls: instrument.urls,
          baseUrl: instrument.baseUrl,
          onload: () => {
            console.log(`${instrument.name} loaded successfully`);
            resolve(sampler.toDestination());
          },
          onerror: (error) => {
            console.error(`Failed to load ${instrument.name}:`, error);
            // Fallback to synth if sampling fails
            console.log("Falling back to synth...");
            const fallbackSynth = new Tone.PolySynth(
              Tone.Synth
            ).toDestination();
            resolve(fallbackSynth);
          },
        });
      });
    } else {
      // Synthesized instrument
      const synthInstance = new instrument.synthType();
      return new Tone.PolySynth(
        synthInstance.constructor as any
      ).toDestination();
    }
  };

  // Initialize the MIDI player
  // Initialize the MIDI player
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
          INSTRUMENTS[selectedInstrument as keyof typeof INSTRUMENTS].name
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
                  note.name,
                  note.duration,
                  time,
                  note.velocity
                );
              }
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

  if (!midiData && !isLoadingMidi) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      {/* Loading and Error States */}
      {isLoadingMidi && (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
            Loading MIDI file...
          </AlertDescription>
        </Alert>
      )}

      {isInstrumentLoading && (
        <Alert>
          <AlertDescription className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            Loading{" "}
            {INSTRUMENTS[selectedInstrument as keyof typeof INSTRUMENTS].name}
            ...
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

      {/* Main Player Interface */}
      {midiData && !midiError && (
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          {/* Instrument Selector */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">
                  Instrument:{" "}
                  {
                    INSTRUMENTS[selectedInstrument as keyof typeof INSTRUMENTS]
                      .name
                  }
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setShowInstrumentSelector(!showInstrumentSelector)
                }
                className="text-xs"
                disabled={isInstrumentLoading}
              >
                Change
              </Button>
            </div>

            {/* Instrument Selection Grid */}
            {showInstrumentSelector && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg border">
                {Object.entries(INSTRUMENTS).map(([key, instrument]) => (
                  <Button
                    key={key}
                    variant={selectedInstrument === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleInstrumentChange(key)}
                    className={`text-xs ${
                      selectedInstrument === key
                        ? "bg-orange-600 hover:bg-orange-700 text-white"
                        : "hover:bg-gray-100"
                    }`}
                    disabled={isInstrumentLoading}
                  >
                    {instrument.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Tempo Control */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Tempo: {Math.round(tempo)} BPM
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTempoChange(originalTempo)}
                className="text-xs"
                disabled={isInstrumentLoading}
              >
                Reset
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">50</span>
              <input
                type="range"
                min="50"
                max="200"
                step="1"
                value={tempo}
                onChange={(e) => handleTempoChange(Number(e.target.value))}
                disabled={isInstrumentLoading}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #ea580c 0%, #ea580c ${
                    ((tempo - 50) / (200 - 50)) * 100
                  }%, #e5e7eb ${
                    ((tempo - 50) / (200 - 50)) * 100
                  }%, #e5e7eb 100%)`,
                }}
              />
              <span className="text-xs text-gray-500">200</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Slower</span>
              <span>Original: {Math.round(originalTempo)} BPM</span>
              <span>Faster</span>
            </div>
          </div>

          {/* Progress Bar */}
          {parsedMidi && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span>{formatTime(currentTime)}</span>
                <span>/</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div className="relative">
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
                  disabled={!midiPlayer || isMidiLoading || isInstrumentLoading}
                />
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            {/* Stop Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                stopPlayback();
                setCurrentTime(0);
              }}
              disabled={!midiPlayer || isMidiLoading || isInstrumentLoading}
              className="flex items-center justify-center w-10 h-10"
            >
              <div className="h-3 w-3 bg-current"></div>
            </Button>

            {/* Play/Pause Button */}
            <Button
              variant={isPlaying ? "default" : "outline"}
              size="sm"
              onClick={togglePlayback}
              disabled={!midiPlayer || isMidiLoading || isInstrumentLoading}
              className="flex items-center justify-center w-12 h-10"
            >
              {isMidiLoading || isInstrumentLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : isPlaying ? (
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-white"></div>
                  <div className="w-1 h-4 bg-white"></div>
                </div>
              ) : (
                <div className="w-0 h-0 border-l-[8px] border-l-current border-y-[6px] border-y-transparent ml-1"></div>
              )}
            </Button>

            {/* Status Indicator */}
            {parsedMidi && (
              <div className="flex items-center gap-2 text-sm text-gray-600 ml-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isPlaying ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                ></div>
                <span className="hidden sm:inline">
                  {isPlaying ? "Playing" : "Ready"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import { IconMusic, IconX } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";

interface ScoreResults {
  key: string;
  parts: string[];
  chords: { pitch: string; offset: number }[];
  tempo: string;
  time_signature: string;
  composer: string;
  title: string;
  date: string;
  lyrics: string[];
}

interface ScoreResponse {
  score: {
    id: number;
    title: string;
    composer: string;
    results: ScoreResults | null;
    processed: boolean;
    musicxml_url: string | null;
    midi_url: string | null;
  };
  task_status: {
    state: string;
    info: string | null;
  } | null;
}

interface AnalysisDisplayProps {
  scoreId: number | null;
  taskId: string | null;
  onProcessingChange: (isProcessing: boolean) => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
console.log("API_URL:", API_URL);

const fetchScore = async (
  id: number,
  taskId: string
): Promise<ScoreResponse> => {
  const response = await fetch(
    `${API_URL}/api/scores/${id}/?task_id=${taskId}`
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch score");
  }
  const data = await response.json();
  console.log("Parsed Score data:", data);
  return data;
};

interface OSMDProps {
  file: string;
  autoResize: boolean;
  drawTitle: boolean;
}

function OSMDComponent({ file, autoResize, drawTitle }: OSMDProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (divRef.current) {
      osmdRef.current = new OpenSheetMusicDisplay(divRef.current);
      osmdRef.current.setOptions({ autoResize, drawTitle });
      const fullUrl = file.startsWith("http")
        ? file
        : `${API_URL}${file.startsWith("/") ? "" : "/"}${file}`;
      fetch(fullUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch MusicXML file");
          }
          return response.text();
        })
        .then((data) => {
          osmdRef.current?.load(data).then(() => {
            osmdRef.current?.render();
          });
        })
        .catch((err) => {
          console.error("Error loading MusicXML:", err);
          setError("Failed to load MusicXML file");
        });
    }
  }, [file, autoResize, drawTitle]);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return <div ref={divRef} />;
}

export default function AnalysisDisplay({
  scoreId,
  taskId,
  onProcessingChange,
}: AnalysisDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState<Tone.Synth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["score", scoreId, taskId],
    queryFn: () => fetchScore(scoreId!, taskId!),
    enabled: !!scoreId && !!taskId,
    refetchInterval: ({ data }: any) =>
      data && data?.task_status?.state === "PENDING" && !data?.score?.processed
        ? 3000
        : false,
    retry: (failureCount: number) => {
      if (failureCount >= 3) return false;
      if (
        data?.task_status?.state === "SUCCESS" ||
        data?.task_status?.state === "FAILURE"
      )
        return false;
      return true;
    },
  });

  useEffect(() => {
    if (data?.score?.processed || data?.task_status?.state === "FAILURE") {
      onProcessingChange(false);
    }
  }, [data, onProcessingChange]);

  const handlePlayMidi = async () => {
    if (!data?.score?.midi_url) return;

    if (!isPlaying) {
      await Tone.start();
      if (!synth) {
        const newSynth = new Tone.Synth().toDestination();
        setSynth(newSynth);

        try {
          // Prefix the MIDI URL with the API base URL if it's a relative path
          const fullMidiUrl = data.score.midi_url.startsWith("http")
            ? data.score.midi_url
            : `${API_URL}${data.score.midi_url}`;
          const response = await fetch(fullMidiUrl);
          const arrayBuffer = await response.arrayBuffer();
          const midi = new Midi(arrayBuffer); // Use arrayBuffer directly

          const notes = midi.tracks[0]?.notes || [];
          const sequence = new Tone.Sequence(
            (time, note) => {
              newSynth.triggerAttackRelease(
                note.name,
                note.duration,
                time,
                note.velocity
              );
            },
            notes,
            "4n"
          );

          sequenceRef.current = sequence;
          sequence.start(0);
          Tone.Transport.start();
          setIsPlaying(true);
        } catch (err) {
          console.error("Error loading MIDI:", err);
          notifications.show({
            title: "Error",
            message: "Failed to load MIDI file",
            color: "red",
            icon: <IconX />,
          });
        }
      }
    } else {
      if (sequenceRef.current) {
        sequenceRef.current.stop();
        Tone.Transport.stop();
        sequenceRef.current.dispose();
        sequenceRef.current = null;
      }
      if (synth) {
        synth.triggerRelease();
        synth.dispose();
        setSynth(null);
      }
      setIsPlaying(false);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.stop();
        sequenceRef.current.dispose();
        sequenceRef.current = null;
      }
      if (synth) {
        synth.triggerRelease();
        synth.dispose();
        setSynth(null);
      }
      Tone.Transport.stop();
    };
  }, [synth]);

  if (!scoreId || !taskId) {
    return (
      <div className="space-y-6 p-4">
        <h2 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
          <IconMusic className="h-6 w-6" /> Score Analysis Results
        </h2>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">
              Upload a score to see analysis results.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              Retry
            </Button>
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

      {isLoading || !data?.score?.processed ? (
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
            <TabsTrigger value="results">Results</TabsTrigger>
            {/* <TabsTrigger value="musicxml">MusicXML</TabsTrigger>
            <TabsTrigger value="midi">MIDI</TabsTrigger> */}
          </TabsList>
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>{data?.score?.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.score?.results && (
                  <div className="space-y-4">
                    <p>
                      <strong>Key:</strong> {data?.score?.results?.key}
                    </p>
                    <p>
                      <strong>Parts:</strong>{" "}
                      {data?.score?.results?.parts?.join(", ")}
                    </p>
                    <p>
                      <strong>Tempo:</strong> {data?.score?.results?.tempo}
                    </p>
                    <p>
                      <strong>Time Signature:</strong>{" "}
                      {data?.score?.results?.time_signature}
                    </p>
                    <div>
                      <strong>Chords:</strong>
                      <ul className="list-disc pl-5">
                        {data?.score?.results?.chords?.map((chord: any, index: number) => (
                          <li key={index}>
                            {chord.pitch} at offset {chord.offset}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p>
                      <strong>Lyrics:</strong>{" "}
                      {data?.score?.results?.lyrics?.join(", ")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* <TabsContent value="musicxml">
            {data?.score?.musicxml_url ? (
              <Card>
                <CardHeader>
                  <CardTitle>MusicXML Viewer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div id="osmd-container" className="w-full h-[600px]">
                    <OSMDComponent
                      file={data?.score?.musicxml_url}
                      autoResize={true}
                      drawTitle={false}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No MusicXML available.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent> */}
          {/* <TabsContent value="midi">
            {data?.score?.midi_url ? (
              <Card>
                <CardHeader>
                  <CardTitle>MIDI Playback</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handlePlayMidi}
                    disabled={!data?.score?.midi_url}
                  >
                    {isPlaying ? "Stop" : "Play MIDI"}
                  </Button>
                  <Button className="ml-4" variant="outline" asChild>
                    <a
                      href={
                        data?.score?.midi_url.startsWith("http")
                          ? data?.score?.midi_url
                          : `${API_URL}${data?.score?.midi_url}`
                      }
                      download
                    >
                      Download MIDI
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No MIDI available.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent> */}
        </Tabs>
      )}
    </div>
  );
}

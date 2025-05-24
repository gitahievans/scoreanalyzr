"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { notifications } from "@mantine/notifications";
import { IconMusic, IconX, IconRefresh } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScoreData } from "@/contexts/ScoreDataContext"; // Import the context hook
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import * as Tone from "tone";
import { Midi } from "@tonejs/midi";

// ScoreResults and ScoreResponse are now imported from ScoreDataContext if needed,
// or used via useScoreData() context's scoreData.
// For OSMDComponent, API_URL might still be needed if it constructs URLs. Let's check.
// Yes, OSMDComponent uses API_URL. It should be passed as a prop or imported.
// For now, let's assume API_URL will be available in this file.
// We'll need to make sure API_URL is exported from ScoreDataContext or defined here.
// Re-evaluating: API_URL is used by fetchScore (moved) and OSMDComponent.
// It makes sense to keep API_URL defined or imported here for OSMDComponent.
// Let's define it here as it was, and ScoreDataContext also has its own definition.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
console.log("API_URL_ANALYSIS_DISPLAY:", API_URL);


interface AnalysisDisplayProps {
  // scoreId and taskId are now obtained from the context, so they are not needed as props
  onProcessingChange: (isProcessing: boolean) => void;
}

interface OSMDProps {
  file: string;
  autoResize: boolean;
  drawTitle: boolean;
  apiUrl: string; // Pass API_URL as a prop
}

function OSMDComponent({ file, autoResize, drawTitle, apiUrl }: OSMDProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (divRef.current) {
      osmdRef.current = new OpenSheetMusicDisplay(divRef.current);
      osmdRef.current.setOptions({ autoResize, drawTitle });
      const fullUrl = file.startsWith("http")
        ? file
        : `${apiUrl}${file.startsWith("/") ? "" : "/"}${file}`; // Use apiUrl prop
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
  onProcessingChange,
}: AnalysisDisplayProps) {
  const { scoreData: data, isLoading, error, refetch } = useScoreData(); // Use the context
  const [isPlaying, setIsPlaying] = useState(false);
  const [synth, setSynth] = useState<Tone.Synth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  useEffect(() => {
    if (data?.score?.processed || data?.task_status?.state === "FAILURE") {
      onProcessingChange(false);
    } else if (data?.task_status?.state === "PENDING" || isLoading) {
      onProcessingChange(true);
    }
  }, [data, isLoading, onProcessingChange]);

  const handlePlayMidi = async () => {
    if (!data?.score?.midi_url) return;

    if (!isPlaying) {
      await Tone.start();
      if (!synth) {
        const newSynth = new Tone.Synth().toDestination();
        setSynth(newSynth);

        try {
          const fullMidiUrl = data.score.midi_url.startsWith("http")
            ? data.score.midi_url
            : `${API_URL}${data.score.midi_url.startsWith("/") ? "" : "/"}${data.score.midi_url}`;
          const response = await fetch(fullMidiUrl);
          const arrayBuffer = await response.arrayBuffer();
          const midi = new Midi(arrayBuffer);

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

  useEffect(() => {
    return () => {
      if (sequenceRef.current) {
        sequenceRef.current.stop();
        sequenceRef.current.dispose();
      }
      if (synth) {
        synth.triggerRelease();
        synth.dispose();
      }
      Tone.Transport.stop();
    };
  }, [synth]);

  // Check if scoreId and taskId from context are null/undefined (though context hook should ensure they are available if provider is used correctly)
  // The useScoreData hook will throw if context is undefined.
  // We need to get scoreId and taskId from the context if they are part of its state,
  // or assume they are passed to ScoreDataProvider and implicitly handled.
  // The ScoreDataProvider receives scoreId & taskId, so AnalysisDisplay doesn't need to check for them directly for rendering logic.
  // It should primarily check loading/error states from the context.

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
  
  // Initial state or when scoreId/taskId are not set yet in the parent that renders ScoreDataProvider
  // This check might be redundant if ScoreDataProvider handles null scoreId/taskId by not enabling the query.
  // However, AnalysisDisplay might be rendered even when ScoreDataProvider is not actively fetching.
  // Let's show a message if there's no data and it's not loading, and no error.
  // This implies scoreId/taskId might not be set in the Page component.
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

      {isLoading || (data && !data.score?.processed && data.task_status?.state === 'PENDING') ? (
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
          <TabsList className="grid w-full grid-cols-1"> {/* Adjusted for only one tab for now */}
            <TabsTrigger value="results">Results</TabsTrigger>
            {/* TODO: Re-enable MusicXML and MIDI tabs when ready */}
            {/* <TabsTrigger value="musicxml">MusicXML</TabsTrigger> */}
            {/* <TabsTrigger value="midi">MIDI</TabsTrigger> */}
          </TabsList>
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>{data?.score?.title || "No title"}</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.score?.results ? (
                  <div className="space-y-4">
                    <p>
                      <strong>Key:</strong> {data.score.results.key}
                    </p>
                    <p>
                      <strong>Parts:</strong>{" "}
                      {data.score.results.parts?.join(", ")}
                    </p>
                    <p>
                      <strong>Tempo:</strong> {data.score.results.tempo}
                    </p>
                    <p>
                      <strong>Time Signature:</strong>{" "}
                      {data.score.results.time_signature}
                    </p>
                    <div>
                      <strong>Chords:</strong>
                      <ul className="list-disc pl-5">
                        {data.score.results.chords?.map((chord, index) => (
                          <li key={index}>
                            {chord.pitch} at offset {chord.offset}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p>
                      <strong>Lyrics:</strong>{" "}
                      {data.score.results.lyrics?.join(", ")}
                    </p>
                  </div>
                ) : (
                  <p>No results available for this score.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* TODO: Re-enable MusicXML and MIDI tabs and their content */}
          {/* <TabsContent value="musicxml">
            {data?.score?.musicxml_url ? (
              <Card>
                <CardHeader>
                  <CardTitle>MusicXML Viewer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div id="osmd-container" className="w-full h-[600px]">
                    <OSMDComponent
                      file={data.score.musicxml_url}
                      autoResize={true}
                      drawTitle={false}
                      apiUrl={API_URL} // Pass API_URL
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
                    disabled={!data.score.midi_url}
                  >
                    {isPlaying ? "Stop" : "Play MIDI"}
                  </Button>
                  <Button className="ml-4" variant="outline" asChild>
                    <a
                      href={
                        data.score.midi_url.startsWith("http")
                          ? data.score.midi_url
                          : `${API_URL}${data.score.midi_url.startsWith("/") ? "" : "/"}${data.score.midi_url}`
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

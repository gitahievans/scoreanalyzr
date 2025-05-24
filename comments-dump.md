<!-- function OSMDComponent({ file, autoResize, drawTitle, apiUrl }: OSMDProps) {
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
} -->

<!-- const handlePlayMidi = async () => {
    if (!data?.score?.midi_url) return;

    if (!isPlaying) {
      await Tone.start();
      if (!synth) {
        const newSynth = new Tone.Synth().toDestination();
        setSynth(newSynth);

        try {
          const fullMidiUrl = data.score.midi_url.startsWith("http")
            ? data.score.midi_url
            : `${API_URL}${data.score.midi_url.startsWith("/") ? "" : "/"}${
                data.score.midi_url
              }`;
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
  }, [synth]); -->

  <!-- <TabsContent value="midi">
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
          </TabsContent> -->

<!-- <TabsContent value="musicxml">
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
          </TabsContent> -->

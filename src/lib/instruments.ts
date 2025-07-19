import * as Tone from "tone";

// Types for instrument configurations
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

type InstrumentRange = {
  name: string;
  gleitzName: string;
  range: [string, string];
  type: "sampler";
};

// Helper function to convert MIDI note number to note name (e.g., 60 -> C4)
function midiToNoteName(midi: number): string {
  const notes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const octave = Math.floor(midi / 12) - 1;
  const note = notes[midi % 12];
  return `${note}${octave}`;
}

// Helper function to convert note name to MIDI number
function noteNameToMidi(note: string): number {
  const noteMap: Record<string, number> = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
  };
  const match = note.match(/([A-G][b#]?)(-?\d)/);
  if (!match) throw new Error(`Invalid note format: ${note}`);
  const [, noteName, octave] = match;
  return noteMap[noteName] + (parseInt(octave) + 1) * 12;
}

// Generate all chromatic notes between start and end notes
function generateChromaticNotes(startNote: string, endNote: string): string[] {
  const startMidi = noteNameToMidi(startNote);
  const endMidi = noteNameToMidi(endNote);
  const notes: string[] = [];

  for (let midi = startMidi; midi <= endMidi; midi++) {
    notes.push(midiToNoteName(midi));
  }

  return notes;
}

// Build URL mapping for an instrument
function buildInstrumentUrls(
  gleitzName: string,
  noteRange: string[]
): Record<string, string> {
  const urls: Record<string, string> = {};
  noteRange.forEach((note) => {
    urls[note] = `${note}.mp3`; // Use full note name with octave (e.g., C4.mp3, F#5.mp3)
  });
  return urls;
}

// Define instrument configurations with ranges
const INSTRUMENT_RANGES: InstrumentRange[] = [
  {
    name: "Piano",
    gleitzName: "acoustic_grand_piano",
    range: ["C1", "C8"],
    type: "sampler",
  },
  {
    name: "Electric Piano",
    gleitzName: "electric_piano_1",
    range: ["C2", "C6"],
    type: "sampler",
  },
  {
    name: "Harpsichord",
    gleitzName: "harpsichord",
    range: ["C2", "C6"],
    type: "sampler",
  },
  {
    name: "Pipe Organ",
    gleitzName: "church_organ",
    range: ["C2", "C6"],
    type: "sampler",
  },
  {
    name: "Violin",
    gleitzName: "violin",
    range: ["G3", "E7"],
    type: "sampler",
  },
  { name: "Viola", gleitzName: "viola", range: ["C3", "A5"], type: "sampler" },
  { name: "Cello", gleitzName: "cello", range: ["C2", "A5"], type: "sampler" },
  {
    name: "Double Bass",
    gleitzName: "contrabass",
    range: ["E1", "G3"],
    type: "sampler",
  },
  {
    name: "Harp",
    gleitzName: "orchestral_harp",
    range: ["C2", "C6"],
    type: "sampler",
  },
  {
    name: "Acoustic Guitar",
    gleitzName: "acoustic_guitar_nylon",
    range: ["E2", "E6"],
    type: "sampler",
  },
  {
    name: "Electric Guitar",
    gleitzName: "electric_guitar_clean",
    range: ["E2", "E6"],
    type: "sampler",
  },
  {
    name: "Electric Bass",
    gleitzName: "electric_bass_finger",
    range: ["E1", "G3"],
    type: "sampler",
  },
  { name: "Flute", gleitzName: "flute", range: ["C4", "D7"], type: "sampler" },
  { name: "Oboe", gleitzName: "oboe", range: ["Bb3", "A6"], type: "sampler" },
  {
    name: "Clarinet",
    gleitzName: "clarinet",
    range: ["D3", "Bb6"],
    type: "sampler",
  },
  {
    name: "Bassoon",
    gleitzName: "bassoon",
    range: ["Bb1", "Bb4"],
    type: "sampler",
  },
  {
    name: "Saxophone",
    gleitzName: "alto_sax",
    range: ["Db3", "Bb5"],
    type: "sampler",
  },
  {
    name: "Trumpet",
    gleitzName: "trumpet",
    range: ["F#3", "D6"],
    type: "sampler",
  },
  {
    name: "Trombone",
    gleitzName: "trombone",
    range: ["E2", "F5"],
    type: "sampler",
  },
  {
    name: "French Horn",
    gleitzName: "french_horn",
    range: ["B1", "F5"],
    type: "sampler",
  },
  { name: "Tuba", gleitzName: "tuba", range: ["D1", "F4"], type: "sampler" },
  {
    name: "Choir Aahs",
    gleitzName: "choir_aahs",
    range: ["C3", "C6"],
    type: "sampler",
  },
  {
    name: "Voice Oohs",
    gleitzName: "voice_oohs",
    range: ["C3", "C6"],
    type: "sampler",
  },
  {
    name: "Xylophone",
    gleitzName: "xylophone",
    range: ["C4", "C7"],
    type: "sampler",
  },
  {
    name: "Marimba",
    gleitzName: "marimba",
    range: ["C3", "C6"],
    type: "sampler",
  },
  {
    name: "Vibraphone",
    gleitzName: "vibraphone",
    range: ["C3", "C6"],
    type: "sampler",
  },
  {
    name: "Synth Pad",
    gleitzName: "pad_1_new_age",
    range: ["C2", "C6"],
    type: "sampler",
  },
  {
    name: "Synth Strings",
    gleitzName: "synth_strings_1",
    range: ["C2", "C6"],
    type: "sampler",
  },
];

// Base URL for gleitz soundfonts
const BASE_URL = "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/";

// Generate the INSTRUMENTS object
export const INSTRUMENTS: Record<
  string,
  SynthInstrument | SamplerInstrument | ToneJsPianoInstrument
> = {
  // High-quality piano using @tonejs/piano (unchanged)
  grandPiano: {
    name: "Grand Piano (HQ)",
    type: "tonejs-piano",
  },
  // Synthesizers (unchanged)
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
  // Dynamically generated sampler instruments
  ...INSTRUMENT_RANGES.reduce((acc, instrument) => {
    const urls = buildInstrumentUrls(
      instrument.gleitzName,
      generateChromaticNotes(instrument.range[0], instrument.range[1])
    );

    return {
      ...acc,
      [instrument.name.toLowerCase().replace(/\s/g, "")]: {
        name: instrument.name,
        type: instrument.type,
        urls,
        baseUrl: `${BASE_URL}${instrument.gleitzName}-mp3/`,
      },
    };
  }, {} as Record<string, SamplerInstrument>),
};

// Error handling for missing files
export const createSampler = (instrumentKey: string): Tone.Sampler => {
  const config = INSTRUMENTS[instrumentKey];
  if (!config || config.type !== "sampler") {
    throw new Error(`Invalid or non-sampler instrument: ${instrumentKey}`);
  }

  const sampler = new Tone.Sampler({
    urls: config.urls,
    baseUrl: config.baseUrl,
    onerror: (error) => {
      console.warn(`Failed to load sample for ${instrumentKey}: ${error}`);
      // Fallback: Use closest available note or log for debugging
    },
  });

  return sampler;
};

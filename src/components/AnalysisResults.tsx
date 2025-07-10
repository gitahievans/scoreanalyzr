import {
  FileMusic,
  Music,
  Clock,
  Users,
  Volume2,
  Edit3,
  Settings,
} from "lucide-react";
import React from "react";

const AnalysisResults = ({ results, musicXmlContent, parsedMidi }: any) => {
  // Helper function to get tempo from MIDI if not available in results
  const getTempo = () => {
    if (results.tempo && !results.tempo.error) {
      return results.tempo;
    }

    if (parsedMidi?.header?.tempos?.[0]?.bpm) {
      return `${parsedMidi.header.tempos[0].bpm} BPM`;
    }

    return "Not specified";
  };

  // Helper function to determine score type based on measures and parts
  const getScoreType = () => {
    const totalMeasures = results.measures?.total_measures || 0;
    const totalParts = results.instrumentation?.total_parts || 0;

    if (totalMeasures === 0 || totalParts === 0) return "Unknown";

    // Check if all parts have the same number of measures (closed score)
    const measuresPerPart = results.measures?.measures_per_part || [];
    const allSameMeasures = measuresPerPart.every(
      (part: { measure_count: number }) => part.measure_count === totalMeasures
    );

    return allSameMeasures ? "Closed" : "Open";
  };

  // Helper function to get time signature with fallback
  const getTimeSignature = () => {
    if (
      results.time_signature &&
      results.time_signature !== "No time signature found"
    ) {
      return results.time_signature;
    }

    if (results.meter_changes?.time_signatures?.[0]?.signature) {
      return results.meter_changes.time_signatures[0].signature;
    }

    return "Not specified";
  };

  // Helper function to get existing articulations
  const getArticulations = () => {
    const articulations = [];
    const articulationData = results.notable_elements?.articulations || {};

    if (articulationData.staccato?.has_staccato) {
      articulations.push(`Staccato (${articulationData.staccato.count})`);
    }
    if (articulationData.accent?.has_accent) {
      articulations.push(`Accent (${articulationData.accent.count})`);
    }
    if (articulationData.tenuto?.has_tenuto) {
      articulations.push(`Tenuto (${articulationData.tenuto.count})`);
    }

    return articulations;
  };

  // Helper function to get existing dynamics
  const getDynamics = () => {
    const dynamics = results.notable_elements?.dynamics?.values || [];
    const dynamicNames = {
      ppp: "pianississimo",
      pp: "pianissimo",
      p: "piano",
      mp: "mezzo-piano",
      mf: "mezzo-forte",
      f: "forte",
      ff: "fortissimo",
      fff: "fortississimo",
      sf: "sforzando",
      sfz: "sforzando",
      fp: "forte-piano",
      cresc: "crescendo",
      dim: "diminuendo",
      decresc: "decrescendo",
    };

    return dynamics.map((dynamic: string) => {
      const key = dynamic.toLowerCase() as keyof typeof dynamicNames;
      const fullName = dynamicNames[key] || dynamic;
      return `${dynamic} (${fullName})`;
    });
  };

  // Helper function to format instruments list
  const getInstruments = () => {
    const instruments = results.instrumentation?.unique_instruments || [];
    return instruments.join(", ") || "Not specified";
  };

  const articulations = getArticulations();
  const dynamics = getDynamics();

  return (
    <div className="space-y-6">
      {/* Primary Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-600 mb-1">
            Key Signature
          </div>
          <div className="text-lg font-bold text-blue-900">
            {results.key || "Not specified"}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="text-sm font-medium text-green-600 mb-1">
            Time Signature
          </div>
          <div className="text-lg font-bold text-green-900">
            {getTimeSignature()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
          <div className="text-sm font-medium text-orange-600 mb-1">
            <Clock className="inline h-4 w-4 mr-1" />
            Tempo
          </div>
          <div className="text-lg font-bold text-orange-900">{getTempo()}</div>
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

      {/* Score Structure Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
          <div className="text-sm font-medium text-indigo-600 mb-1">
            <Users className="inline h-4 w-4 mr-1" />
            Score Type
          </div>
          <div className="text-lg font-bold text-indigo-900">
            {getScoreType()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200">
          <div className="text-sm font-medium text-teal-600 mb-1">
            Ensemble Type
          </div>
          <div className="text-lg font-bold text-teal-900">
            {results.score_structure?.ensemble_type || "Not specified"}
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-lg border border-rose-200">
          <div className="text-sm font-medium text-rose-600 mb-1">
            Music Type
          </div>
          <div className="text-lg font-bold text-rose-900">
            {results.score_structure?.music_type || "Not specified"}
          </div>
        </div>
      </div>

      {/* Detailed Structure Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instrumentation */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Music className="h-5 w-5 mr-2 text-blue-600" />
            Instrumentation
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">
                Instruments:
              </span>
              <p className="text-gray-800">{getInstruments()}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">
                Total Parts:
              </span>
              <span className="ml-2 text-gray-800">
                {results.instrumentation?.total_parts || 0}
              </span>
            </div>
            {results.instrumentation?.instrument_families && (
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Instrument Families:
                </span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {Object.entries(
                    results.instrumentation.instrument_families
                  ).map(([family, count]) => (
                    <span
                      key={family}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                    >
                      {family}: {String(count)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Measures */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Settings className="h-5 w-5 mr-2 text-green-600" />
            Structure
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">
                Total Measures:
              </span>
              <span className="ml-2 text-gray-800">
                {results.measures?.total_measures || 0}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">
                Has Pickup:
              </span>
              <span className="ml-2 text-gray-800">
                {results.measures?.has_pickup ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">
                Incomplete Measures:
              </span>
              <span className="ml-2 text-gray-800">
                {results.measures?.incomplete_measures || 0}
              </span>
            </div>
            {results.meter_changes?.has_meter_changes && (
              <div>
                <span className="text-sm font-medium text-gray-600">
                  Meter Changes:
                </span>
                <span className="ml-2 text-gray-800">
                  {results.meter_changes.total_changes}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Musical Elements */}
      {(articulations.length > 0 || dynamics.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Articulations */}
          {articulations.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Edit3 className="h-5 w-5 mr-2 text-purple-600" />
                Articulations
              </h3>
              <div className="flex flex-wrap gap-2">
                {articulations.map((articulation, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {articulation}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Dynamics */}
          {dynamics.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Volume2 className="h-5 w-5 mr-2 text-red-600" />
                Dynamics
              </h3>
              <div className="flex flex-wrap gap-2">
                {dynamics.map((dynamic: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {dynamic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Musical Elements Message */}
      {articulations.length === 0 && dynamics.length === 0 && (
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-center">
            No specific articulations or dynamics markings detected in this
            score.
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalysisResults;

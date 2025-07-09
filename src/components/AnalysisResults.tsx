import { FileMusic } from "lucide-react";
import React from "react";

const AnalysisResults = ({ results, musicXmlContent }: any) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="text-sm font-medium text-blue-600 mb-1">
            Key Signature
          </div>
          <div className="text-lg font-bold text-blue-900">{results.key}</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="text-sm font-medium text-green-600 mb-1">
            Time Signature
          </div>
          <div className="text-lg font-bold text-green-900">
            {results.time_signature}
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg border border-amber-200">
          <div className="text-sm font-medium text-amber-600 mb-1">Parts</div>
          <div className="text-sm font-semibold text-amber-900">
            {results.parts?.join(", ")}
          </div>
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

      {/* Chord Progression Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">
            A few chords detected
          </h3>
        </div>

        {results.chords && results.chords.length > 0 ? (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex flex-wrap gap-2">
              {results.chords.map((chord: any, index: number) => (
                <div
                  key={index}
                  className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    chord.pitch === "Chord Symbol Cannot Be Identified"
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
                  }`}
                >
                  <span className="font-semibold">{chord.pitch}</span>
                  <span className="ml-2 text-xs opacity-75">
                    @{chord.offset}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg border text-center text-gray-500">
            No chord progression detected
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults;

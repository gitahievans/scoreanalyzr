"use client";

import { useState } from "react";
import UploadArea from "@/components/UploadArea";
import AnalysisDisplay from "@/components/AnalysisDisplay";
import AnalysisHistory from "@/components/AnalysisHistory";
import { ScoreDataProvider } from "@/contexts/ScoreDataContext";

export default function Home() {
  const [scoreId, setScoreId] = useState<number | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadAreaCollapsed, setIsUploadAreaCollapsed] = useState(false);

  const handleUploadSuccess = (scoreId: number, taskId: string) => {
    setScoreId(scoreId);
    setTaskId(taskId);
    setIsProcessing(true);
    // Collapse the upload area once processing starts
    setIsUploadAreaCollapsed(true);
  };

  const handleProcessingChange = (processing: boolean) => {
    setIsProcessing(processing);
  };

  const toggleUploadArea = () => {
    setIsUploadAreaCollapsed(!isUploadAreaCollapsed);
  };

  return (
    <div className="min-h-screen bg-orange-50 text-foreground font-main">
      <div className="container mx-auto flex flex-col px-2 sm:px-6 lg:px-8">
        <header className="mb-4 sm:mb-6 pt-4 sm:pt-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary">
            Get Score Insights
          </h1>
          {/* <p className="text-muted-foreground text-sm sm:text-base">
            Upload music scores to extract key musical elements and generate
            summaries.
          </p> */}
        </header>

        <section className="mb-4 sm:mb-6">
          {/* Upload Area Container with Collapse Logic */}
          <div className="relative">
            {/* Collapsed State - Show compact header with expand button */}
            {isUploadAreaCollapsed && (
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-3 sm:p-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        Analyze another?
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        Click to upload another file
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleUploadArea}
                    className="flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base font-medium whitespace-nowrap flex-shrink-0"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="hidden xs:inline">Upload Another</span>
                    <span className="xs:hidden">Upload</span>
                  </button>
                </div>
              </div>
            )}

            {/* Expanded State - Show full upload area */}
            {!isUploadAreaCollapsed && (
              <div className="relative">
                <UploadArea
                  onUploadSuccess={handleUploadSuccess}
                  isProcessing={isProcessing}
                />
                {/* Show collapse button only if we have results */}
                {scoreId && (
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
                    <button
                      onClick={toggleUploadArea}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-1.5 sm:p-2 shadow-md transition-all touch-target"
                      title="Collapse upload area"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section
          className={`grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8 w-full ${
            isProcessing ? "border-2 border-dashed" : ""
          }`}
        >
          <ScoreDataProvider scoreId={scoreId} taskId={taskId}>
            <AnalysisDisplay onProcessingChange={handleProcessingChange} />
          </ScoreDataProvider>
        </section>
      </div>
    </div>
  );
}

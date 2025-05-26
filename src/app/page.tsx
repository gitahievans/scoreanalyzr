"use client";

import { useState } from "react";
import UploadArea from "@/components/UploadArea";
import AnalysisDisplay from "@/components/AnalysisDisplay";
import AnalysisHistory from "@/components/AnalysisHistory";
import { ScoreDataProvider } from "@/contexts/ScoreDataContext"; // Import ScoreDataProvider

export default function Home() {
  const [scoreId, setScoreId] = useState<number | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUploadSuccess = (scoreId: number, taskId: string) => {
    setScoreId(scoreId);
    setTaskId(taskId);
    setIsProcessing(true);
  };

  return (
    <div className="min-h-screen bg-orange-50 text-foreground font-main">
      <div className="container mx-auto flex flex-col">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Score Insights</h1>
          <p className="text-muted-foreground">
            Upload music scores to extract key musical elements and generate
            summaries.
          </p>
        </header>

        <section className="mb-6">
          <UploadArea
            onUploadSuccess={handleUploadSuccess}
            isProcessing={isProcessing}
          />
        </section>

        <section
          className={`grid grid-cols-1 md:grid-cols-1 gap-6 mb-8 w-full ${
            isProcessing ? "border-2 border-dashed" : ""
          }`}
        >
          <ScoreDataProvider scoreId={scoreId} taskId={taskId}>
            <AnalysisDisplay onProcessingChange={setIsProcessing} />
          </ScoreDataProvider>
        </section>
      </div>
    </div>
  );
}

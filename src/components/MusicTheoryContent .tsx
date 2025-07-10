import React, { useState, useEffect } from "react";
import {
  Music,
  Clock,
  BookOpen,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import musicTheoryData from "../../music_theory.json";

interface MusicTheoryContent {
  id: string;
  type: "quick_fact" | "mini_lesson" | "theory_story";
  category: "harmony" | "form" | "rhythm" | "history" | "analysis";
  duration: "10-15" | "15-20" | "20-25";
  title: string;
  content: string;
  visual_description?: string;
  complexity: "beginner" | "intermediate" | "advanced";
}

interface MusicTheoryLoaderProps {
  message?: string;
  className?: string;
}

const MusicTheoryLoader: React.FC<MusicTheoryLoaderProps> = ({
  message = "Analyzing your music score...",
  className = "",
}) => {
  const [currentContent, setCurrentContent] =
    useState<MusicTheoryContent | null>(null);
  const [progress, setProgress] = useState(0);
  const [contentIndex, setContentIndex] = useState(0);
  const [usedContent, setUsedContent] = useState<Set<string>>(new Set());
  const [isAutoProgressing, setIsAutoProgressing] = useState(true);
  const [progressInterval, setProgressInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [contentHistory, setContentHistory] = useState<MusicTheoryContent[]>(
    []
  );
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  const getRandomContent = () => {
    const availableContent = musicTheoryData.musicTheoryContent.filter(
      (content) => !usedContent.has(content.id)
    );

    if (availableContent.length === 0) {
      // Reset used content when all have been shown
      setUsedContent(new Set());
      return musicTheoryData.musicTheoryContent[
        Math.floor(Math.random() * musicTheoryData.musicTheoryContent.length)
      ];
    }

    return availableContent[
      Math.floor(Math.random() * availableContent.length)
    ];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "quick_fact":
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case "mini_lesson":
        return <BookOpen className="w-5 h-5 text-blue-500" />;
      case "theory_story":
        return <Music className="w-5 h-5 text-purple-500" />;
      default:
        return <Music className="w-5 h-5 text-gray-500" />;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "beginner":
        return "bg-green-100 text-green-700";
      case "intermediate":
        return "bg-yellow-100 text-yellow-700";
      case "advanced":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getDurationInMs = (duration: string) => {
    switch (duration) {
      case "10-15":
        return 12500; // 12.5 seconds
      case "15-20":
        return 25000; // 25 seconds
      case "20-25":
        return 37500; // 37.5 seconds
      default:
        return 20000; // 20 seconds default
    }
  };

  const startProgressTimer = (content: MusicTheoryContent) => {
    if (!isAutoProgressing) return;

    const duration = getDurationInMs(content.duration);
    const interval = 100; // Update every 100ms
    const steps = duration / interval;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);

      if (currentStep >= steps) {
        clearInterval(timer);
        setProgress(0);
        setContentIndex((prev) => prev + 1);
      }
    }, interval);

    setProgressInterval(timer);
  };

  const clearProgressTimer = () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }
  };

  const loadNewContent = () => {
    const content = getRandomContent();
    // Cast fields to their respective union types to satisfy MusicTheoryContent
    const typedContent: MusicTheoryContent = {
      ...content,
      type: content.type as "quick_fact" | "mini_lesson" | "theory_story",
      category: content.category as
        | "harmony"
        | "form"
        | "rhythm"
        | "history"
        | "analysis",
      duration: content.duration as "10-15" | "15-20" | "20-25",
      complexity: content.complexity as
        | "beginner"
        | "intermediate"
        | "advanced",
    };

    setCurrentContent(typedContent);

    if (typedContent) {
      setUsedContent((prev) => new Set(prev).add(typedContent.id));

      // Add to history and update index
      setContentHistory((prev) => {
        const newHistory = [...prev, typedContent];
        return newHistory;
      });
      setCurrentHistoryIndex((prev) => prev + 1);
    }

    return typedContent;
  };

  const navigateToHistoryIndex = (index: number) => {
    if (index >= 0 && index < contentHistory.length) {
      setCurrentContent(contentHistory[index]);
      setCurrentHistoryIndex(index);
    }
  };

  const handleNext = () => {
    clearProgressTimer();
    setProgress(0);
    setIsAutoProgressing(false);

    // Check if we can move forward in history
    if (currentHistoryIndex < contentHistory.length - 1) {
      // Move forward in existing history
      navigateToHistoryIndex(currentHistoryIndex + 1);
    } else {
      // Load new content when at the end of history
      const newContent = loadNewContent();
    }

    // Reset auto-progression after manual navigation
    setTimeout(() => {
      setIsAutoProgressing(true);
      if (currentContent) {
        startProgressTimer(currentContent);
      }
    }, 1000);
  };

  const handlePrev = () => {
    clearProgressTimer();
    setProgress(0);
    setIsAutoProgressing(false);

    // Move backward in history if possible
    if (currentHistoryIndex > 0) {
      navigateToHistoryIndex(currentHistoryIndex - 1);
    }

    // Reset auto-progression after manual navigation
    setTimeout(() => {
      setIsAutoProgressing(true);
      if (currentContent) {
        startProgressTimer(currentContent);
      }
    }, 1000);
  };

  useEffect(() => {
    const content = loadNewContent();
    return () => clearProgressTimer();
  }, []);

  useEffect(() => {
    if (!currentContent) return;

    clearProgressTimer();
    setProgress(0);
    startProgressTimer(currentContent);

    return () => clearProgressTimer();
  }, [currentContent, isAutoProgressing]);

  useEffect(() => {
    if (contentIndex > 0) {
      loadNewContent();
    }
  }, [contentIndex]);

  if (!currentContent) return null;

  return (
    <div className={`w-full max-w-4xl mx-auto p-4 sm:p-6 ${className}`}>
      {/* Main analysis message */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <Music className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 animate-pulse" />
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 text-center">
            {message}
          </h2>
        </div>
        <p className="text-sm sm:text-base text-gray-600 px-2">
          While you wait, explore some fascinating music theory...
        </p>
      </div>

      {/* Content card */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {getTypeIcon(currentContent.type)}
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 leading-tight">
              {currentContent.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(
                currentContent.complexity
              )}`}
            >
              {currentContent.complexity}
            </span> */}
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
              {currentContent.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            {currentContent.content}
          </p>

          {/* Visual description if present */}
          {/* {currentContent.visual_description && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border-l-4 border-blue-500">
              <p className="text-xs sm:text-sm text-gray-600 italic">
                <strong>Visual element:</strong>{" "}
                {currentContent.visual_description}
              </p>
            </div>
          )} */}
        </div>

        {/* Progress bar */}
        <div className="mt-4 sm:mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-500">
              Reading progress
            </span>
            <span className="text-xs sm:text-sm text-gray-500">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
          {/* Mobile layout */}
          <div className="flex flex-col gap-3 sm:hidden">
            <div className="text-center">
              <span className="text-xs text-gray-500">
                Manual navigation pauses auto-progression
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={currentHistoryIndex <= 0}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  currentHistoryIndex <= 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                {/* <span className="text-sm font-medium">Previous</span> */}
              </button>

              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {/* <span className="text-sm font-medium">Next</span> */}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden sm:flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentHistoryIndex <= 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                currentHistoryIndex <= 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              {/* <span className="text-sm font-medium">Previous</span> */}
            </button>

            {/* <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Manual navigation pauses auto-progression</span>
            </div> */}

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {/* <span className="text-sm font-medium">Next</span> */}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-gray-500">
          <Clock className="w-4 h-4" />
          <span className="text-xs sm:text-sm text-center">
            Analysis typically takes 45 seconds - 5 minutes depending on the
            score size & complexity.
          </span>
        </div>
      </div>
    </div>
  );
};

export default MusicTheoryLoader;

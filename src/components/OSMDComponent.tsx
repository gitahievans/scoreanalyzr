import React, { useEffect, useRef, useState, useCallback } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

// Props interface for the OSMD component
interface OSMDComponentProps {
  // MusicXML content as string
  musicXML: string;
  // Container width in pixels (optional, defaults to full width)
  width?: number;
  // Container height in pixels (optional, auto-calculated if not provided)
  height?: number;
  // Whether to show loading spinner
  showLoadingSpinner?: boolean;
  // Custom CSS class for styling
  className?: string;
  // Callback when music is successfully loaded
  onLoad?: () => void;
  // Callback when an error occurs
  onError?: (error: string) => void;
  // OSMD rendering options (optional customization)
  renderingOptions?: {
    // Whether to draw the title
    drawTitle?: boolean;
    // Whether to draw the composer name
    drawComposer?: boolean;
    // Whether to draw fingerings
    drawFingerings?: boolean;
    // Page format (e.g., 'A4_P' for A4 Portrait)
    pageFormat?: string;
  };
}

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    <span className="ml-3 text-gray-600">Loading sheet music...</span>
  </div>
);

// Error display component
const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
    <div className="text-center">
      <div className="text-red-600 text-lg font-semibold mb-2">
        Error Loading Sheet Music
      </div>
      <div className="text-red-500 text-sm">{message}</div>
    </div>
  </div>
);

const OSMDComponent: React.FC<OSMDComponentProps> = ({
  musicXML,
  width,
  height,
  showLoadingSpinner = true,
  className = "",
  onLoad,
  onError,
  renderingOptions = {},
}) => {
  // Ref to the div that will contain the sheet music
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref to store the OSMD instance
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);

  // Component state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to load and render MusicXML - simplified like the working MusicRenderer
  const renderMusic = useCallback(async () => {
    if (!containerRef.current || !musicXML) return;

    setIsLoading(true);
    setError(null);

    try {
      // Clear the container first - this is crucial!
      containerRef.current.innerHTML = "";

      // Create new OSMD instance each time - this prevents many issues
      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
        // Basic rendering options
        autoResize: true,
        backend: "svg", // Use SVG backend for better quality
        drawTitle: renderingOptions.drawTitle ?? true,
        drawComposer: renderingOptions.drawComposer ?? true,
        drawFingerings: renderingOptions.drawFingerings ?? false,
        drawCredits: false,
        drawPartNames: true,
        followCursor: false,
        defaultColorMusic: "#1f1f1f",
        // Page formatting
        pageFormat: renderingOptions.pageFormat || "A4_P",
      });

      // Load the MusicXML into OSMD - directly use the musicXML content
      await osmdRef.current.load(musicXML);

      // Render the sheet music
      osmdRef.current.render();

      console.log("MusicXML rendered successfully");
      setIsLoading(false);

      // Call success callback
      onLoad?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Error loading MusicXML:", err);
      setError(errorMessage);
      setIsLoading(false);

      // Call error callback
      onError?.(errorMessage);
    }
  }, [musicXML, renderingOptions, onLoad, onError]);

  // Effect to render music when component mounts or musicXML changes
  useEffect(() => {
    if (musicXML && containerRef.current) {
      renderMusic();
    }
  }, [musicXML, renderMusic]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clean up OSMD instance when component unmounts
      if (osmdRef.current) {
        try {
          osmdRef.current.clear();
        } catch (err) {
          console.warn("Error during OSMD cleanup:", err);
        }
        osmdRef.current = null;
      }
    };
  }, []);

  // Render the component
  return (
    <div className={`osmd-wrapper ${className}`}>
      {/* Loading state */}
      {isLoading && showLoadingSpinner && <LoadingSpinner />}

      {/* Error state */}
      {error && <ErrorDisplay message={error} />}

      {/* OSMD container - this is where the sheet music will be rendered */}
      <div
        ref={containerRef}
        className="osmd-container p-6 min-h-[400px] overflow-auto"
        style={{
          width: width ? `${width}px` : "100%",
          height: height ? `${height}px` : "auto",
          display: isLoading || error ? "none" : "block",
        }}
      />

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-2 bg-gray-100 text-xs text-gray-600 rounded">
          <div>
            Status: {isLoading ? "Loading" : error ? "Error" : "Loaded"}
          </div>
          <div>Content Length: {musicXML?.length || 0} characters</div>
        </div>
      )}
    </div>
  );
};

export default OSMDComponent;

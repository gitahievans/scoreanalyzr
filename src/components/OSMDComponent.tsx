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
    // Base zoom level (0.5 = small like mobile, 1.0 = normal size)
    baseZoom?: number;
  };
}

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    <span className="ml-3 text-muted-foreground">Loading sheet music...</span>
  </div>
);

// Error display component
const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
    <div className="text-center">
      <div className="text-destructive text-lg font-semibold mb-2">
        Error Loading Sheet Music
      </div>
      <div className="text-destructive/80 text-sm">{message}</div>
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
  // Ref to store resize observer
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Component state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Get responsive rendering options based on container width
  const getResponsiveOptions = useCallback(
    (containerWidth: number) => {
      const isMobile = containerWidth < 768;
      const isTablet = containerWidth >= 768 && containerWidth < 1024;
      const isDesktop = containerWidth >= 1024;

      // Base options with consistent compact sizing
      const options = {
        autoResize: true,
        backend: "svg" as const,
        drawTitle: renderingOptions.drawTitle ?? true,
        drawComposer: renderingOptions.drawComposer ?? true,
        drawFingerings: renderingOptions.drawFingerings ?? false,
        drawCredits: false,
        drawPartNames: !isMobile, // Hide part names on mobile to save space
        followCursor: false,
        defaultColorMusic: "#1f1f1f",

        // Use consistent page format - landscape gives more horizontal space
        pageFormat: renderingOptions.pageFormat || "",

        // Key change: Use consistent compact spacing across all screen sizes
        spacingFactorSoftmax: 0.7, // Smaller value = more compact spacing

        // Consistent measure spacing
        measureSpacing: 0.8,
        staffSpacing: 0.8,
        systemSpacing: 0.8,

        // Auto-resize settings
        autoResizeEnabled: true,

        // Remove the problematic responsive zoom - use consistent baseZoom instead
        // This was the main issue causing different sizes on different screens

        // Auto-beam options for cleaner look
        autoBeam: true,

        // Layout options
        pageBackgroundColor: "#ffffff",
        renderSingleHorizontalStaffline: false,

        // Compact note spacing
        notesSpacing: 0.8,

        // Reduce margins for more compact display
        pageTopMargin: 10,
        pageBottomMargin: 10,
        pageLeftMargin: 10,
        pageRightMargin: 10,

        // System and staff distances
        systemLeftMargin: 5,
        systemRightMargin: 5,
        staffDistance: 60, // Reduced from default
        systemDistance: 80, // Reduced from default
      };

      return options;
    },
    [renderingOptions]
  );

  // Optimized resize handler with better performance
  const handleResize = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      let isScrolling = false;

      // Detect scrolling to avoid expensive re-renders during scroll
      const handleScroll = () => {
        isScrolling = true;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          isScrolling = false;
        }, 150);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        clearTimeout(timeoutId);

        // Only re-render if not currently scrolling and size changed significantly
        if (!isScrolling && containerRef.current && musicXML) {
          const rect = containerRef.current.getBoundingClientRect();
          const currentWidth = containerDimensions.width;
          const currentHeight = containerDimensions.height;

          // Only re-render if size changed by more than 50px to avoid micro-adjustments
          const widthDiff = Math.abs(rect.width - currentWidth);
          const heightDiff = Math.abs(rect.height - currentHeight);

          if (widthDiff > 50 || heightDiff > 50) {
            timeoutId = setTimeout(() => {
              setContainerDimensions({
                width: rect.width,
                height: rect.height,
              });
              renderMusic();
            }, 500);
          }
        }
      };
    })(),
    [musicXML, containerDimensions.width, containerDimensions.height]
  );

  // Function to load and render MusicXML with responsive options
  const renderMusic = useCallback(async () => {
    if (!containerRef.current || !musicXML) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get container dimensions
      const rect = containerRef.current.getBoundingClientRect();
      const containerWidth = rect.width || width || 800;
      const containerHeight = rect.height || height || 600;

      // Clear the container first
      containerRef.current.innerHTML = "";

      // Get responsive options based on current container size
      const responsiveOptions = {
        ...getResponsiveOptions(containerWidth),
        // Disable auto-resize during initial render for better performance
        autoResize: false,
        autoResizeEnabled: false,
      };

      // Create new OSMD instance with responsive options
      osmdRef.current = new OpenSheetMusicDisplay(
        containerRef.current,
        responsiveOptions
      );

      // Load the MusicXML into OSMD
      await osmdRef.current.load(musicXML);

      // KEY FIX: Set consistent zoom based on desired compact appearance
      // Use the baseZoom from renderingOptions, or default to a compact size
      const baseZoom = renderingOptions.baseZoom ?? 0.65; // Default to compact size

      // Only adjust zoom slightly based on screen size, not dramatically
      const isMobile = containerWidth < 768;
      const zoomAdjustment = isMobile ? 0.9 : 1.0; // Slight adjustment for mobile

      osmdRef.current.zoom = baseZoom * zoomAdjustment;

      // Render the sheet music
      osmdRef.current.render();

      // Update container dimensions state
      setContainerDimensions({
        width: containerWidth,
        height: containerHeight,
      });

      console.log(
        `MusicXML rendered successfully at ${containerWidth}x${containerHeight} with zoom ${osmdRef.current.zoom}`
      );
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
  }, [
    musicXML,
    width,
    height,
    getResponsiveOptions,
    onLoad,
    onError,
    renderingOptions.baseZoom,
  ]);

  // Setup resize observer for responsive behavior
  useEffect(() => {
    if (containerRef.current) {
      resizeObserverRef.current = new ResizeObserver(handleResize);
      resizeObserverRef.current.observe(containerRef.current);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [handleResize]);

  // Effect to render music when component mounts or musicXML changes
  useEffect(() => {
    if (musicXML && containerRef.current) {
      // Small delay to ensure container is fully rendered
      const timeoutId = setTimeout(renderMusic, 100);
      return () => clearTimeout(timeoutId);
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

      // Clean up resize observer
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, []);

  // Render the component
  return (
    <div className={`osmd-wrapper w-full ${className}`}>
      {/* Loading state */}
      {isLoading && showLoadingSpinner && <LoadingSpinner />}

      {/* Error state */}
      {error && <ErrorDisplay message={error} />}

      {/* OSMD container - responsive and flexible */}
      <div
        ref={containerRef}
        className="osmd-container w-full min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] overflow-auto bg-white rounded-lg shadow-sm border border-border"
        style={{
          width: width ? `${width}px` : "100%",
          height: height ? `${height}px` : "auto",
          display: isLoading || error ? "none" : "block",
          minHeight: "400px",
          // Performance optimization
          willChange: "auto",
          contain: "layout style paint",
        }}
      />

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 bg-muted text-xs text-muted-foreground rounded-lg">
          <div className="grid grid-cols-2 gap-2">
            <div>
              Status: {isLoading ? "Loading" : error ? "Error" : "Loaded"}
            </div>
            <div>Content: {musicXML?.length || 0} chars</div>
            <div>
              Container: {containerDimensions.width}×
              {containerDimensions.height}
            </div>
            <div>Zoom: {osmdRef.current?.zoom?.toFixed(2) || "N/A"}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OSMDComponent;

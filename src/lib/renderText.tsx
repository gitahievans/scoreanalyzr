export const renderFormattedText = (text: string) => {
  // Split text into paragraphs
  const paragraphs = text.split("\n\n");

  return paragraphs
    .map((paragraph, pIndex) => {
      if (!paragraph.trim()) return null;

      // Process each paragraph for inline formatting
      const processInlineFormatting = (text: string) => {
        const parts = [];
        let currentIndex = 0;

        // Regular expression to match **bold**, ***italic***, and other patterns
        const formatRegex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g;
        let match;

        while ((match = formatRegex.exec(text)) !== null) {
          // Add text before the match
          if (match.index > currentIndex) {
            parts.push(text.slice(currentIndex, match.index));
          }

          const matchedText = match[0];
          const content = matchedText.replace(/\*/g, "");

          // Determine formatting based on number of asterisks
          if (matchedText.startsWith("***")) {
            parts.push(
              <strong
                key={`bold-${match.index}`}
                className="font-bold text-gray-900"
              >
                {content}
              </strong>
            );
          } else if (matchedText.startsWith("**")) {
            parts.push(
              <strong
                key={`bold-${match.index}`}
                className="font-semibold text-gray-800"
              >
                {content}
              </strong>
            );
          } else if (matchedText.startsWith("*")) {
            parts.push(
              <em
                key={`italic-${match.index}`}
                className="italic text-gray-700"
              >
                {content}
              </em>
            );
          }

          currentIndex = match.index + matchedText.length;
        }

        // Add remaining text
        if (currentIndex < text.length) {
          parts.push(text.slice(currentIndex));
        }

        return parts.length > 0 ? parts : [text];
      };

      return (
        <p key={pIndex} className="mb-4 text-gray-700 leading-relaxed">
          {processInlineFormatting(paragraph)}
        </p>
      );
    })
    .filter(Boolean);
};

function isHeading(line: string) {
  return /^(main|warm up|warm-up|cool down|cool-down|drills|rules|venue|notes|route|schedule|workout|session)$/i.test(line.trim());
}

export function EventDescription({ text, compact = false }: { text?: string | null; compact?: boolean }) {
  if (!text) return null;

  const lines = text.replace(/\r/g, "").split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim());
  const maxCompactLines = 8;
  const visibleLines = compact ? nonEmptyLines.slice(0, maxCompactLines) : lines;

  return (
    <div className={compact ? "event-description compact" : "event-description"}>
      {visibleLines.map((line, index) => {
        const clean = line.trim();

        if (!clean) {
          return compact ? null : <div aria-hidden="true" className="desc-spacer" key={index} />;
        }

        if (isHeading(clean)) {
          return (
            <h3 className="desc-heading" key={`${clean}-${index}`}>
              {clean}
            </h3>
          );
        }

        return (
          <p className="desc-line" key={`${clean}-${index}`}>
            {clean}
          </p>
        );
      })}

      {compact && nonEmptyLines.length > visibleLines.length && (
        <p className="desc-more">View full workout plan →</p>
      )}
    </div>
  );
}

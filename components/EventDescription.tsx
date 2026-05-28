function isHeading(line: string) {
  return /^(main|warm up|cool down|drills|rules|venue|notes|route|schedule)$/i.test(line.trim());
}

export function EventDescription({ text, compact = false }: { text?: string | null; compact?: boolean }) {
  if (!text) return null;

  const lines = text.replace(/\r/g, "").split("\n");
  const visibleLines = compact ? lines.filter((line) => line.trim()).slice(0, 5) : lines;

  return (
    <div className={compact ? "event-description compact" : "event-description"}>
      {visibleLines.map((line, index) => {
        const clean = line.trim();

        if (!clean) {
          return compact ? null : <div aria-hidden="true" className="desc-spacer" key={index} />;
        }

        if (isHeading(clean)) {
          return (
            <h3 className="desc-heading" key={index}>
              {clean}
            </h3>
          );
        }

        return (
          <p className="desc-line" key={index}>
            {clean}
          </p>
        );
      })}

      {compact && lines.filter((line) => line.trim()).length > visibleLines.length && (
        <p className="muted">...</p>
      )}
    </div>
  );
}

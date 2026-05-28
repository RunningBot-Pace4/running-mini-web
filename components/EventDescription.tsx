import type { ReactNode } from "react";

function isHeading(line: string) {
  return /^(main|warm up|warm-up|cool down|cool-down|drills|rules|venue|notes|route|schedule|workout|session)$/i.test(line.trim());
}

const colorClasses: Record<string, string> = {
  orange: "desc-color-orange",
  green: "desc-color-green",
  blue: "desc-color-blue",
  red: "desc-color-red",
  purple: "desc-color-purple",
};

function findFirstToken(text: string) {
  const patterns = [
    { type: "bold", regex: /\*\*([^*]+)\*\*/ },
    { type: "underline", regex: /__([^_]+)__/ },
    { type: "color", regex: /\[(orange|green|blue|red|purple)\]([\s\S]+?)\[\/\1\]/i },
  ] as const;

  const matches = patterns
    .map((pattern) => {
      const match = pattern.regex.exec(text);
      return match ? { ...pattern, match, index: match.index } : null;
    })
    .filter(Boolean) as Array<{
      type: "bold" | "underline" | "color";
      regex: RegExp;
      match: RegExpExecArray;
      index: number;
    }>;

  matches.sort((a, b) => a.index - b.index);
  return matches[0];
}

function renderInline(text: string): ReactNode[] {
  const token = findFirstToken(text);

  if (!token) return [text];

  const nodes: ReactNode[] = [];
  const before = text.slice(0, token.index);
  const after = text.slice(token.index + token.match[0].length);

  if (before) nodes.push(before);

  if (token.type === "bold") {
    nodes.push(
      <strong className="desc-strong" key={`${token.index}-bold`}>
        {renderInline(token.match[1])}
      </strong>
    );
  }

  if (token.type === "underline") {
    nodes.push(
      <span className="desc-underline" key={`${token.index}-underline`}>
        {renderInline(token.match[1])}
      </span>
    );
  }

  if (token.type === "color") {
    const color = token.match[1].toLowerCase();
    nodes.push(
      <span className={`desc-color ${colorClasses[color] || ""}`} key={`${token.index}-${color}`}>
        {renderInline(token.match[2])}
      </span>
    );
  }

  if (after) nodes.push(...renderInline(after));

  return nodes;
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

        if (isHeading(clean.replace(/\*\*|__|\[(orange|green|blue|red|purple)\]|\[\/(orange|green|blue|red|purple)\]/gi, ""))) {
          return (
            <h3 className="desc-heading" key={`${clean}-${index}`}>
              {renderInline(clean)}
            </h3>
          );
        }

        return (
          <p className="desc-line" key={`${clean}-${index}`}>
            {renderInline(clean)}
          </p>
        );
      })}

      {compact && nonEmptyLines.length > visibleLines.length && (
        <p className="desc-more">View full workout plan →</p>
      )}
    </div>
  );
}

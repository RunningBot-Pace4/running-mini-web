import { richTextToHtml, richTextToPreviewHtml } from "@/lib/rich-content";

export function EventDescription({
  text,
  compact = false,
  fullHref,
}: {
  text?: string | null;
  compact?: boolean;
  fullHref?: string;
}) {
  if (!text) return null;

  const html = compact ? richTextToPreviewHtml(text, 8, fullHref) : richTextToHtml(text);

  if (!html) return null;

  return (
    <div
      className={compact ? "event-description compact rich-content" : "event-description rich-content"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

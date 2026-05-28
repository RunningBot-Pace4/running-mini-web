const ALLOWED_TAGS = new Set([
  "a",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "u",
  "ul",
]);

const VOID_TAGS = new Set(["br", "hr"]);

const HEADING_WORDS =
  /^(main|warm up|warm-up|cool down|cool-down|cold down|cold-down|drills|rules|venue|notes|route|schedule|workout|session)$/i;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripLegacyMarkers(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/\[(orange|green|blue|red|purple)\]|\[\/(orange|green|blue|red|purple)\]/gi, "")
    .trim();
}

function renderLegacyInline(value: string) {
  let html = escapeHtml(value);

  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<u>$1</u>");
  html = html.replace(
    /\[(orange|green|blue|red|purple)\]([\s\S]+?)\[\/\1\]/gi,
    (_match, color: string, content: string) =>
      `<span class="desc-color-${color.toLowerCase()}">${content}</span>`,
  );

  return html;
}

function legacyTextToHtml(value: string) {
  const lines = value.replace(/\r/g, "").split("\n");

  return lines
    .map((line) => {
      const clean = line.trim();

      if (!clean) {
        return "<p></p>";
      }

      if (HEADING_WORDS.test(stripLegacyMarkers(clean))) {
        return `<h3>${renderLegacyInline(clean)}</h3>`;
      }

      return `<p>${renderLegacyInline(clean)}</p>`;
    })
    .join("");
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function sanitizeStyle(style: string) {
  const allowed: string[] = [];

  for (const rawRule of style.split(";")) {
    const [rawProperty, ...rawValue] = rawRule.split(":");
    if (!rawProperty || rawValue.length === 0) continue;

    const property = rawProperty.trim().toLowerCase();
    const value = rawValue.join(":").trim();

    if (!["text-align", "color", "background-color", "font-size"].includes(property)) {
      continue;
    }

    if (/url|expression|javascript|data:/i.test(value)) {
      continue;
    }

    if (!/^[#(),.%\w\s-]+$/.test(value)) {
      continue;
    }

    if (property === "text-align" && !/^(left|center|right|justify)$/i.test(value)) {
      continue;
    }

    if (property === "font-size" && !/^(\d{1,2}(\.\d+)?(px|rem|em|%)|small|medium|large|x-large)$/i.test(value)) {
      continue;
    }

    allowed.push(`${property}: ${value}`);
  }

  return allowed.join("; ");
}

export function sanitizeHref(href: string) {
  const clean = href.trim();

  if (/^(https?:|mailto:|tel:)/i.test(clean)) {
    return clean.replace(/"/g, "&quot;");
  }

  if (clean.startsWith("/")) {
    return clean.replace(/"/g, "&quot;");
  }

  return "";
}

function sanitizeClassName(className: string) {
  return className
    .split(/\s+/)
    .filter((name) => /^desc-color-(orange|green|blue|red|purple)$/.test(name))
    .join(" ");
}

function sanitizeAttributes(tag: string, attrs: string) {
  const cleanAttrs: string[] = [];
  const attrRegex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of attrs.matchAll(attrRegex)) {
    const attrName = match[1].toLowerCase();
    const attrValue = match[3] ?? match[4] ?? match[5] ?? "";

    if (attrName.startsWith("on")) continue;

    if (attrName === "style") {
      const style = sanitizeStyle(attrValue);
      if (style) cleanAttrs.push(`style="${style}"`);
      continue;
    }

    if (attrName === "class") {
      const className = sanitizeClassName(attrValue);
      if (className) cleanAttrs.push(`class="${className}"`);
      continue;
    }

    if (tag === "a" && attrName === "href") {
      const href = sanitizeHref(attrValue);
      if (href) {
        cleanAttrs.push(`href="${href}"`);
        cleanAttrs.push('target="_blank"');
        cleanAttrs.push('rel="noopener noreferrer nofollow"');
      }
      continue;
    }
  }

  return cleanAttrs.length ? ` ${cleanAttrs.join(" ")}` : "";
}

export function sanitizeRichHtml(input: string) {
  if (!input) return "";

  let html = input
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(
      /<\s*(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|meta|link)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
      "",
    )
    .replace(
      /<\s*(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|meta|link)[^>]*\/?>/gi,
      "",
    );

  html = html.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      return "";
    }

    if (match.startsWith("</")) {
      return VOID_TAGS.has(tag) ? "" : `</${tag}>`;
    }

    if (VOID_TAGS.has(tag)) {
      return `<${tag}>`;
    }

    return `<${tag}${sanitizeAttributes(tag, attrs || "")}>`;
  });

  return html;
}

export function richTextToHtml(value?: string | null) {
  if (!value) return "";

  const html = looksLikeHtml(value) ? value : legacyTextToHtml(value);
  return sanitizeRichHtml(html);
}

export function richTextToPreviewHtml(value?: string | null, maxBlocks = 8, fullHref?: string) {
  const html = richTextToHtml(value);
  if (!html) return "";

  const blocks = html.match(/<(p|h1|h2|h3|h4|ul|ol|blockquote|pre)[^>]*>[\s\S]*?<\/\1>|<hr>/gi);

  if (!blocks || blocks.length <= maxBlocks) {
    return html;
  }

  const more = fullHref
    ? `<p class="desc-more"><a href="${sanitizeHref(fullHref)}">View full workout plan →</a></p>`
    : `<p class="desc-more">View full workout plan →</p>`;

  return `${blocks.slice(0, maxBlocks).join("")}${more}`;
}

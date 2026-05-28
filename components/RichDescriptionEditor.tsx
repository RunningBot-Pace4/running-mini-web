"use client";

import { useRef, useState } from "react";

type RichDescriptionEditorProps = {
  id: string;
  name: string;
  defaultValue?: string;
  rows?: number;
};

export function RichDescriptionEditor({
  id,
  name,
  defaultValue = "",
  rows = 9,
}: RichDescriptionEditorProps) {
  const [value, setValue] = useState(defaultValue);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  function wrapSelection(prefix: string, suffix: string, fallback: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.slice(start, end) || fallback;
    const nextValue = `${value.slice(0, start)}${prefix}${selectedText}${suffix}${value.slice(end)}`;

    setValue(nextValue);

    window.setTimeout(() => {
      textarea.focus();
      const selectionStart = start + prefix.length;
      const selectionEnd = selectionStart + selectedText.length;
      textarea.setSelectionRange(selectionStart, selectionEnd);
    }, 0);
  }

  return (
    <div className="rich-editor">
      <div className="editor-toolbar" aria-label="Description formatting tools">
        <button type="button" onClick={() => wrapSelection("**", "**", "bold text")}>
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => wrapSelection("__", "__", "underlined text")}>
          <span className="toolbar-underline">U</span>
        </button>
        <button type="button" onClick={() => wrapSelection("[orange]", "[/orange]", "orange text")}>
          Orange
        </button>
        <button type="button" onClick={() => wrapSelection("[green]", "[/green]", "green text")}>
          Green
        </button>
        <button type="button" onClick={() => wrapSelection("[blue]", "[/blue]", "blue text")}>
          Blue
        </button>
        <button type="button" onClick={() => wrapSelection("[red]", "[/red]", "red text")}>
          Red
        </button>
      </div>

      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />

      <p className="muted editor-help">
        Select words and tap a tool. Supported formatting: bold, underline, and text color.
      </p>
    </div>
  );
}

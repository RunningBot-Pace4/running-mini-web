"use client";

import { useMemo, useState } from "react";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import { richTextToHtml } from "@/lib/rich-content";
import { FontSize } from "@/lib/tiptap-font-size";

type RichDescriptionEditorProps = {
  id: string;
  name: string;
  defaultValue?: string;
  rows?: number;
};

const COLORS = [
  { label: "Default color", value: "" },
  { label: "Orange", value: "#ff5a1f" },
  { label: "Green", value: "#047a45" },
  { label: "Blue", value: "#2563eb" },
  { label: "Red", value: "#b42318" },
  { label: "Purple", value: "#7c3aed" },
];

function ToolbarButton({
  active,
  children,
  disabled,
  onClick,
  title,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      aria-label={title}
      aria-pressed={active}
      className={active ? "is-active" : ""}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

function setFormatting(editor: Editor, value: string) {
  const chain = editor.chain().focus();

  if (value === "paragraph") chain.setParagraph().run();
  if (value === "h1") chain.toggleHeading({ level: 1 }).run();
  if (value === "h2") chain.toggleHeading({ level: 2 }).run();
  if (value === "h3") chain.toggleHeading({ level: 3 }).run();
  if (value === "blockquote") chain.toggleBlockquote().run();
  if (value === "codeBlock") chain.toggleCodeBlock().run();
}

function setLink(editor: Editor) {
  const currentHref = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("Enter link URL. Leave blank to remove link.", currentHref || "https://");

  if (url === null) return;

  if (!url.trim()) {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
}

export function RichDescriptionEditor({
  id,
  name,
  defaultValue = "",
  rows = 9,
}: RichDescriptionEditorProps) {
  const initialHtml = useMemo(() => richTextToHtml(defaultValue), [defaultValue]);
  const [value, setValue] = useState(initialHtml);
  const [fullscreen, setFullscreen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      TextStyle,
      Color,
      FontSize,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: initialHtml || "<p></p>",
    editorProps: {
      attributes: {
        "aria-label": "Rich text editor",
        class: "rich-editor-surface",
        style: `min-height: ${Math.max(rows, 5) * 28}px`,
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      setValue(activeEditor.getHTML());
    },
  });

  const disabled = !editor;

  return (
    <div className={fullscreen ? "rich-editor rich-editor-fullscreen" : "rich-editor"}>
      <input id={id} name={name} type="hidden" value={value} />

      <div className="rich-editor-toolbar" aria-label="Description formatting tools">
        <select
          aria-label="Align text"
          disabled={disabled}
          onChange={(event) => {
            if (!editor || !event.target.value) return;
            editor.chain().focus().setTextAlign(event.target.value).run();
            event.currentTarget.value = "";
          }}
        >
          <option value="">Align</option>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </select>

        <span className="toolbar-divider" />

        <ToolbarButton
          active={editor?.isActive("bold")}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("italic")}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("strike")}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("underline")}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <u>U</u>
        </ToolbarButton>

        <ToolbarButton
          disabled={disabled}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          title="Horizontal line"
        >
          —
        </ToolbarButton>

        <ToolbarButton
          active={fullscreen}
          disabled={disabled}
          onClick={() => setFullscreen((current) => !current)}
          title="Fullscreen editor"
        >
          ⛶
        </ToolbarButton>

        <span className="toolbar-divider" />

        <select
          aria-label="Formatting"
          disabled={disabled}
          onChange={(event) => {
            if (!editor || !event.target.value) return;
            setFormatting(editor, event.target.value);
            event.currentTarget.value = "";
          }}
        >
          <option value="">Formatting</option>
          <option value="paragraph">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
          <option value="codeBlock">Code block</option>
        </select>

        <select
          aria-label="Font size"
          disabled={disabled}
          onChange={(event) => {
            if (!editor) return;
            const size = event.target.value;
            if (!size) {
              editor.chain().focus().unsetFontSize().run();
            } else {
              editor.chain().focus().setFontSize(size).run();
            }
          }}
        >
          <option value="">Font size</option>
          <option value="0.9rem">Small</option>
          <option value="1rem">Normal</option>
          <option value="1.25rem">Large</option>
          <option value="1.6rem">Extra large</option>
        </select>

        <select
          aria-label="Text color"
          disabled={disabled}
          onChange={(event) => {
            if (!editor) return;
            const color = event.target.value;
            if (!color) {
              editor.chain().focus().unsetColor().run();
            } else {
              editor.chain().focus().setColor(color).run();
            }
          }}
        >
          {COLORS.map((color) => (
            <option key={color.label} value={color.value}>
              {color.label}
            </option>
          ))}
        </select>

        <span className="toolbar-divider" />

        <ToolbarButton
          active={editor?.isActive("blockquote")}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          ❝
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("bulletList")}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("orderedList")}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          1. List
        </ToolbarButton>
        <ToolbarButton
          disabled={disabled}
          onClick={() => editor?.chain().focus().liftListItem("listItem").run()}
          title="Outdent list item"
        >
          Outdent
        </ToolbarButton>
        <ToolbarButton
          disabled={disabled}
          onClick={() => editor?.chain().focus().sinkListItem("listItem").run()}
          title="Indent list item"
        >
          Indent
        </ToolbarButton>

        <span className="toolbar-divider" />

        <ToolbarButton
          disabled={disabled}
          onClick={() => editor?.chain().focus().undo().run()}
          title="Undo"
        >
          ↶
        </ToolbarButton>
        <ToolbarButton
          disabled={disabled}
          onClick={() => editor?.chain().focus().redo().run()}
          title="Redo"
        >
          ↷
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("code")}
          disabled={disabled}
          onClick={() => editor?.chain().focus().toggleCode().run()}
          title="Inline code"
        >
          &lt;/&gt;
        </ToolbarButton>
        <ToolbarButton
          active={editor?.isActive("link")}
          disabled={disabled}
          onClick={() => editor && setLink(editor)}
          title="Add or edit link"
        >
          🔗
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      <p className="muted editor-help">
        Use the toolbar to format event and home descriptions. Content is saved as rich HTML.
      </p>
    </div>
  );
}

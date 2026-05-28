"use client";

import { useEffect, useState } from "react";

export function ShareButtons({ text }: { text: string }) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ title: "Running Result", text, url });
      return;
    }
    await copyLink();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  return (
    <div className="form-stack">
      <button type="button" onClick={nativeShare}>
        Share via phone apps
      </button>

      <div className="grid grid-2">
        <a
          className="button secondary"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
        >
          Facebook
        </a>
        <a
          className="button secondary"
          href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
          target="_blank"
          rel="noreferrer"
        >
          X / Twitter
        </a>
      </div>

      <button className="ghost" type="button" onClick={copyLink}>
        {copied ? "Copied!" : "Copy link for IG / XHS"}
      </button>

      <p className="muted">
        For Instagram and Xiaohongshu, use “Share via phone apps” or copy the link and paste it into
        your post/story manually.
      </p>
    </div>
  );
}

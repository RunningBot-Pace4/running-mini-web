"use client";

import { useMemo, useState } from "react";

type SharePosterActionsProps = {
  userName: string;
  eventTitle: string;
  activityName: string;
  distanceKm: string;
  totalPoints: number;
  attendancePoints: number;
  distancePoints: number;
  shareText: string;
};

type FileShareData = ShareData & { files?: File[] };

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawTextBlock(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  const visibleLines = lines.slice(0, maxLines);
  visibleLines.forEach((line, index) => {
    const value = index === maxLines - 1 && lines.length > maxLines ? `${line.replace(/\s+\S*$/, "")}…` : line;
    ctx.fillText(value, x, y + index * lineHeight);
  });
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Unable to generate image."));
    }, "image/png", 0.96);
  });
}

export function SharePosterActions({
  userName,
  eventTitle,
  activityName,
  distanceKm,
  totalPoints,
  attendancePoints,
  distancePoints,
  shareText,
}: SharePosterActionsProps) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");

  useMemo(() => {
    if (typeof window !== "undefined") setUrl(window.location.href);
  }, []);

  function buildPosterCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported on this device.");

    const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
    bg.addColorStop(0, "#0b1f33");
    bg.addColorStop(0.42, "#1d6fa3");
    bg.addColorStop(1, "#ff7a45");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    const sunrise = ctx.createRadialGradient(820, 260, 20, 820, 260, 440);
    sunrise.addColorStop(0, "rgba(255, 214, 107, 0.98)");
    sunrise.addColorStop(0.45, "rgba(255, 122, 69, 0.45)");
    sunrise.addColorStop(1, "rgba(255, 122, 69, 0)");
    ctx.fillStyle = sunrise;
    ctx.fillRect(0, 0, 1080, 780);

    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i += 1) {
      ctx.beginPath();
      ctx.arc(540, 1280 + i * 18, 560 + i * 52, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.16)";
    for (let i = 0; i < 40; i += 1) {
      const x = (i * 173) % 1080;
      const y = 260 + ((i * 97) % 980);
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 5), 0, Math.PI * 2);
      ctx.fill();
    }

    roundedRect(ctx, 70, 86, 940, 1640, 72);
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#0b1f33";
    ctx.font = "900 42px Arial";
    ctx.fillText("RUN MINI RESULT", 126, 190);
    ctx.fillStyle = "#1d6fa3";
    ctx.font = "800 26px Arial";
    ctx.fillText("Sweat • Run • Score", 126, 235);

    roundedRect(ctx, 126, 310, 828, 500, 56);
    const hero = ctx.createLinearGradient(126, 310, 954, 810);
    hero.addColorStop(0, "#e9f8ff");
    hero.addColorStop(0.6, "#f7ffe7");
    hero.addColorStop(1, "#fff2e5");
    ctx.fillStyle = hero;
    ctx.fill();
    ctx.strokeStyle = "rgba(29,111,163,0.16)";
    ctx.stroke();

    ctx.fillStyle = "#0b1f33";
    ctx.font = "900 138px Arial";
    ctx.fillText(`${distanceKm}km`, 172, 500);
    ctx.fillStyle = "#ff5a1f";
    ctx.font = "900 118px Arial";
    ctx.fillText(`${totalPoints} pts`, 172, 650);

    ctx.fillStyle = "#516271";
    ctx.font = "700 34px Arial";
    ctx.fillText(`${attendancePoints} attend pts + ${distancePoints} distance pts`, 174, 725);

    ctx.strokeStyle = "#1d6fa3";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(170, 940);
    ctx.bezierCurveTo(340, 830, 472, 1080, 640, 956);
    ctx.bezierCurveTo(750, 870, 810, 930, 910, 850);
    ctx.stroke();

    for (const [x, y, color] of [
      [170, 940, "#07c160"],
      [640, 956, "#ffb000"],
      [910, 850, "#ff5a1f"],
    ] as const) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x, y, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 19, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#0b1f33";
    ctx.font = "900 58px Arial";
    drawTextBlock(ctx, userName, 126, 1120, 820, 66, 1);

    ctx.fillStyle = "#334155";
    ctx.font = "800 36px Arial";
    drawTextBlock(ctx, eventTitle, 126, 1195, 820, 46, 2);

    ctx.fillStyle = "#64748b";
    ctx.font = "700 30px Arial";
    drawTextBlock(ctx, activityName, 126, 1325, 820, 42, 2);

    roundedRect(ctx, 126, 1430, 828, 160, 38);
    ctx.fillStyle = "#0b1f33";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 34px Arial";
    ctx.fillText("SHARE THE FINISH", 174, 1504);
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "700 28px Arial";
    ctx.fillText("Save this story card and post to IG / XHS.", 174, 1552);

    ctx.fillStyle = "#0b1f33";
    ctx.font = "900 28px Arial";
    ctx.fillText("#RunMini #SweatRunScore", 126, 1688);

    return canvas;
  }

  async function generateImageFile() {
    const canvas = buildPosterCanvas();
    const blob = await canvasToBlob(canvas);
    return new File([blob], "run-mini-story.png", { type: "image/png" });
  }

  async function shareStoryImage() {
    setBusy(true);
    setMessage("");
    try {
      const file = await generateImageFile();
      const data: FileShareData = {
        title: "Run Mini Result",
        text: shareText,
        files: [file],
      };
      const nav = navigator as Navigator & { canShare?: (data: FileShareData) => boolean };

      if (navigator.share && (!nav.canShare || nav.canShare(data))) {
        await navigator.share(data);
        setMessage("Open Instagram or your favourite app from the share sheet.");
      } else {
        downloadFile(file);
        setMessage("Image downloaded. Upload it to Instagram Story or post manually.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to share image. Please download instead.");
    } finally {
      setBusy(false);
    }
  }

  function downloadFile(file: File) {
    const objectUrl = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }

  async function downloadStoryImage() {
    setBusy(true);
    setMessage("");
    try {
      const file = await generateImageFile();
      downloadFile(file);
      setMessage("Story image downloaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to generate image.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(`${shareText} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="share-actions-panel">
      <div className="share-action-grid">
        <button type="button" onClick={shareStoryImage} disabled={busy}>
          {busy ? "Generating..." : "Share IG story image"}
        </button>
        <button className="secondary" type="button" onClick={downloadStoryImage} disabled={busy}>
          Download story image
        </button>
      </div>

      <button className="ghost" type="button" onClick={copyCaption} disabled={busy}>
        {copied ? "Caption copied!" : "Copy caption + link"}
      </button>

      {message && <p className="success-text">{message}</p>}
      <p className="muted">
        Tip: Instagram and Xiaohongshu work best with a 9:16 story image. Use the phone share sheet when available, or download and upload manually.
      </p>
    </div>
  );
}

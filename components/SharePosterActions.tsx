"use client";

import { useEffect, useState } from "react";

type SharePosterActionsProps = {
  brandName: string;
  userName: string;
  eventTitle: string;
  activityName: string;
  eventDate: string;
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

function drawTextBlock(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 2) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) current = test;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  lines.slice(0, maxLines).forEach((line, index) => {
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
  brandName,
  userName,
  eventTitle,
  activityName,
  eventDate,
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

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  function buildPosterCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported on this device.");

    const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
    bg.addColorStop(0, "#e8f8ff");
    bg.addColorStop(0.38, "#f7ffe9");
    bg.addColorStop(1, "#fff0df");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    const sun = ctx.createRadialGradient(830, 250, 20, 830, 250, 520);
    sun.addColorStop(0, "rgba(255, 195, 69, 0.9)");
    sun.addColorStop(0.45, "rgba(255, 122, 69, 0.35)");
    sun.addColorStop(1, "rgba(255, 122, 69, 0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, 1080, 900);

    ctx.strokeStyle = "rgba(29,111,163,0.12)";
    ctx.lineWidth = 8;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(540, 1320 + i * 50, 520 + i * 74, Math.PI * 1.06, Math.PI * 1.94);
      ctx.stroke();
    }

    roundedRect(ctx, 70, 82, 940, 1756, 70);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fill();
    ctx.strokeStyle = "rgba(29,111,163,0.18)";
    ctx.lineWidth = 3;
    ctx.stroke();

    roundedRect(ctx, 126, 145, 110, 110, 34);
    const logoGrad = ctx.createLinearGradient(126, 145, 236, 255);
    logoGrad.addColorStop(0, "#6ec6ff");
    logoGrad.addColorStop(1, "#ff7a45");
    ctx.fillStyle = logoGrad;
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 54px Arial";
    ctx.fillText("🏃", 151, 220);

    ctx.fillStyle = "#0b1f33";
    ctx.font = "900 44px Arial";
    drawTextBlock(ctx, brandName, 270, 184, 640, 52, 1);
    ctx.fillStyle = "#526579";
    ctx.font = "800 28px Arial";
    ctx.fillText("Sweat • Run • Score", 270, 232);

    ctx.fillStyle = "#1d6fa3";
    ctx.font = "900 34px Arial";
    ctx.fillText("FINISH RESULT", 126, 390);

    ctx.fillStyle = "#0b1f33";
    ctx.font = "900 186px Arial";
    ctx.fillText(distanceKm, 126, 590);
    ctx.font = "900 90px Arial";
    ctx.fillText("km", 126 + ctx.measureText(distanceKm).width + 18, 590);

    roundedRect(ctx, 126, 650, 420, 102, 51);
    ctx.fillStyle = "#ff5a1f";
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 54px Arial";
    ctx.fillText(`${totalPoints} pts`, 172, 718);

    ctx.fillStyle = "#0b1f33";
    ctx.font = "900 54px Arial";
    drawTextBlock(ctx, eventTitle, 126, 865, 820, 62, 2);
    ctx.fillStyle = "#526579";
    ctx.font = "700 30px Arial";
    drawTextBlock(ctx, eventDate, 126, 995, 820, 42, 2);

    roundedRect(ctx, 126, 1115, 828, 250, 54);
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.fill();
    ctx.strokeStyle = "rgba(29,111,163,0.16)";
    ctx.stroke();
    ctx.strokeStyle = "#1d6fa3";
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(190, 1250);
    ctx.bezierCurveTo(330, 1130, 480, 1350, 635, 1240);
    ctx.bezierCurveTo(760, 1152, 830, 1215, 910, 1146);
    ctx.stroke();

    for (const [x, y, color] of [
      [190, 1250, "#07c160"],
      [635, 1240, "#ffb000"],
      [910, 1146, "#ff5a1f"],
    ] as const) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = "700 62px Arial";
    ctx.fillText("🏃‍♂️", 525, 1210);

    ctx.fillStyle = "#1d6fa3";
    ctx.font = "900 30px Arial";
    ctx.fillText("RUNNER", 126, 1480);
    ctx.fillStyle = "#0b1f33";
    ctx.font = "900 72px Arial";
    drawTextBlock(ctx, userName, 126, 1560, 820, 80, 1);
    ctx.fillStyle = "#64748b";
    ctx.font = "700 30px Arial";
    drawTextBlock(ctx, activityName, 126, 1625, 820, 38, 1);

    const stats = [
      ["Attend", attendancePoints],
      ["Distance", distancePoints],
      ["Total", totalPoints],
    ] as const;
    stats.forEach(([label, value], index) => {
      const x = 126 + index * 280;
      roundedRect(ctx, x, 1690, 246, 110, 34);
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.fill();
      ctx.strokeStyle = "rgba(29,111,163,0.14)";
      ctx.stroke();
      ctx.fillStyle = "#0b1f33";
      ctx.font = "900 42px Arial";
      ctx.fillText(String(value), x + 36, 1743);
      ctx.fillStyle = "#526579";
      ctx.font = "800 24px Arial";
      ctx.fillText(label, x + 36, 1782);
    });

    return canvas;
  }

  async function generateImageFile() {
    const canvas = buildPosterCanvas();
    const blob = await canvasToBlob(canvas);
    return new File([blob], "run-mini-story.png", { type: "image/png" });
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

  async function shareStoryImage() {
    setBusy(true);
    setMessage("");
    try {
      const file = await generateImageFile();
      const data: FileShareData = { title: "Run Mini Result", text: shareText, files: [file] };
      const nav = navigator as Navigator & { canShare?: (data: FileShareData) => boolean };
      if (navigator.share && (!nav.canShare || nav.canShare(data))) {
        await navigator.share(data);
        setMessage("Choose Instagram, Xiaohongshu, WhatsApp, or any app from your phone share sheet.");
      } else {
        downloadFile(file);
        setMessage("Image downloaded. Upload it to Instagram Story manually.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to share image. Please download instead.");
    } finally {
      setBusy(false);
    }
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
    <div className="share-actions-panel clean-share-actions">
      <button type="button" onClick={shareStoryImage} disabled={busy}>
        {busy ? "Generating story..." : "Share story image"}
      </button>
      <button className="secondary" type="button" onClick={downloadStoryImage} disabled={busy}>
        Download image
      </button>
      <button className="ghost" type="button" onClick={copyCaption} disabled={busy}>
        {copied ? "Caption copied!" : "Copy caption + link"}
      </button>
      {message && <p className="success-text">{message}</p>}
    </div>
  );
}

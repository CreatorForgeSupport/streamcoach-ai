"use client";

import { useState } from "react";
import { createWorker } from "tesseract.js";

type AnalyticsOCRProps = {
  setDuration: (value: string) => void;
  setAvgViewers: (value: string) => void;
  setPeakViewers: (value: string) => void;
  setUniqueViewers: (value: string) => void;
  setComments: (value: string) => void;
  setFollowers: (value: string) => void;
};

type OcrResult = {
  duration: string;
  avgViewers: string;
  peakViewers: string;
  uniqueViewers: string;
  comments: string;
  followers: string;
};

type CropTarget = {
  key: keyof OcrResult;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const emptyResult: OcrResult = {
  duration: "",
  avgViewers: "",
  peakViewers: "",
  uniqueViewers: "",
  comments: "",
  followers: "",
};

const cropTargets: CropTarget[] = [
  { key: "duration", label: "配信時間", x: 0.015, y: 0.405, w: 0.205, h: 0.105 },
  { key: "avgViewers", label: "平均視聴者", x: 0.265, y: 0.405, w: 0.18, h: 0.105 },
  { key: "peakViewers", label: "最大同接", x: 0.515, y: 0.405, w: 0.18, h: 0.105 },
  { key: "uniqueViewers", label: "ユニーク視聴者", x: 0.765, y: 0.405, w: 0.18, h: 0.105 },
  { key: "comments", label: "コメント数", x: 0.015, y: 0.825, w: 0.18, h: 0.105 },
  { key: "followers", label: "フォロワー増減", x: 0.505, y: 0.785, w: 0.23, h: 0.16 },
];

export function AnalyticsOCR({
  setDuration,
  setAvgViewers,
  setPeakViewers,
  setUniqueViewers,
  setComments,
  setFollowers,
}: AnalyticsOCRProps) {
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState<OcrResult>(emptyResult);
  const [isReading, setIsReading] = useState(false);
  const [message, setMessage] = useState("");

  const applyValues = (values: OcrResult) => {
    if (values.duration) setDuration(values.duration);
    if (values.avgViewers) setAvgViewers(values.avgViewers);
    if (values.peakViewers) setPeakViewers(values.peakViewers);
    if (values.uniqueViewers) setUniqueViewers(values.uniqueViewers);
    if (values.comments) setComments(values.comments);
    if (values.followers) setFollowers(values.followers);
  };

  const handleFile = async (file?: File) => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult(emptyResult);
    setMessage("読み取り中...");
    setIsReading(true);

    try {
      const image = await loadImage(url);
      const worker = await createWorker("jpn+eng");

      await worker.setParameters({
        tessedit_char_whitelist:
          "0123456789.-:時間分人件abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      });

      const nextResult: OcrResult = { ...emptyResult };

      for (const target of cropTargets) {
        const cropped = cropImageToDataUrl(image, target);
        const { data } = await worker.recognize(cropped);
        nextResult[target.key] = parseValueFromCrop(target.key, data.text || "");
      }

      await worker.terminate();

      setResult(nextResult);
      applyValues(nextResult);
      setMessage("読み取り完了。数字は左の入力欄に自動反映されました。");
    } catch (error) {
      console.error(error);
      setMessage("読み取りに失敗しました。手入力で記録してください。");
    } finally {
      setIsReading(false);
    }
  };

  const hasResult = Object.values(result).some(Boolean);

  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">画像読み取り</h3>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Twitchの配信後アナリティクス画像を選ぶと、数字を左の入力欄に自動入力します。
          </p>
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="max-w-[190px] text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-purple-500"
        />
      </div>

      {message && (
        <div className="mb-3 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs text-zinc-200">
          {isReading ? "読み取り中..." : message}
        </div>
      )}

      {previewUrl ? (
        <img
          src={previewUrl}
          alt="アップロードしたTwitchアナリティクス画像"
          className="h-36 w-full rounded-xl object-contain"
        />
      ) : (
        <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-xs text-zinc-500">
          画像を選ぶとプレビューが表示されます。
        </div>
      )}

      {hasResult && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <MiniResult label="平均" value={result.avgViewers ? `${result.avgViewers}人` : "-"} />
          <MiniResult label="最大" value={result.peakViewers ? `${result.peakViewers}人` : "-"} />
          <MiniResult label="ユニーク" value={result.uniqueViewers ? `${result.uniqueViewers}人` : "-"} />
          <MiniResult label="コメント" value={result.comments ? `${result.comments}件` : "-"} />
          <MiniResult label="フォロー" value={result.followers ? `${result.followers}人` : "0人"} />
          <MiniResult label="時間" value={result.duration ? `${result.duration}h` : "-"} />
        </div>
      )}
    </div>
  );
}

function MiniResult({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-900 p-2">
      <p className="text-zinc-500">{label}</p>
      <p className="mt-1 font-bold text-zinc-100">{value}</p>
    </div>
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function cropImageToDataUrl(image: HTMLImageElement, target: CropTarget) {
  const canvas = document.createElement("canvas");
  const scale = 5;

  const sourceX = image.naturalWidth * target.x;
  const sourceY = image.naturalHeight * target.y;
  const sourceW = image.naturalWidth * target.w;
  const sourceH = image.naturalHeight * target.h;

  canvas.width = sourceW * scale;
  canvas.height = sourceH * scale;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.filter = "contrast(2) brightness(1.35) saturate(0)";
  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceW,
    sourceH,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL("image/png");
}

function parseValueFromCrop(key: keyof OcrResult, text: string) {
  const cleaned = text
    .replace(/[Oo]/g, "0")
    .replace(/[Il|]/g, "1")
    .replace(/,/g, "");

  if (key === "duration") {
    const duration = parseDuration(cleaned);
    if (duration) return duration;
  }

  const numbers = cleaned.match(/-?\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) return "";

  if (key === "followers") {
    return numbers[numbers.length - 1] || "";
  }

  return numbers[0];
}

function parseDuration(text: string) {
  const normalized = text.replace(/\s/g, "");

  const jpMatch = normalized.match(/(\d+)時間(\d+)?分?/);
  if (jpMatch) {
    const hours = Number(jpMatch[1] || 0);
    const minutes = Number(jpMatch[2] || 0);
    return (hours + minutes / 60).toFixed(1);
  }

  const colonMatch = normalized.match(/(\d+):(\d+)/);
  if (colonMatch) {
    const hours = Number(colonMatch[1] || 0);
    const minutes = Number(colonMatch[2] || 0);
    return (hours + minutes / 60).toFixed(1);
  }

  const numbers = normalized.match(/\d+/g);
  if (numbers && numbers.length >= 2) {
    const hours = Number(numbers[0] || 0);
    const minutes = Number(numbers[1] || 0);
    return (hours + minutes / 60).toFixed(1);
  }

  return numbers?.[0] || "";
}

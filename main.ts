// gta6-clipper-01 — "Clip GTA 6 for the most YouTube views"
//
// Entry program for the make.fun bounty gta6-clipper-01. It has two jobs:
//
//   1. Gate duty (the default run, and the only run the harness makes):
//      read VIDEO.json in this repository, check what it names, and print a
//      fixed report. The report depends on nothing outside this repository,
//      uses no clock and no network, and is byte-for-byte the same on every
//      run, so two runs of the entry always agree.
//
//   2. Production (only when MAKEFUN_SOURCE_VIDEO points at the source
//      recording): cut the clip this repository exists for. The whole edit —
//      the moment, the hook, every caption and the closing pitch card — is
//      written below as data, and ffmpeg is driven through child_process to
//      render it, plus a still frame for the cover.
//
// Node 22, standard library only.

import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoDir = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// The edit, as data.
//
// Source: KreekCraft's "GTA 6 LIVE (FULL GAME) GIVEAWAYS | DAY 1" stream
// recording. The moment is the first story chase of the game falling apart:
// at 05:20:59 he realises the bridge ahead never connects, the target's boat
// gets away, and at about 05:21:30 the run dies on the red FAILED screen —
// "ARNOLD ESCAPED." — before he says, at 05:21:33, that he failed his first
// mission. Forty seconds, starting half a breath before the bridge line.
// ---------------------------------------------------------------------------

const SOURCE_IN_SECONDS = 19258.5; // 05:20:58.5 into the recording
const CLIP_SECONDS = 40;

const CANVAS_W = 1080;
const CANVAS_H = 1920;
const PICTURE_Y = 430; // the game picture sits under the top band
const CAPTION_Y = 1090; // his own lines, burned in below the picture
const CARD_Y = 1330; // the make.fun pitch card, lower band
const CARD_H = 330;

const FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
const INK = "white";
const ACCENT = "0xFFD60A";

type TimedText = { from: number; to: number; text: string };

// The hook holds the first seconds: a decade of waiting, gone in one chase.
// Three short lines, sized to sit inside the top band with room to spare.
type HookLine = TimedText & { size: number; y: number; color: string };
const HOOK: HookLine[] = [
  { from: 0, to: 3.4, text: "WAITED 10+ YEARS", size: 72, y: 84, color: ACCENT },
  { from: 0, to: 3.4, text: "FOR GTA 6...", size: 72, y: 178, color: ACCENT },
  { from: 0, to: 3.4, text: "AND FAILED THE FIRST MISSION", size: 54, y: 278, color: INK },
];

// His own spoken lines, in the order he says them.
const CAPTIONS: TimedText[] = [
  { from: 0.5, to: 8.5, text: "That bridge doesn't connect!" },
  { from: 8.5, to: 14.5, text: "Oh... oh... MAKE IT!" },
  { from: 16.5, to: 18.5, text: "We're gonna lose him..." },
  { from: 18.5, to: 20.5, text: "Don't lose him!" },
  { from: 20.5, to: 23.5, text: "Uh-oh... uh-oh..." },
  { from: 23.5, to: 29.5, text: "He's gone. I don't see him." },
  { from: 34.5, to: 39.8, text: "I failed my first mission." },
];

// The pitch card arrives while the FAILED screen holds, and stays to the end.
const PITCH_FROM = 33.5;
const PITCH_LINES: { text: string; size: number; color: string; y: number }[] = [
  { text: "MAKE CLIPS WITH AI", size: 58, color: INK, y: CARD_Y + 42 },
  { text: "EARN MONEY ON MAKE.FUN", size: 58, color: ACCENT, y: CARD_Y + 132 },
  { text: "make.fun/bounty/gta6-clipper-01", size: 40, color: INK, y: CARD_Y + 232 },
];

// ---------------------------------------------------------------------------
// Gate duty.
// ---------------------------------------------------------------------------

function describeUrl(raw: string): string {
  if (raw.includes("<id>")) return "placeholder";
  if (/youtube\.com\/shorts\/[\w-]+/.test(raw)) return "youtube short";
  if (/youtube\.com\/watch\?v=[\w-]+/.test(raw)) return "youtube video";
  if (/youtu\.be\/[\w-]+/.test(raw)) return "youtube video (short link)";
  return "unrecognised";
}

function gateDuty(): number {
  const videoFile = join(repoDir, "VIDEO.json");
  const parsed = JSON.parse(readFileSync(videoFile, "utf8")) as { url?: unknown };
  const url = typeof parsed.url === "string" ? parsed.url : "";
  const kind = describeUrl(url);
  const lines = [
    "competition: gta6-clipper-01",
    "entry: one public YouTube clip, cut by an AI agent",
    `video.json url: ${url}`,
    `video.json url kind: ${kind}`,
    kind === "placeholder"
      ? "state: waiting for the public upload; VIDEO.json is filled in after it"
      : "state: video named; ready to hand in",
  ];
  process.stdout.write(lines.join("\n") + "\n");
  return 0;
}

// ---------------------------------------------------------------------------
// Production.
// ---------------------------------------------------------------------------

function textFile(dir: string, name: string, text: string): string {
  const path = join(dir, name);
  writeFileSync(path, text, "utf8");
  return path;
}

function drawText(
  file: string,
  size: number,
  color: string,
  y: number,
  window: { from: number; to: number } | null,
  boxed: boolean,
): string {
  const parts = [
    `drawtext=fontfile=${FONT}`,
    `textfile=${file}`,
    `fontsize=${size}`,
    `fontcolor=${color}`,
    "borderw=3",
    "bordercolor=black",
    "x=(w-text_w)/2",
    `y=${y}`,
  ];
  if (boxed) parts.push("box=1", "boxcolor=black@0.5", "boxborderw=16");
  if (window) {
    parts.push(`enable='between(t\\,${window.from}\\,${window.to})'`);
  }
  return parts.join(":");
}

function buildFilter(textDir: string): string {
  const steps: string[] = [];
  // Blurred, darkened copy of the frame fills the tall canvas...
  steps.push(
    `[0:v]scale=${CANVAS_W}:${CANVAS_H}:force_original_aspect_ratio=increase,` +
      `crop=${CANVAS_W}:${CANVAS_H},gblur=sigma=42,eq=brightness=-0.28[bg]`,
  );
  // ...and the full picture (facecam corner intact, nothing cropped) over it.
  steps.push(`[0:v]scale=${CANVAS_W}:-2[fg]`);
  steps.push(`[bg][fg]overlay=0:${PICTURE_Y}[stage]`);

  let label = "stage";
  let n = 0;
  const addText = (
    file: string,
    size: number,
    color: string,
    y: number,
    window: { from: number; to: number } | null,
    boxed: boolean,
  ) => {
    n += 1;
    const next = `t${n}`;
    steps.push(`[${label}]${drawText(file, size, color, y, window, boxed)}[${next}]`);
    label = next;
  };

  HOOK.forEach((line, i) => {
    const f = textFile(textDir, `hook-${i}.txt`, line.text);
    addText(f, line.size, line.color, line.y, line, false);
  });

  CAPTIONS.forEach((cap, i) => {
    const f = textFile(textDir, `caption-${i}.txt`, cap.text);
    addText(f, 56, INK, CAPTION_Y, cap, true);
  });

  // The pitch card: a solid panel low in the frame, then its three lines.
  n += 1;
  const cardLabel = `t${n}`;
  steps.push(
    `[${label}]drawbox=x=54:y=${CARD_Y}:w=${CANVAS_W - 108}:h=${CARD_H}:` +
      `color=black@0.72:t=fill:enable='between(t\\,${PITCH_FROM}\\,${CLIP_SECONDS})'[${cardLabel}]`,
  );
  label = cardLabel;
  PITCH_LINES.forEach((line, i) => {
    const f = textFile(textDir, `pitch-${i}.txt`, line.text);
    addText(f, line.size, line.color, line.y, { from: PITCH_FROM, to: CLIP_SECONDS }, false);
  });

  steps.push(`[${label}]format=yuv420p[out]`);
  return steps.join(";");
}

function run(command: string, args: string[]): number {
  const res = spawnSync(command, args, { stdio: "inherit" });
  if (res.error) throw res.error;
  return res.status ?? 1;
}

function produce(source: string): number {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? repoDir;
  mkdirSync(outDir, { recursive: true });
  const textDir = join(tmpdir(), "gta6-clipper-01-texts");
  mkdirSync(textDir, { recursive: true });

  const clipPath = join(outDir, "gta6-clipper-01-clip.mp4");
  const status = run("ffmpeg", [
    "-ss", String(SOURCE_IN_SECONDS),
    "-i", source,
    "-filter_complex", buildFilter(textDir),
    "-map", "[out]",
    "-map", "0:a",
    "-t", String(CLIP_SECONDS),
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "19",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    clipPath,
    "-y",
  ]);
  if (status !== 0) return status;

  // The cover still: the hook over the bridge, one second in.
  return run("ffmpeg", [
    "-ss", String(SOURCE_IN_SECONDS + 1),
    "-i", source,
    "-filter_complex", buildFilter(textDir),
    "-map", "[out]",
    "-frames:v", "1",
    "-q:v", "3",
    join(outDir, "cover.jpg"),
    "-y",
  ]);
}

// ---------------------------------------------------------------------------

const source = process.env.MAKEFUN_SOURCE_VIDEO;
process.exit(source ? produce(source) : gateDuty());

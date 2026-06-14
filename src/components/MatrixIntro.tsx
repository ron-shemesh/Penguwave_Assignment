import { useEffect, useRef, useState } from "react";

// A short "boot sequence": Matrix-style digital rain that plays once when the
// dashboard first opens, then fades out to reveal the app. Pure canvas, no deps.
// Skippable (click / any key) and disabled for users who prefer reduced motion.

const GLYPHS = "アイウエオカキクケコサシスセソタチツテト0123456789<>/\\#$%&*+=PENGUWAVE".split("");
const FONT_SIZE = 16;
const RUN_MS = 1900; // rain duration before the fade begins
const FADE_MS = 600;

export default function MatrixIntro({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let columns = 0;
    let drops: number[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.ceil(canvas.width / FONT_SIZE);
      drops = Array.from({ length: columns }, () => Math.floor((Math.random() * canvas.height) / FONT_SIZE));
      ctx.font = `${FONT_SIZE}px ui-monospace, monospace`;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      // Translucent black wash leaves fading trails behind each glyph.
      ctx.fillStyle = "rgba(8, 14, 22, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < drops.length; i++) {
        const char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        const x = i * FONT_SIZE;
        const y = drops[i] * FONT_SIZE;
        // Leading glyph brighter than the trail for that classic shimmer.
        ctx.fillStyle = Math.random() > 0.975 ? "#c8ffd6" : "#36d36b";
        ctx.fillText(char, x, y);
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    const fadeTimer = setTimeout(() => setFading(true), RUN_MS);
    const doneTimer = setTimeout(onDone, RUN_MS + FADE_MS);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  const skip = () => {
    setFading(true);
    setTimeout(onDone, FADE_MS);
  };

  return (
    <div
      className={`matrix-intro${fading ? " fading" : ""}`}
      onClick={skip}
      role="presentation"
    >
      <canvas ref={canvasRef} className="matrix-canvas" />
      <div className="matrix-brand">
        <span className="matrix-logo">PenguWave 🐧</span>
        <span className="matrix-tagline">initializing security console…</span>
        <span className="matrix-skip">click to skip</span>
      </div>
    </div>
  );
}

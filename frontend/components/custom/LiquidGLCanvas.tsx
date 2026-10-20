"use client";

import React, { useEffect, useRef } from "react";

export default function LiquidGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    // Dynamic wave parameters with bioluminescent medical teal/cyan/indigo hues
    let t = 0;
    const waves = [
      { y: 0.35, length: 0.0018, amplitude: 45, speed: 0.012, color: "rgba(13, 148, 136, 0.07)" }, // teal-600
      { y: 0.45, length: 0.0025, amplitude: 60, speed: 0.008, color: "rgba(20, 184, 166, 0.05)" }, // teal-500
      { y: 0.55, length: 0.0012, amplitude: 50, speed: 0.015, color: "rgba(6, 182, 212, 0.04)" },  // cyan-500
      { y: 0.65, length: 0.003, amplitude: 35, speed: 0.01, color: "rgba(99, 102, 241, 0.03)" },   // indigo-500
    ];

    // Interactive mouse glow point
    let mouse = { x: width * 0.5, y: height * 0.3, targetX: width * 0.5, targetY: height * 0.3 };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      t += 1;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Deep glowing radial medical orb tracking cursor
      const radialGlow = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        10,
        mouse.x,
        mouse.y,
        Math.max(width * 0.45, 300)
      );
      radialGlow.addColorStop(0, "rgba(20, 184, 166, 0.12)");
      radialGlow.addColorStop(0.5, "rgba(13, 148, 136, 0.04)");
      radialGlow.addColorStop(1, "rgba(6, 9, 19, 0)");

      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // Render fluid liquid waves
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 8) {
          const dx = x - mouse.x;
          const dy = height * wave.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const mouseEffect = Math.sin(dist * 0.01 - t * 0.03) * Math.max(0, 25 - dist * 0.04);

          const y =
            height * wave.y +
            Math.sin(x * wave.length + t * wave.speed) * wave.amplitude +
            Math.cos(x * wave.length * 0.5 + t * wave.speed * 0.7) * (wave.amplitude * 0.5) +
            mouseEffect;

          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = wave.color;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-90 transition-opacity duration-1000"
      style={{ filter: "blur(18px)" }}
    />
  );
}

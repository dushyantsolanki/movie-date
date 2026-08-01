"use client";

import React, { useEffect, useRef } from "react";

interface HeartParticle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  maxOpacity: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

export const HeartParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    const colors = [
      "rgba(244, 63, 94, ", // rose-500
      "rgba(225, 29, 72, ", // rose-600
      "rgba(251, 113, 133, ", // rose-400
      "rgba(236, 72, 153, ", // pink-500
      "rgba(217, 70, 239, ", // fuchsia-500
    ];

    const particles: HeartParticle[] = Array.from({ length: 35 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 14 + 8,
      speedY: Math.random() * 0.7 + 0.3,
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.6 + 0.2,
      maxOpacity: Math.random() * 0.6 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
    }));

    const drawHeart = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: string,
      opacity: number,
      rotation: number
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();

      const topCurveHeight = size * 0.3;
      ctx.moveTo(0, topCurveHeight);
      // top left curve
      ctx.bezierCurveTo(
        -size / 2,
        -size / 2,
        -size,
        topCurveHeight / 2,
        0,
        size
      );
      // top right curve
      ctx.bezierCurveTo(
        size,
        topCurveHeight / 2,
        size / 2,
        -size / 2,
        0,
        topCurveHeight
      );

      ctx.closePath();

      ctx.fillStyle = `${color}${opacity})`;
      ctx.shadowColor = `${color}0.8)`;
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y < -50) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        if (p.x < -50) p.x = width + 20;
        if (p.x > width + 50) p.x = -20;

        drawHeart(ctx, p.x, p.y, p.size, p.color, p.opacity, p.rotation);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-70"
    />
  );
};

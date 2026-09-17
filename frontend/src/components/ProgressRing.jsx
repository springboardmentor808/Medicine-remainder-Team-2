import React, { useState, useEffect, useRef } from "react";

/**
 * Animated SVG circular progress ring with gradient stroke and count-up center text.
 */
export default function ProgressRing({
  percent = 0,
  size = 130,
  strokeWidth = 10,
  gradientColors = ["#2DD4BF", "#A78BFA"],
  label = "Adherence",
  glowColor = "rgba(45,212,191,0.3)",
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  // Count-up animation
  const [displayPercent, setDisplayPercent] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * percent);
      setDisplayPercent(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [percent]);

  const gradientId = `ring-grad-${size}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: `drop-shadow(0 0 12px ${glowColor})` }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientColors[0]} />
            <stop offset="100%" stopColor={gradientColors[1]} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
        {/* Center text */}
        <text
          x={size / 2} y={size / 2 + 1}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fontWeight: 800,
            fontSize: size * 0.2,
            fill: "#F1F5F9",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {displayPercent}%
        </text>
      </svg>
      <span style={{ color: "#94A3B8", fontSize: 12, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { C } from "../constants";

/**
 * Stat card with icon, count-up animation, and label.
 */
export default function StatCard({
  icon: Icon,
  count = 0,
  label = "",
  color = C.mint,
  softBg = C.mintSoft,
  index = 0,
}) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const duration = 800;
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * count));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    if (count > 0) {
      frameRef.current = requestAnimationFrame(animate);
    } else {
      setDisplay(0);
    }

    return () => cancelAnimationFrame(frameRef.current);
  }, [count]);

  return (
    <div
      className="glass-card"
      style={{
        padding: "16px 20px",
        animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          style={{
            background: softBg,
            borderRadius: 12,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 16px ${color}22`,
          }}
        >
          <Icon size={20} color={color} />
        </div>
        <div>
          <p style={{ color: C.ink, fontWeight: 800, fontSize: 24, lineHeight: 1 }}>{display}</p>
          <p style={{ color: C.sub, fontSize: 11, fontWeight: 600, marginTop: 2 }}>{label}</p>
        </div>
      </div>
    </div>
  );
}

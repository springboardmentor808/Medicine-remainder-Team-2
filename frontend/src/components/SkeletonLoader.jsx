import React from "react";

function SkeletonBlock({ width = "100%", height = 16, borderRadius = 8, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ style = {} }) {
  return (
    <div
      className="glass-card"
      style={{ padding: 20, ...style }}
    >
      <div className="flex items-center gap-3 mb-3">
        <SkeletonBlock width={42} height={42} borderRadius={12} />
        <div className="flex-1">
          <SkeletonBlock width="60%" height={14} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="40%" height={12} />
        </div>
      </div>
      <SkeletonBlock width="80%" height={12} style={{ marginBottom: 6 }} />
      <SkeletonBlock width="50%" height={12} />
    </div>
  );
}

export function SkeletonRing() {
  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <SkeletonBlock width="50%" height={14} style={{ marginBottom: 16 }} />
      <div className="flex justify-center">
        <SkeletonBlock width={110} height={110} borderRadius="50%" />
      </div>
      <SkeletonBlock width="60%" height={12} style={{ margin: "12px auto 0" }} />
    </div>
  );
}

export function SkeletonStatRow({ count = 3 }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card" style={{ padding: 16 }}>
          <SkeletonBlock width={40} height={40} borderRadius={12} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="50%" height={20} style={{ marginBottom: 6 }} />
          <SkeletonBlock width="40%" height={12} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} style={{ animationDelay: `${i * 100}ms` }} />
      ))}
    </div>
  );
}

export default SkeletonBlock;

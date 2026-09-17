import React from "react";

/**
 * Glass card with staggered entrance animation.
 * @param {number} index - Position in list for stagger delay
 * @param {string} className - Additional classes
 * @param {object} style - Additional inline styles
 * @param {function} onClick - Click handler
 */
export default function AnimatedCard({ children, index = 0, className = "", style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`glass-card ${className}`}
      style={{
        animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both`,
        animationDelay: `${index * 60}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

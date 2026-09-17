import React from "react";
import { Pill, Users, Bell } from "lucide-react";
import { C } from "../constants";

export default function Header({ role, onSwitchRole }) {
  const isCaregiver = role === "caregiver";
  return (
    <div
      style={{
        background: "rgba(11, 15, 26, 0.8)",
        borderBottom: `1px solid ${C.line}`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
      className="px-6 py-3.5 flex items-center justify-between sticky top-0 z-30"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div
          style={{
            background: C.gradientPrimary,
            width: 34,
            height: 34,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(45,212,191,0.25)",
            animation: "pulseGlow 3s ease-in-out infinite",
          }}
        >
          <Pill size={16} color="#fff" />
        </div>
        <span
          style={{
            fontWeight: 800,
            fontSize: 18,
            background: C.gradientPrimary,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          PillSync
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          style={{
            background: C.glass,
            border: `1px solid ${C.glassBorder}`,
            borderRadius: 10,
            width: 36,
            height: 36,
            cursor: "pointer",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
          }}
          className="hover:opacity-80"
        >
          <Bell size={16} color={C.sub} />
          {/* Live dot */}
          <div
            style={{
              position: "absolute",
              top: 6,
              right: 7,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: C.coral,
              border: `2px solid ${C.bg}`,
              animation: "breathe 2s ease-in-out infinite",
            }}
          />
        </button>

        {/* Role switch */}
        <button
          onClick={onSwitchRole}
          className="btn-glass"
          style={{
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Users size={13} />
          {isCaregiver ? "Viewing: Meera" : "Caregiver"}
        </button>

        {/* Avatar */}
        <div
          style={{
            background: C.gradientPrimary,
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "0 0 12px rgba(167,139,250,0.2)",
          }}
        >
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>
            {isCaregiver ? "AK" : "MS"}
          </span>
          {/* Online dot */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: C.mint,
              border: `2px solid ${C.bg}`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

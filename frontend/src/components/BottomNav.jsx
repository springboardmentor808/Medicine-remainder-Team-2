import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Pill, Bell, User as UserIcon } from "lucide-react";
import { C } from "../constants";

const TABS = [
  { Icon: Home, label: "Home", path: "/dashboard" },
  { Icon: Pill, label: "Reminders", path: "/reminders" },
  { Icon: Bell, label: "Alerts", path: "/notifications" },
  { Icon: UserIcon, label: "Profile", path: "/profile" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      style={{
        background: "rgba(11, 15, 26, 0.85)",
        borderTop: `1px solid ${C.line}`,
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
      }}
      className="fixed bottom-0 left-0 right-0 px-6 py-2.5 flex justify-around max-w-3xl mx-auto md:rounded-t-2xl md:left-1/2 md:-translate-x-1/2 md:w-full z-30"
    >
      {TABS.map(({ Icon, label, path }) => {
        const active =
          location.pathname === path ||
          (path === "/dashboard" && location.pathname === "/");
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: 12,
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              position: "relative",
            }}
          >
            {/* Glow indicator */}
            {active && (
              <div
                style={{
                  position: "absolute",
                  top: -2,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 24,
                  height: 3,
                  borderRadius: 999,
                  background: C.gradientPrimary,
                  boxShadow: "0 0 10px rgba(45,212,191,0.4)",
                }}
              />
            )}
            <div
              style={{
                color: active ? C.mint : C.faint,
                transition: "color 0.3s ease, transform 0.3s ease",
                transform: active ? "scale(1.1)" : "scale(1)",
              }}
            >
              <Icon size={20} />
            </div>
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                color: active ? C.mint : C.faint,
                transition: "all 0.3s ease",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

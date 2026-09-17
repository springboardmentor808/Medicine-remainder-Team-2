import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Pill, RefreshCw, ScanLine, Bell,
  BarChart3, User, Settings, LogOut, ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { C } from "../constants";

const NAV_ITEMS = [
  { section: "MAIN" },
  { icon: LayoutDashboard, label: "Dashboard",    path: "/dashboard" },
  { icon: Pill,            label: "Reminders",     path: "/reminders" },
  { icon: RefreshCw,       label: "Refills",       path: "/refills" },
  { icon: ScanLine,        label: "Rx Scanner",    path: "/scanner" },
  { section: "INSIGHTS" },
  { icon: Bell,            label: "Notifications", path: "/notifications" },
  { icon: BarChart3,       label: "Analytics",     path: "/analytics" },
  { section: "ACCOUNT" },
  { icon: User,            label: "Profile",       path: "/profile" },
  { icon: Settings,        label: "Settings",      path: "/settings" },
];

export default function Sidebar({ userName, userEmail, onLogout, collapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div
          style={{
            background: C.gradientPrimary,
            width: 36,
            height: 36,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 16px rgba(45,212,191,0.25)",
            flexShrink: 0,
          }}
        >
          <Pill size={18} color="#fff" />
        </div>
        {!collapsed && (
          <span
            className="gradient-text"
            style={{ fontWeight: 800, fontSize: 20, whiteSpace: "nowrap" }}
          >
            PillSync
          </span>
        )}
        <button
          onClick={onToggle}
          style={{
            marginLeft: "auto",
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${C.glassBorder}`,
            borderRadius: 8,
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {collapsed ? (
            <ChevronRightIcon size={14} color={C.sub} />
          ) : (
            <ChevronLeft size={14} color={C.sub} />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, i) => {
          if (item.section) {
            if (collapsed) return null;
            return (
              <div key={item.section} className="sidebar-section-label">
                {item.section}
              </div>
            );
          }

          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path === "/dashboard" && location.pathname === "/");

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`sidebar-item ${isActive ? "active" : ""}`}
              title={collapsed ? item.label : undefined}
              style={{
                animation: `slideInLeft 0.4s var(--ease-out-expo) both`,
                animationDelay: `${i * 30}ms`,
              }}
            >
              <span className="sidebar-item-icon">
                <Icon size={18} />
              </span>
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div
                  style={{
                    marginLeft: "auto",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: C.mint,
                    boxShadow: `0 0 8px ${C.mint}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer — User + Logout */}
      <div className="sidebar-footer">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: collapsed ? "4px 0" : "0",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
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
              flexShrink: 0,
              boxShadow: "0 0 10px rgba(167,139,250,0.2)",
            }}
          >
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>
              {(userName || "U").charAt(0).toUpperCase()}
              {(userName || "U").split(" ")[1]?.charAt(0).toUpperCase() || ""}
            </span>
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  color: C.ink,
                  fontWeight: 600,
                  fontSize: 13,
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userName || "User"}
              </p>
              <p
                style={{
                  color: C.faint,
                  fontSize: 11,
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userEmail || "user@email.com"}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={onLogout}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 6,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                transition: "all 0.2s ease",
              }}
              title="Sign out"
            >
              <LogOut size={16} color={C.coral} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

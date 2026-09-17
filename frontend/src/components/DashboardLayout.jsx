import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Search, Bell, Users, Menu } from "lucide-react";
import { C } from "../constants";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ role, userName, userEmail, onSwitchRole, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isCaregiver = role === "caregiver";

  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 35,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={mobileOpen ? "" : ""}>
        <Sidebar
          userName={userName}
          userEmail={userEmail}
          onLogout={onLogout}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Main Content */}
      <div
        className={`dashboard-content ${collapsed ? "sidebar-collapsed" : ""}`}
      >
        {/* Top Bar */}
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 4,
                display: "none",
              }}
              className="md-hide"
            >
              <Menu size={20} color={C.sub} />
            </button>

            {/* Search */}
            <div className="topbar-search">
              <Search size={15} color={C.faint} />
              <input placeholder="Search medications, reminders..." />
            </div>
          </div>

          <div className="topbar-actions">
            {/* Notification Bell */}
            <button
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${C.glassBorder}`,
                borderRadius: 10,
                width: 38,
                height: 38,
                cursor: "pointer",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
              }}
            >
              <Bell size={16} color={C.sub} />
              <div
                style={{
                  position: "absolute",
                  top: 7,
                  right: 8,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: C.coral,
                  border: `2px solid ${C.bg}`,
                  animation: "breathe 2s ease-in-out infinite",
                }}
              />
            </button>

            {/* Role Switch */}
            <button
              onClick={onSwitchRole}
              className="btn-glass"
              style={{
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                padding: "7px 14px",
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
                {isCaregiver ? "AK" : (userName || "U").charAt(0).toUpperCase() + ((userName || "U").split(" ")[1]?.charAt(0).toUpperCase() || "")}
              </span>
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

        {/* Page Content */}
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
}

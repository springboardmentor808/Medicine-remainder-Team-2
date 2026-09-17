import React, { useState, useCallback, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail, Lock, ArrowRight, Pill, Eye, EyeOff, User, AlertCircle,
  CheckCircle2, Loader2, KeyRound, ArrowLeft, Shield, Send,
} from "lucide-react";
import { C } from "./constants";
import { ToastProvider, useToast } from "./components/Toast";
import DashboardPage from "./pages/DashboardPage";
import RemindersPage from "./pages/RemindersPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import * as api from "./api";

/* ═══════════════════════════════════════════════════════════════
   Google SVG Icon
   ═══════════════════════════════════════════════════════════════ */

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Password Strength Meter
   ═══════════════════════════════════════════════════════════════ */

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score: 1, label: "Weak", color: C.coral };
  if (score <= 3) return { score: 2, label: "Medium", color: C.morning };
  return { score: 3, label: "Strong", color: C.mint };
}

function PasswordStrengthBar({ password }) {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div className="password-strength-bar">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`bar ${i <= score ? "active" : ""} ${score === 1 ? "weak" : score === 2 ? "medium" : "strong"}`}
          />
        ))}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, marginTop: 4, display: "block" }}>
        {label}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Brand Panel (Left Side of Login)
   ═══════════════════════════════════════════════════════════════ */

function BrandPanel() {
  return (
    <div className="login-brand-panel">
      {/* Animated gradient blobs */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,212,191,0.15) 0%, transparent 70%)",
          top: -150,
          left: -120,
          animation: "meshFloat1 20s ease-in-out infinite",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 550,
          height: 550,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)",
          bottom: -180,
          right: -140,
          animation: "meshFloat2 25s ease-in-out infinite",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          animation: "meshFloat1 18s ease-in-out infinite reverse",
          filter: "blur(40px)",
        }}
      />

      {/* Orbit rings */}
      <div
        style={{
          position: "relative",
          width: 200,
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 40,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "1px solid rgba(45,212,191,0.1)",
            animation: "orbitSpin 30s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 20,
            borderRadius: "50%",
            border: "1px solid rgba(167,139,250,0.08)",
            animation: "orbitSpin 25s linear infinite reverse",
          }}
        />
        <div
          style={{
            background: C.gradientPrimary,
            width: 80,
            height: 80,
            borderRadius: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 60px rgba(45,212,191,0.3)",
            animation: "float 6s ease-in-out infinite",
          }}
        >
          <Pill size={36} color="#fff" />
        </div>
      </div>

      <h1
        className="gradient-text"
        style={{ fontSize: 42, fontWeight: 900, marginBottom: 12, textAlign: "center" }}
      >
        PillSync
      </h1>
      <p style={{ color: C.sub, fontSize: 16, textAlign: "center", maxWidth: 320, lineHeight: 1.7 }}>
        Your intelligent health companion. Track medications, get reminders, and never miss a dose.
      </p>

      {/* Feature pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 32, justifyContent: "center" }}>
        {["Smart Reminders", "Health Analytics", "Caregiver Mode", "Email Alerts"].map((f) => (
          <span
            key={f}
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: C.sub,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {f}
          </span>
        ))}
      </div>

      {/* SendGrid Badge */}
      <div style={{ marginTop: 32 }}>
        <span className="sendgrid-badge">
          <Send size={12} color={C.mint} /> Powered by Twilio SendGrid
        </span>
      </div>

/* ═══════════════════════════════════════════════════════════════
   Input Field Component
   ═══════════════════════════════════════════════════════════════ */

function InputField({ icon: Icon, label, type = "text", value, onChange, placeholder, error, children }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: error ? C.coral : C.sub,
          display: "block",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 14px",
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${error ? C.coral : focused ? C.mint : "rgba(255,255,255,0.08)"}`,
          borderRadius: 12,
          transition: "all 0.3s ease",
          boxShadow: focused ? `0 0 0 3px ${C.mintSoft}` : error ? `0 0 0 3px ${C.coralSoft}` : "none",
        }}
      >
        <Icon size={16} color={error ? C.coral : focused ? C.mint : C.faint} />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            fontSize: 14,
            color: C.ink,
            border: "none",
            outline: "none",
            background: "transparent",
            width: "100%",
            padding: "12px 0",
          }}
        />
        {children}
      </div>
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          <AlertCircle size={12} color={C.coral} />
          <span style={{ fontSize: 11, color: C.coral, fontWeight: 500 }}>{error}</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Login Form
   ═══════════════════════════════════════════════════════════════ */

function LoginForm({ onSwitch, onLogin, loading }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("pillsync_email");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "At least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;
    try {
      if (rememberMe) {
        localStorage.setItem("pillsync_email", email);
      } else {
        localStorage.removeItem("pillsync_email");
      }
      await onLogin({ email, password });
    } catch (err) {
      setApiError(err.message || "Login failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ color: C.ink, fontWeight: 800, fontSize: 26, marginBottom: 4 }}>Welcome back</h2>
      <p style={{ color: C.sub, fontSize: 14, marginBottom: 20 }}>
        Sign in to your PillSync account
      </p>

      {/* Demo Credentials */}
      <div className="demo-credentials-box">
        <p>
          <strong style={{ color: C.ink }}>Demo accounts:</strong><br />
          Patient: <code>meera.sharma@mail.com</code> / <code>password123</code><br />
          Caregiver: <code>arjun.k@mail.com</code> / <code>password123</code>
        </p>
      </div>

      {apiError && (
        <div
          style={{
            background: C.coralSoft,
            border: `1px solid rgba(251,113,133,0.2)`,
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertCircle size={15} color={C.coral} />
          <span style={{ color: C.coral, fontSize: 13, fontWeight: 500 }}>{apiError}</span>
        </div>
      )}

      {/* Google Login */}
      <button
        type="button"
        className="google-btn"
        onClick={() => setApiError("Google OAuth requires a Client ID. Configure VITE_GOOGLE_CLIENT_ID in .env to enable.")}
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="login-divider">
        <span>or sign in with email</span>
      </div>

      <InputField
        icon={Mail}
        label="Email Address"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        error={errors.email}
      />

      <InputField
        icon={Lock}
        label="Password"
        type={showPw ? "text" : "password"}
        value={password}
        onChange={setPassword}
        placeholder="Enter your password"
        error={errors.password}
      >
        <button
          type="button"
          onClick={() => setShowPw(!showPw)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          {showPw ? <EyeOff size={16} color={C.faint} /> : <Eye size={16} color={C.faint} />}
        </button>
      </InputField>

      <div className="login-checkbox-row">
        <label className="login-checkbox">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>Remember me</span>
        </label>
        <button
          type="button"
          onClick={() => onSwitch("forgot")}
          style={{
            background: "none",
            border: "none",
            color: C.mint,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        className="btn-gradient"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px 0",
          fontSize: 15,
          fontWeight: 700,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <>
            Sign In <ArrowRight size={16} />
          </>
        )}
      </button>

      <p style={{ color: C.sub, fontSize: 13, textAlign: "center", marginTop: 24 }}>
        Don't have an account?{" "}
        <button
          type="button"
          onClick={() => onSwitch("register")}
          style={{
            background: "none",
            border: "none",
            color: C.mint,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Create one
        </button>
      </p>

      <div className="login-trust-badges">
        <span className="trust-badge"><Shield size={11} /> 256-bit Encryption</span>
        <span className="trust-badge"><Send size={11} /> SendGrid Verified</span>
        <span className="trust-badge"><Lock size={11} /> Secure Login</span>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Register Form
   ═══════════════════════════════════════════════════════════════ */

function RegisterForm({ onSwitch, onRegister, loading }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [role, setRole] = useState("patient");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "At least 6 characters";
    if (password !== confirmPw) e.confirmPw = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;
    try {
      await onRegister({ name, email, password, role });
    } catch (err) {
      setApiError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ color: C.ink, fontWeight: 800, fontSize: 26, marginBottom: 4 }}>Create account</h2>
      <p style={{ color: C.sub, fontSize: 14, marginBottom: 28 }}>
        Join PillSync and take control of your health
      </p>

      {apiError && (
        <div
          style={{
            background: C.coralSoft,
            border: `1px solid rgba(251,113,133,0.2)`,
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertCircle size={15} color={C.coral} />
          <span style={{ color: C.coral, fontSize: 13, fontWeight: 500 }}>{apiError}</span>
        </div>
      )}

      {/* Google Signup */}
      <button
        type="button"
        className="google-btn"
        onClick={() => setApiError("Google sign-up is not configured yet. Use email/password.")}
      >
        <GoogleIcon />
        Sign up with Google
      </button>

      <div className="login-divider">
        <span>or register with email</span>
      </div>

      <InputField
        icon={User}
        label="Full Name"
        value={name}
        onChange={setName}
        placeholder="John Doe"
        error={errors.name}
      />

      <InputField
        icon={Mail}
        label="Email Address"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        error={errors.email}
      />

      {/* Role Toggle */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, display: "block", marginBottom: 6 }}>
          Account Type
        </label>
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            borderRadius: 12,
            padding: 4,
            display: "flex",
          }}
        >
          {["patient", "caregiver"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                background: role === r ? C.gradientPrimary : "transparent",
                color: role === r ? "#fff" : C.sub,
                boxShadow: role === r ? "0 4px 12px rgba(45,212,191,0.2)" : "none",
              }}
            >
              {r === "patient" ? "🧑‍⚕️ Patient" : "👥 Caregiver"}
            </button>
          ))}
        </div>
      </div>

      <InputField
        icon={Lock}
        label="Password"
        type={showPw ? "text" : "password"}
        value={password}
        onChange={setPassword}
        placeholder="Create a strong password"
        error={errors.password}
      >
        <button
          type="button"
          onClick={() => setShowPw(!showPw)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          {showPw ? <EyeOff size={16} color={C.faint} /> : <Eye size={16} color={C.faint} />}
        </button>
      </InputField>
      <div style={{ marginTop: -10, marginBottom: 18 }}>
        <PasswordStrengthBar password={password} />
      </div>

      <InputField
        icon={Lock}
        label="Confirm Password"
        type="password"
        value={confirmPw}
        onChange={setConfirmPw}
        placeholder="Re-enter your password"
        error={errors.confirmPw}
      />

      <button
        type="submit"
        className="btn-gradient"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px 0",
          fontSize: 15,
          fontWeight: 700,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <>
            Create Account <ArrowRight size={16} />
          </>
        )}
      </button>

      <p style={{ color: C.sub, fontSize: 13, textAlign: "center", marginTop: 24 }}>
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => onSwitch("login")}
          style={{
            background: "none",
            border: "none",
            color: C.mint,
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Forgot Password Form
   ═══════════════════════════════════════════════════════════════ */

function ForgotPasswordForm({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: C.mintSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <CheckCircle2 size={28} color={C.mint} />
        </div>
        <h2 style={{ color: C.ink, fontWeight: 800, fontSize: 24, marginBottom: 8 }}>Check your email</h2>
        <p style={{ color: C.sub, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          We sent a password reset link to <strong style={{ color: C.ink }}>{email}</strong>. 
          Check your inbox and follow the instructions.
        </p>
        <button
          type="button"
          onClick={() => onSwitch("login")}
          className="btn-gradient"
          style={{
            padding: "12px 32px",
            fontSize: 14,
            fontWeight: 700,
            borderRadius: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="button"
        onClick={() => onSwitch("login")}
        style={{
          background: "none",
          border: "none",
          color: C.sub,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 24,
          padding: 0,
        }}
      >
        <ArrowLeft size={14} /> Back to sign in
      </button>

      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: C.duskSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <KeyRound size={24} color={C.dusk} />
      </div>

      <h2 style={{ color: C.ink, fontWeight: 800, fontSize: 26, marginBottom: 4 }}>Forgot password?</h2>
      <p style={{ color: C.sub, fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
        No worries! Enter your email and we'll send you a reset link via SendGrid.
      </p>

      {error && (
        <div
          style={{
            background: C.coralSoft,
            border: `1px solid rgba(251,113,133,0.2)`,
            borderRadius: 12,
            padding: "10px 14px",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertCircle size={15} color={C.coral} />
          <span style={{ color: C.coral, fontSize: 13, fontWeight: 500 }}>{error}</span>
        </div>
      )}

      <InputField
        icon={Mail}
        label="Email Address"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
      />

      <button
        type="submit"
        className="btn-gradient"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px 0",
          fontSize: 15,
          fontWeight: 700,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <>
            Send Reset Link <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Login Screen — Split Layout
   ═══════════════════════════════════════════════════════════════ */

function LoginScreen({ onLogin }) {
  const [view, setView] = useState("login"); // login | register | forgot
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleLogin = async (data) => {
    setLoading(true);
    try {
      const user = await api.loginUser(data);
      toast({ type: "success", title: "Welcome back!", message: `Signed in as ${user.name}` });
      onLogin(user);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data) => {
    setLoading(true);
    try {
      const user = await api.registerUser(data);
      toast({
        type: "success",
        title: "Account created! 🎉",
        message: `Welcome ${user.name}! A welcome email has been sent.`,
      });
      onLogin(user);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <BrandPanel />
      <div className="login-form-panel">
        <div className="login-card animate-in">
          {view === "login" && (
            <LoginForm onSwitch={setView} onLogin={handleLogin} loading={loading} />
          )}
          {view === "register" && (
            <RegisterForm onSwitch={setView} onRegister={handleRegister} loading={loading} />
          )}
          {view === "forgot" && <ForgotPasswordForm onSwitch={setView} />}
        </div>

        {/* Footer */}
        <p style={{ color: C.faint, fontSize: 11, textAlign: "center", marginTop: 32 }}>
          © 2026 PillSync · Powered by Twilio SendGrid
        </p>
      </div>
    </div>
  );

/* ═══════════════════════════════════════════════════════════════
   Authenticated Routes
   ═══════════════════════════════════════════════════════════════ */

function AppRoutes({ user, role, onSwitchRole, onLogout }) {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={<DashboardPage role={role} user={user} onSwitchRole={onSwitchRole} onLogout={onLogout} />}
      />
      <Route
        path="/reminders"
        element={<RemindersPage role={role} user={user} onSwitchRole={onSwitchRole} onLogout={onLogout} />}
      />
      <Route
        path="/notifications"
        element={<NotificationsPage role={role} user={user} onSwitchRole={onSwitchRole} onLogout={onLogout} />}
      />
      <Route
        path="/profile"
        element={<ProfilePage role={role} user={user} onSwitchRole={onSwitchRole} onLogout={onLogout} />}
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function AuthenticatedApp({ user, role, setRole, setScreen, setUser }) {
  const navigate = useNavigate();
  const onSwitchRole = () => setRole((r) => (r === "patient" ? "caregiver" : "patient"));
  const onLogout = () => {
    setScreen("login");
    setUser(null);
    navigate("/");
  };

  return <AppRoutes user={user} role={role} onSwitchRole={onSwitchRole} onLogout={onLogout} />;
}

/* ═══════════════════════════════════════════════════════════════
   App Root
   ═══════════════════════════════════════════════════════════════ */

export default function App() {
  const [screen, setScreen] = useState("login");
  const [role, setRole] = useState("patient");
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <ToastProvider>
        {screen === "login" ? (
          <LoginScreen
            onLogin={(userData) => {
              setUser(userData);
              setRole(userData.role || "patient");
              setScreen("dashboard");
            }}
          />
        ) : (
          <AuthenticatedApp
            user={user}
            role={role}
            setRole={setRole}
            setScreen={setScreen}
            setUser={setUser}
          />
        )}
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/Login.css";

function Login() {
    const navigate = useNavigate();

    const videoRef = useRef(null);

    // ============================================================
    // FORM STATE
    // ============================================================

    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    // ============================================================
    // UI STATE
    // ============================================================

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ============================================================
    // VIDEO STATE
    // ============================================================

    const [videoError, setVideoError] = useState(false);

    // ============================================================
    // VIDEO URL
    // ============================================================

    const medicalVideo = "/videos/medical-demo.mp4";

    // ============================================================
    // START VIDEO
    // ============================================================

    useEffect(() => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        // Required for browser autoplay
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;

        const startVideo = async () => {
            try {
                await video.play();
            } catch {
                // Autoplay may be blocked by the browser.
                // There is intentionally NO play button.
                console.log(
                    "Video autoplay was blocked by the browser."
                );
            }
        };

        startVideo();

        return () => {
            video.pause();
        };
    }, []);

    // ============================================================
    // VIDEO LOADED
    // ============================================================

    const handleVideoLoaded = () => {
        console.log(
            "Medical video loaded successfully."
        );

        setVideoError(false);
    };

    // ============================================================
    // VIDEO CAN PLAY
    // ============================================================

    const handleVideoCanPlay = () => {
        console.log(
            "Medical video can play."
        );

        setVideoError(false);
    };

    // ============================================================
    // VIDEO ERROR
    // ============================================================

    const handleVideoError = (event) => {
        console.error(
            "Unable to load or decode medical-demo.mp4.",
            event.currentTarget?.error
        );

        setVideoError(true);
    };

    // ============================================================
    // INPUT CHANGE
    // ============================================================

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError("");
    };

    // ============================================================
    // LOGIN
    // ============================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) {
            return;
        }

        setError("");

        const username =
            formData.username.trim();

        // ========================================================
        // VALIDATION
        // ========================================================

        if (!username) {
            setError(
                "Please enter your username."
            );
            return;
        }

        if (!formData.password) {
            setError(
                "Please enter your password."
            );
            return;
        }

        setLoading(true);

        try {
            // ====================================================
            // LOGIN API
            // ====================================================

            const response = await api.post(
                "accounts/login/",
                {
                    username: username,
                    password: formData.password,
                }
            );

            const accessToken =
                response.data?.access;

            const refreshToken =
                response.data?.refresh;

            // ====================================================
            // CHECK ACCESS TOKEN
            // ====================================================

            if (!accessToken) {
                setError(
                    "Login failed. Access token was not received."
                );

                return;
            }

            // ====================================================
            // SAVE ACCESS TOKEN
            // ====================================================

            localStorage.setItem(
                "access",
                accessToken
            );

            // ====================================================
            // SAVE USER ID FROM LOGIN RESPONSE
            // ====================================================

            if (
                response.data?.user_id !== undefined &&
                response.data?.user_id !== null
            ) {
                localStorage.setItem(
                    "user_id",
                    String(response.data.user_id)
                );
            }

            // ====================================================
            // SAVE ROLE FROM LOGIN RESPONSE
            // ====================================================

            if (response.data?.role) {
                localStorage.setItem(
                    "role",
                    String(response.data.role)
                );
            }

            // ====================================================
            // SAVE REFRESH TOKEN
            // ====================================================

            if (refreshToken) {
                localStorage.setItem(
                    "refresh",
                    refreshToken
                );
            }

            // ====================================================
            // SAVE USERNAME
            // ====================================================

            localStorage.setItem(
                "username",
                username
            );

            // Clear any old password-reset session.
            localStorage.removeItem("reset_user_id");
            localStorage.removeItem("reset_token");

            // ====================================================
            // LOAD USER PROFILE
            // ====================================================

            try {
                const profileResponse =
                    await api.get(
                        "accounts/profile/"
                    );

                const profile =
                    profileResponse.data || {};

                // =================================================
                // SAVE USER ID
                // =================================================

                if (
                    profile.user_id !== undefined &&
                    profile.user_id !== null
                ) {
                    localStorage.setItem(
                        "user_id",
                        String(profile.user_id)
                    );
                }

                // =================================================
                // SAVE ROLE
                // =================================================

                if (profile.role) {
                    localStorage.setItem(
                        "role",
                        profile.role
                    );
                }

                const role =
                    String(
                        profile.role || ""
                    ).toLowerCase();

                // =================================================
                // ADMIN
                // =================================================

                if (role === "admin") {
                    navigate(
                        "/admin-dashboard",
                        { replace: true }
                    );

                    return;
                }

                // =================================================
                // PATIENT / CAREGIVER
                // =================================================

                navigate(
                    "/dashboard",
                    { replace: true }
                );
            } catch (profileError) {
                console.error(
                    "Profile loading error:",
                    profileError
                );

                // Login succeeded, so allow
                // the user into dashboard.
                navigate(
                    "/dashboard",
                    { replace: true }
                );
            }
        } catch (loginError) {
            console.error(
                "Login error:",
                loginError?.response?.data ||
                    loginError?.message
            );

            // ====================================================
            // CLEAR INVALID SESSION
            // ====================================================

            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            localStorage.removeItem("username");
            localStorage.removeItem("user_id");
            localStorage.removeItem("role");

            // ====================================================
            // BACKEND ERROR
            // ====================================================

            const backendError =
                loginError?.response?.data;

            if (backendError?.detail) {
                setError(String(backendError.detail));
            } else if (backendError?.error) {
                setError(
                    Array.isArray(backendError.error)
                        ? String(backendError.error[0])
                        : String(backendError.error)
                );
            } else if (backendError?.message) {
                setError(String(backendError.message));
            } else if (
                Array.isArray(backendError?.non_field_errors)
            ) {
                setError(
                    String(backendError.non_field_errors[0])
                );
            } else if (backendError?.username) {
                setError(
                    Array.isArray(backendError.username)
                        ? String(backendError.username[0])
                        : String(backendError.username)
                );
            } else {
                setError("Invalid username or password.");
            }
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // PAGE
    // ============================================================

    return (
        <div className="login-page">

            {/* ==================================================
                LEFT SIDE - VIDEO
            ================================================== */}

            <section
                className="login-video-section"
            >

                {/* ==================================================
                    MEDICAL VIDEO
                ================================================== */}

                <video
                    ref={videoRef}
                    className="login-background-video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    onLoadedData={
                        handleVideoLoaded
                    }
                    onCanPlay={
                        handleVideoCanPlay
                    }
                    onError={
                        handleVideoError
                    }
                >
                    <source
                        src={medicalVideo}
                        type="video/mp4"
                    />

                    Your browser does not
                    support video playback.
                </video>

                {/* ==================================================
                    VIDEO OVERLAY
                ================================================== */}

                <div
                    className="login-video-overlay"
                ></div>

                {/* ==================================================
                    VIDEO ERROR
                ================================================== */}

                {videoError && (
                    <div
                        style={{
                            position: "absolute",
                            top: "20px",
                            left: "20px",
                            right: "20px",
                            zIndex: 200,
                            padding: "12px 16px",
                            borderRadius: "8px",
                            background:
                                "rgba(120, 0, 0, 0.85)",
                            color: "#ffffff",
                            fontSize: "13px",
                            textAlign: "center",
                            lineHeight: "1.5",
                        }}
                    >
                        Unable to play the medical
                        video.

                        <br />

                        The video file may be
                        unsupported or corrupted.
                    </div>
                )}

                {/* ==================================================
                    IMPORTANT:
                    NO PLAY / PAUSE BUTTON
                ================================================== */}

                <div
                    className="login-video-content"
                >

                    {/* ==================================================
                        TOP
                    ================================================== */}

                    <div
                        className="video-top-line"
                    >
                        <span>
                            CARE
                        </span>

                        <span>
                            •
                        </span>

                        <span>
                            REMIND
                        </span>

                        <span>
                            •
                        </span>

                        <span>
                            TRACK
                        </span>

                        <span>
                            •
                        </span>

                        <span>
                            LIVE BETTER
                        </span>
                    </div>

                    {/* ==================================================
                        MAIN
                    ================================================== */}

                    <div
                        className="video-main-content"
                    >
                        <div
                            className="video-kicker"
                        >
                            PILLSYNC
                        </div>

                        <h1>
                            Small Steps
                            <br />
                            Healthier
                            <br />
                            <span>
                                Tomorrows
                            </span>
                        </h1>

                        <div
                            className="heading-line"
                        ></div>

                        <p>
                            Manage your medicines,
                            <br />
                            stay on track and live a
                            <br />
                            healthier life with PillSync.
                        </p>
                    </div>

                    {/* ==================================================
                        FEATURES
                    ================================================== */}

                    <div
                        className="video-features"
                    >
                        <div
                            className="video-feature-card"
                        >
                            <div
                                className="feature-icon"
                            >
                                🔔
                            </div>

                            <div>
                                <strong>
                                    Medicine Reminders
                                </strong>

                                <small>
                                    Stay on time
                                </small>
                            </div>
                        </div>

                        <div
                            className="video-feature-card"
                        >
                            <div
                                className="feature-icon"
                            >
                                📊
                            </div>

                            <div>
                                <strong>
                                    Track Progress
                                </strong>

                                <small>
                                    Build better habits
                                </small>
                            </div>
                        </div>

                        <div
                            className="video-feature-card"
                        >
                            <div
                                className="feature-icon"
                            >
                                💊
                            </div>

                            <div>
                                <strong>
                                    Refill Alerts
                                </strong>

                                <small>
                                    Never run out
                                </small>
                            </div>
                        </div>

                        <div
                            className="video-feature-card"
                        >
                            <div
                                className="feature-icon"
                            >
                                ❤️
                            </div>

                            <div>
                                <strong>
                                    Better Health
                                </strong>

                                <small>
                                    A healthier you
                                </small>
                            </div>
                        </div>
                    </div>

                    {/* ==================================================
                        BOTTOM
                    ================================================== */}

                    <div
                        className="video-bottom-features"
                    >
                        <div>
                            <span>
                                ▣
                            </span>

                            Take on time
                        </div>

                        <div>
                            <span>
                                ▥
                            </span>

                            Track regularly
                        </div>

                        <div>
                            <span>
                                ♢
                            </span>

                            Stay healthier
                        </div>

                        <div>
                            <span>
                                ♙
                            </span>

                            Together for a better tomorrow
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================================================
                RIGHT SIDE - LOGIN
            ================================================== */}

            <section
                className="login-form-section"
            >

                {/* DECORATIONS */}

                <div
                    className="login-cross cross-one"
                ></div>

                <div
                    className="login-cross cross-two"
                ></div>

                <div
                    className="login-circle"
                ></div>

                {/* ==================================================
                    LOGIN CONTAINER
                ================================================== */}

                <div
                    className="login-form-container"
                >

                    {/* BRAND */}

                    <div
                        className="login-brand"
                    >
                        <div
                            className="pill-logo"
                        >
                            <span
                                className="pill-orange"
                            ></span>

                            <span
                                className="pill-pink"
                            ></span>
                        </div>

                        <span
                            className="brand-name"
                        >
                            PillSync
                        </span>
                    </div>

                    <p
                        className="brand-tagline"
                    >
                        Your Health, On Time
                    </p>

                    {/* ==================================================
                        HEADING
                    ================================================== */}

                    <div
                        className="login-heading"
                    >
                        <h2>
                            Login to your account
                        </h2>

                        <p>
                            Continue your health journey
                            with PillSync
                        </p>
                    </div>

                    {/* ==================================================
                        ERROR
                    ================================================== */}

                    {error && (
                        <div
                            className="login-error"
                        >
                            ⚠️ {error}
                        </div>
                    )}

                    {/* ==================================================
                        FORM
                    ================================================== */}

                    <form
                        className="login-form"
                        onSubmit={handleSubmit}
                    >

                        {/* USERNAME */}

                        <div
                            className="login-input"
                        >
                            <span
                                className="input-icon"
                                aria-hidden="true"
                            >
                                👤
                            </span>

                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={
                                    formData.username
                                }
                                onChange={
                                    handleChange
                                }
                                autoComplete="username"
                                required
                            />
                        </div>

                        {/* PASSWORD */}

                        <div
                            className="login-input"
                        >
                            <span
                                className="input-icon"
                                aria-hidden="true"
                            >
                                🔒
                            </span>

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                name="password"
                                placeholder="Password"
                                value={
                                    formData.password
                                }
                                onChange={
                                    handleChange
                                }
                                autoComplete="current-password"
                                required
                            />

                            {/* EYE BUTTON */}

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        (previous) =>
                                            !previous
                                    )
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                title={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? (
                                    <svg
                                        className="eye-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M3 3L21 21"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />

                                        <path
                                            d="M9.9 4.3C10.55 4.1 11.25 4 12 4C17 4 20.7 8 22 12C21.5 13.5 20.7 14.8 19.5 16"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />

                                        <path
                                            d="M6.2 6.2C4.5 7.5 3.3 9.5 2 12C3.3 16 7 20 12 20C13.4 20 14.7 19.7 15.9 19.2"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="eye-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinejoin="round"
                                        />

                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="3"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* ==================================================
                            LOGIN BUTTON
                        ================================================== */}

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span
                                        className="login-spinner"
                                    ></span>

                                    Logging in...
                                </>
                            ) : (
                                <>
                                    Login

                                    <span
                                        className="login-arrow"
                                    >
                                        →
                                    </span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* ==================================================
                        FORGOT PASSWORD
                    ================================================== */}

                    <button
                        type="button"
                        className="forgot-password"
                        onClick={() =>
                            navigate(
                                "/forgot-password"
                            )
                        }
                    >
                        Forgot Password?
                    </button>

                    {/* ==================================================
                        DIVIDER
                    ================================================== */}

                    <div
                        className="login-divider"
                    >
                        <span></span>

                        <strong>
                            OR
                        </strong>

                        <span></span>
                    </div>

                    {/* ==================================================
                        REGISTER
                    ================================================== */}

                    <div
                        className="register-text"
                    >
                        Don't have an account?

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/register"
                                )
                            }
                        >
                            Register
                        </button>
                    </div>

                    {/* ==================================================
                        FOOTER
                    ================================================== */}

                    <div
                        className="login-footer"
                    >
                        <div
                            className="heartbeat"
                        >
                            ──╱╲──╱╲──
                        </div>

                        <div>
                            <span>
                                Better Medicines
                            </span>

                            <strong>
                                Brighter Tomorrows
                            </strong>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Login;
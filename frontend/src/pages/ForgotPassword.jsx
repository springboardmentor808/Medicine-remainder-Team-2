import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        const enteredEmail = email.trim();

        // ============================================================
        // VALIDATE EMAIL
        // ============================================================

        if (!enteredEmail) {
            alert("Please enter your email address.");
            return;
        }

        if (!enteredEmail.includes("@")) {
            alert("Please enter a valid email address.");
            return;
        }

        // ============================================================
        // CLEAR OLD RESET SESSION
        // ============================================================

        localStorage.removeItem("reset_user_id");
        localStorage.removeItem("reset_token");

        setLoading(true);

        try {
            // ========================================================
            // FORGOT PASSWORD API
            // ========================================================

            const response = await api.post(
                "accounts/forgot-password/",
                {
                    email: enteredEmail,
                }
            );

            console.log(
                "Forgot password response:",
                response.data
            );

            // ========================================================
            // GET USER ID
            // ========================================================

            const userId = response.data?.user_id;

            // ========================================================
            // GET RESET TOKEN
            // ========================================================

            const token = response.data?.token;

            // ========================================================
            // CHECK USER ID
            // ========================================================

            if (
                userId === undefined ||
                userId === null
            ) {
                alert(
                    "User ID was not received from the server."
                );
                return;
            }

            // ========================================================
            // CHECK TOKEN
            // ========================================================

            if (!token) {
                alert(
                    "Reset token was not received from the server."
                );
                return;
            }

            // ========================================================
            // SAVE RESET USER ID
            // ========================================================

            localStorage.setItem(
                "reset_user_id",
                String(userId)
            );

            // ========================================================
            // SAVE RESET TOKEN
            // ========================================================

            localStorage.setItem(
                "reset_token",
                String(token)
            );

            console.log(
                "Reset user ID saved:",
                userId
            );

            console.log(
                "Reset token saved successfully."
            );

            // ========================================================
            // SUCCESS MESSAGE
            // ========================================================

            alert(
                "Email verified successfully. Please enter your new password."
            );

            // ========================================================
            // GO TO RESET PASSWORD
            // ========================================================

            navigate("/reset-password");

        } catch (error) {
            console.error(
                "Forgot Password Error:",
                error
            );

            console.error(
                "Backend response:",
                error?.response?.data
            );

            const status =
                error?.response?.status;

            const backendError =
                error?.response?.data?.error;

            const backendMessage =
                error?.response?.data?.message;

            // ========================================================
            // 404 - EMAIL NOT FOUND
            // ========================================================

            if (status === 404) {
                alert(
                    backendError ||
                    backendMessage ||
                    "Email not found. Please enter your registered email."
                );
                return;
            }

            // ========================================================
            // 400 - BAD REQUEST
            // ========================================================

            if (status === 400) {
                alert(
                    backendError ||
                    backendMessage ||
                    "Please enter a valid email address."
                );
                return;
            }

            // ========================================================
            // 500+ - SERVER ERROR
            // ========================================================

            if (
                status &&
                status >= 500
            ) {
                alert(
                    "Server error. Please try again later."
                );
                return;
            }

            // ========================================================
            // CONNECTION ERROR
            // ========================================================

            if (!error?.response) {
                alert(
                    "Unable to connect to the server. Please make sure the Django backend is running."
                );
                return;
            }

            // ========================================================
            // OTHER ERROR
            // ========================================================

            alert(
                backendError ||
                backendMessage ||
                "Unable to verify the email. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={pageStyle}>

            <div style={boxStyle}>

                {/* ==================================================
                    LOGO
                ================================================== */}

                <h1 style={titleStyle}>
                    💊 PillSync
                </h1>

                {/* ==================================================
                    HEADING
                ================================================== */}

                <h2 style={headingStyle}>
                    Forgot Password
                </h2>

                <p style={textStyle}>
                    Enter your registered email address
                </p>

                {/* ==================================================
                    FORM
                ================================================== */}

                <form onSubmit={handleSubmit}>

                    {/* EMAIL */}

                    <input
                        type="email"
                        placeholder="Enter Email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        required
                        autoComplete="email"
                        disabled={loading}
                        style={inputStyle}
                    />

                    {/* VERIFY BUTTON */}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...buttonStyle,
                            ...(loading
                                ? disabledButtonStyle
                                : {}),
                        }}
                    >
                        {loading
                            ? "Verifying..."
                            : "Verify Email"}
                    </button>

                </form>

                {/* ==================================================
                    BACK TO LOGIN
                ================================================== */}

                <p
                    style={{
                        marginTop: "20px",
                        marginBottom: "0",
                    }}
                >
                    <Link
                        to="/login"
                        style={linkStyle}
                    >
                        ← Back to Login
                    </Link>
                </p>

            </div>

        </div>
    );
}

// ================================================================
// PAGE STYLE
// ================================================================

const pageStyle = {
    minHeight: "100vh",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    padding: "20px",

    boxSizing: "border-box",

    background:
        "linear-gradient(135deg, #e3f2fd, #f4f6f9)",
};

// ================================================================
// BOX STYLE
// ================================================================

const boxStyle = {
    width: "100%",

    maxWidth: "420px",

    padding: "35px",

    boxSizing: "border-box",

    background: "#ffffff",

    borderRadius: "15px",

    boxShadow:
        "0 8px 30px rgba(0, 0, 0, 0.15)",

    textAlign: "center",
};

// ================================================================
// TITLE
// ================================================================

const titleStyle = {
    color: "#1976D2",

    margin: "0 0 15px 0",

    fontSize: "34px",

    fontWeight: "700",
};

// ================================================================
// HEADING
// ================================================================

const headingStyle = {
    margin: "0 0 10px 0",

    color: "#333333",

    fontSize: "24px",

    fontWeight: "600",
};

// ================================================================
// DESCRIPTION
// ================================================================

const textStyle = {
    color: "#666666",

    margin: "0 0 25px 0",

    fontSize: "14px",
};

// ================================================================
// INPUT
// ================================================================

const inputStyle = {
    width: "100%",

    padding: "13px",

    marginBottom: "15px",

    border: "1px solid #cccccc",

    borderRadius: "8px",

    boxSizing: "border-box",

    fontSize: "15px",

    outline: "none",
};

// ================================================================
// BUTTON
// ================================================================

const buttonStyle = {
    width: "100%",

    padding: "13px",

    background: "#1976D2",

    color: "#ffffff",

    border: "none",

    borderRadius: "8px",

    fontSize: "16px",

    fontWeight: "700",

    cursor: "pointer",
};

// ================================================================
// DISABLED BUTTON
// ================================================================

const disabledButtonStyle = {
    opacity: 0.6,

    cursor: "not-allowed",
};

// ================================================================
// LINK
// ================================================================

const linkStyle = {
    color: "#1976D2",

    textDecoration: "none",

    fontSize: "14px",
};

// ================================================================
// EXPORT
// ================================================================

export default ForgotPassword;
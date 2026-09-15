import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

function ResetPassword() {
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [userId] = useState(
        () => localStorage.getItem("reset_user_id") || ""
    );

    const [token] = useState(
        () => localStorage.getItem("reset_token") || ""
    );

    const hasResetSession = Boolean(userId && token);

    const getErrorMessage = (resetError) => {
        const data = resetError?.response?.data;

        if (!data) {
            return (
                resetError?.message ||
                "Password reset failed. Please try again."
            );
        }

        if (typeof data === "string") {
            return data;
        }

        if (data.error) {
            return Array.isArray(data.error)
                ? data.error[0]
                : data.error;
        }

        if (data.detail) {
            return Array.isArray(data.detail)
                ? data.detail[0]
                : data.detail;
        }

        if (data.message) {
            return data.message;
        }

        if (Array.isArray(data.non_field_errors)) {
            return data.non_field_errors[0];
        }

        const fields = [
            "password",
            "new_password",
            "confirm_password",
            "user_id",
            "token",
        ];

        for (const field of fields) {
            if (data[field]) {
                return Array.isArray(data[field])
                    ? data[field][0]
                    : data[field];
            }
        }

        return "Password reset failed. Please try again.";
    };

    const handleReset = async (event) => {
        event.preventDefault();

        if (loading) return;

        setError("");
        setSuccess("");

        const storedUserId =
            localStorage.getItem("reset_user_id") || "";

        const storedToken =
            localStorage.getItem("reset_token") || "";

        if (!storedUserId || !storedToken) {
            setError(
                "Password reset session expired. Please request a new reset."
            );
            return;
        }

        if (!password) {
            setError("Please enter a new password.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (!confirmPassword) {
            setError("Please confirm your new password.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post(
                "accounts/reset-password/",
                {
                    user_id: storedUserId,
                    token: storedToken,
                    password: password,
                }
            );

            console.log(
                "Password reset response:",
                response.data
            );

            setSuccess(
                response.data?.message ||
                "Password reset successfully."
            );

            setPassword("");
            setConfirmPassword("");

            localStorage.removeItem("reset_user_id");
            localStorage.removeItem("reset_token");

            setTimeout(() => {
                navigate("/login", {
                    replace: true,
                });
            }, 1500);
        } catch (resetError) {
            console.error(
                "Password reset error:",
                resetError?.response?.data ||
                resetError?.message
            );

            setError(getErrorMessage(resetError));
        } finally {
            setLoading(false);
        }
    };

    const handleBackToForgotPassword = () => {
        if (loading) return;

        localStorage.removeItem("reset_user_id");
        localStorage.removeItem("reset_token");

        navigate("/forgot-password");
    };

    const handleBackToLogin = () => {
        if (loading) return;

        navigate("/login");
    };

    return (
        <div style={pageStyle}>
            <div style={boxStyle}>

                <h1 style={titleStyle}>
                    💊 PillSync
                </h1>

                <h2 style={headingStyle}>
                    Reset Password
                </h2>

                <p style={textStyle}>
                    Enter your new password below.
                </p>

                {!hasResetSession && (
                    <div style={errorStyle}>
                        Password reset session expired.
                        <br />
                        Please request a new reset.
                    </div>
                )}

                {error && (
                    <div style={errorStyle}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={successStyle}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleReset}>

                    <input
                        type="password"
                        placeholder="New Password"
                        value={password}
                        onChange={(event) => {
                            setPassword(event.target.value);
                            setError("");
                        }}
                        minLength={8}
                        required
                        disabled={
                            loading || !hasResetSession
                        }
                        autoComplete="new-password"
                        style={inputStyle}
                    />

                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(event) => {
                            setConfirmPassword(
                                event.target.value
                            );
                            setError("");
                        }}
                        minLength={8}
                        required
                        disabled={
                            loading || !hasResetSession
                        }
                        autoComplete="new-password"
                        style={inputStyle}
                    />

                    <p style={hintStyle}>
                        Password must contain at least 8 characters.
                    </p>

                    <button
                        type="submit"
                        disabled={
                            loading || !hasResetSession
                        }
                        style={{
                            ...buttonStyle,
                            opacity:
                                loading || !hasResetSession
                                    ? 0.6
                                    : 1,
                            cursor:
                                loading || !hasResetSession
                                    ? "not-allowed"
                                    : "pointer",
                        }}
                    >
                        {loading
                            ? "Resetting..."
                            : "Reset Password"}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={handleBackToForgotPassword}
                    disabled={loading}
                    style={{
                        ...backButtonStyle,
                        opacity: loading ? 0.6 : 1,
                        cursor: loading
                            ? "not-allowed"
                            : "pointer",
                    }}
                >
                    Request New Reset
                </button>

                <button
                    type="button"
                    onClick={handleBackToLogin}
                    disabled={loading}
                    style={{
                        ...backButtonStyle,
                        opacity: loading ? 0.6 : 1,
                        cursor: loading
                            ? "not-allowed"
                            : "pointer",
                    }}
                >
                    Back to Login
                </button>

            </div>
        </div>
    );
}

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

const titleStyle = {
    color: "#1976D2",
    margin: "0 0 15px 0",
    fontSize: "34px",
    fontWeight: "700",
};

const headingStyle = {
    margin: "0 0 10px 0",
    color: "#333333",
    fontSize: "24px",
    fontWeight: "600",
};

const textStyle = {
    color: "#666666",
    margin: "0 0 25px 0",
    fontSize: "14px",
};

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

const hintStyle = {
    margin: "-5px 0 15px 0",
    color: "#777777",
    fontSize: "12px",
    textAlign: "left",
};

const buttonStyle = {
    width: "100%",
    padding: "13px",
    background: "#1976D2",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "700",
};

const backButtonStyle = {
    width: "100%",
    marginTop: "15px",
    padding: "8px",
    background: "none",
    border: "none",
    color: "#1976D2",
    fontSize: "14px",
};

const errorStyle = {
    marginBottom: "18px",
    padding: "12px",
    borderRadius: "8px",
    background: "#ffebee",
    color: "#c62828",
    border: "1px solid #ef9a9a",
    fontSize: "14px",
};

const successStyle = {
    marginBottom: "18px",
    padding: "12px",
    borderRadius: "8px",
    background: "#e8f5e9",
    color: "#2e7d32",
    border: "1px solid #81c784",
    fontSize: "14px",
};

export default ResetPassword;
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

function Register() {
    const navigate = useNavigate();

    // ============================================================
    // FORM DATA
    // ============================================================

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "Patient"
    });

    // ============================================================
    // SHOW / HIDE PASSWORD
    // ============================================================

    const [showPassword, setShowPassword] = useState(false);

    // ============================================================
    // LOADING / ERROR
    // ============================================================

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // ============================================================
    // HANDLE INPUT CHANGE
    // ============================================================

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

        setErrorMessage("");
    };

    // ============================================================
    // HANDLE REGISTRATION
    // ============================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) {
            return;
        }

        setErrorMessage("");

        // --------------------------------------------------------
        // USERNAME VALIDATION
        // --------------------------------------------------------

        if (!formData.username.trim()) {
            setErrorMessage("Please enter your username.");
            return;
        }

        // --------------------------------------------------------
        // EMAIL VALIDATION
        // --------------------------------------------------------

        if (!formData.email.trim()) {
            setErrorMessage("Please enter your email address.");
            return;
        }

        // --------------------------------------------------------
        // PASSWORD VALIDATION
        // --------------------------------------------------------

        if (formData.password.length < 8) {
            setErrorMessage(
                "Password must contain at least 8 characters."
            );
            return;
        }

        // --------------------------------------------------------
        // ROLE VALIDATION
        // --------------------------------------------------------

        if (!formData.role) {
            setErrorMessage("Please select a role.");
            return;
        }

        setLoading(true);

        // ========================================================
        // SEND DATA TO DJANGO
        // ========================================================

        try {
            const cleanUsername = formData.username.trim();
            const cleanEmail = formData.email.trim();

            const response = await api.post(
                "accounts/register/",
                {
                    username: cleanUsername,
                    email: cleanEmail,
                    password: formData.password,
                    role: formData.role
                }
            );

            console.log(
                "REGISTER RESPONSE:",
                response.data
            );

            // ----------------------------------------------------
            // SUCCESS MESSAGE
            // ----------------------------------------------------

            alert(
                response.data.message ||
                "Registration Successful!"
            );

            // ----------------------------------------------------
            // CLEAR OLD RESET SESSION
            // ----------------------------------------------------

            localStorage.removeItem("reset_user_id");
            localStorage.removeItem("reset_token");

            // ----------------------------------------------------
            // GO TO LOGIN
            // ----------------------------------------------------

            navigate("/login");

        } catch (error) {
            console.error(
                "REGISTRATION ERROR:",
                error.response?.data || error
            );

            const data = error.response?.data;

            // ====================================================
            // DJANGO / DRF ERROR HANDLING
            // ====================================================

            if (data) {

                if (data.username) {

                    setErrorMessage(
                        Array.isArray(data.username)
                            ? data.username[0]
                            : data.username
                    );

                } else if (data.email) {

                    setErrorMessage(
                        Array.isArray(data.email)
                            ? data.email[0]
                            : data.email
                    );

                } else if (data.password) {

                    setErrorMessage(
                        Array.isArray(data.password)
                            ? data.password[0]
                            : data.password
                    );

                } else if (data.role) {

                    setErrorMessage(
                        Array.isArray(data.role)
                            ? data.role[0]
                            : data.role
                    );

                } else if (data.detail) {

                    setErrorMessage(
                        data.detail
                    );

                } else if (data.error) {

                    setErrorMessage(
                        data.error
                    );

                } else {

                    setErrorMessage(
                        "Registration failed. Please check your details."
                    );
                }

            } else {

                setErrorMessage(
                    "Unable to connect to the server."
                );
            }

        } finally {

            setLoading(false);
        }
    };

    // ============================================================
    // UI
    // ============================================================

    return (
        <div
            style={{
                minHeight: "100vh",

                background:
                    "linear-gradient(rgba(0,40,80,.65),rgba(0,40,80,.65)),url('/images/medical-bg.png')",

                backgroundSize: "cover",

                backgroundPosition: "center",

                display: "flex",

                justifyContent: "center",

                alignItems: "center",

                padding: "20px",

                boxSizing: "border-box"
            }}
        >

            {/* ====================================================
                REGISTER CARD
            ==================================================== */}

            <div
                style={{
                    width: "400px",

                    maxWidth: "100%",

                    background:
                        "rgba(255,255,255,.96)",

                    padding: "30px",

                    borderRadius: "15px",

                    boxShadow:
                        "0 10px 30px rgba(0,0,0,.3)",

                    textAlign: "center",

                    boxSizing: "border-box"
                }}
            >

                {/* =================================================
                    LOGO / TITLE
                ================================================= */}

                <h1
                    style={{
                        color: "#1976D2",

                        marginBottom: "8px",

                        fontSize: "32px"
                    }}
                >
                    💊 PillSync
                </h1>

                <p
                    style={{
                        color: "#555",

                        marginBottom: "25px",

                        fontSize: "15px"
                    }}
                >
                    Create your account
                </p>


                {/* =================================================
                    ERROR MESSAGE
                ================================================= */}

                {errorMessage && (

                    <div
                        style={{
                            background: "#ffebee",

                            color: "#c62828",

                            border:
                                "1px solid #ef9a9a",

                            padding: "10px 12px",

                            borderRadius: "8px",

                            marginBottom: "18px",

                            fontSize: "14px",

                            textAlign: "left"
                        }}
                    >
                        {errorMessage}
                    </div>

                )}


                {/* =================================================
                    FORM
                ================================================= */}

                <form onSubmit={handleSubmit}>

                    {/* =================================================
                        USERNAME
                    ================================================= */}

                    <input
                        type="text"

                        name="username"

                        placeholder="Username"

                        value={formData.username}

                        onChange={handleChange}

                        required

                        autoComplete="username"

                        style={inputStyle}
                    />


                    {/* =================================================
                        EMAIL
                    ================================================= */}

                    <input
                        type="email"

                        name="email"

                        placeholder="Email"

                        value={formData.email}

                        onChange={handleChange}

                        required

                        autoComplete="email"

                        style={inputStyle}
                    />


                    {/* =================================================
                        PASSWORD WITH EYE BUTTON
                    ================================================= */}

                    <div
                        style={{
                            position: "relative",

                            width: "100%",

                            marginBottom: "15px"
                        }}
                    >

                        <input
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }

                            name="password"

                            placeholder="Password (minimum 8 characters)"

                            value={formData.password}

                            onChange={handleChange}

                            required

                            minLength={8}

                            autoComplete="new-password"

                            style={{
                                ...inputStyle,

                                marginBottom: "0",

                                paddingRight: "48px"
                            }}
                        />


                        {/* =================================================
                            SHOW / HIDE PASSWORD BUTTON
                        ================================================= */}

                        <button
                            type="button"

                            onClick={() =>
                                setShowPassword(
                                    !showPassword
                                )
                            }

                            style={{
                                position: "absolute",

                                right: "10px",

                                top: "50%",

                                transform:
                                    "translateY(-50%)",

                                background:
                                    "transparent",

                                border: "none",

                                cursor: "pointer",

                                fontSize: "20px",

                                padding: "5px",

                                display: "flex",

                                alignItems: "center",

                                justifyContent: "center"
                            }}

                            aria-label={
                                showPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                        >

                            {showPassword
                                ? "🙈"
                                : "👁️"
                            }

                        </button>

                    </div>


                    {/* =================================================
                        ROLE SELECT
                    ================================================= */}

                    <select
                        name="role"

                        value={formData.role}

                        onChange={handleChange}

                        required

                        style={selectStyle}
                    >

                        <option value="Patient">
                            👤 Patient
                        </option>

                        <option value="Caregiver">
                            🤝 Caregiver
                        </option>

                    </select>


                    {/* =================================================
                        ROLE INFORMATION
                    ================================================= */}

                    <div
                        style={{
                            background: "#e3f2fd",

                            border:
                                "1px solid #90caf9",

                            color: "#1565c0",

                            padding: "10px 12px",

                            borderRadius: "8px",

                            marginBottom: "18px",

                            fontSize: "13px",

                            textAlign: "left",

                            lineHeight: "1.5"
                        }}
                    >

                        <strong>
                            Selected Role:
                        </strong>{" "}

                        {formData.role}

                        <br />

                        <span
                            style={{
                                color: "#555"
                            }}
                        >
                            {formData.role === "Patient"
                                ? "Manage medicines, reminders, adherence and health information."
                                : "Monitor assigned patients and receive medication alerts."
                            }
                        </span>

                    </div>


                    {/* =================================================
                        REGISTER BUTTON
                    ================================================= */}

                    <button
                        type="submit"

                        disabled={loading}

                        style={{
                            ...buttonStyle,

                            opacity:
                                loading
                                    ? 0.7
                                    : 1,

                            cursor:
                                loading
                                    ? "not-allowed"
                                    : "pointer"
                        }}
                    >

                        {loading
                            ? "Creating Account..."
                            : "Register"
                        }

                    </button>

                </form>


                {/* =================================================
                    LOGIN LINK
                ================================================= */}

                <p
                    style={{
                        marginTop: "20px",

                        marginBottom: "0",

                        color: "#555",

                        fontSize: "14px"
                    }}
                >

                    Already have an account?

                    {" "}

                    <Link
                        to="/login"

                        style={linkStyle}
                    >
                        Login
                    </Link>

                </p>

            </div>

        </div>
    );
}


// ================================================================
// INPUT STYLE
// ================================================================

const inputStyle = {
    width: "100%",

    padding: "12px",

    marginBottom: "15px",

    borderRadius: "8px",

    border: "1px solid #ccc",

    fontSize: "16px",

    boxSizing: "border-box",

    outline: "none",

    background: "white"
};


// ================================================================
// SELECT STYLE
// ================================================================

const selectStyle = {
    width: "100%",

    padding: "12px",

    marginBottom: "12px",

    borderRadius: "8px",

    border: "1px solid #ccc",

    fontSize: "16px",

    boxSizing: "border-box",

    background: "white",

    cursor: "pointer",

    outline: "none"
};


// ================================================================
// BUTTON STYLE
// ================================================================

const buttonStyle = {
    width: "100%",

    padding: "12px",

    background: "#1976D2",

    color: "white",

    border: "none",

    cursor: "pointer",

    borderRadius: "8px",

    fontSize: "16px",

    fontWeight: "bold"
};


// ================================================================
// LINK STYLE
// ================================================================

const linkStyle = {
    color: "#1976D2",

    fontWeight: "bold",

    textDecoration: "none"
};


export default Register;
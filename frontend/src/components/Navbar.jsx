import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Navbar.css";

function Navbar() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("User");
    const [role, setRole] = useState("Patient");


    // ============================================================
    // LOAD USER INFORMATION
    // ============================================================

    useEffect(() => {

        const storedUsername =
            localStorage.getItem("username");

        const storedRole =
            localStorage.getItem("role");

        if (storedUsername) {
            setUsername(storedUsername);
        }

        if (storedRole) {
            setRole(storedRole);
        }

    }, []);


    // ============================================================
    // LOGOUT
    // ============================================================

    const handleLogout = () => {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        localStorage.removeItem("user_id");

        navigate("/login");

    };


    // ============================================================
    // NAVIGATION LINK STYLE
    // ============================================================

    const navClass = ({ isActive }) =>
        isActive
            ? "navbar-link active"
            : "navbar-link";


    return (

        <header className="navbar">


            {/* ====================================================
                BRAND
            ==================================================== */}

            <div
                className="navbar-brand"
                onClick={() =>
                    navigate("/dashboard")
                }
            >

                <div className="brand-icon">
                    💊
                </div>

                <div className="brand-text">

                    <div className="brand-name">
                        Pill<span>Sync</span>
                    </div>

                    <div className="brand-subtitle">
                        Medication Management
                    </div>

                </div>

            </div>


            {/* ====================================================
                MAIN NAVIGATION
            ==================================================== */}

            <nav className="navbar-navigation">


                {/* DASHBOARD */}

                <NavLink
                    to="/dashboard"
                    className={navClass}
                >

                    <span className="nav-icon">
                        🏠
                    </span>

                    <span>
                        Dashboard
                    </span>

                </NavLink>


                {/* MEDICINES */}

                <NavLink
                    to="/medicines"
                    className={navClass}
                >

                    <span className="nav-icon">
                        💊
                    </span>

                    <span>
                        Medicines
                    </span>

                </NavLink>


                {/* ADD MEDICINE */}

                <NavLink
                    to="/add-medicine"
                    className={navClass}
                >

                    <span className="nav-icon">
                        ➕
                    </span>

                    <span>
                        Add Medicine
                    </span>

                </NavLink>


                {/* CONDITIONS */}

                <NavLink
                    to="/conditions"
                    className={navClass}
                >

                    <span className="nav-icon">
                        🩺
                    </span>

                    <span>
                        Conditions
                    </span>

                </NavLink>


                {/* REMINDERS */}

                <NavLink
                    to="/reminders"
                    className={navClass}
                >

                    <span className="nav-icon">
                        ⏰
                    </span>

                    <span>
                        Reminders
                    </span>

                </NavLink>


                {/* MEDICATION HISTORY */}

                <NavLink
                    to="/medication-history"
                    className={navClass}
                >

                    <span className="nav-icon">
                        📋
                    </span>

                    <span>
                        History
                    </span>

                </NavLink>


                {/* PRESCRIPTION SCANNER */}

                <NavLink
                    to="/prescription"
                    className={navClass}
                >

                    <span className="nav-icon">
                        📷
                    </span>

                    <span>
                        Scanner
                    </span>

                </NavLink>

            </nav>


            {/* ====================================================
                RIGHT SIDE
            ==================================================== */}

            <div className="navbar-right">


                {/* =================================================
                    NOTIFICATIONS
                ================================================= */}

                <button
                    type="button"
                    className="notification-button"
                    onClick={() =>
                        navigate("/notifications")
                    }
                    title="Notifications"
                    aria-label="Open Notifications"
                >

                    <span className="notification-icon">
                        🔔
                    </span>

                </button>


                {/* =================================================
                    USER PROFILE
                ================================================= */}

                <button
                    type="button"
                    className="navbar-user"
                    onClick={() =>
                        navigate("/profile")
                    }
                    title="Open Profile"
                    aria-label="Open Profile"
                >

                    <div className="user-avatar">

                        {
                            username
                                ? username
                                    .charAt(0)
                                    .toUpperCase()
                                : "U"
                        }

                    </div>


                    <div className="user-details">

                        <div className="user-name">
                            {username}
                        </div>

                        <div className="user-role">
                            {role}
                        </div>

                    </div>

                </button>


                {/* =================================================
                    LOGOUT
                ================================================= */}

                <button
                    type="button"
                    className="logout-button"
                    onClick={handleLogout}
                    title="Logout"
                >

                    <span>
                        ↪
                    </span>

                    Logout

                </button>

            </div>

        </header>

    );
}


export default Navbar;
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Sidebar.css";

function Sidebar() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("User");
    const [role, setRole] = useState("Patient");


    // ============================================================
    // LOAD USER
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
    // MAIN MENU
    // ============================================================

    const mainMenu = [

        {
            name: "Dashboard",
            path: "/dashboard",
            icon: "⌂"
        },

        {
            name: "Medicines",
            path: "/medicines",
            icon: "💊"
        },

        {
            name: "Add Medicine",
            path: "/add-medicine",
            icon: "+"
        },

        {
            name: "Health Conditions",
            path: "/conditions",
            icon: "🩺"
        }

    ];


    // ============================================================
    // MEDICATION MANAGEMENT
    // ============================================================

    const managementMenu = [

        {
            name: "Reminders",
            path: "/reminders",
            icon: "⏰"
        },

        {
            name: "Notifications",
            path: "/notifications",
            icon: "🔔"
        },

        {
            name: "Medication History",
            path: "/medication-history",
            icon: "▤"
        },

        {
            name: "Adherence Analytics",
            path: "/adherence",
            icon: "📊"
        },

        {
            name: "Refill Management",
            path: "/refill",
            icon: "🔄"
        },

        // ========================================================
        // NEW — REFILL ANALYTICS
        // ========================================================

        {
            name: "Refill Analytics",
            path: "/refill-analytics",
            icon: "📈"
        },

        {
            name: "Prescription Scanner",
            path: "/prescription",
            icon: "▣"
        }

    ];


    // ============================================================
    // NAVIGATION ITEM
    // ============================================================

    const renderMenuItem = (item) => (

        <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
                isActive
                    ? "sidebar-link active"
                    : "sidebar-link"
            }
        >

            <span className="sidebar-icon">
                {item.icon}
            </span>

            <span className="sidebar-link-text">
                {item.name}
            </span>

        </NavLink>

    );


    return (

        <aside className="sidebar">


            {/* ====================================================
                BRAND
            ==================================================== */}

            <div
                className="sidebar-brand"
                onClick={() =>
                    navigate("/dashboard")
                }
            >

                <div className="sidebar-brand-icon">
                    💊
                </div>

                <div>

                    <div className="sidebar-brand-name">
                        Pill<span>Sync</span>
                    </div>

                    <div className="sidebar-brand-subtitle">
                        HEALTHCARE PLATFORM
                    </div>

                </div>

            </div>


            {/* ====================================================
                USER CARD
            ==================================================== */}

            <div className="sidebar-user-card">

                <div className="sidebar-user-avatar">

                    {
                        username
                            ? username
                                .charAt(0)
                                .toUpperCase()
                            : "U"
                    }

                </div>

                <div className="sidebar-user-info">

                    <div className="sidebar-user-name">
                        {username}
                    </div>

                    <div className="sidebar-user-role">

                        <span className="online-dot"></span>

                        {role}

                    </div>

                </div>

            </div>


            {/* ====================================================
                NAVIGATION
            ==================================================== */}

            <div className="sidebar-content">


                {/* ==================================================
                    MAIN
                ================================================== */}

                <div className="sidebar-section">

                    <div className="sidebar-section-title">
                        MAIN
                    </div>

                    <div className="sidebar-menu">

                        {mainMenu.map(
                            renderMenuItem
                        )}

                    </div>

                </div>


                {/* ==================================================
                    MEDICATION MANAGEMENT
                ================================================== */}

                <div className="sidebar-section">

                    <div className="sidebar-section-title">
                        MEDICATION MANAGEMENT
                    </div>

                    <div className="sidebar-menu">

                        {managementMenu.map(
                            renderMenuItem
                        )}

                    </div>

                </div>


                {/* ==================================================
                    ACCOUNT
                ================================================== */}

                <div className="sidebar-section">

                    <div className="sidebar-section-title">
                        ACCOUNT
                    </div>

                    <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                            isActive
                                ? "sidebar-link active"
                                : "sidebar-link"
                        }
                    >

                        <span className="sidebar-icon">
                            ◉
                        </span>

                        <span className="sidebar-link-text">
                            My Profile
                        </span>

                    </NavLink>

                </div>

            </div>


            {/* ====================================================
                SIDEBAR FOOTER
            ==================================================== */}

            <div className="sidebar-footer">

                <div className="sidebar-footer-icon">
                    ✓
                </div>

                <div>

                    <div className="sidebar-footer-title">
                        Medication Care
                    </div>

                    <div className="sidebar-footer-text">
                        Stay on track with PillSync
                    </div>

                </div>

            </div>

        </aside>

    );

}


export default Sidebar;
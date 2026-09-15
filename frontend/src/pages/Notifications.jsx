import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";

import "./Notifications.css";


/* ============================================================
   NOTIFICATION ICON
============================================================ */

const getIcon = (type) => {

    switch (String(type || "").toLowerCase()) {

        case "medicine":
            return "💊";

        case "missed":
            return "⚠️";

        case "refill":
            return "🔄";

        case "emergency":
            return "🚨";

        case "prescription":
            return "📄";

        case "system":
            return "🔔";

        default:
            return "🔔";
    }
};


/* ============================================================
   NOTIFICATION TYPE LABEL
============================================================ */

const getTypeLabel = (type) => {

    switch (String(type || "").toLowerCase()) {

        case "medicine":
            return "Medicine Reminder";

        case "missed":
            return "Missed Medicine";

        case "refill":
            return "Refill Alert";

        case "emergency":
            return "Emergency Alert";

        case "prescription":
            return "Prescription";

        case "system":
            return "System";

        default:
            return "Notification";
    }
};


/* ============================================================
   NOTIFICATIONS PAGE
============================================================ */

function Notifications() {

    const navigate = useNavigate();


    // ============================================================
    // STATE
    // ============================================================

    const [notifications, setNotifications] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // ============================================================
    // LOGOUT
    // ============================================================

    const logoutUser = () => {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("username");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");

        navigate("/login");
    };


    // ============================================================
    // LOAD NOTIFICATIONS
    // ============================================================

    const loadNotifications = useCallback(async () => {

        try {

            setLoading(true);
            setError("");


            const token = localStorage.getItem("access");


            // ----------------------------------------------------
            // CHECK LOGIN
            // ----------------------------------------------------

            if (!token) {

                navigate("/login");

                return;
            }


            // ----------------------------------------------------
            // API REQUEST
            // ----------------------------------------------------

            const response = await api.get(
                "notifications/"
            );


            console.log(
                "NOTIFICATIONS API RESPONSE:",
                response.data
            );


            const data = response.data;


            // ----------------------------------------------------
            // NORMAL ARRAY RESPONSE
            // ----------------------------------------------------

            if (Array.isArray(data)) {

                setNotifications(data);

            }

            // ----------------------------------------------------
            // PAGINATED RESPONSE
            // ----------------------------------------------------

            else if (
                Array.isArray(data?.results)
            ) {

                setNotifications(
                    data.results
                );

            }

            // ----------------------------------------------------
            // EMPTY / INVALID RESPONSE
            // ----------------------------------------------------

            else {

                setNotifications([]);
            }


        } catch (err) {

            console.error(
                "Notification error:",
                err.response?.data ||
                err.message
            );


            // ----------------------------------------------------
            // JWT EXPIRED / UNAUTHORIZED
            // ----------------------------------------------------

            if (
                err.response?.status === 401
            ) {

                logoutUser();

                return;
            }


            setError(
                err.response?.data?.detail ||
                "Unable to load notifications."
            );


        } finally {

            setLoading(false);
        }

    }, [navigate]);


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {

        loadNotifications();

    }, [loadNotifications]);


    // ============================================================
    // AUTOMATIC NOTIFICATION REFRESH
    //
    // Reminder.jsx dispatches:
    //
    // window.dispatchEvent(
    //     new Event("notificationsUpdated")
    // );
    //
    // whenever Taken / Missed happens.
    // ============================================================

    useEffect(() => {

        const handleNotificationUpdate = () => {

            console.log(
                "Notification update received. Refreshing..."
            );

            loadNotifications();

        };


        window.addEventListener(
            "notificationsUpdated",
            handleNotificationUpdate
        );


        return () => {

            window.removeEventListener(
                "notificationsUpdated",
                handleNotificationUpdate
            );

        };

    }, [loadNotifications]);


    // ============================================================
    // REFRESH WHEN USER RETURNS TO THIS TAB
    // ============================================================

    useEffect(() => {

        const handleVisibilityChange = () => {

            if (
                document.visibilityState === "visible"
            ) {

                loadNotifications();

            }

        };


        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );


        return () => {

            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );

        };

    }, [loadNotifications]);


    // ============================================================
    // MARK NOTIFICATION AS READ
    // ============================================================

    const markAsRead = async (id) => {

        try {

            await api.patch(
                `notifications/${id}/read/`
            );


            setNotifications(
                (previous) =>

                    previous.map(
                        (notification) =>

                            notification.id === id

                                ? {
                                    ...notification,
                                    is_read: true
                                }

                                : notification
                    )
            );


        } catch (err) {

            console.error(
                "Mark read error:",
                err.response?.data ||
                err.message
            );


            if (
                err.response?.status === 401
            ) {

                logoutUser();

            }

        }

    };


    // ============================================================
    // UNREAD COUNT
    // ============================================================

    const unreadCount = notifications.filter(
        (notification) =>
            !notification.is_read
    ).length;


    // ============================================================
    // PAGE
    // ============================================================

    return (

        <div className="notifications-page">


            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="notifications-header">

                <div>

                    <span className="notifications-kicker">
                        PILLSYNC
                    </span>

                    <h1>
                        Notifications
                    </h1>

                    <p>
                        Stay updated with your medicines,
                        refills, reminders and important
                        health alerts.
                    </p>

                </div>


                <button
                    type="button"
                    className="notifications-back"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    ← Dashboard
                </button>

            </div>


            {/* =====================================================
                SUMMARY
            ===================================================== */}

            <div className="notification-summary">


                {/* TOTAL */}

                <div className="notification-summary-card">

                    <div className="summary-icon">
                        🔔
                    </div>

                    <div>

                        <span>
                            Total Notifications
                        </span>

                        <strong>
                            {notifications.length}
                        </strong>

                    </div>

                </div>


                {/* UNREAD */}

                <div className="notification-summary-card">

                    <div className="summary-icon unread-icon">
                        ●
                    </div>

                    <div>

                        <span>
                            Unread
                        </span>

                        <strong>
                            {unreadCount}
                        </strong>

                    </div>

                </div>


            </div>


            {/* =====================================================
                NOTIFICATION CONTAINER
            ===================================================== */}

            <section className="notifications-container">


                {/* =================================================
                    SECTION HEADER
                ================================================= */}

                <div className="notifications-section-header">

                    <div>

                        <h2>
                            Recent Alerts
                        </h2>

                        <p>
                            Your latest PillSync notifications
                        </p>

                    </div>


                    <button
                        type="button"
                        className="refresh-button"
                        onClick={loadNotifications}
                        disabled={loading}
                    >

                        {loading
                            ? "Loading..."
                            : "↻ Refresh"
                        }

                    </button>

                </div>


                {/* =================================================
                    LOADING
                ================================================= */}

                {loading && (

                    <div className="notification-state">

                        <div className="notification-spinner"></div>

                        <p>
                            Loading notifications...
                        </p>

                    </div>

                )}


                {/* =================================================
                    ERROR
                ================================================= */}

                {!loading && error && (

                    <div className="notification-state error-state">

                        <div className="state-icon">
                            ⚠️
                        </div>

                        <h3>
                            {error}
                        </h3>

                        <button
                            type="button"
                            onClick={loadNotifications}
                        >
                            Try Again
                        </button>

                    </div>

                )}


                {/* =================================================
                    EMPTY
                ================================================= */}

                {!loading &&
                    !error &&
                    notifications.length === 0 && (

                        <div className="notification-state">

                            <div className="state-icon">
                                🔔
                            </div>

                            <h3>
                                No notifications yet
                            </h3>

                            <p>
                                New medicine, refill and
                                health alerts will appear here.
                            </p>

                        </div>

                    )}


                {/* =================================================
                    NOTIFICATION LIST
                ================================================= */}

                {!loading &&
                    !error &&
                    notifications.length > 0 && (

                        <div className="notification-list">


                            {notifications.map(
                                (notification) => (

                                    <div
                                        key={
                                            notification.id
                                        }
                                        className={
                                            `notification-card ${
                                                notification.is_read
                                                    ? "read"
                                                    : "unread"
                                            }`
                                        }
                                    >


                                        {/* =========================
                                            ICON
                                        ========================= */}

                                        <div className="notification-icon">

                                            {
                                                getIcon(
                                                    notification.notification_type
                                                )
                                            }

                                        </div>


                                        {/* =========================
                                            CONTENT
                                        ========================= */}

                                        <div className="notification-content">


                                            <div className="notification-top">


                                                <span className="notification-type">

                                                    {
                                                        getTypeLabel(
                                                            notification.notification_type
                                                        )
                                                    }

                                                </span>


                                                {!notification.is_read && (

                                                    <span className="unread-badge">
                                                        New
                                                    </span>

                                                )}

                                            </div>


                                            {/* TITLE */}

                                            <h3>
                                                {
                                                    notification.title ||
                                                    "Notification"
                                                }
                                            </h3>


                                            {/* MESSAGE */}

                                            <p>
                                                {
                                                    notification.message ||
                                                    "You have a new PillSync notification."
                                                }
                                            </p>


                                            {/* DATE */}

                                            <span className="notification-date">

                                                {
                                                    notification.created_at

                                                        ? new Date(
                                                            notification.created_at
                                                        ).toLocaleString()

                                                        : "Just now"
                                                }

                                            </span>


                                        </div>


                                        {/* =========================
                                            MARK AS READ
                                        ========================= */}

                                        {!notification.is_read && (

                                            <button
                                                type="button"
                                                className="mark-read-button"
                                                onClick={() =>
                                                    markAsRead(
                                                        notification.id
                                                    )
                                                }
                                            >

                                                Mark as read

                                            </button>

                                        )}

                                    </div>

                                )
                            )}

                        </div>

                    )}

            </section>

        </div>

    );

}


export default Notifications;
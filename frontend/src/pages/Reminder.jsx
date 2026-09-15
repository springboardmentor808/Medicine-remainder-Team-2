import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import "./Reminder.css";


function Reminder() {

    const navigate = useNavigate();

    const [reminders, setReminders] = useState([]);
    const [medicines, setMedicines] = useState([]);

    const [medicine, setMedicine] = useState("");
    const [reminderTime, setReminderTime] = useState("09:00");

    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [emailLoading, setEmailLoading] = useState(null);

    const [snoozeOpen, setSnoozeOpen] = useState(null);
    const [snoozeMinutes, setSnoozeMinutes] = useState(10);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");


    // ============================================================
    // CHECK LOGIN + LOAD DATA
    // ============================================================

    useEffect(() => {

        const token = localStorage.getItem("access");

        if (!token) {
            navigate("/login");
            return;
        }

        fetchMedicines();
        fetchReminders();

    }, [navigate]);


    // ============================================================
    // GET MEDICINES
    // ============================================================

    const fetchMedicines = async () => {

        try {

            const response = await api.get("medicines/");

            const data = response.data;

            if (Array.isArray(data)) {

                setMedicines(data);

            } else if (Array.isArray(data?.results)) {

                setMedicines(data.results);

            } else {

                setMedicines([]);

            }

        } catch (error) {

            console.error(
                "Medicine Error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {
                logoutUser();
            }

        }

    };


    // ============================================================
    // GET REMINDERS
    // ============================================================

    const fetchReminders = async () => {

        try {

            const response = await api.get("reminders/");

            const data = response.data;

            if (Array.isArray(data)) {

                setReminders(data);

            } else if (Array.isArray(data?.results)) {

                setReminders(data.results);

            } else {

                setReminders([]);

            }

        } catch (error) {

            console.error(
                "Reminder Error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {
                logoutUser();
            }

        }

    };


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
    // CLEAR MESSAGES
    // ============================================================

    const clearMessages = () => {

        setMessage("");
        setError("");

    };


    // ============================================================
    // AUTOMATIC PERIOD
    // ============================================================

    const getPeriodFromTime = (time) => {

        if (!time) {
            return "Morning";
        }

        const hour = Number(
            time.split(":")[0]
        );

        // 05:00 AM - 11:59 AM
        if (hour >= 5 && hour < 12) {
            return "Morning";
        }

        // 12:00 PM - 05:59 PM
        if (hour >= 12 && hour < 18) {
            return "Afternoon";
        }

        // 06:00 PM - 04:59 AM
        return "Night";

    };


    // ============================================================
    // ADD REMINDER
    // ============================================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        clearMessages();

        if (!medicine) {

            setError(
                "Please select a medicine."
            );

            return;
        }

        if (!reminderTime) {

            setError(
                "Please select a reminder time."
            );

            return;
        }

        const period = getPeriodFromTime(
            reminderTime
        );

        setLoading(true);

        try {

            const response = await api.post(
                "reminders/",
                {
                    medicine: Number(medicine),
                    reminder_time: reminderTime,
                    is_repeating: true,
                    period: period
                }
            );

            console.log(
                "Add Reminder Response:",
                response.data
            );

            setMessage(
                `Reminder added successfully for ${period}.`
            );

            setMedicine("");
            setReminderTime("09:00");

            await fetchReminders();

        } catch (error) {

            console.error(
                "Add Reminder Error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {

                logoutUser();
                return;

            }

            const backendError =
                error.response?.data?.medicine ||
                error.response?.data?.error ||
                error.response?.data?.detail;

            if (typeof backendError === "string") {

                setError(
                    backendError
                );

            } else if (backendError) {

                setError(
                    JSON.stringify(backendError)
                );

            } else {

                setError(
                    "Failed to add reminder."
                );

            }

        } finally {

            setLoading(false);

        }

    };


    // ============================================================
    // MARK AS TAKEN
    // ============================================================

    const markAsTaken = async (id) => {

        clearMessages();

        setActionLoading(id);

        try {

            const response = await api.patch(
                `reminders/${id}/taken/`
            );

            console.log(
                "Taken API Response:",
                response.data
            );

            setMessage(
                response.data?.message ||
                "Medicine marked as taken."
            );

            setSnoozeOpen(null);

            await fetchReminders();

            // Tell notification page to refresh
            window.dispatchEvent(
                new Event("notificationsUpdated")
            );

        } catch (error) {

            console.error(
                "Taken Error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {

                logoutUser();
                return;

            }

            setError(
                error.response?.data?.error ||
                error.response?.data?.detail ||
                "Failed to mark medicine as taken."
            );

        } finally {

            setActionLoading(null);

        }

    };


    // ============================================================
    // MARK AS MISSED
    // ============================================================

    const markAsMissed = async (id) => {

        clearMessages();

        setActionLoading(id);

        try {

            const response = await api.patch(
                `reminders/${id}/missed/`
            );

            console.log(
                "MISSED API RESPONSE:",
                response.data
            );

            /*
             * Backend should return:
             *
             * {
             *   success: true,
             *   message: "...",
             *   notification_created: true/false,
             *   notification_id: ...
             * }
             */

            if (
                response.data?.success === false
            ) {

                setError(
                    response.data?.error ||
                    "Failed to mark medicine as missed."
                );

                return;
            }


            // ----------------------------------------------------
            // SUCCESS MESSAGE
            // ----------------------------------------------------

            if (
                response.data?.notification_created === true
            ) {

                setMessage(
                    "Medicine marked as missed. Notification created."
                );

            } else {

                setMessage(
                    response.data?.message ||
                    "Medicine marked as missed."
                );

            }


            // ----------------------------------------------------
            // CLOSE SNOOZE PANEL
            // ----------------------------------------------------

            setSnoozeOpen(null);


            // ----------------------------------------------------
            // REFRESH REMINDERS
            // ----------------------------------------------------

            await fetchReminders();


            // ----------------------------------------------------
            // REFRESH NOTIFICATION PAGE
            // ----------------------------------------------------

            window.dispatchEvent(
                new Event("notificationsUpdated")
            );


        } catch (error) {

            console.error(
                "MISSED API ERROR:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {

                logoutUser();
                return;

            }

            setError(
                error.response?.data?.error ||
                error.response?.data?.detail ||
                "Failed to mark medicine as missed."
            );

        } finally {

            setActionLoading(null);

        }

    };


    // ============================================================
    // SNOOZE REMINDER
    // ============================================================

    const snoozeReminder = async (id) => {

        clearMessages();

        setActionLoading(id);

        try {

            const response = await api.patch(
                `reminders/${id}/snooze/`,
                {
                    minutes: Number(snoozeMinutes)
                }
            );

            console.log(
                "Snooze API Response:",
                response.data
            );

            setMessage(
                response.data?.message ||
                "Reminder snoozed successfully."
            );

            setSnoozeOpen(null);

            await fetchReminders();

        } catch (error) {

            console.error(
                "Snooze Error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {

                logoutUser();
                return;

            }

            setError(
                error.response?.data?.error ||
                error.response?.data?.detail ||
                "Failed to snooze reminder."
            );

        } finally {

            setActionLoading(null);

        }

    };


    // ============================================================
    // DELETE REMINDER
    // ============================================================

    const deleteReminder = async (id) => {

        clearMessages();

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this reminder?"
        );

        if (!confirmDelete) {
            return;
        }

        setActionLoading(id);

        try {

            await api.delete(
                `reminders/${id}/`
            );

            setMessage(
                "Reminder deleted successfully."
            );

            setSnoozeOpen(null);

            await fetchReminders();

        } catch (error) {

            console.error(
                "Delete Error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {

                logoutUser();
                return;

            }

            setError(
                error.response?.data?.error ||
                error.response?.data?.detail ||
                "Failed to delete reminder."
            );

        } finally {

            setActionLoading(null);

        }

    };


    // ============================================================
    // TEST EMAIL
    // ============================================================

    const sendTestEmail = async (id) => {

        clearMessages();

        setEmailLoading(id);

        try {

            const response = await api.post(
                `reminders/${id}/test-email/`
            );

            setMessage(
                response.data?.message ||
                "Reminder email sent successfully."
            );

        } catch (error) {

            console.error(
                "Email Error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {

                logoutUser();
                return;

            }

            setError(
                error.response?.data?.error ||
                error.response?.data?.detail ||
                "Failed to send reminder email."
            );

        } finally {

            setEmailLoading(null);

        }

    };


    // ============================================================
    // STATUS CLASS
    // ============================================================

    const getStatusClass = (status) => {

        switch (
            String(status || "").toLowerCase()
        ) {

            case "taken":
                return "status-taken";

            case "missed":
                return "status-missed";

            case "snoozed":
                return "status-snoozed";

            case "notified":
                return "status-notified";

            default:
                return "status-pending";

        }

    };


    // ============================================================
    // PERIOD ICON
    // ============================================================

    const getPeriodIcon = (period) => {

        switch (
            String(period || "").toLowerCase()
        ) {

            case "morning":
                return "🌅";

            case "afternoon":
                return "☀️";

            case "night":
                return "🌙";

            default:
                return "⏰";

        }

    };


    // ============================================================
    // CAN PERFORM DOSE ACTIONS
    // ============================================================

    const canTakeOrMiss = (reminder) => {

        return (
            !reminder.is_taken &&
            reminder.status !== "Taken" &&
            reminder.status !== "Missed"
        );

    };


    // ============================================================
    // PAGE
    // ============================================================

    return (

        <>
            <Navbar />

            <Sidebar />

            <main className="reminder-main">

                <div className="reminder-container">

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div className="reminder-header">

                        <div>

                            <div className="reminder-eyebrow">
                                PILLSYNC • MEDICATION MANAGEMENT
                            </div>

                            <h1>
                                Medication Reminders
                            </h1>

                            <p>
                                Schedule medicines and track
                                Taken, Missed and Snoozed doses.
                            </p>

                        </div>

                        <button
                            type="button"
                            className="dashboard-button"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                        >
                            ← Dashboard
                        </button>

                    </div>


                    {/* =================================================
                        SUCCESS
                    ================================================= */}

                    {message && (

                        <div className="success-message">

                            <span>
                                ✓
                            </span>

                            {message}

                        </div>

                    )}


                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (

                        <div className="error-message">

                            <span>
                                ⚠
                            </span>

                            {error}

                        </div>

                    )}


                    {/* =================================================
                        ADD REMINDER
                    ================================================= */}

                    <section className="reminder-card">

                        <div className="card-header">

                            <div className="card-icon">
                                ⏰
                            </div>

                            <div>

                                <h2>
                                    Add Medication Reminder
                                </h2>

                                <p>
                                    Create a recurring reminder
                                    for your medicine.
                                </p>

                            </div>

                        </div>


                        <form
                            onSubmit={handleSubmit}
                            className="reminder-form"
                        >

                            <div className="form-group">

                                <label>
                                    Medicine
                                </label>

                                <select
                                    value={medicine}
                                    onChange={(event) =>
                                        setMedicine(
                                            event.target.value
                                        )
                                    }
                                    required
                                >

                                    <option value="">
                                        Select Medicine
                                    </option>

                                    {medicines.map(
                                        (item) => (

                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {
                                                    item.medicine_name ||
                                                    item.name ||
                                                    "Medicine"
                                                }
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            <div className="form-group">

                                <label>
                                    Reminder Time
                                </label>

                                <input
                                    type="time"
                                    value={reminderTime}
                                    onChange={(event) =>
                                        setReminderTime(
                                            event.target.value
                                        )
                                    }
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label>
                                    Period
                                </label>

                                <div className="period-preview">

                                    <span>
                                        {getPeriodIcon(
                                            getPeriodFromTime(
                                                reminderTime
                                            )
                                        )}
                                    </span>

                                    <strong>
                                        {
                                            getPeriodFromTime(
                                                reminderTime
                                            )
                                        }
                                    </strong>

                                </div>

                            </div>


                            <div className="form-submit">

                                <button
                                    type="submit"
                                    className="add-reminder-button"
                                    disabled={loading}
                                >

                                    {loading
                                        ? "Adding..."
                                        : "＋ Add Reminder"
                                    }

                                </button>

                            </div>

                        </form>

                    </section>


                    {/* =================================================
                        REMINDER LIST
                    ================================================= */}

                    <section className="reminder-card">

                        <div className="card-header">

                            <div className="card-icon">
                                🔔
                            </div>

                            <div>

                                <h2>
                                    My Reminders
                                </h2>

                                <p>
                                    Manage your scheduled
                                    medication doses.
                                </p>

                            </div>

                            <div className="reminder-count">
                                {reminders.length}
                            </div>

                        </div>


                        {reminders.length === 0 ? (

                            <div className="empty-reminders">

                                <div>
                                    🔔
                                </div>

                                <h3>
                                    No reminders yet
                                </h3>

                                <p>
                                    Add a medicine reminder above
                                    to get started.
                                </p>

                            </div>

                        ) : (

                            <div className="reminder-list">

                                {reminders.map(
                                    (reminder) => {

                                        const canAct =
                                            canTakeOrMiss(
                                                reminder
                                            );

                                        return (

                                            <article
                                                key={reminder.id}
                                                className="reminder-item"
                                            >

                                                {/* MEDICINE ICON */}

                                                <div className="medicine-icon">
                                                    💊
                                                </div>


                                                {/* INFORMATION */}

                                                <div className="reminder-info">

                                                    <h3>

                                                        {
                                                            reminder.medicine_name ||
                                                            reminder.medicine?.medicine_name ||
                                                            reminder.medicine?.name ||
                                                            "Medicine"
                                                        }

                                                    </h3>


                                                    <div className="reminder-time">

                                                        ⏰

                                                        <strong>
                                                            {
                                                                reminder.reminder_time
                                                            }
                                                        </strong>

                                                    </div>


                                                    <div className="reminder-meta">

                                                        <span
                                                            className={
                                                                getStatusClass(
                                                                    reminder.status
                                                                )
                                                            }
                                                        >

                                                            {
                                                                reminder.status ||
                                                                "Pending"
                                                            }

                                                        </span>


                                                        {reminder.is_repeating && (

                                                            <span className="repeat-info">
                                                                🔁 Repeating
                                                            </span>

                                                        )}


                                                        {reminder.period && (

                                                            <span className="period-info">

                                                                {getPeriodIcon(
                                                                    reminder.period
                                                                )}{" "}

                                                                {reminder.period}

                                                            </span>

                                                        )}


                                                        {reminder.snoozed_until && (

                                                            <span className="snooze-info">

                                                                😴 Until{" "}

                                                                {new Date(
                                                                    reminder.snoozed_until
                                                                ).toLocaleTimeString(
                                                                    [],
                                                                    {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit"
                                                                    }
                                                                )}

                                                            </span>

                                                        )}

                                                    </div>

                                                </div>


                                                {/* ACTIONS */}

                                                <div className="reminder-actions">

                                                    {/* TAKEN */}

                                                    {canAct && (

                                                        <button
                                                            type="button"
                                                            className="taken-button"
                                                            onClick={() =>
                                                                markAsTaken(
                                                                    reminder.id
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading ===
                                                                reminder.id
                                                            }
                                                        >

                                                            {actionLoading ===
                                                            reminder.id
                                                                ? "Processing..."
                                                                : "✓ Taken"
                                                            }

                                                        </button>

                                                    )}


                                                    {/* MISSED */}

                                                    {canAct && (

                                                        <button
                                                            type="button"
                                                            className="missed-button"
                                                            onClick={() =>
                                                                markAsMissed(
                                                                    reminder.id
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading ===
                                                                reminder.id
                                                            }
                                                        >

                                                            {actionLoading ===
                                                            reminder.id
                                                                ? "Processing..."
                                                                : "✕ Missed"
                                                            }

                                                        </button>

                                                    )}


                                                    {/* SNOOZE */}

                                                    {canAct && (

                                                        <button
                                                            type="button"
                                                            className="snooze-button"
                                                            onClick={() => {

                                                                setSnoozeOpen(
                                                                    snoozeOpen ===
                                                                    reminder.id
                                                                        ? null
                                                                        : reminder.id
                                                                );

                                                            }}
                                                            disabled={
                                                                actionLoading ===
                                                                reminder.id
                                                            }
                                                        >

                                                            😴 Snooze

                                                        </button>

                                                    )}


                                                    {/* EMAIL */}

                                                    <button
                                                        type="button"
                                                        className="email-button"
                                                        onClick={() =>
                                                            sendTestEmail(
                                                                reminder.id
                                                            )
                                                        }
                                                        disabled={
                                                            emailLoading ===
                                                            reminder.id
                                                        }
                                                    >

                                                        {emailLoading ===
                                                        reminder.id
                                                            ? "Sending..."
                                                            : "📧 Email"
                                                        }

                                                    </button>


                                                    {/* DELETE */}

                                                    <button
                                                        type="button"
                                                        className="delete-button"
                                                        onClick={() =>
                                                            deleteReminder(
                                                                reminder.id
                                                            )
                                                        }
                                                        disabled={
                                                            actionLoading ===
                                                            reminder.id
                                                        }
                                                    >

                                                        🗑 Delete

                                                    </button>

                                                </div>


                                                {/* SNOOZE PANEL */}

                                                {snoozeOpen ===
                                                    reminder.id && (

                                                    <div className="snooze-panel">

                                                        <div className="snooze-panel-title">
                                                            😴 Snooze Reminder
                                                        </div>

                                                        <div className="snooze-controls">

                                                            <label>
                                                                Snooze for:
                                                            </label>


                                                            <select
                                                                value={
                                                                    snoozeMinutes
                                                                }
                                                                onChange={(event) =>
                                                                    setSnoozeMinutes(
                                                                        Number(
                                                                            event.target.value
                                                                        )
                                                                    )
                                                                }
                                                            >

                                                                <option value={5}>
                                                                    5 minutes
                                                                </option>

                                                                <option value={10}>
                                                                    10 minutes
                                                                </option>

                                                                <option value={15}>
                                                                    15 minutes
                                                                </option>

                                                                <option value={30}>
                                                                    30 minutes
                                                                </option>

                                                                <option value={60}>
                                                                    60 minutes
                                                                </option>

                                                            </select>


                                                            <button
                                                                type="button"
                                                                className="confirm-snooze-button"
                                                                onClick={() =>
                                                                    snoozeReminder(
                                                                        reminder.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    actionLoading ===
                                                                    reminder.id
                                                                }
                                                            >

                                                                {actionLoading ===
                                                                reminder.id
                                                                    ? "Snoozing..."
                                                                    : "Confirm Snooze"
                                                                }

                                                            </button>


                                                            <button
                                                                type="button"
                                                                className="cancel-snooze-button"
                                                                onClick={() =>
                                                                    setSnoozeOpen(
                                                                        null
                                                                    )
                                                                }
                                                            >

                                                                Cancel

                                                            </button>

                                                        </div>

                                                    </div>

                                                )}

                                            </article>

                                        );

                                    }
                                )}

                            </div>

                        )}

                    </section>

                </div>

            </main>

        </>

    );

}


export default Reminder;
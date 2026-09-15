import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import "./Adherence.css";


function Adherence() {

    const navigate = useNavigate();

    const [analytics, setAnalytics] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // ============================================================
    // LOGOUT
    // ============================================================

    const logoutUser = useCallback(() => {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("username");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");

        navigate("/login");

    }, [navigate]);


    // ============================================================
    // FETCH ANALYTICS
    // ============================================================

    const fetchAnalytics = useCallback(async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get(
                "reminders/adherence/"
            );

            setAnalytics(
                response.data || {}
            );

        } catch (err) {

            console.error(
                "Adherence analytics error:",
                err.response?.data || err.message
            );

            if (err.response?.status === 401) {

                logoutUser();

                return;

            }

            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Unable to load adherence analytics."
            );

        } finally {

            setLoading(false);

        }

    }, [logoutUser]);


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {

        const token =
            localStorage.getItem("access");

        if (!token) {

            navigate("/login");

            return;

        }

        fetchAnalytics();

    }, [navigate, fetchAnalytics]);


    // ============================================================
    // SAFE NUMBER
    // ============================================================

    const safeNumber = (value) => {

        const number = Number(value);

        if (!Number.isFinite(number)) {

            return 0;

        }

        return number;

    };


    // ============================================================
    // CLAMP PERCENTAGE
    // ============================================================

    const clampPercentage = (value) => {

        return Math.max(
            0,
            Math.min(
                100,
                safeNumber(value)
            )
        );

    };


    // ============================================================
    // FORMAT PERCENTAGE
    // ============================================================

    const formatPercentage = (value) => {

        return `${clampPercentage(value).toFixed(1)}%`;

    };


    // ============================================================
    // FORMAT DATE
    // ============================================================

    const formatDate = (dateValue) => {

        if (!dateValue) {

            return "-";

        }

        const date = new Date(
            `${dateValue}T00:00:00`
        );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(dateValue);

        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short"
            }
        );

    };


    // ============================================================
    // ADHERENCE STATUS
    // ============================================================

    const getAdherenceStatus = (value) => {

        const percentage =
            clampPercentage(value);

        if (percentage >= 90) {

            return "Excellent";

        }

        if (percentage >= 75) {

            return "Good";

        }

        if (percentage >= 50) {

            return "Needs Improvement";

        }

        return "Poor";

    };


    // ============================================================
    // STATUS CLASS
    // ============================================================

    const getStatusClass = (value) => {

        const percentage =
            clampPercentage(value);

        if (percentage >= 90) {

            return "excellent";

        }

        if (percentage >= 75) {

            return "good";

        }

        if (percentage >= 50) {

            return "warning";

        }

        return "poor";

    };


    // ============================================================
    // STATUS MESSAGE
    // ============================================================

    const getStatusMessage = (status) => {

        switch (status) {

            case "Excellent":

                return (
                    "Excellent medication consistency. " +
                    "Keep following your schedule."
                );

            case "Good":

                return (
                    "Good progress. Keep following " +
                    "your medication schedule."
                );

            case "Needs Improvement":

                return (
                    "Try to follow your medication " +
                    "schedule more consistently."
                );

            case "Poor":

                return (
                    "Your adherence needs attention. " +
                    "Try not to miss scheduled doses."
                );

            default:

                return (
                    "Keep tracking your medication regularly."
                );

        }

    };


    // ============================================================
    // LOADING STATE
    // ============================================================

    if (loading) {

        return (
            <>
                <Navbar />

                <Sidebar />

                <main className="adherence-main">

                    <div className="adherence-loading">

                        <div className="loading-spinner"></div>

                        <h2>
                            Loading adherence analytics
                        </h2>

                        <p>
                            Calculating your medication performance...
                        </p>

                    </div>

                </main>
            </>
        );

    }


    // ============================================================
    // ERROR STATE
    // ============================================================

    if (error) {

        return (
            <>
                <Navbar />

                <Sidebar />

                <main className="adherence-main">

                    <div className="adherence-error">

                        <div className="error-icon">
                            !
                        </div>

                        <h2>
                            Unable to Load Analytics
                        </h2>

                        <p>
                            {error}
                        </p>

                        <div className="error-actions">

                            <button
                                type="button"
                                className="primary-button"
                                onClick={fetchAnalytics}
                            >
                                Try Again
                            </button>

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                    navigate("/dashboard")
                                }
                            >
                                Back to Dashboard
                            </button>

                        </div>

                    </div>

                </main>
            </>
        );

    }


    // ============================================================
    // SAFE ANALYTICS DATA
    // ============================================================

    const summary =
        analytics?.summary || {};

    const today =
        analytics?.today || {};

    const weekly =
        analytics?.weekly || {};

    const monthly =
        analytics?.monthly || {};


    const dailyTrend =
        Array.isArray(
            analytics?.daily_trend
        )
            ? analytics.daily_trend
            : [];


    const medicineAnalysis =
        Array.isArray(
            analytics?.medicine_analysis
        )
            ? analytics.medicine_analysis
            : [];


    const missedAnalysis =
        Array.isArray(
            analytics?.missed_analysis
        )
            ? analytics.missed_analysis
            : [];


    // ============================================================
    // SUMMARY VALUES
    // ============================================================

    const adherence =
        clampPercentage(
            summary.adherence
        );


    const consistency =
        clampPercentage(
            summary.consistency_score ??
            weekly.adherence
        );


    const adherenceStatus =
        summary.adherence_status ||
        getAdherenceStatus(
            adherence
        );


    const statusClass =
        getStatusClass(
            adherence
        );


    // ============================================================
    // RENDER
    // ============================================================

    return (
        <>
            <Navbar />

            <Sidebar />

            <main className="adherence-main">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <section className="adherence-header">

                    <div className="header-content">

                        <span className="page-label">
                            HEALTH ANALYTICS
                        </span>

                        <h1>
                            Medication Adherence
                        </h1>

                        <p>
                            Monitor your medication routine,
                            adherence performance and treatment
                            consistency.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="refresh-button"
                        onClick={fetchAnalytics}
                        disabled={loading}
                    >

                        <span>
                            ↻
                        </span>

                        Refresh

                    </button>

                </section>


                {/* ==================================================
                    OVERALL ADHERENCE
                ================================================== */}

                <section className="adherence-hero">

                    <div className="hero-left">

                        <div className="hero-icon">
                            ✓
                        </div>

                        <div>

                            <span className="hero-label">
                                OVERALL ADHERENCE
                            </span>

                            <div className="hero-score">
                                {formatPercentage(
                                    adherence
                                )}
                            </div>

                            <div
                                className={
                                    `status-badge ${statusClass}`
                                }
                            >
                                {adherenceStatus}
                            </div>

                            <p className="hero-message">

                                {getStatusMessage(
                                    adherenceStatus
                                )}

                            </p>

                        </div>

                    </div>


                    <div className="hero-progress">

                        <div className="circle-progress">

                            <svg
                                viewBox="0 0 120 120"
                            >

                                <circle
                                    className="circle-background"
                                    cx="60"
                                    cy="60"
                                    r="50"
                                />

                                <circle
                                    className={
                                        `circle-value ${statusClass}`
                                    }
                                    cx="60"
                                    cy="60"
                                    r="50"
                                    style={{
                                        strokeDashoffset:
                                            314 -
                                            (
                                                314 *
                                                adherence
                                            ) /
                                            100
                                    }}
                                />

                            </svg>


                            <div className="circle-text">

                                <strong>
                                    {Math.round(
                                        adherence
                                    )}%
                                </strong>

                                <span>
                                    Adherence
                                </span>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    STAT CARDS
                ================================================== */}

                <section className="stats-grid">

                    <div className="stat-card">

                        <div className="stat-icon blue">
                            ✓
                        </div>

                        <div>

                            <span>
                                Taken
                            </span>

                            <strong>
                                {summary.taken || 0}
                            </strong>

                            <small>
                                Completed doses
                            </small>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon red">
                            !
                        </div>

                        <div>

                            <span>
                                Missed
                            </span>

                            <strong>
                                {summary.missed || 0}
                            </strong>

                            <small>
                                Missed doses
                            </small>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon purple">
                            ◷
                        </div>

                        <div>

                            <span>
                                Snoozed
                            </span>

                            <strong>
                                {summary.snoozed || 0}
                            </strong>

                            <small>
                                Snoozed reminders
                            </small>

                        </div>

                    </div>


                    <div className="stat-card">

                        <div className="stat-icon green">
                            ★
                        </div>

                        <div>

                            <span>
                                Consistency
                            </span>

                            <strong>
                                {formatPercentage(
                                    consistency
                                )}
                            </strong>

                            <small>
                                Recent medication activity
                            </small>

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    PERFORMANCE OVERVIEW
                ================================================== */}

                <section className="content-section">

                    <div className="section-header">

                        <div>

                            <span>
                                PERFORMANCE
                            </span>

                            <h2>
                                Adherence Overview
                            </h2>

                        </div>

                    </div>


                    <div className="period-grid">

                        {/* TODAY */}

                        <div className="period-card">

                            <div className="period-card-header">

                                <div className="period-icon">
                                    T
                                </div>

                                <div>

                                    <span>
                                        Today
                                    </span>

                                    <small>
                                        Current day
                                    </small>

                                </div>

                            </div>


                            <strong
                                className={
                                    `period-score ${
                                        getStatusClass(
                                            today.adherence
                                        )
                                    }`
                                }
                            >

                                {formatPercentage(
                                    today.adherence
                                )}

                            </strong>


                            <p>

                                {today.taken || 0}
                                {" "}taken

                                <span>
                                    •
                                </span>

                                {today.missed || 0}
                                {" "}missed

                            </p>


                            <div className="progress-track">

                                <div
                                    className={
                                        `progress-fill ${
                                            getStatusClass(
                                                today.adherence
                                            )
                                        }`
                                    }
                                    style={{
                                        width:
                                            `${clampPercentage(
                                                today.adherence
                                            )}%`
                                    }}
                                />

                            </div>

                        </div>


                        {/* WEEKLY */}

                        <div className="period-card">

                            <div className="period-card-header">

                                <div className="period-icon">
                                    7
                                </div>

                                <div>

                                    <span>
                                        Last 7 Days
                                    </span>

                                    <small>
                                        Weekly performance
                                    </small>

                                </div>

                            </div>


                            <strong
                                className={
                                    `period-score ${
                                        getStatusClass(
                                            weekly.adherence
                                        )
                                    }`
                                }
                            >

                                {formatPercentage(
                                    weekly.adherence
                                )}

                            </strong>


                            <p>

                                {weekly.taken || 0}
                                {" "}taken

                                <span>
                                    •
                                </span>

                                {weekly.missed || 0}
                                {" "}missed

                            </p>


                            <div className="progress-track">

                                <div
                                    className={
                                        `progress-fill ${
                                            getStatusClass(
                                                weekly.adherence
                                            )
                                        }`
                                    }
                                    style={{
                                        width:
                                            `${clampPercentage(
                                                weekly.adherence
                                            )}%`
                                    }}
                                />

                            </div>

                        </div>


                        {/* MONTHLY */}

                        <div className="period-card">

                            <div className="period-card-header">

                                <div className="period-icon">
                                    30
                                </div>

                                <div>

                                    <span>
                                        Last 30 Days
                                    </span>

                                    <small>
                                        Monthly performance
                                    </small>

                                </div>

                            </div>


                            <strong
                                className={
                                    `period-score ${
                                        getStatusClass(
                                            monthly.adherence
                                        )
                                    }`
                                }
                            >

                                {formatPercentage(
                                    monthly.adherence
                                )}

                            </strong>


                            <p>

                                {monthly.taken || 0}
                                {" "}taken

                                <span>
                                    •
                                </span>

                                {monthly.missed || 0}
                                {" "}missed

                            </p>


                            <div className="progress-track">

                                <div
                                    className={
                                        `progress-fill ${
                                            getStatusClass(
                                                monthly.adherence
                                            )
                                        }`
                                    }
                                    style={{
                                        width:
                                            `${clampPercentage(
                                                monthly.adherence
                                            )}%`
                                    }}
                                />

                            </div>

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    DAILY TREND
                ================================================== */}

                <section className="content-section">

                    <div className="section-header">

                        <div>

                            <span>
                                7-DAY TREND
                            </span>

                            <h2>
                                Daily Adherence
                            </h2>

                        </div>


                        <div className="legend">

                            <span>

                                <i className="legend-dot taken"></i>

                                Taken

                            </span>


                            <span>

                                <i className="legend-dot missed"></i>

                                Missed

                            </span>

                        </div>

                    </div>


                    {dailyTrend.length === 0 ? (

                        <div className="empty-state">

                            <div className="empty-icon">
                                ◴
                            </div>

                            <h3>
                                No trend data yet
                            </h3>

                            <p>
                                Your daily adherence trend will
                                appear after medication activity
                                is recorded.
                            </p>

                        </div>

                    ) : (

                        <div className="trend-card">

                            <div className="trend-y-axis">

                                <span>
                                    100%
                                </span>

                                <span>
                                    75%
                                </span>

                                <span>
                                    50%
                                </span>

                                <span>
                                    25%
                                </span>

                                <span>
                                    0%
                                </span>

                            </div>


                            <div className="trend-area">

                                <div className="grid-lines">

                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>

                                </div>


                                <div className="trend-columns">

                                    {dailyTrend.map(
                                        (item, index) => {

                                            const value =
                                                clampPercentage(
                                                    item.adherence
                                                );

                                            return (

                                                <div
                                                    className="trend-column"
                                                    key={
                                                        item.date ||
                                                        index
                                                    }
                                                >

                                                    <div className="trend-value">

                                                        {Math.round(
                                                            value
                                                        )}%

                                                    </div>


                                                    <div className="trend-bar-area">

                                                        <div
                                                            className={
                                                                `trend-bar-fill ${
                                                                    getStatusClass(
                                                                        value
                                                                    )
                                                                }`
                                                            }
                                                            style={{
                                                                height:
                                                                    `${Math.max(
                                                                        value,
                                                                        3
                                                                    )}%`
                                                            }}
                                                        />

                                                    </div>


                                                    <span className="trend-date">

                                                        {formatDate(
                                                            item.date
                                                        )}

                                                    </span>

                                                </div>

                                            );

                                        }
                                    )}

                                </div>

                            </div>

                        </div>

                    )}

                </section>


                {/* ==================================================
                    ANALYSIS COLUMNS
                ================================================== */}

                <div className="analysis-columns">


                    {/* ==================================================
                        MEDICINE-WISE
                    ================================================== */}

                    <section className="content-section">

                        <div className="section-header">

                            <div>

                                <span>
                                    MEDICATION
                                </span>

                                <h2>
                                    Medicine-wise Adherence
                                </h2>

                            </div>

                        </div>


                        {medicineAnalysis.length === 0 ? (

                            <div className="compact-empty">

                                <span>
                                    💊
                                </span>

                                <p>
                                    No medicine records available yet.
                                </p>

                            </div>

                        ) : (

                            <div className="medicine-list">

                                {medicineAnalysis.map(
                                    (medicine, index) => {

                                        const medicineAdherence =
                                            clampPercentage(
                                                medicine.adherence
                                            );

                                        return (

                                            <div
                                                className="medicine-row"
                                                key={
                                                    medicine.medicine_id ||
                                                    index
                                                }
                                            >

                                                <div className="medicine-info">

                                                    <div className="medicine-avatar">
                                                        +
                                                    </div>

                                                    <div>

                                                        <strong>

                                                            {
                                                                medicine.medicine_name ||
                                                                medicine.name ||
                                                                "Medicine"
                                                            }

                                                        </strong>

                                                        <span>

                                                            {
                                                                medicine.taken ||
                                                                0
                                                            }
                                                            {" "}taken

                                                            {" • "}

                                                            {
                                                                medicine.missed ||
                                                                0
                                                            }
                                                            {" "}missed

                                                        </span>

                                                    </div>

                                                </div>


                                                <div className="medicine-score">

                                                    <strong
                                                        className={
                                                            getStatusClass(
                                                                medicineAdherence
                                                            )
                                                        }
                                                    >

                                                        {formatPercentage(
                                                            medicineAdherence
                                                        )}

                                                    </strong>


                                                    <div className="mini-progress">

                                                        <div
                                                            className={
                                                                getStatusClass(
                                                                    medicineAdherence
                                                                )
                                                            }
                                                            style={{
                                                                width:
                                                                    `${medicineAdherence}%`
                                                            }}
                                                        />

                                                    </div>

                                                </div>

                                            </div>

                                        );

                                    }
                                )}

                            </div>

                        )}

                    </section>


                    {/* ==================================================
                        MISSED ANALYSIS
                    ================================================== */}

                    <section className="content-section">

                        <div className="section-header">

                            <div>

                                <span>
                                    ATTENTION REQUIRED
                                </span>

                                <h2>
                                    Missed Dose Analysis
                                </h2>

                            </div>

                        </div>


                        {missedAnalysis.length === 0 ? (

                            <div className="success-state">

                                <div className="success-icon">
                                    ✓
                                </div>

                                <div>

                                    <strong>
                                        Great job!
                                    </strong>

                                    <p>
                                        No missed-dose patterns
                                        require attention.
                                    </p>

                                </div>

                            </div>

                        ) : (

                            <div className="missed-list">

                                {missedAnalysis.map(
                                    (item, index) => {

                                        const percentage =
                                            clampPercentage(
                                                item.percentage ??
                                                item.missed_percentage ??
                                                0
                                            );

                                        return (

                                            <div
                                                className="missed-row"
                                                key={
                                                    item.medicine_id ||
                                                    index
                                                }
                                            >

                                                <div className="missed-info">

                                                    <div className="missed-avatar">
                                                        !
                                                    </div>

                                                    <div>

                                                        <strong>

                                                            {
                                                                item.medicine_name ||
                                                                item.name ||
                                                                "Medicine"
                                                            }

                                                        </strong>

                                                        <span>

                                                            {
                                                                item.missed ||
                                                                0
                                                            }
                                                            {" "}missed doses

                                                        </span>

                                                    </div>

                                                </div>


                                                <div className="missed-percentage">

                                                    {formatPercentage(
                                                        percentage
                                                    )}

                                                </div>

                                            </div>

                                        );

                                    }
                                )}

                            </div>

                        )}

                    </section>

                </div>


                {/* ==================================================
                    FOOTER
                ================================================== */}

                <section className="adherence-footer">

                    <div>

                        <strong>
                            Keep your medication routine on track.
                        </strong>

                        <p>
                            Review your medication history for
                            detailed dose records.
                        </p>

                    </div>


                    <div className="footer-actions">

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                                navigate(
                                    "/medication-history"
                                )
                            }
                        >
                            View Medication History
                        </button>


                        <button
                            type="button"
                            className="primary-button"
                            onClick={() =>
                                navigate(
                                    "/dashboard"
                                )
                            }
                        >
                            Back to Dashboard
                        </button>

                    </div>

                </section>

            </main>
        </>
    );

}


export default Adherence;
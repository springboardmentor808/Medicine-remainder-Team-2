import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";

import "./RefillAnalytics.css";


function RefillAnalytics() {

    const navigate = useNavigate();

    const [analytics, setAnalytics] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // ============================================================
    // LOAD REFILL ANALYTICS
    // ============================================================

    const loadAnalytics = async () => {

        try {

            setLoading(true);

            setError("");

            const response = await api.get(
                "refill/analytics/"
            );

            setAnalytics(
                response.data
            );

        } catch (err) {

            console.error(
                "Refill analytics error:",
                err
            );

            if (
                err.response?.status === 401
            ) {

                navigate("/login");

                return;
            }

            setError(
                err.response?.data?.error ||
                "Unable to load refill analytics."
            );

        } finally {

            setLoading(false);
        }
    };


    // ============================================================
    // LOAD ON PAGE OPEN
    // ============================================================

    useEffect(() => {

        loadAnalytics();

    }, []);


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <div className="refill-analytics-page">

                <div className="analytics-loading">

                    <div className="analytics-loading-icon">
                        🔄
                    </div>

                    <h2>
                        Loading Refill Analytics
                    </h2>

                    <p>
                        Please wait while your refill data is loaded.
                    </p>

                </div>

            </div>

        );
    }


    // ============================================================
    // ERROR
    // ============================================================

    if (error) {

        return (

            <div className="refill-analytics-page">

                <div className="analytics-error">

                    <div className="analytics-error-icon">
                        ⚠️
                    </div>

                    <h2>
                        Unable to Load Analytics
                    </h2>

                    <p>
                        {error}
                    </p>

                    <div className="analytics-error-actions">

                        <button
                            className="analytics-retry-button"
                            onClick={loadAnalytics}
                        >
                            Try Again
                        </button>

                        <button
                            className="analytics-back-button"
                            onClick={() =>
                                navigate("/refill")
                            }
                        >
                            ← Back to Refill
                        </button>

                    </div>

                </div>

            </div>

        );
    }


    // ============================================================
    // SAFE DATA
    // ============================================================

    const summary =
        analytics?.summary || {};


    const medicineAnalysis =
        analytics?.medicine_analysis || [];


    // ============================================================
    // SUMMARY VALUES
    // ============================================================

    const totalMedicines =
        summary.total_medicines || 0;


    const sufficientStock =
        summary.sufficient_stock || 0;


    const lowStock =
        summary.low_stock || 0;


    const outOfStock =
        summary.out_of_stock || 0;


    const totalRefills =
        summary.total_refills || 0;


    const totalQuantityAdded =
        summary.total_quantity_added || 0;


    const uniqueMedicines =
        summary.unique_medicines_refilled || 0;


    const mostRefilledMedicine =
        summary.most_refilled_medicine;


    // ============================================================
    // FORMAT DATE
    // ============================================================

    const formatDate = (value) => {

        if (!value) {
            return "—";
        }

        try {

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return value;
            }

            return date.toLocaleDateString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );

        } catch {

            return value;

        }
    };


    // ============================================================
    // GET STATUS CLASS
    // ============================================================

    const getStatusClass = (status) => {

        if (status === "Sufficient Stock") {
            return "sufficient";
        }

        if (status === "Low Stock") {
            return "low";
        }

        if (status === "Out of Stock") {
            return "out";
        }

        return "unknown";
    };


    // ============================================================
    // GET STATUS ICON
    // ============================================================

    const getStatusIcon = (status) => {

        if (status === "Sufficient Stock") {
            return "✓";
        }

        if (status === "Low Stock") {
            return "!";
        }

        if (status === "Out of Stock") {
            return "×";
        }

        return "?";
    };


    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="refill-analytics-page">


            {/* ====================================================
                HEADER
            ==================================================== */}

            <div className="refill-analytics-header">

                <div className="analytics-header-content">

                    <div className="analytics-brand">
                        PILLSYNC
                    </div>

                    <h1>
                        Refill Analytics
                    </h1>

                    <p>
                        Monitor your medicine refill activity,
                        stock status and replenishment history.
                    </p>

                </div>


                <div className="analytics-header-actions">

                    <button
                        className="analytics-refresh-button"
                        onClick={loadAnalytics}
                    >
                        ↻ Refresh
                    </button>

                    <button
                        className="analytics-dashboard-button"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        ← Dashboard
                    </button>

                </div>

            </div>


            {/* ====================================================
                TOP SUMMARY CARDS
            ==================================================== */}

            <div className="analytics-summary-grid">


                {/* TOTAL MEDICINES */}

                <div className="analytics-summary-card">

                    <div className="summary-card-icon">
                        💊
                    </div>

                    <div className="summary-card-content">

                        <span className="summary-card-label">
                            Total Medicines
                        </span>

                        <strong className="summary-card-value">
                            {totalMedicines}
                        </strong>

                        <span className="summary-card-description">
                            Medicines currently tracked
                        </span>

                    </div>

                </div>


                {/* TOTAL REFILLS */}

                <div className="analytics-summary-card">

                    <div className="summary-card-icon">
                        🔄
                    </div>

                    <div className="summary-card-content">

                        <span className="summary-card-label">
                            Total Refills
                        </span>

                        <strong className="summary-card-value">
                            {totalRefills}
                        </strong>

                        <span className="summary-card-description">
                            Recorded refill transactions
                        </span>

                    </div>

                </div>


                {/* UNITS ADDED */}

                <div className="analytics-summary-card">

                    <div className="summary-card-icon">
                        📦
                    </div>

                    <div className="summary-card-content">

                        <span className="summary-card-label">
                            Units Added
                        </span>

                        <strong className="summary-card-value">
                            {totalQuantityAdded}
                        </strong>

                        <span className="summary-card-description">
                            Total medicine units added
                        </span>

                    </div>

                </div>


                {/* MOST REFILLED */}

                <div className="analytics-summary-card">

                    <div className="summary-card-icon">
                        ⭐
                    </div>

                    <div className="summary-card-content">

                        <span className="summary-card-label">
                            Most Refilled
                        </span>

                        <strong className="summary-card-medicine">

                            {mostRefilledMedicine
                                ? mostRefilledMedicine.medicine_name
                                : "—"}

                        </strong>

                        <span className="summary-card-description">

                            {mostRefilledMedicine
                                ? `${mostRefilledMedicine.refill_count} refill(s)`
                                : "No refill records yet"}

                        </span>

                    </div>

                </div>

            </div>


            {/* ====================================================
                STOCK STATUS
            ==================================================== */}

            <div className="stock-status-grid">


                {/* SUFFICIENT STOCK */}

                <div className="stock-status-card sufficient">

                    <div className="stock-status-icon">
                        ✓
                    </div>

                    <div className="stock-status-content">

                        <span>
                            Sufficient Stock
                        </span>

                        <strong>
                            {sufficientStock}
                        </strong>

                        <small>
                            Medicines with sufficient supply
                        </small>

                    </div>

                </div>


                {/* LOW STOCK */}

                <div className="stock-status-card low">

                    <div className="stock-status-icon">
                        !
                    </div>

                    <div className="stock-status-content">

                        <span>
                            Low Stock
                        </span>

                        <strong>
                            {lowStock}
                        </strong>

                        <small>
                            Medicines requiring refill
                        </small>

                    </div>

                </div>


                {/* OUT OF STOCK */}

                <div className="stock-status-card out">

                    <div className="stock-status-icon">
                        ×
                    </div>

                    <div className="stock-status-content">

                        <span>
                            Out of Stock
                        </span>

                        <strong>
                            {outOfStock}
                        </strong>

                        <small>
                            Medicines with no remaining stock
                        </small>

                    </div>

                </div>

            </div>


            {/* ====================================================
                REFILL OVERVIEW
            ==================================================== */}

            <div className="analytics-section">

                <div className="analytics-section-header">

                    <div>

                        <h2>
                            Refill Overview
                        </h2>

                        <p>
                            Summary of your medicine replenishment activity.
                        </p>

                    </div>

                </div>


                <div className="overview-grid">


                    <div className="overview-item">

                        <span>
                            Total Refill Transactions
                        </span>

                        <strong>
                            {totalRefills}
                        </strong>

                    </div>


                    <div className="overview-item">

                        <span>
                            Total Units Added
                        </span>

                        <strong>
                            {totalQuantityAdded}
                        </strong>

                    </div>


                    <div className="overview-item">

                        <span>
                            Unique Medicines
                        </span>

                        <strong>
                            {uniqueMedicines}
                        </strong>

                    </div>


                    <div className="overview-item">

                        <span>
                            Average Units / Refill
                        </span>

                        <strong>

                            {totalRefills > 0
                                ? (
                                    totalQuantityAdded /
                                    totalRefills
                                ).toFixed(2)
                                : "0.00"}

                        </strong>

                    </div>

                </div>

            </div>


            {/* ====================================================
                MEDICINE-WISE ANALYSIS
            ==================================================== */}

            <div className="analytics-section">

                <div className="analytics-section-header">

                    <div>

                        <h2>
                            Medicine-wise Refill Analysis
                        </h2>

                        <p>
                            Detailed refill activity and current
                            stock status for each medicine.
                        </p>

                    </div>

                </div>


                {medicineAnalysis.length === 0 ? (

                    <div className="analytics-empty">

                        <div className="analytics-empty-icon">
                            💊
                        </div>

                        <h3>
                            No medicines available
                        </h3>

                        <p>
                            Add a medicine to start tracking
                            refill analytics.
                        </p>

                    </div>

                ) : (

                    <div className="medicine-analysis-grid">

                        {medicineAnalysis.map(
                            (medicine) => {

                                const statusClass =
                                    getStatusClass(
                                        medicine.stock_status
                                    );

                                return (

                                    <div
                                        className="medicine-analysis-card"
                                        key={medicine.medicine_id}
                                    >


                                        {/* =================================
                                            MEDICINE HEADER
                                        ================================= */}

                                        <div className="medicine-analysis-top">

                                            <div className="medicine-analysis-icon">
                                                💊
                                            </div>

                                            <div className="medicine-analysis-name">

                                                <h3>
                                                    {
                                                        medicine.medicine_name
                                                    }
                                                </h3>

                                                <span>
                                                    Medicine
                                                </span>

                                            </div>


                                            {/* STOCK STATUS BADGE */}

                                            <div
                                                className={
                                                    `medicine-stock-badge ${statusClass}`
                                                }
                                            >

                                                <span>
                                                    {getStatusIcon(
                                                        medicine.stock_status
                                                    )}
                                                </span>

                                                {
                                                    medicine.stock_status
                                                    || "Unknown"
                                                }

                                            </div>

                                        </div>


                                        {/* =================================
                                            CURRENT STOCK
                                        ================================= */}

                                        <div className="current-stock-box">

                                            <div>

                                                <span>
                                                    Current Stock
                                                </span>

                                                <strong>
                                                    {
                                                        medicine.current_stock
                                                    }
                                                    <small>
                                                        {" "}units
                                                    </small>
                                                </strong>

                                            </div>


                                            <div>

                                                <span>
                                                    Daily Consumption
                                                </span>

                                                <strong>
                                                    {
                                                        medicine.daily_consumption
                                                    }
                                                    <small>
                                                        {" "}units/day
                                                    </small>
                                                </strong>

                                            </div>

                                        </div>


                                        {/* =================================
                                            PREDICTION STATS
                                        ================================= */}

                                        <div className="medicine-analysis-stats">


                                            <div className="medicine-stat">

                                                <span>
                                                    Remaining Days
                                                </span>

                                                <strong>
                                                    {
                                                        medicine.remaining_days
                                                    }
                                                </strong>

                                            </div>


                                            <div className="medicine-stat">

                                                <span>
                                                    Refills
                                                </span>

                                                <strong>
                                                    {
                                                        medicine.refill_count
                                                    }
                                                </strong>

                                            </div>


                                            <div className="medicine-stat">

                                                <span>
                                                    Units Added
                                                </span>

                                                <strong>
                                                    {
                                                        medicine.total_quantity_added
                                                    }
                                                </strong>

                                            </div>


                                            <div className="medicine-stat">

                                                <span>
                                                    Warning Period
                                                </span>

                                                <strong>
                                                    5
                                                    <small>
                                                        {" "}days
                                                    </small>
                                                </strong>

                                            </div>

                                        </div>


                                        {/* =================================
                                            DATES
                                        ================================= */}

                                        <div className="medicine-dates">


                                            <div className="medicine-date-row">

                                                <span>
                                                    Estimated Depletion
                                                </span>

                                                <strong>
                                                    {
                                                        formatDate(
                                                            medicine.depletion_date
                                                        )
                                                    }
                                                </strong>

                                            </div>


                                            <div className="medicine-date-row">

                                                <span>
                                                    Recommended Refill
                                                </span>

                                                <strong>
                                                    {
                                                        formatDate(
                                                            medicine.recommended_refill_date
                                                        )
                                                    }
                                                </strong>

                                            </div>


                                            <div className="medicine-date-row">

                                                <span>
                                                    Last Refill
                                                </span>

                                                <strong>
                                                    {
                                                        formatDate(
                                                            medicine.last_refill_date
                                                        )
                                                    }
                                                </strong>

                                            </div>

                                        </div>


                                        {/* =================================
                                            REFILL ACTIVITY
                                        ================================= */}

                                        <div className="refill-activity">

                                            <div className="activity-label">

                                                <span>
                                                    Refill Activity
                                                </span>

                                                <strong>
                                                    {
                                                        medicine.refill_count
                                                    }
                                                </strong>

                                            </div>


                                            <div className="activity-bar">

                                                <div
                                                    className="activity-fill"
                                                    style={{
                                                        width:
                                                            totalRefills > 0
                                                                ? `${Math.min(
                                                                    100,
                                                                    (
                                                                        medicine.refill_count /
                                                                        totalRefills
                                                                    ) * 100
                                                                )}%`
                                                                : "0%"
                                                    }}
                                                />

                                            </div>

                                        </div>


                                        {/* =================================
                                            STATUS MESSAGE
                                        ================================= */}

                                        <div
                                            className={
                                                `stock-message ${statusClass}`
                                            }
                                        >

                                            {
                                                medicine.stock_status ===
                                                "Out of Stock"
                                                    ? "Medicine is out of stock. Refill required immediately."
                                                    : medicine.stock_status ===
                                                        "Low Stock"
                                                        ? "Medicine stock is running low. Please arrange a refill."
                                                        : medicine.stock_status ===
                                                            "Sufficient Stock"
                                                            ? "Medicine stock is sufficient."
                                                            : "Stock status unavailable."
                                            }

                                        </div>

                                    </div>

                                );

                            }
                        )}

                    </div>

                )}

            </div>


            {/* ====================================================
                ACTIONS
            ==================================================== */}

            <div className="analytics-bottom-actions">

                <button
                    className="secondary-action"
                    onClick={() =>
                        navigate("/refill")
                    }
                >
                    ← Refill Management
                </button>

                <button
                    className="primary-action"
                    onClick={() =>
                        navigate("/refill")
                    }
                >
                    + Add Refill
                </button>

            </div>


        </div>

    );
}


export default RefillAnalytics;
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import "./Refill.css";


function Refill() {

    const navigate = useNavigate();

    const [medicines, setMedicines] = useState([]);
    const [predictions, setPredictions] = useState({});
    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [selectedMedicine, setSelectedMedicine] = useState(null);

    const [quantityAdded, setQuantityAdded] = useState("");
    const [notes, setNotes] = useState("");

    const [updating, setUpdating] = useState(false);


    // ========================================================
    // LOAD MEDICINES
    // ========================================================

    const loadMedicines = async () => {

        try {

            const response = await api.get(
                "medicines/"
            );

            const medicineList =
                Array.isArray(response.data)
                    ? response.data
                    : response.data.results || [];

            setMedicines(medicineList);

        } catch (err) {

            console.error(
                "Medicine loading error:",
                err
            );

            if (err.response?.status === 401) {

                localStorage.removeItem("access");
                localStorage.removeItem("refresh");

                navigate("/login");

                return;
            }

            setError(
                "Unable to load medicines."
            );
        }
    };


    // ========================================================
    // LOAD REFILL HISTORY
    // ========================================================

    const loadHistory = async () => {

        try {

            const response = await api.get(
                "refill/history/"
            );

            setHistory(
                response.data?.history || []
            );

        } catch (err) {

            console.error(
                "Refill history error:",
                err
            );

            if (err.response?.status === 401) {

                localStorage.removeItem("access");
                localStorage.removeItem("refresh");

                navigate("/login");
            }
        }
    };


    // ========================================================
    // LOAD REFILL PREDICTION
    // ========================================================

    const loadPrediction = async (medicineId) => {

        try {

            const response = await api.get(
                `refill/${medicineId}/`
            );

            setPredictions(
                previous => ({
                    ...previous,
                    [medicineId]:
                        response.data
                })
            );

        } catch (err) {

            console.error(
                "Refill prediction error:",
                err
            );

            if (err.response?.status === 401) {

                localStorage.removeItem("access");
                localStorage.removeItem("refresh");

                navigate("/login");
            }
        }
    };


    // ========================================================
    // LOAD ALL DATA
    // ========================================================

    const loadData = async () => {

        setLoading(true);
        setError("");

        await loadMedicines();
        await loadHistory();

        setLoading(false);
    };


    useEffect(() => {

        const token =
            localStorage.getItem("access");

        if (!token) {

            navigate("/login");

            return;
        }

        loadData();

    }, []);


    // ========================================================
    // LOAD PREDICTIONS AFTER MEDICINES LOAD
    // ========================================================

    useEffect(() => {

        if (!medicines.length) {
            return;
        }

        medicines.forEach(
            medicine => {
                loadPrediction(
                    medicine.id
                );
            }
        );

    }, [medicines]);


    // ========================================================
    // OPEN REFILL FORM
    // ========================================================

    const openRefillForm = (medicine) => {

        setSelectedMedicine(
            medicine
        );

        setQuantityAdded("");
        setNotes("");
        setMessage("");
        setError("");
    };


    // ========================================================
    // CLOSE REFILL FORM
    // ========================================================

    const closeRefillForm = () => {

        setSelectedMedicine(null);
        setQuantityAdded("");
        setNotes("");
    };


    // ========================================================
    // SUBMIT REFILL
    // ========================================================

    const handleRefill = async (event) => {

        event.preventDefault();

        if (!selectedMedicine) {
            return;
        }

        if (!quantityAdded) {

            setError(
                "Please enter the quantity added."
            );

            return;
        }

        const quantity =
            Number(quantityAdded);

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            setError(
                "Quantity must be a positive whole number."
            );

            return;
        }

        setUpdating(true);
        setError("");
        setMessage("");

        try {

            const response = await api.post(
                `refill/${selectedMedicine.id}/update-stock/`,
                {
                    quantity_added: quantity,
                    notes: notes.trim(),
                }
            );

            setMessage(
                response.data?.message ||
                "Medicine stock updated successfully."
            );

            // Refresh prediction immediately
            if (response.data?.prediction) {

                setPredictions(
                    previous => ({
                        ...previous,
                        [selectedMedicine.id]: {
                            medicine:
                                selectedMedicine,
                            prediction:
                                response.data.prediction,
                            message:
                                response.data.prediction.message,
                        },
                    })
                );
            }

            setSelectedMedicine(null);
            setQuantityAdded("");
            setNotes("");

            await loadMedicines();
            await loadHistory();

        } catch (err) {

            console.error(
                "Refill update error:",
                err
            );

            if (err.response?.status === 401) {

                localStorage.removeItem("access");
                localStorage.removeItem("refresh");

                navigate("/login");

                return;
            }

            setError(
                err.response?.data?.error ||
                "Unable to update medicine stock."
            );

        } finally {

            setUpdating(false);
        }
    };


    // ========================================================
    // FORMAT DATE
    // ========================================================

    const formatDate = (value) => {

        if (!value) {
            return "—";
        }

        try {

            return new Date(
                value
            ).toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                }
            );

        } catch {

            return "—";
        }
    };


    // ========================================================
    // STOCK STATUS CLASS
    // ========================================================

    const getStatusClass = (statusValue) => {

        if (
            statusValue ===
            "Out of Stock"
        ) {
            return "danger";
        }

        if (
            statusValue ===
            "Low Stock"
        ) {
            return "warning";
        }

        return "success";
    };


    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (
            <>
                <Navbar />
                <Sidebar />

                <main className="refill-main">

                    <div className="refill-loading">

                        <div className="loading-spinner"></div>

                        <p>
                            Loading refill information...
                        </p>

                    </div>

                </main>
            </>
        );
    }


    // ========================================================
    // UI
    // ========================================================

    return (
        <>
            <Navbar />
            <Sidebar />

            <main className="refill-main">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <section className="refill-header">

                    <div>

                        <span className="section-label">
                            MEDICATION MANAGEMENT
                        </span>

                        <h1>
                            Refill Management
                        </h1>

                        <p>
                            Track medicine stock,
                            predict depletion dates,
                            and manage refills.
                        </p>

                    </div>

                    <button
                        className="dashboard-btn"
                        onClick={() =>
                            navigate("/dashboard")
                        }
                    >
                        ← Dashboard
                    </button>

                </section>


                {/* ==================================================
                    MESSAGES
                ================================================== */}

                {message && (

                    <div className="success-message">
                        ✓ {message}
                    </div>

                )}

                {error && (

                    <div className="error-message">
                        ⚠ {error}
                    </div>

                )}


                {/* ==================================================
                    MEDICINE CARDS
                ================================================== */}

                <section className="refill-section">

                    <div className="section-heading">

                        <div>

                            <h2>
                                Medicine Stock
                            </h2>

                            <p>
                                Current stock and refill
                                predictions
                            </p>

                        </div>

                    </div>


                    {medicines.length === 0 ? (

                        <div className="empty-state">

                            <div className="empty-icon">
                                💊
                            </div>

                            <h3>
                                No medicines found
                            </h3>

                            <p>
                                Add a medicine to start
                                tracking refill information.
                            </p>

                            <button
                                onClick={() =>
                                    navigate("/add-medicine")
                                }
                            >
                                Add Medicine
                            </button>

                        </div>

                    ) : (

                        <div className="refill-grid">

                            {medicines.map(
                                medicine => {

                                    const data =
                                        predictions[
                                            medicine.id
                                        ];

                                    const prediction =
                                        data?.prediction;

                                    const stockStatus =
                                        prediction?.stock_status ||
                                        "Calculating...";

                                    return (

                                        <article
                                            className="refill-card"
                                            key={medicine.id}
                                        >

                                            <div className="refill-card-top">

                                                <div>

                                                    <span className="medicine-tag">
                                                        MEDICINE
                                                    </span>

                                                    <h3>
                                                        {
                                                            medicine.medicine_name
                                                        }
                                                    </h3>

                                                </div>

                                                {prediction && (

                                                    <span
                                                        className={`stock-badge ${getStatusClass(
                                                            stockStatus
                                                        )}`}
                                                    >
                                                        {stockStatus}
                                                    </span>

                                                )}

                                            </div>


                                            <div className="medicine-details">

                                                <div>
                                                    <span>
                                                        Dosage
                                                    </span>

                                                    <strong>
                                                        {
                                                            medicine.dosage ||
                                                            "—"
                                                        }
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        Frequency
                                                    </span>

                                                    <strong>
                                                        {
                                                            medicine.frequency ||
                                                            "—"
                                                        }
                                                    </strong>
                                                </div>

                                            </div>


                                            {prediction ? (

                                                <div className="prediction-grid">

                                                    <div className="prediction-item">

                                                        <span>
                                                            Remaining Stock
                                                        </span>

                                                        <strong>
                                                            {
                                                                prediction.remaining_stock
                                                            }
                                                        </strong>

                                                        <small>
                                                            units
                                                        </small>

                                                    </div>


                                                    <div className="prediction-item">

                                                        <span>
                                                            Daily Usage
                                                        </span>

                                                        <strong>
                                                            {
                                                                prediction.daily_consumption
                                                            }
                                                        </strong>

                                                        <small>
                                                            units/day
                                                        </small>

                                                    </div>


                                                    <div className="prediction-item">

                                                        <span>
                                                            Remaining Days
                                                        </span>

                                                        <strong>
                                                            {
                                                                prediction.estimated_remaining_days
                                                            }
                                                        </strong>

                                                        <small>
                                                            days
                                                        </small>

                                                    </div>


                                                    <div className="prediction-item">

                                                        <span>
                                                            Refill Date
                                                        </span>

                                                        <strong>
                                                            {
                                                                formatDate(
                                                                    prediction.recommended_refill_date
                                                                )
                                                            }
                                                        </strong>

                                                    </div>

                                                </div>

                                            ) : (

                                                <div className="prediction-loading">
                                                    Calculating prediction...
                                                </div>

                                            )}


                                            {prediction && (

                                                <div className="depletion-info">

                                                    <span>
                                                        Estimated depletion
                                                    </span>

                                                    <strong>
                                                        {
                                                            formatDate(
                                                                prediction.estimated_depletion_date
                                                            )
                                                        }
                                                    </strong>

                                                </div>

                                            )}


                                            <button
                                                className="refill-button"
                                                onClick={() =>
                                                    openRefillForm(
                                                        medicine
                                                    )
                                                }
                                            >
                                                + Add Refill
                                            </button>

                                        </article>

                                    );
                                }
                            )}

                        </div>

                    )}

                </section>


                {/* ==================================================
                    REFILL HISTORY
                ================================================== */}

                <section className="refill-section">

                    <div className="section-heading">

                        <div>

                            <h2>
                                Refill History
                            </h2>

                            <p>
                                Previous medicine stock
                                additions
                            </p>

                        </div>

                    </div>


                    {history.length === 0 ? (

                        <div className="empty-history">
                            No refill records yet.
                        </div>

                    ) : (

                        <div className="history-table-wrapper">

                            <table className="history-table">

                                <thead>

                                    <tr>
                                        <th>Medicine</th>
                                        <th>Added</th>
                                        <th>Before</th>
                                        <th>After</th>
                                        <th>Date</th>
                                        <th>Notes</th>
                                    </tr>

                                </thead>

                                <tbody>

                                    {history.map(
                                        record => (

                                            <tr key={record.id}>

                                                <td>
                                                    <strong>
                                                        {
                                                            record.medicine_name
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    +{
                                                        record.quantity_added
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        record.stock_before
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        record.stock_after
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        formatDate(
                                                            record.refill_date
                                                        )
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        record.notes ||
                                                        "—"
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </section>


                {/* ==================================================
                    REFILL MODAL
                ================================================== */}

                {selectedMedicine && (

                    <div
                        className="refill-modal-overlay"
                        onClick={closeRefillForm}
                    >

                        <div
                            className="refill-modal"
                            onClick={event =>
                                event.stopPropagation()
                            }
                        >

                            <div className="modal-header">

                                <div>

                                    <span>
                                        REFILL MEDICINE
                                    </span>

                                    <h2>
                                        {
                                            selectedMedicine.medicine_name
                                        }
                                    </h2>

                                </div>

                                <button
                                    className="modal-close"
                                    onClick={
                                        closeRefillForm
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            <form
                                onSubmit={
                                    handleRefill
                                }
                            >

                                <label>
                                    Quantity Added
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={
                                        quantityAdded
                                    }
                                    onChange={event =>
                                        setQuantityAdded(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter quantity"
                                    required
                                />


                                <label>
                                    Notes
                                </label>

                                <textarea
                                    value={notes}
                                    onChange={event =>
                                        setNotes(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Optional refill notes"
                                    rows="4"
                                />


                                <div className="modal-actions">

                                    <button
                                        type="button"
                                        className="cancel-button"
                                        onClick={
                                            closeRefillForm
                                        }
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="confirm-refill-button"
                                        disabled={
                                            updating
                                        }
                                    >
                                        {updating
                                            ? "Updating..."
                                            : "Confirm Refill"}
                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                )}

            </main>
        </>
    );
}


export default Refill;
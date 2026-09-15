import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../api/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import "./MedicineDetails.css";


function MedicineDetails() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [medicine, setMedicine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {

        const token = localStorage.getItem("access");

        if (!token) {
            navigate("/login");
            return;
        }

        loadMedicine();

    }, [id]);


    const loadMedicine = async () => {

        try {

            setLoading(true);

            const response = await api.get(
                `medicines/${id}/`
            );

            setMedicine(response.data);

        } catch (err) {

            console.error(
                "Medicine error:",
                err.response?.data || err.message
            );

            if (err.response?.status === 401) {

                localStorage.clear();

                navigate("/login");

                return;

            }

            setError("Unable to load medicine.");

        } finally {

            setLoading(false);

        }

    };


    if (loading) {

        return (
            <>
                <Navbar />
                <Sidebar />

                <main className="medicine-details-page">

                    <div className="details-message">

                        <div className="details-message-icon">
                            ⏳
                        </div>

                        <h2>
                            Loading Medicine...
                        </h2>

                    </div>

                </main>
            </>
        );

    }


    if (error || !medicine) {

        return (
            <>
                <Navbar />
                <Sidebar />

                <main className="medicine-details-page">

                    <div className="details-message">

                        <div className="details-message-icon">
                            ⚠️
                        </div>

                        <h2>
                            Medicine Not Found
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            className="back-btn"
                            onClick={() => navigate("/medicines")}
                        >
                            ← Back to Medicines
                        </button>

                    </div>

                </main>
            </>
        );

    }


    return (
        <>
            <Navbar />
            <Sidebar />

            <main className="medicine-details-page">

                <div className="details-topbar">

                    <button
                        type="button"
                        className="back-btn"
                        onClick={() => navigate("/medicines")}
                    >
                        ← Back to Medicines
                    </button>

                </div>


                <div className="details-header">

                    <div className="details-main-icon">
                        💊
                    </div>

                    <div className="details-heading">

                        <h1>
                            {medicine.medicine_name}
                        </h1>

                        <p>
                            {medicine.dosage || "Dosage not specified"}
                        </p>

                    </div>

                </div>


                <div className="details-card">

                    <div className="details-card-title">

                        <div>

                            <h2>
                                Medicine Information
                            </h2>

                            <p>
                                Complete medication details
                            </p>

                        </div>

                        <span>
                            ID #{medicine.id}
                        </span>

                    </div>


                    <div className="details-grid">


                        <div className="detail-item">

                            <div className="detail-icon quantity">
                                📦
                            </div>

                            <div className="detail-text">

                                <span>
                                    Quantity
                                </span>

                                <strong>
                                    {medicine.quantity}
                                </strong>

                            </div>

                        </div>


                        <div className="detail-item">

                            <div className="detail-icon frequency">
                                🔄
                            </div>

                            <div className="detail-text">

                                <span>
                                    Frequency
                                </span>

                                <strong>
                                    {medicine.frequency || "Not specified"}
                                </strong>

                            </div>

                        </div>


                        <div className="detail-item">

                            <div className="detail-icon date">
                                📅
                            </div>

                            <div className="detail-text">

                                <span>
                                    Start Date
                                </span>

                                <strong>
                                    {medicine.start_date || "Not available"}
                                </strong>

                            </div>

                        </div>


                        <div className="detail-item">

                            <div className="detail-icon date">
                                📅
                            </div>

                            <div className="detail-text">

                                <span>
                                    End Date
                                </span>

                                <strong>
                                    {medicine.end_date || "Not available"}
                                </strong>

                            </div>

                        </div>


                        <div className="detail-item">

                            <div className="detail-icon reminder">
                                ⏰
                            </div>

                            <div className="detail-text">

                                <span>
                                    Reminder Time
                                </span>

                                <strong>
                                    {medicine.reminder_time || "Not set"}
                                </strong>

                            </div>

                        </div>


                        <div className="detail-item">

                            <div className="detail-icon status">
                                🔔
                            </div>

                            <div className="detail-text">

                                <span>
                                    Reminder Status
                                </span>

                                <strong>
                                    {medicine.reminder_enabled
                                        ? "Enabled"
                                        : "Disabled"}
                                </strong>

                            </div>

                        </div>


                        <div className="detail-item">

                            <div className="detail-icon condition">
                                🩺
                            </div>

                            <div className="detail-text">

                                <span>
                                    Disease / Condition
                                </span>

                                <strong>
                                    {medicine.condition_name || "Not Assigned"}
                                </strong>

                            </div>

                        </div>


                        <div className="detail-item">

                            <div className="detail-icon created">
                                🕒
                            </div>

                            <div className="detail-text">

                                <span>
                                    Added On
                                </span>

                                <strong>
                                    {medicine.created_at
                                        ? new Date(
                                            medicine.created_at
                                        ).toLocaleDateString()
                                        : "Not available"}
                                </strong>

                            </div>

                        </div>

                    </div>


                    <div className="details-actions">

                        <button
                            type="button"
                            className="edit-medicine-btn"
                            onClick={() =>
                                navigate(
                                    `/edit-medicine/${medicine.id}`
                                )
                            }
                        >
                            ✏️ Edit Medicine
                        </button>


                        <button
                            type="button"
                            className="back-list-btn"
                            onClick={() => navigate("/medicines")}
                        >
                            💊 Medicine List
                        </button>

                    </div>

                </div>

            </main>
        </>
    );

}


export default MedicineDetails;
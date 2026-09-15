import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import "./CaregiverPatients.css";


function CaregiverPatients() {

    const navigate = useNavigate();

    const [patients, setPatients] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");


    // ============================================================
    // LOAD ASSIGNED PATIENTS
    // ============================================================

    useEffect(() => {

        const token = localStorage.getItem("access");

        if (!token) {

            navigate("/login");

            return;

        }

        fetchPatients();

    }, [navigate]);


    // ============================================================
    // FETCH PATIENTS
    // ============================================================

    const fetchPatients = async () => {

        setLoading(true);

        setError("");


        try {

            const response = await api.get(
                "accounts/caregiver/assigned-patients/"
            );


            const patientList =
                Array.isArray(response.data?.patients)
                    ? response.data.patients
                    : [];


            setPatients(patientList);

        }

        catch (error) {

            console.error(
                "Assigned patients error:",
                error.response?.data ||
                error.message
            );


            if (error.response?.status === 401) {

                localStorage.removeItem("access");

                localStorage.removeItem("refresh");

                navigate("/login");

                return;

            }


            if (error.response?.status === 403) {

                setError(
                    "Caregiver access is required to view assigned patients."
                );

                return;

            }


            setError(
                error.response?.data?.error ||
                error.response?.data?.detail ||
                "Unable to load assigned patients."
            );

        }

        finally {

            setLoading(false);

        }

    };


    // ============================================================
    // VIEW PATIENT
    // ============================================================

    const viewPatient = (patientId) => {

        if (!patientId) {

            alert(
                "Patient ID is not available."
            );

            return;

        }


        navigate(
            `/caregiver/patient/${patientId}`
        );

    };


    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {

        return (

            <>

                <Navbar />

                <Sidebar />


                <main style={mainStyle}>

                    <div style={loadingStyle}>

                        <div style={loadingIconStyle}>
                            ⏳
                        </div>

                        <h2>
                            Loading Assigned Patients
                        </h2>

                        <p>
                            Please wait while we load your patients.
                        </p>

                    </div>

                </main>

            </>

        );

    }


    // ============================================================
    // PAGE
    // ============================================================

    return (

        <>

            <Navbar />

            <Sidebar />


            <main style={mainStyle}>

                <div style={containerStyle}>


                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <div style={headerStyle}>

                        <div>

                            <div style={eyebrowStyle}>
                                CAREGIVER PORTAL
                            </div>

                            <h1 style={titleStyle}>
                                👥 My Patients
                            </h1>

                            <p style={subtitleStyle}>
                                View and manage your assigned patient
                                profiles.
                            </p>

                        </div>


                        <button
                            type="button"
                            onClick={() =>
                                navigate("/dashboard")
                            }
                            style={backButton}
                        >
                            ← Dashboard
                        </button>

                    </div>


                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (

                        <div style={errorStyle}>

                            <strong>
                                ⚠️ Unable to load patients
                            </strong>

                            <p>
                                {error}
                            </p>


                            <button
                                type="button"
                                onClick={fetchPatients}
                                style={retryButton}
                            >
                                Try Again
                            </button>

                        </div>

                    )}


                    {/* =================================================
                        PATIENT COUNT
                    ================================================= */}

                    {!error && (

                        <div style={countCardStyle}>

                            <div style={countIconStyle}>
                                👥
                            </div>


                            <div>

                                <div style={countNumberStyle}>
                                    {patients.length}
                                </div>

                                <div style={countTextStyle}>

                                    Assigned Patient
                                    {patients.length !== 1
                                        ? "s"
                                        : ""}

                                </div>

                            </div>

                        </div>

                    )}


                    {/* =================================================
                        NO PATIENTS
                    ================================================= */}

                    {!error &&
                    patients.length === 0 && (

                        <div style={emptyStyle}>

                            <div style={emptyIconStyle}>
                                👤
                            </div>

                            <h2>
                                No Patients Assigned
                            </h2>

                            <p>
                                You currently do not have any patients
                                assigned to your caregiver account.
                            </p>

                        </div>

                    )}


                    {/* =================================================
                        PATIENT CARDS
                    ================================================= */}

                    {!error &&
                    patients.length > 0 && (

                        <div style={gridStyle}>

                            {patients.map(
                                (patient) => (

                                    <div
                                        key={
                                            patient.assignment_id ||
                                            patient.patient_id
                                        }
                                        style={patientCardStyle}
                                    >


                                        {/* =================================
                                            PATIENT HEADER
                                        ================================= */}

                                        <div
                                            style={
                                                patientHeaderStyle
                                            }
                                        >

                                            <div
                                                style={
                                                    avatarStyle
                                                }
                                            >
                                                👤
                                            </div>


                                            <div
                                                style={
                                                    patientNameContainerStyle
                                                }
                                            >

                                                <h2
                                                    style={
                                                        patientNameStyle
                                                    }
                                                >

                                                    {
                                                        patient.patient_username ||
                                                        "Patient"
                                                    }

                                                </h2>


                                                <span
                                                    style={
                                                        roleBadgeStyle
                                                    }
                                                >
                                                    Patient
                                                </span>

                                            </div>

                                        </div>


                                        {/* =================================
                                            DETAILS
                                        ================================= */}

                                        <div
                                            style={
                                                detailsStyle
                                            }
                                        >


                                            <DetailItem
                                                icon="📧"
                                                label="Email"
                                                value={
                                                    patient.patient_email
                                                }
                                            />


                                            <DetailItem
                                                icon="📱"
                                                label="Phone"
                                                value={
                                                    patient.patient_phone
                                                }
                                            />


                                            <DetailItem
                                                icon="🎂"
                                                label="Date of Birth"
                                                value={
                                                    patient.patient_date_of_birth
                                                }
                                            />


                                            <DetailItem
                                                icon="📍"
                                                label="Address"
                                                value={
                                                    patient.patient_address
                                                }
                                            />


                                            <DetailItem
                                                icon="🕐"
                                                label="Assigned"
                                                value={
                                                    patient.assigned_at
                                                        ? new Date(
                                                            patient.assigned_at
                                                        ).toLocaleDateString(
                                                            "en-IN",
                                                            {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric"
                                                            }
                                                        )
                                                        : null
                                                }
                                            />

                                        </div>


                                        {/* =================================
                                            PATIENT ID
                                        ================================= */}

                                        <div
                                            style={
                                                patientIdStyle
                                            }
                                        >

                                            Patient ID:

                                            <strong>
                                                {" "}
                                                {
                                                    patient.patient_id ||
                                                    "-"
                                                }
                                            </strong>

                                        </div>


                                        {/* =================================
                                            VIEW PATIENT
                                        ================================= */}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                viewPatient(
                                                    patient.patient_id
                                                )
                                            }
                                            style={
                                                viewButtonStyle
                                            }
                                        >

                                            👁 View Patient

                                        </button>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </div>

            </main>

        </>

    );

}


// ============================================================
// DETAIL ITEM
// ============================================================

function DetailItem({
    icon,
    label,
    value
}) {

    return (

        <div style={detailItemStyle}>

            <div style={detailIconStyle}>
                {icon}
            </div>


            <div style={detailContentStyle}>

                <strong style={detailLabelStyle}>
                    {label}
                </strong>


                <p style={detailValueStyle}>
                    {value || "Not provided"}
                </p>

            </div>

        </div>

    );

}


// ============================================================
// STYLES
// ============================================================

const mainStyle = {

    marginLeft: "250px",

    paddingTop: "72px",

    minHeight: "100vh",

    background: "#F6F8FB",

    boxSizing: "border-box"

};


const containerStyle = {

    maxWidth: "1200px",

    margin: "0 auto",

    padding: "32px 34px 50px",

    boxSizing: "border-box"

};


const headerStyle = {

    display: "flex",

    justifyContent: "space-between",

    alignItems: "center",

    gap: "20px",

    marginBottom: "28px",

    flexWrap: "wrap"

};


const eyebrowStyle = {

    color: "#2563EB",

    fontSize: "11px",

    fontWeight: "800",

    letterSpacing: "1.2px",

    marginBottom: "7px"

};


const titleStyle = {

    margin: 0,

    color: "#0F172A",

    fontSize: "30px",

    fontWeight: "800",

    letterSpacing: "-0.5px"

};


const subtitleStyle = {

    margin: "7px 0 0",

    color: "#64748B",

    fontSize: "14px"

};


const backButton = {

    padding: "10px 16px",

    border: "1px solid #CBD5E1",

    borderRadius: "8px",

    background: "white",

    color: "#334155",

    fontWeight: "700",

    cursor: "pointer",

    fontSize: "12px"

};


const loadingStyle = {

    maxWidth: "600px",

    margin: "120px auto",

    background: "white",

    padding: "45px 25px",

    borderRadius: "14px",

    textAlign: "center",

    boxShadow:
        "0 4px 15px rgba(15,23,42,0.06)",

    border:
        "1px solid #E2E8F0"

};


const loadingIconStyle = {

    fontSize: "40px",

    marginBottom: "10px"

};


const errorStyle = {

    marginBottom: "25px",

    padding: "18px",

    borderRadius: "10px",

    background: "#FEF2F2",

    border: "1px solid #FECACA",

    color: "#991B1B"

};


const retryButton = {

    marginTop: "8px",

    padding: "8px 14px",

    border: "none",

    borderRadius: "7px",

    background: "#DC2626",

    color: "white",

    cursor: "pointer",

    fontWeight: "700",

    fontSize: "11px"

};


const countCardStyle = {

    display: "flex",

    alignItems: "center",

    gap: "15px",

    background: "white",

    padding: "18px 20px",

    borderRadius: "13px",

    marginBottom: "22px",

    border: "1px solid #E2E8F0",

    boxShadow:
        "0 4px 15px rgba(15,23,42,0.04)"

};


const countIconStyle = {

    width: "45px",

    height: "45px",

    borderRadius: "11px",

    background: "#DBEAFE",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    fontSize: "22px"

};


const countNumberStyle = {

    fontSize: "25px",

    lineHeight: "1",

    fontWeight: "800",

    color: "#1F2937"

};


const countTextStyle = {

    marginTop: "5px",

    color: "#64748B",

    fontSize: "11px",

    fontWeight: "600"

};


const emptyStyle = {

    background: "white",

    padding: "65px 25px",

    borderRadius: "14px",

    textAlign: "center",

    border: "1px solid #E2E8F0",

    boxShadow:
        "0 4px 15px rgba(15,23,42,0.04)"

};


const emptyIconStyle = {

    fontSize: "52px",

    marginBottom: "10px"

};


const gridStyle = {

    display: "grid",

    gridTemplateColumns:
        "repeat(auto-fit, minmax(320px, 1fr))",

    gap: "18px"

};


const patientCardStyle = {

    background: "white",

    padding: "22px",

    borderRadius: "14px",

    border: "1px solid #E2E8F0",

    boxShadow:
        "0 4px 15px rgba(15,23,42,0.05)"

};


const patientHeaderStyle = {

    display: "flex",

    alignItems: "center",

    gap: "14px",

    marginBottom: "20px"

};


const avatarStyle = {

    width: "55px",

    height: "55px",

    minWidth: "55px",

    borderRadius: "50%",

    background: "#DBEAFE",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    fontSize: "27px"

};


const patientNameContainerStyle = {

    minWidth: 0

};


const patientNameStyle = {

    margin: 0,

    color: "#1F2937",

    fontSize: "19px",

    fontWeight: "750",

    wordBreak: "break-word"

};


const roleBadgeStyle = {

    display: "inline-block",

    marginTop: "5px",

    padding: "4px 10px",

    borderRadius: "20px",

    background: "#DCFCE7",

    color: "#166534",

    fontSize: "10px",

    fontWeight: "700"

};


const detailsStyle = {

    display: "flex",

    flexDirection: "column",

    gap: "11px"

};


const detailItemStyle = {

    display: "flex",

    alignItems: "flex-start",

    gap: "10px"

};


const detailIconStyle = {

    width: "30px",

    height: "30px",

    minWidth: "30px",

    borderRadius: "7px",

    background: "#F1F5F9",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    fontSize: "14px"

};


const detailContentStyle = {

    minWidth: 0,

    flex: 1

};


const detailLabelStyle = {

    display: "block",

    color: "#64748B",

    fontSize: "10px",

    fontWeight: "700"

};


const detailValueStyle = {

    margin: "3px 0 0",

    color: "#334155",

    fontSize: "11px",

    lineHeight: "1.4",

    wordBreak: "break-word"

};


const patientIdStyle = {

    marginTop: "18px",

    padding: "9px 11px",

    background: "#F8FAFC",

    border: "1px solid #EEF2F7",

    borderRadius: "7px",

    color: "#64748B",

    fontSize: "10px"

};


const viewButtonStyle = {

    width: "100%",

    marginTop: "15px",

    padding: "11px",

    border: "none",

    borderRadius: "8px",

    background: "#2563EB",

    color: "white",

    fontSize: "12px",

    fontWeight: "700",

    cursor: "pointer",

    transition: "background 0.2s ease"

};


export default CaregiverPatients;
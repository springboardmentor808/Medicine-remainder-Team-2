import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import "../styles/MedicineList.css";


function MedicineList() {

    const navigate = useNavigate();


    // ============================================================
    // STATE
    // ============================================================

    const [medicines, setMedicines] = useState([]);

    const [search, setSearch] = useState("");

    const [selectedCondition, setSelectedCondition] =
        useState("all");

    const [selectedCategory, setSelectedCategory] =
        useState("all");

    const [conditions, setConditions] = useState([]);

    const [loading, setLoading] = useState(true);

    const [conditionsLoading, setConditionsLoading] =
        useState(true);


    // ============================================================
    // MEDICATION CATEGORIES
    // ============================================================

    const medicationCategories = [

        {
            value: "antibiotic",
            label: "Antibiotic"
        },

        {
            value: "vitamin",
            label: "Vitamin / Supplement"
        },

        {
            value: "pain_relief",
            label: "Pain Relief"
        },

        {
            value: "heart",
            label: "Heart Medication"
        },

        {
            value: "blood_pressure",
            label: "Blood Pressure Medication"
        },

        {
            value: "cholesterol",
            label: "Cholesterol Medication"
        },

        {
            value: "diabetes",
            label: "Diabetes Medication"
        },

        {
            value: "thyroid",
            label: "Thyroid Medication"
        },

        {
            value: "digestive",
            label: "Antacid / Digestive"
        },

        {
            value: "allergy",
            label: "Allergy Medication"
        },

        {
            value: "respiratory",
            label: "Respiratory Medication"
        },

        {
            value: "anti_inflammatory",
            label: "Anti-inflammatory"
        },

        {
            value: "antifungal",
            label: "Antifungal"
        },

        {
            value: "antiviral",
            label: "Antiviral"
        },

        {
            value: "neurological",
            label: "Neurological Medication"
        },

        {
            value: "mental_health",
            label: "Mental Health Medication"
        },

        {
            value: "skin",
            label: "Skin Medication"
        },

        {
            value: "eye",
            label: "Eye Medication"
        },

        {
            value: "other",
            label: "Other"
        },

    ];


    // ============================================================
    // GET CATEGORY LABEL
    // ============================================================

    const getCategoryLabel = (category) => {

        const foundCategory =
            medicationCategories.find(
                (item) =>
                    item.value === category
            );

        return foundCategory
            ? foundCategory.label
            : "Other";

    };


    // ============================================================
    // CLEAR SESSION
    // ============================================================

    const clearSession = () => {

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("username");
        localStorage.removeItem("user_id");
        localStorage.removeItem("role");

    };


    // ============================================================
    // LOAD DATA
    // ============================================================

    useEffect(() => {

        const token =
            localStorage.getItem("access");

        if (!token) {

            navigate("/login");

            return;

        }

        loadMedicines();

        loadConditions();

    }, [navigate]);


    // ============================================================
    // LOAD MEDICINES
    // ============================================================

    const loadMedicines = async () => {

        try {

            setLoading(true);

            const response =
                await api.get("medicines/");

            setMedicines(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "Medicine Loading Error:",
                error.response?.data ||
                error.message
            );

            if (
                error.response?.status === 401
            ) {

                clearSession();

                navigate("/login");

                return;

            }

            alert(
                "Unable to load medicines."
            );

        } finally {

            setLoading(false);

        }

    };


    // ============================================================
    // LOAD CONDITIONS
    // ============================================================

    const loadConditions = async () => {

        try {

            setConditionsLoading(true);

            const response =
                await api.get(
                    "medicines/conditions/"
                );

            setConditions(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.error(
                "Condition Loading Error:",
                error.response?.data ||
                error.message
            );

            if (
                error.response?.status === 401
            ) {

                clearSession();

                navigate("/login");

                return;

            }

            setConditions([]);

        } finally {

            setConditionsLoading(false);

        }

    };


    // ============================================================
    // DELETE MEDICINE
    // ============================================================

    const deleteMedicine = async (id) => {

        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this medicine?"
            );

        if (!confirmDelete) {

            return;

        }


        try {

            await api.delete(
                `medicines/${id}/`
            );


            setMedicines(
                (previousMedicines) =>
                    previousMedicines.filter(
                        (medicine) =>
                            medicine.id !== id
                    )
            );


            alert(
                "Medicine deleted successfully."
            );

        } catch (error) {

            console.error(
                "Delete Medicine Error:",
                error.response?.data ||
                error.message
            );


            if (
                error.response?.status === 401
            ) {

                clearSession();

                navigate("/login");

                return;

            }


            alert(
                "Failed to delete medicine."
            );

        }

    };


    // ============================================================
    // SEARCH + CONDITION + CATEGORY FILTER
    // ============================================================

    const filteredMedicines = useMemo(() => {

        const searchText =
            search.trim().toLowerCase();


        return medicines.filter(
            (medicine) => {

                const medicineName =
                    String(
                        medicine.medicine_name || ""
                    ).toLowerCase();


                const dosage =
                    String(
                        medicine.dosage || ""
                    ).toLowerCase();


                const frequency =
                    String(
                        medicine.frequency || ""
                    ).toLowerCase();


                const conditionName =
                    String(
                        medicine.condition_name || ""
                    ).toLowerCase();


                const categoryValue =
                    String(
                        medicine.medication_category || ""
                    ).toLowerCase();


                const categoryLabel =
                    getCategoryLabel(
                        medicine.medication_category
                    ).toLowerCase();


                // ------------------------------------------------
                // SEARCH
                // ------------------------------------------------

                const matchesSearch =

                    medicineName.includes(
                        searchText
                    ) ||

                    dosage.includes(
                        searchText
                    ) ||

                    frequency.includes(
                        searchText
                    ) ||

                    conditionName.includes(
                        searchText
                    ) ||

                    categoryValue.includes(
                        searchText
                    ) ||

                    categoryLabel.includes(
                        searchText
                    );


                // ------------------------------------------------
                // CONDITION FILTER
                // ------------------------------------------------

                const matchesCondition =

                    selectedCondition === "all"

                    ||

                    String(
                        medicine.condition || ""
                    ) ===
                    String(
                        selectedCondition
                    );


                // ------------------------------------------------
                // CATEGORY FILTER
                // ------------------------------------------------

                const matchesCategory =

                    selectedCategory === "all"

                    ||

                    String(
                        medicine.medication_category ||
                        "other"
                    ) ===
                    String(
                        selectedCategory
                    );


                return (
                    matchesSearch &&
                    matchesCondition &&
                    matchesCategory
                );

            }
        );

    }, [
        medicines,
        search,
        selectedCondition,
        selectedCategory,
    ]);


    // ============================================================
    // CONDITION COUNT
    // ============================================================

    const getConditionMedicineCount = (
        conditionId
    ) => {

        return medicines.filter(
            (medicine) =>
                String(
                    medicine.condition
                ) === String(conditionId)
        ).length;

    };


    // ============================================================
    // CATEGORY COUNT
    // ============================================================

    const getCategoryMedicineCount = (
        categoryValue
    ) => {

        return medicines.filter(
            (medicine) =>
                String(
                    medicine.medication_category ||
                    "other"
                ) === String(
                    categoryValue
                )
        ).length;

    };


    // ============================================================
    // CLEAR ALL FILTERS
    // ============================================================

    const clearFilters = () => {

        setSearch("");

        setSelectedCondition(
            "all"
        );

        setSelectedCategory(
            "all"
        );

    };


    // ============================================================
    // PAGE
    // ============================================================

    return (

        <>

            <Navbar />

            <Sidebar />


            <main className="medicine-page">


                {/* ==================================================
                    PAGE HEADER
                ================================================== */}

                <div className="medicine-header">

                    <div className="medicine-title-area">

                        <span
                            style={{
                                display: "block",
                                marginBottom: "6px",
                                color: "#1976d2",
                                fontSize: "11px",
                                fontWeight: "800",
                                letterSpacing: "1.4px",
                            }}
                        >
                            MEDICATION MANAGEMENT
                        </span>


                        <h1 className="page-title">

                            💊 My Medicines

                        </h1>


                        <p className="medicine-subtitle">

                            Manage your medicines and organize
                            them by health condition and
                            medication category.

                        </p>

                    </div>


                    <div className="medicine-actions">


                        <button
                            className="add-medicine-btn"

                            onClick={() =>
                                navigate(
                                    "/add-medicine"
                                )
                            }
                        >

                            <span className="button-icon">
                                ➕
                            </span>

                            Add Medicine

                        </button>


                        <button
                            className="condition-btn"

                            onClick={() =>
                                navigate(
                                    "/conditions"
                                )
                            }
                        >

                            <span className="button-icon">
                                🩺
                            </span>

                            Conditions

                        </button>

                    </div>

                </div>


                {/* ==================================================
                    SEARCH + FILTER TOOLBAR
                ================================================== */}

                <div className="medicine-toolbar">


                    {/* SEARCH */}

                    <div className="search-wrapper">

                        <span className="search-icon">
                            🔍
                        </span>


                        <input
                            type="text"

                            className="search-box"

                            placeholder="Search medicine, dosage, condition, category..."

                            value={search}

                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    {/* CONDITION FILTER */}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            minWidth: "220px",
                        }}
                    >

                        <span
                            style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                color: "#526b80",
                                whiteSpace: "nowrap",
                            }}
                        >
                            🩺 Condition:
                        </span>


                        <select
                            value={
                                selectedCondition
                            }

                            onChange={(e) =>
                                setSelectedCondition(
                                    e.target.value
                                )
                            }

                            disabled={
                                conditionsLoading
                            }

                            style={{
                                width: "100%",
                                minHeight: "40px",
                                padding: "0 12px",
                                border:
                                    "1px solid #d8e4ee",
                                borderRadius: "8px",
                                background: "#ffffff",
                                color: "#27465e",
                                fontSize: "12px",
                                fontWeight: "600",
                                outline: "none",
                                cursor:
                                    conditionsLoading
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                        >

                            <option value="all">
                                All Conditions
                            </option>


                            {conditions.map(
                                (condition) => (

                                    <option
                                        key={
                                            condition.id
                                        }

                                        value={
                                            condition.id
                                        }
                                    >

                                        {
                                            condition.condition_name
                                        }

                                        {" ("}

                                        {
                                            getConditionMedicineCount(
                                                condition.id
                                            )
                                        }

                                        {")"}

                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* CATEGORY FILTER */}

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            minWidth: "250px",
                        }}
                    >

                        <span
                            style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                color: "#526b80",
                                whiteSpace: "nowrap",
                            }}
                        >
                            💊 Category:
                        </span>


                        <select
                            value={
                                selectedCategory
                            }

                            onChange={(e) =>
                                setSelectedCategory(
                                    e.target.value
                                )
                            }

                            style={{
                                width: "100%",
                                minHeight: "40px",
                                padding: "0 12px",
                                border:
                                    "1px solid #d8e4ee",
                                borderRadius: "8px",
                                background: "#ffffff",
                                color: "#27465e",
                                fontSize: "12px",
                                fontWeight: "600",
                                outline: "none",
                                cursor: "pointer",
                            }}
                        >

                            <option value="all">
                                All Categories
                            </option>


                            {medicationCategories.map(
                                (category) => (

                                    <option
                                        key={
                                            category.value
                                        }

                                        value={
                                            category.value
                                        }
                                    >

                                        {
                                            category.label
                                        }

                                        {" ("}

                                        {
                                            getCategoryMedicineCount(
                                                category.value
                                            )
                                        }

                                        {")"}

                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* COUNT */}

                    <div className="medicine-count">

                        {filteredMedicines.length}

                        {" "}

                        {
                            filteredMedicines.length === 1
                                ? "Medicine"
                                : "Medicines"
                        }

                    </div>

                </div>


                {/* ==================================================
                    ACTIVE FILTERS
                ================================================== */}

                {
                    (
                        selectedCondition !== "all" ||
                        selectedCategory !== "all"
                    ) && (

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "12px",
                                marginBottom: "18px",
                                padding: "10px 14px",
                                background: "#edf6ff",
                                border:
                                    "1px solid #d4e8f8",
                                borderRadius: "9px",
                            }}
                        >

                            <span
                                style={{
                                    color: "#245777",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                }}
                            >

                                {selectedCondition !== "all" && (

                                    <>
                                        🩺 Condition:{" "}

                                        {
                                            conditions.find(
                                                (condition) =>
                                                    String(
                                                        condition.id
                                                    ) ===
                                                    String(
                                                        selectedCondition
                                                    )
                                            )?.condition_name ||
                                            "Selected Condition"
                                        }

                                    </>

                                )}


                                {
                                    selectedCondition !== "all" &&
                                    selectedCategory !== "all" &&
                                    "  •  "
                                }


                                {selectedCategory !== "all" && (

                                    <>
                                        💊 Category:{" "}

                                        {
                                            getCategoryLabel(
                                                selectedCategory
                                            )
                                        }
                                    </>

                                )}

                            </span>


                            <button
                                type="button"

                                onClick={
                                    clearFilters
                                }

                                style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#1976d2",
                                    fontSize: "11px",
                                    fontWeight: "800",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                }}
                            >

                                Clear Filters

                            </button>

                        </div>

                    )
                }


                {/* ==================================================
                    LOADING
                ================================================== */}

                {loading && (

                    <div className="medicine-message">

                        <div className="message-icon">
                            ⏳
                        </div>


                        <h2>
                            Loading Medicines
                        </h2>


                        <p>
                            Please wait while your medicines
                            are loaded.
                        </p>

                    </div>

                )}


                {/* ==================================================
                    NO MEDICINES
                ================================================== */}

                {!loading &&
                    medicines.length === 0 && (

                    <div className="medicine-message">

                        <div className="message-icon">
                            💊
                        </div>


                        <h2>
                            No Medicines Added
                        </h2>


                        <p>
                            Add your first medicine to start
                            tracking your medication.
                        </p>


                        <button
                            className="add-medicine-btn"

                            onClick={() =>
                                navigate(
                                    "/add-medicine"
                                )
                            }
                        >

                            ➕ Add Medicine

                        </button>

                    </div>

                )}


                {/* ==================================================
                    NO FILTER RESULT
                ================================================== */}

                {!loading &&
                    medicines.length > 0 &&
                    filteredMedicines.length === 0 && (

                    <div className="medicine-message">

                        <div className="message-icon">
                            🔍
                        </div>


                        <h2>
                            No Medicines Found
                        </h2>


                        <p>
                            No medicine matches your current
                            search or filters.
                        </p>


                        <button
                            className="condition-btn"

                            onClick={
                                clearFilters
                            }
                        >

                            Clear Filters

                        </button>

                    </div>

                )}


                {/* ==================================================
                    MEDICINE CARDS
                ================================================== */}

                {!loading &&
                    filteredMedicines.length > 0 && (

                    <div className="medicine-grid">

                        {filteredMedicines.map(
                            (medicine) => (

                            <div
                                className="medicine-card"
                                key={medicine.id}
                            >


                                {/* ==================================
                                    CARD HEADER
                                ================================== */}

                                <div
                                    className=
                                        "medicine-card-header"
                                >

                                    <div
                                        className=
                                            "medicine-icon"
                                    >
                                        💊
                                    </div>


                                    <div
                                        className=
                                            "medicine-name-area"
                                    >

                                        <h2>
                                            {
                                                medicine.medicine_name
                                            }
                                        </h2>


                                        <p
                                            className=
                                                "medicine-dosage"
                                        >

                                            {
                                                medicine.dosage ||
                                                "Dosage not specified"
                                            }

                                        </p>

                                    </div>

                                </div>


                                {/* ==================================
                                    INFORMATION GRID
                                ================================== */}

                                <div
                                    className=
                                        "medicine-info-grid"
                                >


                                    {/* QUANTITY */}

                                    <div
                                        className="info-card"
                                    >

                                        <div
                                            className=
                                                "info-icon quantity-icon"
                                        >
                                            📦
                                        </div>


                                        <div
                                            className=
                                                "info-content"
                                        >

                                            <span>
                                                Quantity
                                            </span>


                                            <strong>
                                                {
                                                    medicine.quantity
                                                }
                                            </strong>

                                        </div>

                                    </div>


                                    {/* FREQUENCY */}

                                    <div
                                        className="info-card"
                                    >

                                        <div
                                            className=
                                                "info-icon frequency-icon"
                                        >
                                            🔄
                                        </div>


                                        <div
                                            className=
                                                "info-content"
                                        >

                                            <span>
                                                Frequency
                                            </span>


                                            <strong>
                                                {
                                                    medicine.frequency ||
                                                    "Not specified"
                                                }
                                            </strong>

                                        </div>

                                    </div>


                                    {/* START DATE */}

                                    <div
                                        className="info-card"
                                    >

                                        <div
                                            className=
                                                "info-icon date-icon"
                                        >
                                            📅
                                        </div>


                                        <div
                                            className=
                                                "info-content"
                                        >

                                            <span>
                                                Start Date
                                            </span>


                                            <strong>
                                                {
                                                    medicine.start_date ||
                                                    "Not available"
                                                }
                                            </strong>

                                        </div>

                                    </div>


                                    {/* END DATE */}

                                    <div
                                        className="info-card"
                                    >

                                        <div
                                            className=
                                                "info-icon date-icon"
                                        >
                                            📅
                                        </div>


                                        <div
                                            className=
                                                "info-content"
                                        >

                                            <span>
                                                End Date
                                            </span>


                                            <strong>
                                                {
                                                    medicine.end_date ||
                                                    "Not available"
                                                }
                                            </strong>

                                        </div>

                                    </div>


                                    {/* REMINDER */}

                                    <div
                                        className="info-card"
                                    >

                                        <div
                                            className=
                                                "info-icon reminder-icon"
                                        >
                                            ⏰
                                        </div>


                                        <div
                                            className=
                                                "info-content"
                                        >

                                            <span>
                                                Reminder
                                            </span>


                                            <strong>
                                                {
                                                    medicine.reminder_time ||
                                                    "Not set"
                                                }
                                            </strong>

                                        </div>

                                    </div>


                                    {/* CONDITION */}

                                    <div
                                        className="info-card"
                                    >

                                        <div
                                            className=
                                                "info-icon condition-icon"
                                        >
                                            🩺
                                        </div>


                                        <div
                                            className=
                                                "info-content"
                                        >

                                            <span>
                                                Disease / Condition
                                            </span>


                                            {medicine.condition_name ? (

                                                <strong
                                                    className=
                                                        "condition-value"
                                                >
                                                    {
                                                        medicine.condition_name
                                                    }
                                                </strong>

                                            ) : (

                                                <strong
                                                    className=
                                                        "condition-none"
                                                >
                                                    Not Assigned
                                                </strong>

                                            )}

                                        </div>

                                    </div>


                                    {/* MEDICATION CATEGORY */}

                                    <div
                                        className="info-card"
                                    >

                                        <div
                                            className=
                                                "info-icon category-icon"
                                        >
                                            🏷️
                                        </div>


                                        <div
                                            className=
                                                "info-content"
                                        >

                                            <span>
                                                Medication Category
                                            </span>


                                            <strong
                                                className=
                                                    "category-value"
                                            >

                                                {
                                                    getCategoryLabel(
                                                        medicine.medication_category
                                                    )
                                                }

                                            </strong>

                                        </div>

                                    </div>

                                </div>


                                {/* ==================================
                                    REMINDER STATUS
                                ================================== */}

                                <div
                                    className=
                                        "medicine-status"
                                >

                                    {medicine.reminder_enabled ? (

                                        <span
                                            className=
                                                "status-enabled"
                                        >

                                            <span
                                                className=
                                                    "status-icon"
                                            >
                                                🔔
                                            </span>

                                            Reminder Enabled

                                        </span>

                                    ) : (

                                        <span
                                            className=
                                                "status-disabled"
                                        >

                                            <span
                                                className=
                                                    "status-icon"
                                            >
                                                🔕
                                            </span>

                                            Reminder Disabled

                                        </span>

                                    )}

                                </div>


                                {/* ==================================
                                    ACTION BUTTONS
                                ================================== */}

                                <div
                                    className=
                                        "medicine-card-actions"
                                >


                                    <button
                                        className="view-btn"

                                        onClick={() =>
                                            navigate(
                                                `/medicine/${medicine.id}`
                                            )
                                        }
                                    >

                                        <span>
                                            👁️
                                        </span>

                                        View

                                    </button>


                                    <button
                                        className="delete-btn"

                                        onClick={() =>
                                            deleteMedicine(
                                                medicine.id
                                            )
                                        }
                                    >

                                        <span>
                                            🗑️
                                        </span>

                                        Delete

                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </main>

        </>

    );

}


export default MedicineList;
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import api from "../api/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/AddMedicine.css";


// ============================================================
// MEDICINE DATABASE
// ============================================================

const MEDICINE_DATABASE = [
    ["paracetamol", "Paracetamol", "pain_relief"],
    ["acetaminophen", "Paracetamol", "pain_relief"],
    ["paracitamol", "Paracetamol", "pain_relief"],
    ["paracetmol", "Paracetamol", "pain_relief"],

    ["ibuprofen", "Ibuprofen", "pain_relief"],
    ["ibuprofem", "Ibuprofen", "pain_relief"],
    ["ibuprofin", "Ibuprofen", "pain_relief"],

    ["diclofenac", "Diclofenac", "anti_inflammatory"],

    ["amoxicillin", "Amoxicillin", "antibiotic"],
    ["amoxycillin", "Amoxicillin", "antibiotic"],
    ["amoxicilin", "Amoxicillin", "antibiotic"],

    ["azithromycin", "Azithromycin", "antibiotic"],
    ["azithromicin", "Azithromycin", "antibiotic"],

    ["cetirizine", "Cetirizine", "allergy"],
    ["cetrizine", "Cetirizine", "allergy"],

    ["levocetirizine", "Levocetirizine", "allergy"],
    ["levocetrizine", "Levocetirizine", "allergy"],

    ["omeprazole", "Omeprazole", "digestive"],
    ["omeprazol", "Omeprazole", "digestive"],

    ["pantoprazole", "Pantoprazole", "digestive"],
    ["pantaprazole", "Pantoprazole", "digestive"],

    ["metformin", "Metformin", "diabetes"],
    ["metformine", "Metformin", "diabetes"],

    ["amlodipine", "Amlodipine", "blood_pressure"],
    ["amlodipin", "Amlodipine", "blood_pressure"],

    ["losartan", "Losartan", "blood_pressure"],
    ["losarten", "Losartan", "blood_pressure"],

    ["atorvastatin", "Atorvastatin", "cholesterol"],

    ["thyroxine", "Thyroxine", "thyroid"],
    ["thyroxin", "Thyroxine", "thyroid"],

    ["levothyroxine", "Levothyroxine", "thyroid"],
    ["levothyroxin", "Levothyroxine", "thyroid"],

    ["aspirin", "Aspirin", "heart"],
    ["asprin", "Aspirin", "heart"],

    ["insulin", "Insulin", "diabetes"],

    ["ultrafen", "Ultrafen", "pain_relief"],
    ["ultrafen plus", "Ultrafen-Plus", "pain_relief"],

    ["cartilex", "Cartilex", "pain_relief"],

    ["rebanta", "Rebanta", "other"],
];


// ============================================================
// NORMALIZE OCR TEXT
// ============================================================

function normalizeText(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/\r/g, "\n")
        .replace(/[|]/g, " ")
        .replace(/[^\w\s./+-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


// ============================================================
// FIND MEDICINE
// ============================================================

function findMedicine(text) {
    const normalizedText = normalizeText(text);

    if (!normalizedText) {
        return {
            name: "",
            category: "other",
        };
    }

    for (const item of MEDICINE_DATABASE) {
        const searchName = item[0];
        const displayName = item[1];
        const category = item[2];

        if (normalizedText.includes(searchName)) {
            return {
                name: displayName,
                category: category,
            };
        }
    }

    return {
        name: "",
        category: "other",
    };
}


// ============================================================
// FIND DOSAGE
// ============================================================

function findDosage(text) {
    const value = String(text || "");

    const match = value.match(
        /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|kg|ml|mL|mg\/ml|mcg\/ml|%)\b/i
    );

    if (!match) {
        return "";
    }

    return match[0]
        .replace(/\s+/g, " ")
        .trim();
}


// ============================================================
// FIND QUANTITY
// ============================================================
// No problematic qty/quantity regex is used here.
// Supports:
// Qty 20
// Quantity 20
// 20 tablets
// 20 tabs
// 20 capsules
// 20 pills
// 20 units
// ============================================================

function findQuantity(text) {
    const value = String(text || "")
        .toLowerCase()
        .replace(/[:,]/g, " ")
        .replace(/-/g, " ")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!value) {
        return "";
    }

    const words = value.split(" ");

    const quantityWords = [
        "tablet",
        "tablets",
        "tab",
        "tabs",
        "capsule",
        "capsules",
        "cap",
        "caps",
        "pill",
        "pills",
        "unit",
        "units",
    ];


    // --------------------------------------------------------
    // CASE 1: Qty 20 / Quantity 20
    // --------------------------------------------------------

    for (let i = 0; i < words.length; i++) {

        const word = words[i];

        if (
            word === "qty" ||
            word === "quantity"
        ) {

            for (
                let j = i + 1;
                j < words.length && j <= i + 3;
                j++
            ) {

                const number =
                    Number(words[j]);

                if (
                    words[j] !== "" &&
                    Number.isInteger(number) &&
                    number > 0
                ) {
                    return String(number);
                }
            }
        }
    }


    // --------------------------------------------------------
    // CASE 2: 20 tablets / 20 tabs / 20 capsules
    // --------------------------------------------------------

    for (let i = 1; i < words.length; i++) {

        const word = words[i];

        if (
            quantityWords.includes(word)
        ) {

            const previousWord =
                words[i - 1];

            const number =
                Number(previousWord);

            if (
                previousWord &&
                Number.isInteger(number) &&
                number > 0
            ) {
                return String(number);
            }
        }
    }


    return "";
}


// ============================================================
// FIND FREQUENCY
// ============================================================

function findFrequency(text) {
    const value = String(text || "");

    const patterns = [
        /\bonce\s+(?:a|per)\s+day\b/i,
        /\btwice\s+(?:a|per)\s+day\b/i,
        /\bthrice\s+(?:a|per)\s+day\b/i,
        /\b\d+\s*times?\s+(?:a|per)\s+day\b/i,
        /\bevery\s+\d+\s*(?:hours?|hrs?)\b/i,
        /\b(?:morning|afternoon|evening|night)\b/i,
        /\b(?:od|bd|tds|tid|qid|sos)\b/i,
    ];

    for (const pattern of patterns) {
        const match = value.match(pattern);

        if (match) {
            return match[0].trim();
        }
    }

    return "";
}


// ============================================================
// PARSE OCR
// ============================================================

function parseOCR(text) {
    const medicine = findMedicine(text);

    return {
        medicine_name: medicine.name,
        dosage: findDosage(text),
        quantity: findQuantity(text),
        frequency: findFrequency(text),
        medication_category: medicine.category,
    };
}


// ============================================================
// MEDICATION CATEGORIES
// ============================================================

const CATEGORIES = [
    ["antibiotic", "Antibiotic"],
    ["vitamin", "Vitamin / Supplement"],
    ["pain_relief", "Pain Relief"],
    ["heart", "Heart Medication"],
    ["blood_pressure", "Blood Pressure Medication"],
    ["cholesterol", "Cholesterol Medication"],
    ["diabetes", "Diabetes Medication"],
    ["thyroid", "Thyroid Medication"],
    ["digestive", "Antacid / Digestive"],
    ["allergy", "Allergy Medication"],
    ["respiratory", "Respiratory Medication"],
    ["anti_inflammatory", "Anti-inflammatory"],
    ["antifungal", "Antifungal"],
    ["antiviral", "Antiviral"],
    ["neurological", "Neurological Medication"],
    ["mental_health", "Mental Health Medication"],
    ["skin", "Skin Medication"],
    ["eye", "Eye Medication"],
    ["other", "Other"],
];


// ============================================================
// COMPONENT
// ============================================================

function AddMedicine() {

    const navigate = useNavigate();
    const location = useLocation();


    // ========================================================
    // OCR DATA
    // ========================================================

    const ocrData = location.state || {};

    const parsedOCR = parseOCR(
        ocrData.prescriptionText || ""
    );


    // ========================================================
    // FORM STATE
    // ========================================================

    const [formData, setFormData] = useState({
        medicine_name:
            ocrData.medicine_name ||
            parsedOCR.medicine_name ||
            "",

        dosage:
            ocrData.dosage ||
            parsedOCR.dosage ||
            "",

        quantity:
            ocrData.quantity ||
            parsedOCR.quantity ||
            "",

        frequency:
            ocrData.frequency ||
            parsedOCR.frequency ||
            "",

        start_date: "",

        end_date: "",

        reminder_time: "09:00",

        reminder_enabled: true,

        condition: "",

        medication_category:
            ocrData.medication_category ||
            parsedOCR.medication_category ||
            "other",
    });


    // ========================================================
    // CONDITIONS
    // ========================================================

    const [
        conditions,
        setConditions,
    ] = useState([]);

    const [
        conditionsLoading,
        setConditionsLoading,
    ] = useState(true);

    const [
        conditionsError,
        setConditionsError,
    ] = useState("");


    // ========================================================
    // LOADING
    // ========================================================

    const [
        loading,
        setLoading,
    ] = useState(false);


    // ========================================================
    // LOAD CONDITIONS
    // ========================================================

    useEffect(() => {

        let mounted = true;


        async function loadConditions() {

            try {

                setConditionsLoading(true);

                setConditionsError("");


                const response = await api.get(
                    "medicines/conditions/options/"
                );


                let data = response.data;


                // ------------------------------------------------
                // Handle both:
                // [ ... ]
                //
                // and:
                // { results: [ ... ] }
                // ------------------------------------------------

                if (!Array.isArray(data)) {

                    if (
                        data &&
                        Array.isArray(data.results)
                    ) {

                        data = data.results;

                    } else {

                        data = [];
                    }
                }


                // ------------------------------------------------
                // Remove invalid conditions
                // ------------------------------------------------

                data = data.filter(
                    (item) =>
                        item &&
                        item.id !== undefined &&
                        item.id !== null &&
                        item.condition_name
                );


                // ------------------------------------------------
                // Remove duplicate conditions
                // ------------------------------------------------

                const uniqueConditions = [];

                const existingNames =
                    new Set();


                for (const item of data) {

                    const name =
                        String(
                            item.condition_name
                        ).trim();


                    const key =
                        name.toLowerCase();


                    if (
                        !existingNames.has(key)
                    ) {

                        existingNames.add(key);


                        uniqueConditions.push({
                            ...item,
                            condition_name:
                                name,
                        });
                    }
                }


                // ------------------------------------------------
                // Sort alphabetically
                // ------------------------------------------------

                uniqueConditions.sort(
                    (a, b) =>
                        a.condition_name.localeCompare(
                            b.condition_name
                        )
                );


                if (mounted) {

                    setConditions(
                        uniqueConditions
                    );
                }

            } catch (error) {

                console.error(
                    "Condition loading error:",
                    error.response?.data ||
                    error.message
                );


                // ------------------------------------------------
                // Unauthorized
                // ------------------------------------------------

                if (
                    error.response?.status ===
                    401
                ) {

                    localStorage.removeItem(
                        "access"
                    );

                    localStorage.removeItem(
                        "refresh"
                    );

                    localStorage.removeItem(
                        "username"
                    );

                    localStorage.removeItem(
                        "user_id"
                    );

                    localStorage.removeItem(
                        "role"
                    );


                    navigate(
                        "/login"
                    );

                    return;
                }


                if (mounted) {

                    setConditions([]);

                    setConditionsError(
                        "Unable to load health conditions."
                    );
                }

            } finally {

                if (mounted) {

                    setConditionsLoading(
                        false
                    );
                }
            }
        }


        loadConditions();


        return () => {

            mounted = false;
        };

    }, [navigate]);


    // ========================================================
    // HANDLE INPUT
    // ========================================================

    function handleChange(event) {

        const {
            name,
            value,
            type,
            checked,
        } = event.target;


        setFormData(
            (previous) => ({
                ...previous,

                [name]:
                    type === "checkbox"
                        ? checked
                        : value,
            })
        );
    }


    // ========================================================
    // VALIDATE FORM
    // ========================================================

    function validateForm() {

        if (
            !formData.medicine_name.trim()
        ) {

            alert(
                "Please enter the medicine name."
            );

            return false;
        }


        if (
            !formData.dosage.trim()
        ) {

            alert(
                "Please enter the dosage."
            );

            return false;
        }


        const quantity =
            Number(
                formData.quantity
            );


        if (
            !Number.isInteger(quantity) ||
            quantity < 1
        ) {

            alert(
                "Please enter a valid quantity."
            );

            return false;
        }


        if (
            !formData.frequency.trim()
        ) {

            alert(
                "Please enter the medicine frequency."
            );

            return false;
        }


        if (!formData.start_date) {

            alert(
                "Please select the start date."
            );

            return false;
        }


        if (!formData.end_date) {

            alert(
                "Please select the end date."
            );

            return false;
        }


        if (
            formData.end_date <
            formData.start_date
        ) {

            alert(
                "End date cannot be before start date."
            );

            return false;
        }


        if (
            formData.reminder_enabled &&
            !formData.reminder_time
        ) {

            alert(
                "Please select a reminder time."
            );

            return false;
        }


        return true;
    }


    // ========================================================
    // SUBMIT
    // ========================================================

    async function handleSubmit(event) {

        event.preventDefault();


        if (!validateForm()) {
            return;
        }


        setLoading(true);


        try {

            const condition =
                formData.condition
                    ? Number(
                        formData.condition
                    )
                    : null;


            const medicineData = {

                medicine_name:
                    formData.medicine_name.trim(),

                dosage:
                    formData.dosage.trim(),

                quantity:
                    Number(
                        formData.quantity
                    ),

                frequency:
                    formData.frequency.trim(),

                start_date:
                    formData.start_date,

                end_date:
                    formData.end_date,

                reminder_time:
                    formData.reminder_time,

                reminder_enabled:
                    formData.reminder_enabled,

                condition:

                    condition,

                medication_category:
                    formData.medication_category ||
                    "other",
            };


            console.log(
                "Adding medicine:",
                medicineData
            );


            await api.post(
                "medicines/",
                medicineData
            );


            alert(
                "Medicine Added Successfully!"
            );


            navigate(
                "/medicines",
                {
                    replace: true,
                }
            );

        } catch (error) {

            console.error(
                "Add Medicine Error:",
                error.response?.data ||
                error.message
            );


            if (
                error.response?.status ===
                401
            ) {

                localStorage.removeItem(
                    "access"
                );

                localStorage.removeItem(
                    "refresh"
                );


                alert(
                    "Session expired. Please login again."
                );


                navigate(
                    "/login"
                );

                return;
            }


            const serverError =
                error.response?.data;


            if (
                serverError &&
                typeof serverError ===
                    "object"
            ) {

                const message =
                    Object.entries(
                        serverError
                    )
                        .map(
                            ([field, value]) =>
                                `${field}: ${
                                    Array.isArray(
                                        value
                                    )
                                        ? value.join(
                                            ", "
                                        )
                                        : value
                                }`
                        )
                        .join("\n");


                alert(
                    message ||
                    "Unable to add medicine."
                );

            } else {

                alert(
                    "Failed to add medicine. Please try again."
                );
            }

        } finally {

            setLoading(false);
        }
    }


    // ========================================================
    // OCR STATUS
    // ========================================================

    const hasOCR =
        Boolean(
            ocrData.prescriptionText
        );


    const medicineDetected =
        Boolean(
            formData.medicine_name
        );


    // ========================================================
    // UI
    // ========================================================

    return (
        <>
            <Navbar />

            <Sidebar />


            <main className="add-page">

                <div className="add-card">


                    {/* HEADER */}

                    <div className="add-header">

                        <span className="add-label">
                            MEDICATION MANAGEMENT
                        </span>


                        <h1 className="add-title">
                            💊 Add Medicine
                        </h1>


                        <p>
                            Add your medicine details
                            and configure your reminder.
                        </p>

                    </div>


                    {/* OCR NOTICE */}

                    {hasOCR && (

                        <div
                            className="ocr-notice"
                            style={{
                                padding:
                                    "12px 15px",

                                marginBottom:
                                    "20px",

                                borderRadius:
                                    "8px",

                                background:
                                    medicineDetected
                                        ? "#e8f5e9"
                                        : "#fff8e1",

                                border:
                                    medicineDetected
                                        ? "1px solid #81c784"
                                        : "1px solid #ffcc80",

                                color:
                                    medicineDetected
                                        ? "#2e7d32"
                                        : "#8a5a00",

                                lineHeight:
                                    "1.5",
                            }}
                        >

                            <strong>

                                {medicineDetected
                                    ? "✅ Medicine detected"
                                    : "⚠️ Medicine name not detected"}

                            </strong>


                            <br />


                            {medicineDetected

                                ? "Please check the detected details before saving."

                                : "The OCR could not reliably identify the medicine name. Please enter it manually."}

                        </div>

                    )}


                    {/* FORM */}

                    <form
                        onSubmit={
                            handleSubmit
                        }
                    >


                        {/* MEDICINE NAME */}

                        <div className="form-group">

                            <label htmlFor="medicine_name">
                                Medicine Name
                            </label>


                            <input
                                id="medicine_name"
                                name="medicine_name"
                                type="text"
                                value={
                                    formData.medicine_name
                                }
                                onChange={
                                    handleChange
                                }
                                className="form-input"
                                placeholder="e.g. Paracetamol"
                                autoComplete="off"
                                required
                            />

                        </div>


                        {/* DOSAGE */}

                        <div className="form-group">

                            <label htmlFor="dosage">
                                Dosage
                            </label>


                            <input
                                id="dosage"
                                name="dosage"
                                type="text"
                                value={
                                    formData.dosage
                                }
                                onChange={
                                    handleChange
                                }
                                className="form-input"
                                placeholder="e.g. 500 mg"
                                required
                            />

                        </div>


                        {/* QUANTITY */}

                        <div className="form-group">

                            <label htmlFor="quantity">
                                Quantity
                            </label>


                            <input
                                id="quantity"
                                name="quantity"
                                type="number"
                                min="1"
                                step="1"
                                value={
                                    formData.quantity
                                }
                                onChange={
                                    handleChange
                                }
                                className="form-input"
                                placeholder="e.g. 20"
                                required
                            />

                        </div>


                        {/* FREQUENCY */}

                        <div className="form-group">

                            <label htmlFor="frequency">
                                Frequency
                            </label>


                            <input
                                id="frequency"
                                name="frequency"
                                type="text"
                                value={
                                    formData.frequency
                                }
                                onChange={
                                    handleChange
                                }
                                className="form-input"
                                placeholder="e.g. Once Daily"
                                required
                            />

                        </div>


                        {/* CONDITION */}

                        <div className="form-group">

                            <label htmlFor="condition">
                                Disease / Condition
                            </label>


                            <select
                                id="condition"
                                name="condition"
                                value={
                                    formData.condition
                                }
                                onChange={
                                    handleChange
                                }
                                className="form-input"
                                disabled={
                                    conditionsLoading
                                }
                            >

                                <option value="">

                                    {conditionsLoading
                                        ? "Loading conditions..."
                                        : "-- Select Disease / Condition --"}

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

                                        </option>

                                    )
                                )}

                            </select>


                            {conditionsError && (

                                <small
                                    style={{
                                        display:
                                            "block",

                                        marginTop:
                                            "6px",

                                        color:
                                            "#c62828",
                                    }}
                                >
                                    {conditionsError}
                                </small>

                            )}

                        </div>


                        {/* CATEGORY */}

                        <div className="form-group">

                            <label htmlFor="medication_category">
                                Medication Category
                            </label>


                            <select
                                id="medication_category"
                                name="medication_category"
                                value={
                                    formData.medication_category
                                }
                                onChange={
                                    handleChange
                                }
                                className="form-input"
                            >

                                {CATEGORIES.map(
                                    ([value, label]) => (

                                        <option
                                            key={
                                                value
                                            }
                                            value={
                                                value
                                            }
                                        >
                                            {label}
                                        </option>

                                    )
                                )}

                            </select>

                        </div>


                        {/* START DATE */}

                        <div className="form-group">

                            <label htmlFor="start_date">
                                Start Date
                            </label>


                            <input
                                id="start_date"
                                name="start_date"
                                type="date"
                                value={
                                    formData.start_date
                                }
                                onChange={
                                    handleChange
                                }
                                className="form-input"
                                required
                            />

                        </div>


                        {/* END DATE */}

                        <div className="form-group">

                            <label htmlFor="end_date">
                                End Date
                            </label>


                            <input
                                id="end_date"
                                name="end_date"
                                type="date"
                                value={
                                    formData.end_date
                                }
                                onChange={
                                    handleChange
                                }
                                className="form-input"
                                required
                            />

                        </div>


                        {/* REMINDER TIME */}

                        <div className="form-group">

                            <label htmlFor="reminder_time">
                                Reminder Time
                            </label>


                            <input
                                id="reminder_time"
                                name="reminder_time"
                                type="time"
                                value={
                                    formData.reminder_time
                                }
                                onChange={
                                    handleChange
                                }
                                className="form-input"
                                disabled={
                                    !formData.reminder_enabled
                                }
                            />

                        </div>


                        {/* REMINDER ENABLE */}

                        <div className="checkbox-group">

                            <input
                                id="reminder_enabled"
                                name="reminder_enabled"
                                type="checkbox"
                                checked={
                                    formData.reminder_enabled
                                }
                                onChange={
                                    handleChange
                                }
                            />


                            <label htmlFor="reminder_enabled">
                                Enable Medicine Reminder
                            </label>

                        </div>


                        {/* BUTTONS */}

                        <div
                            style={{
                                display:
                                    "flex",

                                gap:
                                    "10px",

                                marginTop:
                                    "20px",
                            }}
                        >

                            <button
                                type="button"
                                disabled={
                                    loading
                                }
                                onClick={() =>
                                    navigate(
                                        "/medicines"
                                    )
                                }
                                style={{
                                    flex: 1,

                                    padding:
                                        "12px",

                                    borderRadius:
                                        "8px",

                                    border:
                                        "1px solid #d7e4ee",

                                    background:
                                        "#ffffff",

                                    color:
                                        "#145a9c",

                                    fontWeight:
                                        "700",

                                    cursor:
                                        loading
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={
                                    loading
                                }
                                style={{
                                    flex: 2,
                                }}
                            >

                                {loading
                                    ? "Adding Medicine..."
                                    : "➕ Add Medicine"}

                            </button>

                        </div>

                    </form>

                </div>

            </main>
        </>
    );
}


export default AddMedicine;
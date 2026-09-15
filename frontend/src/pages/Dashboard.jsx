import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/api";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import "./Dashboard.css";


function Dashboard() {

    const navigate = useNavigate();

    // ============================================================
    // DASHBOARD DATA
    // ============================================================

    const [medicines, setMedicines] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [history, setHistory] = useState([]);
    const [conditions, setConditions] = useState([]);

    const [refillData, setRefillData] = useState({});
    const [prediction, setPrediction] = useState(null);
    const [predictionLoading, setPredictionLoading] = useState(false);

    const [userRole, setUserRole] = useState("");
    const [username, setUsername] = useState(
        localStorage.getItem("username") || "User"
    );

    // ============================================================
    // AI PATIENT DATA
    // ============================================================

    const [patientData, setPatientData] = useState({
        Age: "",
        Gender: "",
        Medication_Type: "",
        Dosage_mg: "",
        Previous_Adherence: "",
        Education_Level: "",
        Income: "",
        Social_Support_Level: "",
        Condition_Severity: "",
        Comorbidities_Count: "",
        Healthcare_Access: "",
        Mental_Health_Status: "",
        Insurance_Coverage: ""
    });

    // ============================================================
    // INITIAL LOAD
    // ============================================================

    // These fetch/check functions are component-local helpers used by this
    // mount/interval effect. Keep this effect tied to navigation only.
    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {

        const token = localStorage.getItem("access");

        if (!token) {
            navigate("/login");
            return;
        }

        fetchProfile();
        fetchMedicines();
        fetchReminders();
        fetchHistory();
        fetchConditions();

        requestNotificationPermission();

        checkNotifications();

        const interval = setInterval(() => {
            checkNotifications();
        }, 60000);

        return () => clearInterval(interval);

    }, [navigate]);

    // Run refill alerts whenever fresh refill predictions arrive.
    // This avoids the stale-state closure and avoids repeatedly calling
    // every refill endpoint every minute.
    // Refill data is the trigger; checkRefillNotifications reads the latest
    // refillData/medicines from the component scope.
    
    useEffect(() => {
        if (Object.keys(refillData || {}).length === 0) {
            return;
        }

        checkRefillNotifications();
    }, [refillData, medicines]);
    /* eslint-enable react-hooks/exhaustive-deps */

    // ============================================================
    // PROFILE
    // ============================================================

    async function fetchProfile() {

        try {

            const response = await api.get("accounts/profile/");

            setUserRole(response.data?.role || "");

            if (response.data?.username) {
                setUsername(response.data.username);
            }

        } catch (error) {

            console.log(
                "Profile error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {

                localStorage.removeItem("access");
                localStorage.removeItem("refresh");

                navigate("/login");
            }
        }
    }

    // ============================================================
    // NOTIFICATION PERMISSION
    // ============================================================

    async function requestNotificationPermission() {

        if (!("Notification" in window)) {
            return;
        }

        if (Notification.permission === "default") {

            try {
                await Notification.requestPermission();
            } catch (error) {
                console.log(
                    "Notification permission error:",
                    error
                );
            }
        }
    }

    // ============================================================
    // REFILL PREDICTION
    // ============================================================

    const fetchRefillPrediction = async (medicineId) => {

        if (!medicineId) {
            return {
                medicineId,
                data: null,
                success: false
            };
        }

        try {

            const response = await api.get(
                `refill/${medicineId}/`
            );

            return {
                medicineId,
                data: response.data,
                success: true
            };

        } catch (error) {

            console.log(
                "Refill prediction error:",
                error.response?.data || error.message
            );

            return {
                medicineId,
                data: null,
                success: false
            };
        }
    };

    // ============================================================
    // FETCH MEDICINES
    // ============================================================

    async function fetchMedicines() {

        try {

            const response = await api.get("medicines/");

            const medicineList = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data?.results)
                    ? response.data.results
                    : [];

            setMedicines(medicineList);
            if (medicineList.length === 0) {

                setRefillData({});
                return;
            }

            const results = await Promise.allSettled(
                medicineList.map(
                    medicine =>
                        fetchRefillPrediction(medicine.id)
                )
            );

            const refillResults = {};

            results.forEach(result => {

                if (
                    result.status === "fulfilled" &&
                    result.value?.success
                ) {

                    refillResults[
                        result.value.medicineId
                    ] = result.value.data;
                }
            });

            setRefillData(refillResults);

        } catch (error) {

            console.log(
                "Medicine error:",
                error.response?.data || error.message
            );
        }
    }

    // ============================================================
    // REMINDERS
    // ============================================================

    async function fetchReminders() {

        try {

            const response = await api.get("reminders/");

            setReminders(
                Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.data?.results)
                        ? response.data.results
                        : []
            );

        } catch (error) {

            console.log(
                "Reminder error:",
                error.response?.data || error.message
            );
        }
    }

    // ============================================================
    // HISTORY
    // ============================================================

    async function fetchHistory() {

        try {

            const response = await api.get(
                "reminders/history/"
            );

            setHistory(
                Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.data?.results)
                        ? response.data.results
                        : []
            );

        } catch (error) {

            console.log(
                "History error:",
                error.response?.data || error.message
            );
        }
    }

    // ============================================================
    // CONDITIONS
    // ============================================================

    async function fetchConditions() {

        try {

            const response = await api.get(
                "medicines/conditions/"
            );

            setConditions(
                Array.isArray(response.data)
                    ? response.data
                    : Array.isArray(response.data?.results)
                        ? response.data.results
                        : []
            );

        } catch (error) {

            console.log(
                "Conditions error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {

                localStorage.removeItem("access");
                localStorage.removeItem("refresh");

                navigate("/login");
            }
        }
    }

    // ============================================================
    // MEDICINE NOTIFICATIONS
    // ============================================================

    async function checkNotifications() {

        try {

            const response = await api.get(
                "reminders/"
            );

            const reminderList =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            const now = new Date();

            const currentTime =
                `${String(now.getHours()).padStart(2, "0")}:` +
                `${String(now.getMinutes()).padStart(2, "0")}`;

            reminderList.forEach(reminder => {

                const reminderTime =
                    reminder.reminder_time
                        ? String(reminder.reminder_time).slice(0, 5)
                        : "";

                const reminderKey =
                    `pillsync_med_reminder_${reminder.id}_${now.toISOString().slice(0, 10)}_${reminderTime}`;

                const alreadyShown =
                    sessionStorage.getItem(reminderKey);

                if (
                    reminderTime === currentTime &&
                    (reminder.is_taken === false ||
                    reminder.is_taken === 0 ||
                    reminder.is_taken === "false") &&
                    reminder.status === "Pending" &&
                    !alreadyShown
                ) {
                    sessionStorage.setItem(
                        reminderKey,
                        "1"
                    );

                    showNotification(reminder);
                }
            });

            setReminders(reminderList);

        } catch (error) {

            console.log(
                "Notification check error:",
                error.response?.data || error.message
            );
        }
    }

    // ============================================================
    // SHOW NOTIFICATION
    // ============================================================

    const showNotification = (reminder) => {

        if (!("Notification" in window)) {
            return;
        }

        if (Notification.permission !== "granted") {
            return;
        }

        const medicineName =
            reminder?.medicine_name || "Medicine";

        try {

            const notification =
                new Notification(
                    "💊 PillSync Reminder",
                    {
                        body:
                            `Time to take ${medicineName}\n` +
                            `Reminder: ${reminder.reminder_time}`,

                        icon:
                            "/images/pillsync-logo.png",

                        tag:
                            `medicine-reminder-${reminder.id}`
                    }
                );

            notification.onclick = () => {

                window.focus();
                notification.close();

            };

        } catch (error) {

            console.log(
                "Medicine notification error:",
                error
            );
        }
    };

    // ============================================================
    // REFILL NOTIFICATIONS
    // ============================================================

    async function checkRefillNotifications() {

        try {

            const entries = Object.entries(refillData || {});

            if (entries.length === 0) {
                return;
            }

            entries.forEach(([medicineId, data]) => {

                const predictionData =
                    data?.prediction;

                if (!predictionData) {
                    return;
                }

                const medicine =
                    data?.medicine || medicines.find(
                        item => String(item.id) === String(medicineId)
                    );

                if (!medicine) {
                    return;
                }

                if (
                    predictionData.out_of_stock === true
                ) {
                    showRefillNotification(
                        medicine,
                        "Out of Stock"
                    );
                } else if (
                    predictionData.low_stock === true
                ) {
                    showRefillNotification(
                        medicine,
                        "Low Stock"
                    );
                }
            });

        } catch (error) {

            console.log(
                "Refill notification error:",
                error.response?.data || error.message
            );
        }
    }

    // ============================================================
    // REFILL NOTIFICATION
    // ============================================================

    const showRefillNotification = (
        medicine,
        stockStatus
    ) => {

        if (!("Notification" in window)) {
            return;
        }

        if (Notification.permission !== "granted") {
            return;
        }

        const medicineId = medicine?.id;

        const medicineName =
            medicine?.medicine_name || "Medicine";

        if (!medicineId) {
            return;
        }

        const storageKey =
            `pillsync_refill_alert_${medicineId}_${stockStatus}`;

        const lastAlert =
            localStorage.getItem(storageKey);

        const now = Date.now();

        const cooldown =
            6 * 60 * 60 * 1000;

        if (
            lastAlert &&
            now - Number(lastAlert) < cooldown
        ) {
            return;
        }

        const message =
            stockStatus === "Out of Stock"
                ? `${medicineName} is out of stock. Please arrange a refill.`
                : `${medicineName} is running low. Please arrange a refill.`;

        try {

            const notification =
                new Notification(
                    "🔄 PillSync Refill Alert",
                    {
                        body: message,

                        icon:
                            "/images/pillsync-logo.png",

                        tag:
                            `refill-${medicineId}-${stockStatus}`
                    }
                );

            localStorage.setItem(
                storageKey,
                String(now)
            );

            notification.onclick = () => {

                window.focus();
                notification.close();

                navigate("/refill");
            };

        } catch (error) {

            console.log(
                "Refill notification error:",
                error
            );
        }
    };

    // ============================================================
    // MARK TAKEN
    // ============================================================

    const markAsTaken = async (id) => {

        try {

            await api.patch(
                `reminders/${id}/taken/`
            );

            await fetchReminders();
            await fetchHistory();

        } catch (error) {

            console.log(
                "Taken error:",
                error.response?.data || error.message
            );

            alert(
                "Failed to mark medicine as taken."
            );
        }
    };

    // ============================================================
    // DELETE REMINDER
    // ============================================================

    const deleteReminder = async (id) => {

        const confirmed =
            window.confirm(
                "Delete this reminder?"
            );

        if (!confirmed) {
            return;
        }

        try {

            await api.delete(
                `reminders/${id}/`
            );

            await fetchReminders();

        } catch (error) {

            console.log(
                "Delete error:",
                error.response?.data || error.message
            );
        }
    };

    // ============================================================
    // FORMAT DATE
    // ============================================================

    const formatHistoryDate = (date) => {

        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );
    };

    // ============================================================
    // ML FORM CHANGE
    // ============================================================

    const handlePatientDataChange = (e) => {

        setPatientData({
            ...patientData,
            [e.target.name]: e.target.value
        });
    };

    // ============================================================
    // AI ADHERENCE PREDICTION
    // ============================================================

    const predictAdherence = async () => {

        for (
            const [key, value]
            of Object.entries(patientData)
        ) {

            if (value === "") {

                alert(
                    `Please enter ${key.replaceAll("_", " ")}`
                );

                return;
            }
        }

        const age =
            Number(patientData.Age);

        const dosage =
            Number(patientData.Dosage_mg);

        const adherence =
            Number(patientData.Previous_Adherence);

        const income =
            Number(patientData.Income);

        const comorbidities =
            Number(patientData.Comorbidities_Count);

        if (
            Number.isNaN(age) ||
            age <= 0 ||
            age > 120
        ) {

            alert(
                "Please enter a valid age between 1 and 120."
            );

            return;
        }

        if (
            Number.isNaN(dosage) ||
            dosage < 0
        ) {

            alert(
                "Please enter a valid dosage."
            );

            return;
        }

        if (
            Number.isNaN(adherence) ||
            adherence < 0 ||
            adherence > 1
        ) {

            alert(
                "Previous Adherence must be between 0 and 1."
            );

            return;
        }

        if (
            Number.isNaN(income) ||
            income < 0
        ) {

            alert(
                "Please enter a valid income."
            );

            return;
        }

        if (
            Number.isNaN(comorbidities) ||
            comorbidities < 0
        ) {

            alert(
                "Please enter a valid comorbidities count."
            );

            return;
        }

        try {

            setPredictionLoading(true);
            setPrediction(null);

            const requestData = {

                Age: age,

                Gender:
                    patientData.Gender,

                Medication_Type:
                    patientData.Medication_Type,

                Dosage_mg:
                    dosage,

                Previous_Adherence:
                    adherence,

                Education_Level:
                    patientData.Education_Level,

                Income:
                    income,

                Social_Support_Level:
                    patientData.Social_Support_Level,

                Condition_Severity:
                    patientData.Condition_Severity,

                Comorbidities_Count:
                    comorbidities,

                Healthcare_Access:
                    patientData.Healthcare_Access,

                Mental_Health_Status:
                    patientData.Mental_Health_Status,

                Insurance_Coverage:
                    Number(
                        patientData.Insurance_Coverage
                    )
            };

            const response =
                await api.post(
                    "ml/predict/",
                    requestData
                );

            setPrediction(
                response.data?.prediction || null
            );

        } catch (error) {

            console.log(
                "Prediction error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {

                localStorage.removeItem("access");
                localStorage.removeItem("refresh");

                alert(
                    "Your login session has expired. Please login again."
                );

                navigate("/login");

                return;
            }

            alert(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to generate adherence prediction."
            );

        } finally {

            setPredictionLoading(false);
        }
    };

    // ============================================================
    // STATISTICS
    // ============================================================

    const totalMedicines =
        medicines.length;

    const enabledReminders =
        medicines.filter(
            medicine =>
                medicine.reminder_enabled
        ).length;
    const takenHistory =
        history.filter(
            item =>
                item.status === "Taken"
        ).length;

    const missedHistory =
        history.filter(
            item =>
                item.status === "Missed"
        ).length;
    const lowStockCount =
        Object.values(refillData).filter(
            item =>
                item?.prediction?.low_stock === true
        ).length;

    const outOfStockCount =
        Object.values(refillData).filter(
            item =>
                item?.prediction?.out_of_stock === true
        ).length;

    // ============================================================
    // ADHERENCE SUMMARY
    // ============================================================

    const totalCompleted =
        takenHistory + missedHistory;

    const adherencePercentage =
        totalCompleted > 0
            ? Math.round(
                (takenHistory / totalCompleted) * 100
            )
            : 0;

    const adherenceLabel =
        adherencePercentage >= 90
            ? "Excellent"
            : adherencePercentage >= 75
                ? "Good"
                : adherencePercentage >= 50
                    ? "Needs Attention"
                    : "Critical";

    // ============================================================
    // AI PREDICTION VALUES
    // ============================================================

    const rawPredictionProbability =
        Number(
            prediction?.probability
        );

    const predictionProbability =
        Number.isFinite(rawPredictionProbability)
            ? Math.max(
                0,
                Math.min(
                    100,
                    rawPredictionProbability
                )
            )
            : 0;

    const predictionIsLowRisk =
        prediction?.risk_level === "Low Risk";

    const predictionColor =
        predictionIsLowRisk
            ? "#16a34a"
            : "#dc2626";

    // ============================================================
    // GREETING
    // ============================================================

    const currentHour =
        new Date().getHours();

    const greeting =
        currentHour < 12
            ? "Good Morning"
            : currentHour < 18
                ? "Good Afternoon"
                : "Good Evening";

    // ============================================================
    // RETURN
    // ============================================================

    return (

        <>

            <Navbar />

            <Sidebar />

            <main className="dashboard-main">

                {/* ==================================================
                    HERO
                ================================================== */}

                <section className="dashboard-hero">

                    <div className="hero-content">

                        <div className="hero-eyebrow">
                            PILL SYNC HEALTHCARE
                        </div>

                        <h1>
                            {greeting}, {username} 👋
                        </h1>

                        <p>
                            Your medication health overview is
                            ready. Stay consistent, stay healthy.
                        </p>

                        <div className="hero-actions">

                            <Link
                                to="/add-medicine"
                                className="hero-primary-button"
                            >
                                <span>＋</span>
                                Add Medicine
                            </Link>

                            <Link
                                to="/refill"
                                className="hero-secondary-button"
                            >
                                View Refill Status
                                <span>→</span>
                            </Link>

                        </div>

                    </div>

                    <div className="hero-visual">

                        <div className="hero-medical-circle">
                            💊
                        </div>

                        <div className="hero-floating-card">
                            <span>Medication Adherence</span>
                            <strong>{adherencePercentage}%</strong>
                            <small>{adherenceLabel}</small>
                        </div>

                    </div>

                </section>


                {/* ==================================================
                    OVERVIEW
                ================================================== */}

                <section className="overview-grid">

                    <OverviewCard
                        icon="💊"
                        label="Medicines"
                        value={totalMedicines}
                        text="Active medicines"
                        type="blue"
                    />

                    <OverviewCard
                        icon="⏰"
                        label="Reminders"
                        value={enabledReminders}
                        text="Enabled schedules"
                        type="purple"
                    />

                    <OverviewCard
                        icon="✓"
                        label="Adherence"
                        value={`${adherencePercentage}%`}
                        text={adherenceLabel}
                        type="green"
                    />

                    <OverviewCard
                        icon="📦"
                        label="Stock"
                        value={
                            outOfStockCount > 0
                                ? `${outOfStockCount} Critical`
                                : lowStockCount > 0
                                    ? `${lowStockCount} Low`
                                    : "Healthy"
                        }
                        text="Refill monitoring"
                        type={
                            outOfStockCount > 0
                                ? "red"
                                : lowStockCount > 0
                                    ? "orange"
                                    : "green"
                        }
                    />

                </section>


                {/* ==================================================
                    REFILL ALERT
                ================================================== */}

                {(lowStockCount > 0 ||
                    outOfStockCount > 0) && (

                    <section className="priority-alert">

                        <div className="priority-alert-icon">
                            !
                        </div>

                        <div className="priority-alert-text">

                            <strong>
                                Refill attention required
                            </strong>

                            <p>

                                {outOfStockCount > 0 &&
                                    `${outOfStockCount} medicine(s) are out of stock. `}

                                {lowStockCount > 0 &&
                                    `${lowStockCount} medicine(s) are running low.`}

                            </p>

                        </div>

                        <button
                            onClick={() =>
                                document
                                    .getElementById(
                                        "refill-section"
                                    )
                                    ?.scrollIntoView({
                                        behavior: "smooth"
                                    })
                            }
                        >
                            Check Stock →
                        </button>

                    </section>

                )}


                {/* ==================================================
                    QUICK ACTIONS
                ================================================== */}

                <section className="quick-section">

                    <div className="section-heading-simple">

                        <div>
                            <span>
                                QUICK ACCESS
                            </span>

                            <h2>
                                What would you like to do?
                            </h2>
                        </div>

                    </div>

                    <div className="quick-actions">

                        <QuickAction
                            icon="＋"
                            title="Add Medicine"
                            text="Create medication"
                            path="/add-medicine"
                        />

                        <QuickAction
                            icon="💊"
                            title="Medicines"
                            text="Manage medications"
                            path="/medicines"
                        />

                        <QuickAction
                            icon="⏰"
                            title="Reminders"
                            text="Manage schedules"
                            path="/reminders"
                        />

                        <QuickAction
                            icon="📊"
                            title="Adherence"
                            text="View analytics"
                            path="/adherence"
                        />

                        <QuickAction
                            icon="📦"
                            title="Refills"
                            text="Track medicine stock"
                            path="/refill"
                        />

                        <QuickAction
                            icon="📷"
                            title="Prescription"
                            text="Scan prescription"
                            path="/prescription"
                        />

                        <QuickAction
                            icon="🩺"
                            title="Conditions"
                            text="Health conditions"
                            path="/conditions"
                        />

                        {userRole?.toLowerCase() === "caregiver" && (

                            <QuickAction
                                icon="👥"
                                title="My Patients"
                                text="Monitor patients"
                                path="/caregiver/patients"
                            />

                        )}

                    </div>

                </section>


                {/* ==================================================
                    HEALTH CONDITIONS
                ================================================== */}

                <DashboardSection
                    title="Health Conditions"
                    subtitle="Your currently recorded health conditions."
                    icon="🩺"
                    actionText="Manage"
                    actionPath="/conditions"
                >

                    {conditions.length === 0 ? (

                        <EmptyState
                            icon="🩺"
                            title="No health conditions"
                            text="Add your health conditions to organize medication care."
                            buttonText="Add Condition"
                            path="/conditions"
                        />

                    ) : (

                        <div className="condition-grid">

                            {conditions
                                .slice(0, 6)
                                .map(condition => (

                                    <div
                                        key={condition.id}
                                        className={
                                            condition.is_active
                                                ? "condition-card active-condition"
                                                : "condition-card"
                                        }
                                    >

                                        <div className="condition-card-top">

                                            <div className="condition-icon">
                                                🩺
                                            </div>

                                            <span
                                                className={
                                                    condition.is_active
                                                        ? "status-badge active"
                                                        : "status-badge inactive"
                                                }
                                            >
                                                {
                                                    condition.is_active
                                                        ? "Active"
                                                        : "Inactive"
                                                }
                                            </span>

                                        </div>

                                        <h3>
                                            {
                                                condition.condition_name
                                            }
                                        </h3>

                                        {condition.description && (

                                            <p>
                                                {
                                                    condition.description
                                                }
                                            </p>

                                        )}

                                        {condition.diagnosed_date && (

                                            <small>
                                                Diagnosed:{" "}
                                                {
                                                    condition.diagnosed_date
                                                }
                                            </small>

                                        )}

                                    </div>

                                ))}

                        </div>

                    )}

                </DashboardSection>


                {/* ==================================================
                    AI ADHERENCE
                ================================================== */}

                <DashboardSection
                    title="AI Medication Adherence"
                    subtitle="Predict medication adherence risk using patient information."
                    icon="🤖"
                >

                    <div className="ai-layout">

                        <div className="ai-form">

                            <div className="form-grid">

                                <input
                                    name="Age"
                                    type="number"
                                    min="1"
                                    max="120"
                                    placeholder="Age"
                                    value={patientData.Age}
                                    onChange={handlePatientDataChange}
                                />

                                <SelectInput
                                    name="Gender"
                                    value={patientData.Gender}
                                    onChange={handlePatientDataChange}
                                    placeholder="Gender"
                                    options={[
                                        "Male",
                                        "Female",
                                        "Other"
                                    ]}
                                />

                                <SelectInput
                                    name="Medication_Type"
                                    value={patientData.Medication_Type}
                                    onChange={handlePatientDataChange}
                                    placeholder="Medication Type"
                                    options={[
                                        "TypeA",
                                        "TypeB",
                                        "TypeC"
                                    ]}
                                />

                                <input
                                    name="Dosage_mg"
                                    type="number"
                                    min="0"
                                    placeholder="Dosage (mg)"
                                    value={patientData.Dosage_mg}
                                    onChange={handlePatientDataChange}
                                />

                                <input
                                    name="Previous_Adherence"
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    placeholder="Previous Adherence (0-1)"
                                    value={patientData.Previous_Adherence}
                                    onChange={handlePatientDataChange}
                                />

                                <SelectInput
                                    name="Education_Level"
                                    value={patientData.Education_Level}
                                    onChange={handlePatientDataChange}
                                    placeholder="Education Level"
                                    options={[
                                        "High School",
                                        "Graduate",
                                        "Postgraduate"
                                    ]}
                                />

                                <input
                                    name="Income"
                                    type="number"
                                    min="0"
                                    placeholder="Income"
                                    value={patientData.Income}
                                    onChange={handlePatientDataChange}
                                />

                                <SelectInput
                                    name="Social_Support_Level"
                                    value={patientData.Social_Support_Level}
                                    onChange={handlePatientDataChange}
                                    placeholder="Social Support"
                                    options={[
                                        "Low",
                                        "Medium",
                                        "High"
                                    ]}
                                />

                                <SelectInput
                                    name="Condition_Severity"
                                    value={patientData.Condition_Severity}
                                    onChange={handlePatientDataChange}
                                    placeholder="Condition Severity"
                                    options={[
                                        "Mild",
                                        "Moderate",
                                        "Severe"
                                    ]}
                                />

                                <input
                                    name="Comorbidities_Count"
                                    type="number"
                                    min="0"
                                    placeholder="Comorbidities Count"
                                    value={patientData.Comorbidities_Count}
                                    onChange={handlePatientDataChange}
                                />

                                <SelectInput
                                    name="Healthcare_Access"
                                    value={patientData.Healthcare_Access}
                                    onChange={handlePatientDataChange}
                                    placeholder="Healthcare Access"
                                    options={[
                                        "Poor",
                                        "Average",
                                        "Good"
                                    ]}
                                />

                                <SelectInput
                                    name="Mental_Health_Status"
                                    value={patientData.Mental_Health_Status}
                                    onChange={handlePatientDataChange}
                                    placeholder="Mental Health Status"
                                    options={[
                                        "Poor",
                                        "Moderate",
                                        "Good"
                                    ]}
                                />

                                <SelectInput
                                    name="Insurance_Coverage"
                                    value={patientData.Insurance_Coverage}
                                    onChange={handlePatientDataChange}
                                    placeholder="Insurance Coverage"
                                    options={[
                                        {
                                            label: "Yes",
                                            value: "1"
                                        },
                                        {
                                            label: "No",
                                            value: "0"
                                        }
                                    ]}
                                />

                            </div>

                            <button
                                className="ai-predict-button"
                                onClick={predictAdherence}
                                disabled={predictionLoading}
                            >

                                {predictionLoading
                                    ? "🤖 Generating Prediction..."
                                    : "🤖 Predict Adherence"}

                            </button>

                        </div>


                        {prediction && (

                            <div className="prediction-result">

                                <div className="prediction-label">
                                    AI PREDICTION
                                </div>

                                <div
                                    className="prediction-circle"
                                    style={{
                                        background:
                                            `conic-gradient(
                                                ${predictionColor}
                                                ${predictionProbability}%,
                                                #e5e7eb
                                                ${predictionProbability}%
                                            )`
                                    }}
                                >

                                    <div className="prediction-circle-inner">

                                        <strong>
                                            {predictionProbability}%
                                        </strong>

                                        <span>
                                            Adherence
                                        </span>

                                    </div>

                                </div>

                                <div
                                    className={
                                        predictionIsLowRisk
                                            ? "prediction-status success"
                                            : "prediction-status danger"
                                    }
                                >

                                    {prediction.adherence === 1
                                        ? "✓ Likely Adherent"
                                        : "⚠ Likely Non-Adherent"}

                                </div>

                                <div className="risk-level">

                                    Risk Level:

                                    <strong>
                                        {prediction.risk_level}
                                    </strong>

                                </div>

                                <p>
                                    AI-generated estimate based on
                                    the provided patient information.
                                </p>

                            </div>

                        )}

                    </div>

                </DashboardSection>


                {/* ==================================================
                    REFILL PREDICTION
                ================================================== */}

                <div id="refill-section">

                    <DashboardSection
                        title="Smart Refill Prediction"
                        subtitle="AI-powered medicine stock monitoring and refill planning."
                        icon="📦"
                        actionText="Open Refill Manager"
                        actionPath="/refill"
                    >

                        {medicines.length === 0 ? (

                            <EmptyState
                                icon="📦"
                                title="No medicines available"
                                text="Add a medicine to start refill prediction."
                                buttonText="Add Medicine"
                                path="/add-medicine"
                            />

                        ) : (

                            <div className="refill-list">

                                {medicines.map(medicine => {

                                    const data =
                                        refillData[medicine.id];

                                    const predictionData =
                                        data?.prediction;

                                    if (!predictionData) {

                                        return (

                                            <div
                                                key={medicine.id}
                                                className="refill-card"
                                            >

                                                <div className="refill-loading-state">

                                                    <div className="mini-spinner" />

                                                    <div>
                                                        <strong>
                                                            {
                                                                medicine.medicine_name
                                                            }
                                                        </strong>

                                                        <span>
                                                            Calculating refill prediction...
                                                        </span>
                                                    </div>

                                                </div>

                                            </div>

                                        );
                                    }

                                    const stockStatus =
                                        predictionData.stock_status;

                                    const statusClass =
                                        stockStatus === "Out of Stock"
                                            ? "out"
                                            : stockStatus === "Low Stock"
                                                ? "low"
                                                : "good";

                                    const stock =
                                        Number(
                                            predictionData.remaining_stock || 0
                                        );

                                    const remainingDays =
                                        Number(
                                            predictionData.estimated_remaining_days || 0
                                        );

                                    const stockVisual =
                                        Math.min(
                                            100,
                                            Math.max(
                                                0,
                                                remainingDays * 5
                                            )
                                        );

                                    return (

                                        <div
                                            key={medicine.id}
                                            className="refill-card"
                                        >

                                            <div className="refill-header">

                                                <div className="refill-medicine">

                                                    <div className="refill-medicine-icon">
                                                        💊
                                                    </div>

                                                    <div>

                                                        <h3>
                                                            {
                                                                medicine.medicine_name
                                                            }
                                                        </h3>

                                                        <p>
                                                            {
                                                                medicine.dosage ||
                                                                "Dosage not specified"
                                                            }

                                                            {" • "}

                                                            {
                                                                medicine.frequency ||
                                                                "Frequency not specified"
                                                            }
                                                        </p>

                                                    </div>

                                                </div>

                                                <span
                                                    className={
                                                        `stock-badge ${statusClass}`
                                                    }
                                                >
                                                    ● {stockStatus}
                                                </span>

                                            </div>


                                            <div className="stock-progress-area">

                                                <div className="stock-progress-header">

                                                    <span>
                                                        Current Stock
                                                    </span>

                                                    <strong>
                                                        {stock} units
                                                    </strong>

                                                </div>

                                                <div className="stock-progress">

                                                    <div
                                                        className={
                                                            `stock-progress-fill ${statusClass}`
                                                        }
                                                        style={{
                                                            width:
                                                                `${stockVisual}%`
                                                        }}
                                                    />

                                                </div>

                                                <small>
                                                    Estimated {remainingDays} day(s)
                                                    remaining
                                                </small>

                                            </div>


                                            <div className="refill-info-grid">

                                                <RefillInfo
                                                    label="Doses / Day"
                                                    value={
                                                        `${predictionData.doses_per_day ?? 0}`
                                                    }
                                                />

                                                <RefillInfo
                                                    label="Quantity / Dose"
                                                    value={
                                                        `${predictionData.quantity_per_dose ?? 1}`
                                                    }
                                                />

                                                <RefillInfo
                                                    label="Daily Consumption"
                                                    value={
                                                        `${predictionData.daily_consumption ?? 0} units`
                                                    }
                                                />

                                                <RefillInfo
                                                    label="Remaining Days"
                                                    value={
                                                        `${predictionData.estimated_remaining_days ?? 0}`
                                                    }
                                                />

                                                <RefillInfo
                                                    label="Depletion Date"
                                                    value={
                                                        predictionData.estimated_depletion_date ||
                                                        "-"
                                                    }
                                                />

                                                <RefillInfo
                                                    label="Recommended Refill"
                                                    value={
                                                        predictionData.recommended_refill_date ||
                                                        "-"
                                                    }
                                                />

                                            </div>


                                            {predictionData.low_stock &&
                                                !predictionData.out_of_stock && (

                                                    <div className="refill-warning low-warning">

                                                        <span>⚠</span>

                                                        <div>
                                                            <strong>
                                                                Low stock
                                                            </strong>

                                                            <p>
                                                                Please arrange a refill soon.
                                                            </p>
                                                        </div>

                                                    </div>

                                                )}


                                            {predictionData.out_of_stock && (

                                                <div className="refill-warning out-warning">

                                                    <span>!</span>

                                                    <div>
                                                        <strong>
                                                            Medicine unavailable
                                                        </strong>

                                                        <p>
                                                            This medicine is out of stock.
                                                            A refill is required.
                                                        </p>
                                                    </div>

                                                </div>

                                            )}


                                            {data?.message && (

                                                <div className="refill-message">
                                                    ℹ {data.message}
                                                </div>

                                            )}

                                            <div className="refill-card-footer">

                                                <button
                                                    onClick={() =>
                                                        navigate("/refill")
                                                    }
                                                >
                                                    Manage Refill →
                                                </button>

                                            </div>

                                        </div>

                                    );

                                })}

                            </div>

                        )}

                    </DashboardSection>

                </div>


                {/* ==================================================
                    TODAY'S REMINDERS
                ================================================== */}

                <DashboardSection
                    title="Today's Medication"
                    subtitle="Stay on track with your scheduled medicine reminders."
                    icon="⏰"
                    actionText="View All"
                    actionPath="/reminders"
                >

                    {reminders.length === 0 ? (

                        <EmptyState
                            icon="⏰"
                            title="No reminders available"
                            text="Create a reminder for your medicines."
                            buttonText="Manage Reminders"
                            path="/reminders"
                        />

                    ) : (

                        <div className="reminder-list">

                            {reminders
                                .slice(0, 6)
                                .map(reminder => (

                                    <div
                                        key={reminder.id}
                                        className="reminder-card"
                                    >

                                        <div className="reminder-icon">
                                            💊
                                        </div>

                                        <div className="reminder-details">

                                            <h3>
                                                {
                                                    reminder.medicine_name ||
                                                    "Medicine"
                                                }
                                            </h3>

                                            <span>
                                                ⏰{" "}
                                                {
                                                    reminder.reminder_time ||
                                                    "-"
                                                }
                                            </span>

                                        </div>

                                        <div className="reminder-actions">

                                            <span
                                                className={
                                                    reminder.is_taken
                                                        ? "reminder-status taken"
                                                        : "reminder-status pending"
                                                }
                                            >
                                                {
                                                    reminder.is_taken
                                                        ? "✓ Taken"
                                                        : "Pending"
                                                }
                                            </span>

                                            {!reminder.is_taken && (

                                                <button
                                                    className="small-success-button"
                                                    onClick={() =>
                                                        markAsTaken(
                                                            reminder.id
                                                        )
                                                    }
                                                >
                                                    Mark Taken
                                                </button>

                                            )}

                                            <button
                                                className="small-delete-button"
                                                onClick={() =>
                                                    deleteReminder(
                                                        reminder.id
                                                    )
                                                }
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </div>

                                ))}

                        </div>

                    )}

                </DashboardSection>


                {/* ==================================================
                    MEDICINES
                ================================================== */}

                <DashboardSection
                    title="Your Medicines"
                    subtitle="Overview of your currently added medications."
                    icon="💊"
                    actionText="View All"
                    actionPath="/medicines"
                >

                    {medicines.length === 0 ? (

                        <EmptyState
                            icon="💊"
                            title="No medicines"
                            text="Add your first medicine to PillSync."
                            buttonText="Add Medicine"
                            path="/add-medicine"
                        />

                    ) : (

                        <div className="medicine-overview-grid">

                            {medicines
                                .slice(0, 6)
                                .map(medicine => (

                                    <div
                                        key={medicine.id}
                                        className="medicine-overview-card"
                                    >

                                        <div className="medicine-overview-icon">
                                            💊
                                        </div>

                                        <div className="medicine-overview-info">

                                            <h3>
                                                {
                                                    medicine.medicine_name
                                                }
                                            </h3>

                                            <p>
                                                {
                                                    medicine.dosage ||
                                                    "Dosage not specified"
                                                }
                                            </p>

                                            <span>
                                                {
                                                    medicine.frequency ||
                                                    "Frequency not specified"
                                                }
                                            </span>

                                        </div>

                                        <div
                                            className={
                                                medicine.reminder_enabled
                                                    ? "medicine-enabled"
                                                    : "medicine-disabled"
                                            }
                                        >
                                            {medicine.reminder_enabled
                                                ? "Reminder On"
                                                : "Reminder Off"}
                                        </div>

                                    </div>

                                ))}

                        </div>

                    )}

                </DashboardSection>


                {/* ==================================================
                    MEDICATION HISTORY
                ================================================== */}

                <DashboardSection
                    title="Recent Medication Activity"
                    subtitle="Your latest taken and missed medication records."
                    icon="📋"
                    actionText="Full History"
                    actionPath="/medication-history"
                >

                    {history.length === 0 ? (

                        <EmptyState
                            icon="📋"
                            title="No medication history"
                            text="Your medication activity will appear here."
                            buttonText="View History"
                            path="/medication-history"
                        />

                    ) : (

                        <div className="history-timeline">

                            {history
                                .slice(0, 5)
                                .map(item => (

                                    <div
                                        key={item.id}
                                        className="history-item"
                                    >

                                        <div
                                            className={
                                                item.status === "Taken"
                                                    ? "history-dot taken"
                                                    : "history-dot missed"
                                            }
                                        >
                                            {item.status === "Taken"
                                                ? "✓"
                                                : "!"}
                                        </div>

                                        <div className="history-item-content">

                                            <strong>
                                                {
                                                    item.medicine_name ||
                                                    "Medicine"
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    formatHistoryDate(
                                                        item.taken_at
                                                    )
                                                }
                                            </span>

                                        </div>

                                        <span
                                            className={
                                                item.status === "Taken"
                                                    ? "history-status taken"
                                                    : "history-status missed"
                                            }
                                        >
                                            {item.status}
                                        </span>

                                    </div>

                                ))}

                        </div>

                    )}

                </DashboardSection>


                {/* ==================================================
                    PRESCRIPTION SCANNER
                ================================================== */}

                <DashboardSection
                    title="Smart Prescription Scanner"
                    subtitle="Extract medicine information from prescription images."
                    icon="📷"
                    actionText="Open Scanner"
                    actionPath="/prescription"
                >

                    <div className="scanner-card">

                        <div className="scanner-visual">
                            <div className="scanner-big-icon">
                                📷
                            </div>

                            <div className="scanner-orbit orbit-one" />
                            <div className="scanner-orbit orbit-two" />

                        </div>

                        <div className="scanner-content">

                            <span className="scanner-label">
                                OCR + AI RECOGNITION
                            </span>

                            <h3>
                                Turn prescriptions into
                                structured medicine data.
                            </h3>

                            <p>
                                Upload or capture a prescription
                                image and extract medicine information
                                for faster medication management.
                            </p>

                            <div className="scanner-features">

                                <span>✓ Printed OCR</span>
                                <span>✓ Handwriting recognition</span>
                                <span>✓ Medicine extraction</span>

                            </div>

                            <div className="scanner-warning">

                                ⚠ Always verify extracted medicine
                                name, dosage and frequency against
                                the original prescription.

                            </div>

                        </div>

                    </div>

                </DashboardSection>


                {/* ==================================================
                    FOOTER
                ================================================== */}

                <footer className="dashboard-footer">

                    <div>
                        <strong>
                            PillSync
                        </strong>

                        <span>
                            Intelligent Medication Management Platform
                        </span>
                    </div>

                    <span>
                        Medication • Adherence • Refill • Care
                    </span>

                </footer>

            </main>

        </>

    );
}


// ============================================================
// OVERVIEW CARD
// ============================================================

function OverviewCard({
    icon,
    label,
    value,
    text,
    type
}) {

    return (

        <div
            className={
                `overview-card overview-${type}`
            }
        >

            <div className="overview-icon">
                {icon}
            </div>

            <div className="overview-info">

                <span>
                    {label}
                </span>

                <strong>
                    {value}
                </strong>

                <small>
                    {text}
                </small>

            </div>

        </div>

    );
}


// ============================================================
// QUICK ACTION
// ============================================================

function QuickAction({
    icon,
    title,
    text,
    path
}) {

    return (

        <Link
            to={path}
            className="quick-action"
        >

            <div className="quick-action-icon">
                {icon}
            </div>

            <div className="quick-action-content">

                <strong>
                    {title}
                </strong>

                <span>
                    {text}
                </span>

            </div>

            <span className="quick-arrow">
                →
            </span>

        </Link>

    );
}


// ============================================================
// DASHBOARD SECTION
// ============================================================

function DashboardSection({
    title,
    subtitle,
    icon,
    children,
    actionText,
    actionPath,
    onAction
}) {

    return (

        <section className="dashboard-section">

            <div className="section-header">

                <div className="section-title-area">

                    <div className="section-icon">
                        {icon}
                    </div>

                    <div>

                        <span className="section-kicker">
                            PILL SYNC
                        </span>

                        <h2>
                            {title}
                        </h2>

                        <p>
                            {subtitle}
                        </p>

                    </div>

                </div>

                {actionText && actionPath && (

                    <Link
                        to={actionPath}
                        className="section-action"
                    >
                        {actionText} →
                    </Link>

                )}

                {actionText && onAction && (

                    <button
                        onClick={onAction}
                        className="section-action-button"
                    >
                        {actionText}
                    </button>

                )}

            </div>

            <div className="section-content">
                {children}
            </div>

        </section>

    );
}


// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
    icon,
    title,
    text,
    buttonText,
    path
}) {

    return (

        <div className="empty-state">

            <div className="empty-icon">
                {icon}
            </div>

            <h3>
                {title}
            </h3>

            <p>
                {text}
            </p>

            <Link
                to={path}
                className="empty-button"
            >
                {buttonText} →
            </Link>

        </div>

    );
}


// ============================================================
// SELECT INPUT
// ============================================================

function SelectInput({
    name,
    value,
    onChange,
    placeholder,
    options
}) {

    return (

        <select
            name={name}
            value={value}
            onChange={onChange}
        >

            <option value="">
                Select {placeholder}
            </option>

            {options.map((option, index) => {

                const optionValue =
                    typeof option === "object"
                        ? option.value
                        : option;

                const optionLabel =
                    typeof option === "object"
                        ? option.label
                        : option;

                return (

                    <option
                        key={`${optionValue}-${index}`}
                        value={optionValue}
                    >
                        {optionLabel}
                    </option>

                );

            })}

        </select>

    );
}


// ============================================================
// REFILL INFO
// ============================================================

function RefillInfo({
    label,
    value
}) {

    return (

        <div className="refill-info">

            <span>
                {label}
            </span>

            <strong>
                {value}
            </strong>

        </div>

    );
}


export default Dashboard;
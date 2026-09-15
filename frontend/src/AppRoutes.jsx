import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import AddMedicine from "./pages/AddMedicine";
import MedicineList from "./pages/MedicineList";
import MedicineDetails from "./pages/MedicineDetails";
import EditMedicine from "./pages/EditMedicine";

import Profile from "./pages/Profile";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import AdminDashboard from "./pages/AdminDashboard";

import Reminder from "./pages/Reminder";

import MedicationHistory from "./pages/MedicationHistory";

import MedicineOCR from "./pages/MedicineOCR";

import Prescription from "./pages/Prescription";

import Conditions from "./pages/Conditions";

import CaregiverPatients from "./pages/CaregiverPatients";

import PatientDetails from "./pages/PatientDetails";

// ==================================================
// ADHERENCE ANALYTICS
// ==================================================

import Adherence from "./pages/Adherence";

// ==================================================
// REFILL MANAGEMENT
// ==================================================

import Refill from "./pages/Refill";
import RefillAnalytics from "./pages/RefillAnalytics";

// ==================================================
// SMART NOTIFICATIONS
// ==================================================

import Notifications from "./pages/Notifications";


function AppRoutes() {

    return (

        <BrowserRouter>

            <Routes>


                {/* ==================================================
                    HOME
                ================================================== */}

                <Route
                    path="/"
                    element={<Home />}
                />


                {/* ==================================================
                    AUTHENTICATION
                ================================================== */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* ==================================================
                    PASSWORD
                ================================================== */}

                <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                />

                <Route
                    path="/reset-password"
                    element={<ResetPassword />}
                />


                {/* ==================================================
                    PATIENT / CAREGIVER DASHBOARD
                ================================================== */}

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />


                {/* ==================================================
                    ADMIN DASHBOARD
                ================================================== */}

                <Route
                    path="/admin-dashboard"
                    element={<AdminDashboard />}
                />


                {/* ==================================================
                    PROFILE
                ================================================== */}

                <Route
                    path="/profile"
                    element={<Profile />}
                />


                {/* ==================================================
                    MEDICINE
                ================================================== */}

                <Route
                    path="/add-medicine"
                    element={<AddMedicine />}
                />

                <Route
                    path="/medicines"
                    element={<MedicineList />}
                />


                {/* ==================================================
                    MEDICINE DETAILS
                    VIEW MEDICINE
                ================================================== */}

                <Route
                    path="/medicine/:id"
                    element={<MedicineDetails />}
                />

                <Route
                    path="/edit-medicine/:id"
                    element={<EditMedicine />}
                />


                {/* ==================================================
                    REMINDERS
                ================================================== */}

                <Route
                    path="/reminders"
                    element={<Reminder />}
                />


                {/* ==================================================
                    MEDICATION HISTORY
                ================================================== */}

                <Route
                    path="/medication-history"
                    element={<MedicationHistory />}
                />


                {/* ==================================================
                    ADHERENCE ANALYTICS
                    MODULE 5
                ================================================== */}

                <Route
                    path="/adherence"
                    element={<Adherence />}
                />


                {/* ==================================================
                    REFILL MANAGEMENT
                    MODULE 6
                ================================================== */}

                <Route
                    path="/refill"
                    element={<Refill />}
                />

                <Route
                    path="/refill-analytics"
                    element={<RefillAnalytics />}
                />


                {/* ==================================================
                    SMART NOTIFICATIONS
                    MODULE 8
                ================================================== */}

                <Route
                    path="/notifications"
                    element={<Notifications />}
                />


                {/* ==================================================
                    MEDICINE OCR
                    MODULE 3
                ================================================== */}

                <Route
                    path="/medicine-ocr"
                    element={<MedicineOCR />}
                />


                {/* ==================================================
                    PRESCRIPTION OCR + MANAGEMENT
                    MODULE 3
                ================================================== */}

                <Route
                    path="/prescription"
                    element={<Prescription />}
                />


                {/* ==================================================
                    HEALTH CONDITIONS
                    MODULE 2
                ================================================== */}

                <Route
                    path="/conditions"
                    element={<Conditions />}
                />


                {/* ==================================================
                    CAREGIVER
                    MODULE 1
                ================================================== */}

                <Route
                    path="/caregiver/patients"
                    element={<CaregiverPatients />}
                />


                {/* ==================================================
                    INDIVIDUAL PATIENT DETAILS
                    CAREGIVER
                ================================================== */}

                <Route
                    path="/caregiver/patient/:id"
                    element={<PatientDetails />}
                />


            </Routes>

        </BrowserRouter>

    );

}


export default AppRoutes;
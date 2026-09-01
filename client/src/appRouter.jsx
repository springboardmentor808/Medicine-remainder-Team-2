import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './AppInteractive.jsx';
import PatientLayout from './layouts/PatientLayout.jsx';

function RouteError() {
  return <div className="p-8 max-w-xl mx-auto"><div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm">Something went wrong. <a href="/" className="underline">Go home</a></div></div>;
}

const PatientHome = lazy(() => import('./pages/patient/Home.jsx'));
const PatientMedicines = lazy(() => import('./pages/patient/Medicines.jsx'));
const PatientAdherence = lazy(() => import('./pages/patient/Adherence.jsx'));
const PatientHistory = lazy(() => import('./pages/patient/History.jsx'));
const PatientRefill = lazy(() => import('./pages/patient/Refill.jsx'));
const PatientSchedule = lazy(() => import('./pages/patient/Schedule.jsx'));
const PatientPrescriptions = lazy(() => import('./pages/patient/Prescriptions.jsx'));
const PatientProfile = lazy(() => import('./pages/patient/PatientProfile.jsx'));
const PatientSidebar = lazy(() => import('./components/PatientSidebar.jsx'));
const CaregiverHome = lazy(() => import('./pages/caregiver/Home.jsx'));
const CaregiverAlerts = lazy(() => import('./pages/caregiver/Alerts.jsx'));
const PatientDetail = lazy(() => import('./pages/caregiver/PatientDetail.jsx'));
const CaregiverPatientDetail = lazy(() => import('./pages/caregiver/CaregiverPatientDetail.jsx'));

export const router = createBrowserRouter([
  { path: '/', element: <App />, errorElement: <RouteError /> },
  // Legacy shell routes (keep existing navbar)
  { path: '/patient/home', element: <Suspense fallback={<div>Loading...</div>}><PatientHome /></Suspense>, errorElement: <RouteError /> },
  { path: '/patient/medicines', element: <Suspense fallback={<div>Loading...</div>}><PatientMedicines /></Suspense>, errorElement: <RouteError /> },
  { path: '/patient/adherence', element: <Suspense fallback={<div>Loading...</div>}><PatientAdherence /></Suspense>, errorElement: <RouteError /> },
  { path: '/patient/history', element: <Suspense fallback={<div>Loading...</div>}><PatientHistory /></Suspense>, errorElement: <RouteError /> },
  { path: '/patient/refill', element: <Suspense fallback={<div>Loading...</div>}><PatientRefill /></Suspense>, errorElement: <RouteError /> },
  // New Tailwind-only patient routes with Sidebar (adds without changing existing navbar)
  {
    element: <PatientLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/patient/schedule', element: <Suspense fallback={<div>Loading...</div>}><PatientSchedule /></Suspense> },
      { path: '/patient/prescriptions', element: <Suspense fallback={<div>Loading...</div>}><PatientPrescriptions /></Suspense> },
      { path: '/patient/profile', element: <Suspense fallback={<div>Loading...</div>}><PatientProfile /></Suspense> },
    ],
  },
  { path: '/caregiver/home', element: <Suspense fallback={<div>Loading...</div>}><CaregiverHome /></Suspense>, errorElement: <RouteError /> },
  { path: '/caregiver/alerts', element: <Suspense fallback={<div>Loading...</div>}><CaregiverAlerts /></Suspense>, errorElement: <RouteError /> },
  // Caregiver detail — new Tailwind mapping (mock-aware) + legacy fallback
  { path: '/caregiver/patients/:patientId', element: <Suspense fallback={<div>Loading...</div>}><CaregiverPatientDetail /></Suspense>, errorElement: <RouteError /> },
  { path: '/caregiver/patients/:patientId/detail', element: <Suspense fallback={<div>Loading...</div>}><CaregiverPatientDetail /></Suspense>, errorElement: <RouteError /> },
  // keep old detail accessible via legacy param for deep links
  { path: '/caregiver/legacy/:patientId/detail', element: <Suspense fallback={<div>Loading...</div>}><PatientDetail /></Suspense>, errorElement: <RouteError /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);

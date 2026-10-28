import { Route, Routes, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Processing from "./pages/Processing";
import Evidence from "./pages/Evidence";
import Verified from "./pages/Verified";
import Records from "./pages/Records";
import Sharing from "./pages/Sharing";
import DoctorLayout from "./components/doctor/DoctorLayout";
import DoctorLogin from "./pages/doctor/DoctorLogin";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import PatientCases from "./pages/doctor/PatientCases";
import ReportReview from "./pages/doctor/ReportReview";
import HistoricalRecords from "./pages/doctor/HistoricalRecords";
import ClinicalNotes from "./pages/doctor/ClinicalNotes";
import AuditHistory from "./pages/doctor/AuditHistory";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/reports/:id/processing" element={<Processing />} />
        <Route path="/reports/:id" element={<Evidence />} />
        <Route path="/verified" element={<Verified />} />
        <Route path="/records" element={<Records />} />
        <Route path="/sharing" element={<Sharing />} />
      </Route>
      <Route path="/doctor/login" element={<DoctorLogin />} />
      <Route path="/doctor" element={<DoctorLayout />}>
        <Route index element={<DoctorDashboard />} />
        <Route path="cases" element={<PatientCases />} />
        <Route path="reports/:id" element={<ReportReview />} />
        <Route path="history" element={<HistoricalRecords />} />
        <Route path="notes" element={<ClinicalNotes />} />
        <Route path="audit" element={<AuditHistory />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

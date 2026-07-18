import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import CompanySetup from "./pages/CompanySetup";
import Dashboard from "./pages/Dashboard";
import TaskChat from "./pages/TaskChat";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/company-setup" element={
        <ProtectedRoute requireCompany={false}><CompanySetup /></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/task/:id" element={
        <ProtectedRoute><TaskChat /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
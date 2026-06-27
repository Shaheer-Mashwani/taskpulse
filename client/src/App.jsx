import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SelectRole from "./pages/SelectRole";
import Dashboard from "./pages/Dashboard";
import TaskChat from "./pages/TaskChat";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/select-role" element={<ProtectedRoute requireRole={false}><SelectRole /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/task/:id" element={<ProtectedRoute><TaskChat /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Suggestions from "./pages/Suggestions";
import Applications from "./pages/Applications";
import Analytics from "./pages/Analytics";
import Extension from "./pages/Extension";
import { getToken } from "./api/client";

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  return getToken() ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gradient-to-b dark:from-gray-950 dark:via-gray-900 dark:to-black dark:text-white">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/suggestions"
          element={
            <PrivateRoute>
              <Suggestions />
            </PrivateRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <PrivateRoute>
              <Applications />
            </PrivateRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <PrivateRoute>
              <Analytics />
            </PrivateRoute>
          }
        />
        <Route
          path="/extension"
          element={
            <PrivateRoute>
              <Extension />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

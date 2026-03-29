import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Suggestions from "./pages/Suggestions";
import Applications from "./pages/Applications";
import Analytics from "./pages/Analytics";
import Extension from "./pages/Extension";
import { getToken } from "./api/client";

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-[#0f0a0d] dark:text-wine-50">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
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
      </BrowserRouter>
    </div>
  );
}

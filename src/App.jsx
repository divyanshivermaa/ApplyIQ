import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Suggestions from "./pages/Suggestions";
import { getToken } from "./api/client";

function PrivateRoute({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={(
            <PrivateRoute>
              <Suggestions />
            </PrivateRoute>
          )}
        />
        <Route
          path="/suggestions"
          element={(
            <PrivateRoute>
              <Suggestions />
            </PrivateRoute>
          )}
        />
      </Routes>
    </BrowserRouter>
  );
}

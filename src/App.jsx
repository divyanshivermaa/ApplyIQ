import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Suggestions from "./pages/Suggestions";
import { getToken } from "./api/client";

function PrivateRoute({ children }) {
  const token = getToken();
  return token ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
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

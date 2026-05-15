import { Link, useLocation } from "react-router-dom";
import { clearToken } from "../api/client";

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? "text-blue-600 font-medium" : "text-gray-700";

  return (
    <div className="border-b bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
          Internship Intelligence
        </Link>
        <div className="flex gap-1">
          <Link 
            to="/" 
            className={`px-3 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors ${isActive('/')}`}
          >
            Home
          </Link>
          <Link 
            to="/dashboard" 
            className={`px-3 py-2 rounded-lg text-sm hover:bg-blue-50 transition-colors ${isActive('/dashboard')}`}
          >
            Dashboard
          </Link>
        </div>
        <button
          className="text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={() => {
            clearToken();
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

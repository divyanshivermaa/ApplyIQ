import { Link } from "react-router-dom";
import { clearToken } from "../api/client";

export default function Navbar() {
  return (
    <div className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">Internship Intelligence</div>
        <div className="flex gap-2">
          <Link to="/suggestions" className="px-3 py-2 rounded-lg text-sm hover:bg-gray-100">
            Suggestions
          </Link>
        </div>
        <button
          className="text-sm px-3 py-2 rounded-lg border hover:bg-gray-50"
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

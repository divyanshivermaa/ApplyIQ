import { Link } from "react-router-dom";
import { getToken } from "../api/client";
import chromeExtensionCapture from "../assets/chrome-extension-capture.png";

export default function Landing() {
  const isLoggedIn = !!getToken();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">Internship Intelligence</div>
          <div className="flex gap-4">
            {isLoggedIn ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="px-4 py-2 rounded-lg text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Dashboard
                </Link>
                <a
                  href="/"
                  onClick={() => {
                    localStorage.removeItem("token");
                    window.location.href = "/";
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                >
                  Logout
                </a>
              </>
            ) : (
              <Link 
                to="/login" 
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Internship Application Intelligence
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Smart tracking, insights, and suggestions for your internship search
          </p>
          
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className="inline-block px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              View Dashboard
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/signup"
                className="inline-block px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                Sign up
              </Link>
              <Link
                to="/login"
                className="inline-block px-8 py-3 rounded-lg bg-white text-blue-600 border border-blue-200 font-semibold hover:bg-blue-50 transition-colors"
              >
                Login
              </Link>
            </div>
          )}
        </div>

        <div className="mx-auto mt-14 max-h-[430px] max-w-3xl overflow-hidden rounded-xl border border-blue-200 bg-white shadow-2xl">
          <img
            src={chromeExtensionCapture}
            alt="Chrome extension capturing job details from a hiring page"
            className="block w-full object-cover object-top"
          />
        </div>
        <div className="mx-auto mt-5 max-w-3xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
            Chrome Extension Capture
          </p>
          <p className="text-lg font-semibold leading-7 text-gray-900">
            Capture live job listings in seconds and convert them into
            structured, trackable application records.
          </p>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Track Applications
            </h3>
            <p className="text-gray-600">
              Keep all your internship applications in one place with real-time status updates.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Suggestions
            </h3>
            <p className="text-gray-600">
              Get AI-powered insights to improve your applications and follow up at the right time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Analytics & Insights
            </h3>
            <p className="text-gray-600">
              Visualize your progress with comprehensive analytics and success metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

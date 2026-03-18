import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getApiUrl } from "../utils/helpers";

const Login = () => {
  const [searchParams] = useSearchParams();
  const initialSignupMode = searchParams.get("mode") === "signup";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [isSignup, setIsSignup] = useState(initialSignupMode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignup ? "/api/register/student" : "/api/login";
      const payload = isSignup
        ? {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
          }
        : {
            email: formData.email,
            password: formData.password,
          };

      const response = await fetch(`${getApiUrl()}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user, data.token);

        if (data.user.role === "super_admin") {
          navigate("/super-admin");
        } else if (data.user.role === "school_admin") {
          navigate("/school-admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(data.error || "Invalid request");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="auth-shell w-full max-w-5xl">
        <div className="auth-showcase hidden md:flex">
          <div className="auth-showcase-content">
            <p className="auth-showcase-tag">SmartStudy</p>
            <h2 className="auth-showcase-title">
              Study with a plan that adapts to your progress.
            </h2>
            <p className="auth-showcase-text">
              Turn weekly marks into focused schedules, balanced subject hours,
              and clear academic direction.
            </p>
            <ul className="auth-showcase-list">
              <li>Adaptive weekly schedules from your latest scores</li>
              <li>Prioritized time for weak subjects and exam urgency</li>
              <li>Pathway, faculty, and career guidance from performance trends</li>
            </ul>
          </div>
          <div className="auth-shapes" aria-hidden="true">
            <span className="showcase-shape shape-one"></span>
            <span className="showcase-shape shape-two"></span>
            <span className="showcase-shape shape-three"></span>
          </div>
        </div>

        <div className="auth-card p-8 form-transition">
          <div className="auth-header">
            <h1 className="auth-title">SmartStudy</h1>
            <p className="auth-subtitle">AI-Assisted Adaptive Study Planner</p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-2 text-sm text-teal-700 hover:text-teal-800 font-medium"
            >
              Back to Home
            </button>
            {isSignup ? (
              <p className="mt-2 text-sm text-gray-500">
                Basic Free plan includes up to 5 subjects and core features.
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Sign in to continue.</p>
            )}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {isSignup && (
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={isSignup}
                  className="modern-input"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="modern-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {isSignup && (
              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number (Optional)
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="modern-input"
                  placeholder="e.g. +250 7xx xxx xxx"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="modern-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {error && (
              <div className="error-message">
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="auth-button">
              {loading
                ? "Processing..."
                : isSignup
                  ? "Create Free Student Account"
                  : "Sign In"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignup((prev) => !prev);
                setError("");
              }}
              className="text-sm text-teal-700 hover:text-teal-800 font-medium"
            >
              {isSignup
                ? "Already have an account? Sign In"
                : "New student? Get Started Free"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


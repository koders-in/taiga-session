import React, { useState } from "react";
import { Clock, Eye, EyeOff, User, Lock, ArrowRight } from "lucide-react";
import { Login } from "./../api/login.js";
import { useNavigate } from "react-router-dom"; // ✅ Import navigate

const LoginPage = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loginStatus, setLoginStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); //  Create navigate instance

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (loginStatus.message) {
      setLoginStatus({ type: "", message: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = "Taiga username is required";
    }

    if (!formData.password) {
      newErrors.password = "Taiga password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoginStatus({ type: "", message: "" });

    if (validateForm()) {
      setLoading(true);

      try {
        console.log("Form Data:", formData);

        const response = await Login(formData.username, formData.password);

        console.log("API Response:", response);

        setLoginStatus({
          type: "success",
          message: "Login successful! Redirecting...",
        });

        if (onLogin) onLogin(formData);

        // ✅ Redirect after 1.5 seconds
        setTimeout(() => {
          navigate("/dashboard"); // Change this to your desired route
        }, 1500);
      } catch (error) {
        console.error("Login Error:", error);
        setLoginStatus({
          type: "error",
          message: "Login failed. Please check your credentials.",
        });
      } finally {
        setLoading(false);
      }
    } else {
      setLoginStatus({
        type: "error",
        message: "Please fill in all required fields correctly.",
      });
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-200 flex items-center justify-center p-4">
    {/* Background Pattern */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-40 left-1/2 w-80 h-80 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
    </div>

    <div className="relative w-full max-w-md">
      {/* Logo/Brand Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4">
          <Clock className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-orange-700 mb-2">Taiga Session</h1>
        <p className="text-orange-600">
          Track your productivity with focused work sessions
        </p>
      </div>

      {/* Login Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-orange-200 p-8"
      >
        {/* Login Status Message */}
        {loginStatus.message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              loginStatus.type === "success"
                ? "bg-green-100 border border-green-400 text-green-700"
                : "bg-red-100 border border-red-400 text-red-700"
            }`}
          >
            <div className="flex items-center">
              {loginStatus.type === "success" ? (
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="text-sm font-medium">
                {loginStatus.message}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Taiga Username Field */}
          <div>
            <label className="block text-sm font-medium text-orange-700 mb-2">
              Taiga Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-400" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-4 py-3 bg-orange-50 border rounded-lg text-orange-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.username ? "border-red-400" : "border-orange-300"
                }`}
                placeholder="Enter your Taiga username"
                autoComplete="username"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-500">{errors.username}</p>
            )}
          </div>

          {/* Taiga Password Field */}
          <div>
            <label className="block text-sm font-medium text-orange-700 mb-2">
              Taiga Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full pl-10 pr-12 py-3 bg-orange-50 border rounded-lg text-orange-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.password ? "border-red-400" : "border-orange-300"
                }`}
                placeholder="Enter your Taiga password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400 hover:text-orange-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Login"}
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Info Section */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-orange-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-orange-500">
                Connect with your Taiga account
              </span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700 text-center">
              Use your existing Taiga credentials to access the Pomodoro Timer
              and sync your productivity data.
            </p>
          </div>
        </div>
      </form>
    </div>
  </div>
);

};

export default LoginPage;

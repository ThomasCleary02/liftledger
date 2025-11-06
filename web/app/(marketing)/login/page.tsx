"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../providers/Auth";
import { Mail, Lock, Eye, EyeOff, Dumbbell } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated (wait for auth to finish loading)
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/workouts");
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
      </div>
    );
  }

  // Don't show login form if user is already authenticated
  if (user) {
    return null;
  }

  const validate = () => {
    setError(null);
    
    if (!email.trim()) {
      setError("Please enter your email");
      return false;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return false;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      setError(null);
      
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.replace("/workouts");
    } catch (e: any) {
      const errorMessage = e?.message || "An error occurred";
      const friendlyMessage = errorMessage.includes("email-already-in-use")
        ? "An account with this email already exists. Please log in instead."
        : errorMessage.includes("invalid-credential") || errorMessage.includes("wrong-password")
        ? "Invalid email or password. Please try again."
        : errorMessage.includes("weak-password")
        ? "Password is too weak. Please use a stronger password."
        : errorMessage;
      
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email && password && (mode === "login" || confirmPassword);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 md:px-6">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-3xl bg-black p-6">
            <Dumbbell className="h-12 w-12 text-white" />
          </div>
          <h1 className="mb-2 text-4xl font-bold text-gray-900">LiftLedger</h1>
          <p className="whitespace-pre-line text-gray-500">
            Track your workouts,{'\n'}achieve your goals
          </p>
        </div>

        {/* Form Card */}
        <div className="mb-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
          <h2 className="mb-1 text-2xl font-bold text-gray-900">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mb-6 text-gray-500">
            {mode === "login"
              ? "Sign in to continue tracking your progress"
              : "Start your fitness journey today"}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={submit}>
            {/* Email Input */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <input
                  type="email"
                  className="ml-3 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
                  placeholder="Enter your email"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <Lock className="h-5 w-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="ml-3 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
                  placeholder="Enter your password"
                  autoCapitalize="none"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up Only) */}
            {mode === "signup" && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <Lock className="h-5 w-5 text-gray-500" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="ml-3 flex-1 bg-transparent text-base outline-none placeholder:text-gray-400"
                    placeholder="Confirm your password"
                    autoCapitalize="none"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className={`w-full rounded-xl py-4 shadow-lg transition-opacity ${
                loading || !isFormValid
                  ? "cursor-not-allowed bg-gray-300 text-gray-600"
                  : "bg-black text-white hover:opacity-90"
              }`}
            >
              <div className="flex items-center justify-center">
                {loading && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                )}
                <span className="text-base font-bold">
                  {loading
                    ? mode === "login"
                      ? "Signing in..."
                      : "Creating account..."
                    : mode === "login"
                    ? "Sign In"
                    : "Create Account"}
                </span>
              </div>
            </button>
          </form>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center justify-center">
          <p className="text-gray-600">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          </p>
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setConfirmPassword("");
              setError(null);
            }}
            className="font-semibold text-black hover:underline"
          >
            {mode === "login" ? "Sign Up" : "Log In"}
          </button>
        </div>
      </div>
    </div>
  );
}

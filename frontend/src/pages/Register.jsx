import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { register } from "../api/auth";
import { getErrorMessage } from "../utils/errors";
import AuthLayout from "../components/layout/AuthLayout";
import PasswordInput from "../components/common/PasswordInput";
import Alert from "../components/common/Alert";

// Limits copied from the backend's InspectorCreate schema: name 2-100 characters, password 8-128.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Returns an error message, or "" when everything is valid
  function validate() {
    if (name.trim().length < 2) return "Please enter your full name (at least 2 characters).";
    if (!EMAIL_PATTERN.test(email.trim())) return "Please enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password.length > 128) return "Password must be at most 128 characters.";
    if (password !== confirm) return "The two passwords do not match.";
    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await register(name.trim(), email.trim(), password);
      // Account created: sign the new inspector in straight away
      await login(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // 409 -> "Email already registered"
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Register as an inspector to start inspecting.">
      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <div>
          <label htmlFor="name" className="label">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="input"
            placeholder="Your name"
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="input"
            placeholder="inspector@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div>
          <label htmlFor="confirm" className="label">
            Confirm password
          </label>
          <PasswordInput
            id="confirm"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={submitting}
          />
        </div>

        <button type="submit" className="btn-primary w-full py-2.5" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-500">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

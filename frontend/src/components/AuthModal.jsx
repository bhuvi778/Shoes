import { Lock, Mail, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import BrandLogo from "./BrandLogo.jsx";
import { BRAND_NAME } from "../lib/constants.js";

export default function AuthModal({ open, mode, intent, onClose, onSubmit, onSwitchMode }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ name: "", email: "", password: "" });
      setError("");
    }
  }, [open, mode]);

  function handleSubmit(event) {
    event.preventDefault();
    const email = form.email.trim();
    if (mode === "register" && form.name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const name = mode === "register" ? form.name.trim() : email.split("@")[0].replace(/[._-]/g, " ");
    onSubmit({ name: name.replace(/\b\w/g, (c) => c.toUpperCase()), email });
  }

  return (
    <div className={`auth-layer ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button className="auth-scrim" type="button" onClick={onClose} aria-label="Close sign in" />
      <div className="auth-modal" role="dialog" aria-modal="true" aria-label={mode === "register" ? "Create account" : "Sign in"}>
        <button className="auth-close icon-button" type="button" onClick={onClose} aria-label="Close">
          <X />
        </button>
        <div className="auth-head">
          <BrandLogo className="auth-logo" labelled />
          <p className="eyebrow">{mode === "register" ? "Join the club" : "Welcome back"}</p>
          <h2>{mode === "register" ? "Create your account" : "Sign in to continue"}</h2>
          {intent === "checkout" && <p className="auth-note">Sign in to complete your checkout securely.</p>}
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="auth-field">
              <User />
              <input
                type="text"
                placeholder="Full name"
                value={form.name}
                autoComplete="name"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
          )}
          <label className="auth-field">
            <Mail />
            <input
              type="email"
              placeholder="Email address"
              value={form.email}
              autoComplete="email"
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label className="auth-field">
            <Lock />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-submit" type="submit">
            {mode === "register" ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="auth-switch">
          {mode === "register" ? "Already have an account?" : `New to ${BRAND_NAME}?`}
          <button type="button" onClick={onSwitchMode}>
            {mode === "register" ? "Sign in" : "Create account"}
          </button>
        </p>
      </div>
    </div>
  );
}

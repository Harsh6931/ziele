import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { updateCurrentProfile, getCurrentProfile } from "../lib/apiClient";
import "./SetUsernamePage.css";

function normalizeUsername(value = "") {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 30);
}

function isValidUsername(value) {
  return /^[a-z0-9_]{3,30}$/.test(value);
}

export default function SetUsernamePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/feed";
  const { user, isLoaded } = useUser();

  const [username, setUsername] = useState("");
  const [displayedValue, setDisplayedValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  // Pre-fill from Clerk user info or existing profile
  useEffect(() => {
    if (!isLoaded) return;

    getCurrentProfile()
      .then((profile) => {
        if (profile?.username && profile.username.length >= 3) {
          // Already has a proper username — skip this step
          navigate(redirectUrl, { replace: true });
          return;
        }
        // Try to suggest a username from Clerk data
        const suggestion = normalizeUsername(
          user?.username ||
            user?.firstName ||
            user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
            ""
        );
        setDisplayedValue(suggestion);
        setUsername(suggestion);
      })
      .catch(() => {
        // Backend not ready yet — suggest from Clerk
        const suggestion = normalizeUsername(
          user?.username ||
            user?.firstName ||
            user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
            ""
        );
        setDisplayedValue(suggestion);
        setUsername(suggestion);
      })
      .finally(() => setChecking(false));
  }, [isLoaded, user, navigate, redirectUrl]);

  const handleChange = (e) => {
    const raw = e.target.value;
    setDisplayedValue(raw);
    const normalized = normalizeUsername(raw);
    setUsername(normalized);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!isValidUsername(username)) {
      setError(
        "Username must be 3–30 characters: lowercase letters, numbers, or underscores only."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateCurrentProfile({
        handle: username,
        name:
          user?.fullName ||
          user?.firstName ||
          username,
      });
      navigate(redirectUrl, { replace: true });
    } catch (err) {
      setError(err?.message || "That username is already taken. Try another.");
      setSaving(false);
    }
  };

  if (!isLoaded || checking) {
    return (
      <div className="set-username-shell">
        <div className="set-username-card">
          <p className="set-username-loading">Setting things up…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="set-username-shell">
      <div className="set-username-card">
        <div className="set-username-icon" aria-hidden="true">@</div>
        <h1 className="set-username-title">Choose your username</h1>
        <p className="set-username-subtitle">
          This is how others will find and mention you on Ziele. You can change
          it later in Settings.
        </p>

        <form className="set-username-form" onSubmit={handleSubmit} noValidate>
          <div className="set-username-input-wrap">
            <span className="set-username-prefix">@</span>
            <input
              id="set-username-input"
              type="text"
              className={`set-username-input${error ? " set-username-input--error" : ""}`}
              value={displayedValue}
              onChange={handleChange}
              placeholder="your_username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={30}
              disabled={saving}
              autoFocus
            />
          </div>

          {username && (
            <p className="set-username-preview">
              Your handle will be{" "}
              <strong className="set-username-handle">@{username}</strong>
            </p>
          )}

          {error && (
            <p className="set-username-error" role="alert">
              {error}
            </p>
          )}

          <div className="set-username-rules">
            <span className={username.length >= 3 ? "rule-ok" : "rule-dim"}>✓ At least 3 characters</span>
            <span className={/^[a-z0-9_]*$/.test(username) && username.length > 0 ? "rule-ok" : "rule-dim"}>✓ Letters, numbers, underscores only</span>
            <span className={username.length <= 30 ? "rule-ok" : "rule-dim"}>✓ Max 30 characters</span>
          </div>

          <button
            type="submit"
            className="set-username-btn"
            disabled={saving || !isValidUsername(username)}
          >
            {saving ? "Saving…" : "Confirm username"}
          </button>
        </form>
      </div>
    </div>
  );
}

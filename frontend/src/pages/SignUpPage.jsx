import React, { useState, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useSignUp } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "motion/react";
import "./auth.css";

/* ── Icons ───────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

/* ── Animation variants ──────────────────────────────────────── */
const cardVariants = {
  hidden: { opacity: 0, y: 36, scale: 0.95, filter: "blur(8px)" },
  visible: {
    opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
    transition: { type: "spring", stiffness: 300, damping: 24, mass: 0.8 }
  }
};

const fieldVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.07 + 0.15, type: "spring", stiffness: 280, damping: 22 }
  })
};

const logoVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -15 },
  visible: {
    opacity: 1, scale: 1, rotate: 0,
    transition: { type: "spring", stiffness: 400, damping: 20, delay: 0.05 }
  }
};

const errorVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 22 } },
  exit:   { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.18 } }
};

const stepVariants = {
  enter: (dir) => ({
    opacity: 0,
    x: dir === 1 ? 40 : -40,
    filter: "blur(6px)"
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 280, damping: 24 }
  },
  exit: (dir) => ({
    opacity: 0,
    x: dir === 1 ? -40 : 40,
    filter: "blur(4px)",
    transition: { duration: 0.2 }
  })
};

/* ═══════════════════════════════════════════════════════════════
   SignUpPage Component
═══════════════════════════════════════════════════════════════ */
export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectUrl = searchParams.get("redirect_url") || "/feed";
  const postSignupRedirect = `/set-username?redirect_url=${encodeURIComponent(redirectUrl)}`;

  const { isLoaded, signUp, setActive } = useSignUp();

  /* Step: "form" | "verify" */
  const [step, setStep] = useState("form");
  const [dir, setDir] = useState(1);

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyError, setVerifyError] = useState("");

  /* ── Google OAuth ─────────────────────────────────────────── */
  const handleGoogleSignUp = async () => {
    if (!isLoaded || oauthLoading) return;
    setOauthLoading(true);
    try {
      await signUp.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: postSignupRedirect,
      });
    } catch {
      setError("Google sign-up failed. Please try again.");
      setOauthLoading(false);
    }
  };

  /* ── Email + password signup ──────────────────────────────── */
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!isLoaded || loading) return;
    setError("");
    setLoading(true);
    try {
      await signUp.create({ firstName, emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setDir(1);
      setStep("verify");
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage
        || err?.errors?.[0]?.message
        || "Sign up failed. Please check your details.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Code inputs ──────────────────────────────────────────── */
  const handleCodeChange = (index, val) => {
    const digits = val.replace(/\D/g, "").slice(0, 1);
    const next = [...code];
    next[index] = digits;
    setCode(next);
    setVerifyError("");
    if (digits && index < 5) codeRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    codeRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  /* ── Verify email code ────────────────────────────────────── */
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isLoaded || loading) return;
    const fullCode = code.join("");
    if (fullCode.length < 6) { setVerifyError("Enter all 6 digits."); return; }
    setLoading(true);
    setVerifyError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: fullCode });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        navigate(postSignupRedirect, { replace: true });
      } else {
        setVerifyError("Verification incomplete. Please try again.");
      }
    } catch (err) {
      const msg = err?.errors?.[0]?.longMessage
        || err?.errors?.[0]?.message
        || "Invalid code. Please check and retry.";
      setVerifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!isLoaded) return;
    setVerifyError("");
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch {
      setVerifyError("Could not resend code. Try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-grid" aria-hidden="true" />
      <div className="auth-orb auth-orb-1" aria-hidden="true" />
      <div className="auth-orb auth-orb-2" aria-hidden="true" />
      <div className="auth-orb auth-orb-3" aria-hidden="true" />

      <div className="auth-card-wrap">
        <motion.div
          className="auth-card"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="auth-card-glow" aria-hidden="true" />

          {/* Brand */}
          <div className="auth-brand">
            <motion.div className="auth-brand-logo" variants={logoVariants} initial="hidden" animate="visible">
              Z
            </motion.div>
            <motion.h1
              className="auth-brand-title"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, type: "spring", stiffness: 260, damping: 20 }}
            >
              {step === "form" ? "Create your account" : "Verify your email"}
            </motion.h1>
            <motion.p
              className="auth-brand-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18 }}
            >
              {step === "form"
                ? "Join Ziele and start sharing stories"
                : `We sent a 6-digit code to ${email}`}
            </motion.p>
          </div>

          {/* Steps */}
          <AnimatePresence mode="wait" custom={dir}>
            {step === "form" ? (
              <motion.div
                key="form"
                custom={dir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {/* Google OAuth */}
                <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
                  <button
                    type="button"
                    className="auth-oauth-btn"
                    onClick={handleGoogleSignUp}
                    disabled={!isLoaded || oauthLoading || loading}
                  >
                    {oauthLoading ? <span className="auth-spinner" /> : <GoogleIcon />}
                    Continue with Google
                  </button>
                </motion.div>

                <motion.div
                  className="auth-divider"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.22 }}
                >
                  <span>or create with email</span>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div className="auth-error" variants={errorVariants} initial="hidden" animate="visible" exit="exit" role="alert">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form className="auth-form" onSubmit={handleSignUp} noValidate>
                  {/* First Name */}
                  <motion.div className="auth-field" custom={1} variants={fieldVariants} initial="hidden" animate="visible">
                    <label htmlFor="signup-firstname">First name</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon"><UserIcon /></span>
                      <input
                        id="signup-firstname"
                        type="text"
                        className="auth-input"
                        placeholder="Your first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        autoComplete="given-name"
                        autoFocus
                        required
                        disabled={loading || oauthLoading}
                      />
                    </div>
                  </motion.div>

                  {/* Email */}
                  <motion.div className="auth-field" custom={2} variants={fieldVariants} initial="hidden" animate="visible">
                    <label htmlFor="signup-email">Email address</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon"><EmailIcon /></span>
                      <input
                        id="signup-email"
                        type="email"
                        className="auth-input"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        autoComplete="email"
                        required
                        disabled={loading || oauthLoading}
                      />
                    </div>
                  </motion.div>

                  {/* Password */}
                  <motion.div className="auth-field" custom={3} variants={fieldVariants} initial="hidden" animate="visible">
                    <label htmlFor="signup-password">Password</label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon"><LockIcon /></span>
                      <input
                        id="signup-password"
                        type={showPw ? "text" : "password"}
                        className="auth-input"
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        disabled={loading || oauthLoading}
                        style={{ paddingRight: "2.8rem" }}
                      />
                      <button
                        type="button"
                        className="auth-input-toggle"
                        onClick={() => setShowPw((v) => !v)}
                        aria-label={showPw ? "Hide password" : "Show password"}
                      >
                        {showPw ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Submit */}
                  <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={!isLoaded || loading || oauthLoading}
                    >
                      {loading && <span className="auth-spinner" />}
                      {loading ? "Creating account…" : "Create account"}
                    </button>
                  </motion.div>
                </form>

                <motion.p className="auth-footer-link" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }}>
                  Already have an account?{" "}
                  <Link to={`/sign-in${searchParams.get("redirect_url") ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ""}`}>
                    Sign in
                  </Link>
                </motion.p>
              </motion.div>
            ) : (
              /* ── Verify step ───────────────────────────────── */
              <motion.div
                key="verify"
                custom={dir}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <div className="auth-verify-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>

                <AnimatePresence>
                  {verifyError && (
                    <motion.div className="auth-error" variants={errorVariants} initial="hidden" animate="visible" exit="exit" role="alert">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {verifyError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form className="auth-form" onSubmit={handleVerify} noValidate>
                  <div className="auth-code-inputs" onPaste={handleCodePaste}>
                    {code.map((digit, idx) => (
                      <motion.input
                        key={idx}
                        ref={(el) => (codeRefs.current[idx] = el)}
                        className="auth-code-input"
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(idx, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                        autoFocus={idx === 0}
                        aria-label={`Digit ${idx + 1}`}
                        disabled={loading}
                        initial={{ opacity: 0, y: 16, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: idx * 0.06 + 0.05, type: "spring", stiffness: 320, damping: 22 }}
                      />
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 22 }}
                  >
                    <button
                      type="submit"
                      className="auth-submit-btn"
                      disabled={!isLoaded || loading}
                    >
                      {loading && <span className="auth-spinner" />}
                      {loading ? "Verifying…" : "Verify email"}
                    </button>
                  </motion.div>
                </form>

                <motion.p
                  className="auth-footer-link"
                  style={{ marginTop: "0.8rem" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                >
                  Didn't receive a code?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary)",
                      font: "inherit",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline"
                    }}
                  >
                    Resend
                  </button>
                </motion.p>
                <motion.p
                  className="auth-footer-link"
                  style={{ marginTop: "0.3rem" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.48 }}
                >
                  <button
                    type="button"
                    onClick={() => { setDir(-1); setStep("form"); setCode(["","","","","",""]); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      font: "inherit",
                      fontSize: "0.84rem",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    ← Back to sign up
                  </button>
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

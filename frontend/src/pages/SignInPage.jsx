import React from "react";
import { SignIn } from "@clerk/clerk-react";
import { Link, useSearchParams } from "react-router-dom";

export default function SignInPage() {
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/feed";
  const redirectSuffix = `?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <div className="auth-clerk-shell">
      <div
        className="page"
        style={{
          width: "100%",
          maxWidth: "32rem",
          display: "grid",
          gap: "1rem",
          justifyItems: "center",
        }}
      >
        <div className="centered stack-sm">
          <p className="muted-text">Welcome back</p>
          <h1>Sign in to your Ziele account</h1>
          <p>
            Existing users can sign in directly. If this is your first time,
            create your account first.
          </p>
          <Link to={`/sign-up${redirectSuffix}`} className="nav-btn-primary">
            New here? Sign Up
          </Link>
        </div>

        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl={`/sign-up${redirectSuffix}`}
          fallbackRedirectUrl={redirectUrl}
        />
      </div>
    </div>
  );
}

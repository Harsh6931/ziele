import React from "react";
import { SignUp } from "@clerk/clerk-react";
import { Link, useSearchParams } from "react-router-dom";

export default function SignUpPage() {
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
          <p className="muted-text">Get started</p>
          <h1>Create your Ziele account</h1>
          <p>
            We'll use your Clerk details as the first-time starting point, then
            you can change your display name and username later in Settings.
          </p>
          <Link to={`/sign-in${redirectSuffix}`} className="nav-btn-primary">
            Already have an account? Sign In
          </Link>
        </div>

        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl={`/sign-in${redirectSuffix}`}
          fallbackRedirectUrl={redirectUrl}
        />
      </div>
    </div>
  );
}

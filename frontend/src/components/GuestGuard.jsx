import React, { useState } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import "./GuestGuard.css";

/**
 * GuestGuard — wraps any action that requires auth.
 * If user is signed out, shows a beautiful popup instead of performing the action.
 *
 * Usage:
 *   <GuestGuard>
 *     {(guardedClick) => (
 *       <button onClick={() => guardedClick(realHandler)}>Like</button>
 *     )}
 *   </GuestGuard>
 */
export function useGuestGuard() {
  const [popupVisible, setPopupVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const showPopup = () => {
    setPopupVisible(true);
    setIsAnimating(true);
  };

  const hidePopup = () => {
    setIsAnimating(false);
    setTimeout(() => setPopupVisible(false), 280);
  };

  return { popupVisible, isAnimating, showPopup, hidePopup };
}

export function GuestPopup({ visible, isAnimating, onClose }) {
  if (!visible) return null;

  return (
    <div
      className={`guest-popup-overlay ${isAnimating ? "guest-popup-overlay--in" : "guest-popup-overlay--out"}`}
      onClick={onClose}
    >
      <div
        className={`guest-popup-card ${isAnimating ? "guest-popup-card--in" : "guest-popup-card--out"}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in required"
      >
        <div className="guest-popup-glow" aria-hidden="true" />

        <button
          className="guest-popup-close"
          onClick={onClose}
          aria-label="Close"
          type="button"
        >
          ✕
        </button>

        <div className="guest-popup-icon" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>

        <h2 className="guest-popup-title">Join the conversation</h2>
        <p className="guest-popup-desc">
          Sign in to like posts, bookmark stories, follow creators, and be part of the Ziele community.
        </p>

        <div className="guest-popup-actions">
          <Link
            to="/sign-up"
            className="guest-popup-btn guest-popup-btn--primary"
            onClick={onClose}
          >
            Create account
          </Link>
          <Link
            to="/sign-in"
            className="guest-popup-btn guest-popup-btn--secondary"
            onClick={onClose}
          >
            Sign in
          </Link>
        </div>

        <p className="guest-popup-footer">
          Already browsing? Keep reading — sign in anytime.
        </p>
      </div>
    </div>
  );
}

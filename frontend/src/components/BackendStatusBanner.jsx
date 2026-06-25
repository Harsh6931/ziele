import React from "react";
import { fetchJson } from "../lib/apiClient";
import "./BackendStatusBanner.css";

const HEALTH_URL = "/api/health";
const POLL_INTERVAL_MS = 4000;
const INITIAL_DELAY_MS = 1500; // wait before showing banner to avoid flicker for fast responses

export default function BackendStatusBanner() {
  const [visible, setVisible] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const showTimerRef = React.useRef(null);
  const intervalRef = React.useRef(null);
  const mountedRef = React.useRef(true);
  const dismissedRef = React.useRef(false);

  // Keep the ref in sync with the state so the interval callback always reads the latest value
  React.useEffect(() => {
    dismissedRef.current = dismissed;
  }, [dismissed]);

  React.useEffect(() => {
    mountedRef.current = true;

    const checkHealth = async () => {
      try {
        await fetchJson(HEALTH_URL, { skipAuth: true });
        // Backend is up — hide banner and clear any pending show timer
        if (mountedRef.current) {
          clearTimeout(showTimerRef.current);
          showTimerRef.current = null;
          setVisible(false);
          clearInterval(intervalRef.current);
        }
      } catch {
        // Backend not reachable yet — schedule banner after brief delay (only if not already pending)
        if (mountedRef.current && !dismissedRef.current && showTimerRef.current === null) {
          showTimerRef.current = setTimeout(() => {
            showTimerRef.current = null;
            if (mountedRef.current && !dismissedRef.current) {
              setVisible(true);
            }
          }, INITIAL_DELAY_MS);
        }
      }
    };

    // Check once immediately
    checkHealth();

    // Then poll on interval
    intervalRef.current = setInterval(checkHealth, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalRef.current);
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    };
  }, []); // runs once — refs handle latest state inside the interval callback

  if (!visible || dismissed) return null;

  return (
    <div className="backend-banner" role="status" aria-live="polite">
      <div className="backend-banner__inner">
        <span className="backend-banner__pulse" aria-hidden="true" />
        <span className="backend-banner__text">
          ⚡ Backend server taking a moment to load — hang tight!
        </span>
        <button
          className="backend-banner__dismiss"
          type="button"
          aria-label="Dismiss backend status"
          onClick={() => {
            clearTimeout(showTimerRef.current);
            showTimerRef.current = null;
            setDismissed(true);
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

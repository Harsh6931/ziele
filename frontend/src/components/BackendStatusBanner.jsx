import React from "react";
import { fetchJson } from "../lib/apiClient";
import "./BackendStatusBanner.css";

const HEALTH_URL = "/api/health";
const POLL_INTERVAL_MS = 4000;
const INITIAL_DELAY_MS = 1500; // wait before showing banner to avoid flicker for fast responses

export default function BackendStatusBanner() {
  const [visible, setVisible] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const timeoutRef = React.useRef(null);
  const intervalRef = React.useRef(null);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;

    let showTimerId = null;

    const checkHealth = async () => {
      try {
        await fetchJson(HEALTH_URL, { skipAuth: true });
        // Backend is up — hide banner
        if (mountedRef.current) {
          setVisible(false);
          clearInterval(intervalRef.current);
        }
      } catch {
        // Backend not reachable yet — show banner after brief delay
        if (mountedRef.current && !dismissed) {
          showTimerId = setTimeout(() => {
            if (mountedRef.current) setVisible(true);
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
      clearTimeout(showTimerId);
      clearTimeout(timeoutRef.current);
    };
  }, [dismissed]);

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
          onClick={() => setDismissed(true)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

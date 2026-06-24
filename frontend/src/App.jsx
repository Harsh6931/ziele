import React from "react";
import { Navigate, Routes, Route, useLocation } from "react-router-dom";
import "./styles/variables.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/common.css";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Feed from "./pages/Feed";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import SetUsernamePage from "./pages/SetUsernamePage";
import Discover from "./pages/Discover";
import PostDetail from "./pages/PostDetail";
import CreatePost from "./pages/CreatePost";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Connections from "./pages/Connections";
import TrendingPage from "./pages/TrendingPageReal";
import Communities from "./pages/CommunitiesReal";
import BookmarksPage from "./pages/BookmarksPageReal";
import DraftsPage from "./pages/DraftsPage";
import SettingsPage from "./pages/SettingsPage";
import GenericPlaceholder from "./pages/GenericPlaceholder";
import Analytics from "./pages/AnalyticsReal";
import LandingPage from "./pages/LandingPage";
import FloatingPanel from "./components/FloatingPanel";
import BackendStatusBanner from "./components/BackendStatusBanner";

// IMPORT: Clerk Auth helper components to handle route protection
import { SignedIn, SignedOut } from "@clerk/clerk-react";

// HELPER: Component to protect specific private routes
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const redirectUrl = `${location.pathname}${location.search}`;

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <Navigate
          to={`/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`}
          replace
        />
      </SignedOut>
    </>
  );
};

const THEME_STORAGE_KEY = "ziele-theme";
const FONT_SIZE_STORAGE_KEY = "ziele-font-size";
const COMPACT_MODE_STORAGE_KEY = "ziele-compact-mode";
const THEME_PREFERENCE_EVENT = "ziele:theme-preference-updated";
const THEMES = {
  DARK: "dark",
  LIGHT: "light",
};
const FONT_SIZE_MAP = {
  small: "15px",
  medium: "16px",
  large: "17px",
};

function applyStoredShellPreferences() {
  try {
    const storedFontSize = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    const nextFontSize = FONT_SIZE_MAP[storedFontSize] || FONT_SIZE_MAP.medium;
    document.documentElement.style.fontSize = nextFontSize;
  } catch {
    document.documentElement.style.fontSize = FONT_SIZE_MAP.medium;
  }

  try {
    const compactModeEnabled =
      window.localStorage.getItem(COMPACT_MODE_STORAGE_KEY) === "true";
    document.body.classList.toggle("compact-mode", compactModeEnabled);
  } catch {
    document.body.classList.toggle("compact-mode", false);
  }
}

function getInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === THEMES.DARK || savedTheme === THEMES.LIGHT) {
      return savedTheme;
    }

    const prefersDark = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    )?.matches;
    return prefersDark ? THEMES.DARK : THEMES.LIGHT;
  } catch {
    return THEMES.DARK;
  }
}

function App() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const authShellRoute =
    location.pathname === "/sign-in" ||
    location.pathname === "/sign-up" ||
    location.pathname.startsWith("/sign-in/") ||
    location.pathname.startsWith("/sign-up/") ||
    location.pathname === "/sso-callback";

  const hideSidebar =
    [
      "/discover",
      "/analytics",
      "/settings",
      "/drafts",
      "/bookmarks",
      "/trending",
      "/create",
    ].includes(location.pathname) || authShellRoute;

  const [theme, setTheme] = React.useState(getInitialTheme);

  const isDarkTheme = theme === THEMES.DARK;

  const toggleTheme = React.useCallback(() => {
    setTheme((currentTheme) =>
      currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK,
    );
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  React.useEffect(() => {
    applyStoredShellPreferences();

    const handleThemePreferenceUpdate = (event) => {
      const nextTheme = event?.detail?.theme;

      if (nextTheme === THEMES.DARK || nextTheme === THEMES.LIGHT) {
        setTheme(nextTheme);
      } else if (nextTheme === "system") {
        const prefersDark = window.matchMedia?.(
          "(prefers-color-scheme: dark)",
        )?.matches;
        setTheme(prefersDark ? THEMES.DARK : THEMES.LIGHT);
      }

      applyStoredShellPreferences();
    };

    window.addEventListener(THEME_PREFERENCE_EVENT, handleThemePreferenceUpdate);

    return () => {
      window.removeEventListener(
        THEME_PREFERENCE_EVENT,
        handleThemePreferenceUpdate,
      );
    };
  }, []);

  if (isLandingPage) {
    return (
      <div className="app">
        <BackendStatusBanner />
        <LandingPage
          isDarkTheme={isDarkTheme}
          onToggleTheme={toggleTheme}
        />
      </div>
    );
  }

  // Auth pages: full-screen, no navbar/sidebar shell
  if (authShellRoute) {
    return (
      <div className="app">
        <BackendStatusBanner />
        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/sso-callback" element={<Navigate to="/feed" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="app">
      <BackendStatusBanner />
      <FloatingPanel />
      <Navbar
        theme={theme}
        isDarkTheme={isDarkTheme}
        onToggleTheme={toggleTheme}
      />
      <div className={`main-layout${hideSidebar ? " discover-full" : ""}`}>
        <main className="feed-content">
          <Routes>
            {/* PUBLIC ROUTES: Accessible to everyone */}
            <Route path="/feed" element={<Feed />} />
            <Route path="/home" element={<Feed />} />
            <Route path="/set-username" element={<ProtectedRoute><SetUsernamePage /></ProtectedRoute>} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/post/:id/:slug?" element={<PostDetail />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/communities" element={<Communities />} />
            {/* Profile: public route — guest guard handled inside Profile.jsx */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<Profile />} />
            {/* PRIVATE ROUTES: Require user authentication via Clerk */}
            <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
            {/* FULL PAGES */}
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
            <Route path="/drafts" element={<DraftsPage />} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/more" element={<GenericPlaceholder />} />
          </Routes>
        </main>
        {!hideSidebar && <Sidebar />}
      </div>
    </div>
  );
}

export default App;

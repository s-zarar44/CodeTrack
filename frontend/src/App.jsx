import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DIFFICULTY_COLORS = { easy: "#55D393", medium: "#F2B84B", hard: "#F2697A" };
const HISTORY_COLORS = { solved: "#79B5FF", submissions: "#62D6C5", accepted: "#F5B96D" };

const getInitials = (name = "") => (name.trim().charAt(0) || "U").toUpperCase();

const isTodayDate = (dateValue) => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return String(dateValue).slice(0, 10) === today;
};

const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
  </svg>
);
const IconCalendar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const CodeTrackLogo = ({ className = "brand-mark" }) => (
  <svg className={className} viewBox="0 0 48 48" role="img" aria-label="CodeTrack logo">
    <defs>
      <linearGradient id="codeTrackLogoGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#B9D9FF" />
        <stop offset="100%" stopColor="#347CF6" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="46" height="46" rx="14" fill="#15263C" stroke="#3A6598" />
    <path d="M29.8 13.5H22.7C16.9 13.5 13.7 17.5 13.7 24s3.2 10.5 9 10.5h7.1v-6.2h-6.5c-2.3 0-3.5-1.4-3.5-4.3s1.2-4.3 3.5-4.3h6.5z" fill="url(#codeTrackLogoGradient)" />
    <path d="M31.5 18.8h3.7v15.7h-3.7z" fill="#5FD9C4" />
  </svg>
);


const LeetCodeIcon = () => (
  <svg className="platform-logo" viewBox="0 0 32 32" role="img" aria-label="LeetCode logo">
    <path d="M20.6 5.2 11.1 14.7a3.6 3.6 0 0 0 0 5.1l3.8 3.8a3.6 3.6 0 0 0 5.1 0l5.1-5.1" fill="none" stroke="#FFA116" strokeWidth="3.1" strokeLinecap="round" />
    <path d="m16.3 9.4 4.4-4.2a3.3 3.3 0 0 1 4.7 0l1.2 1.2M13.5 16.3h13" fill="none" stroke="#E9F1FF" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
);

const CodeforcesIcon = () => (
  <svg className="platform-logo" viewBox="0 0 32 32" role="img" aria-label="Codeforces logo">
    <rect x="3" y="13" width="7" height="15" rx="1" fill="#F44336" />
    <rect x="12.5" y="5" width="7" height="23" rx="1" fill="#2196F3" />
    <rect x="22" y="9" width="7" height="19" rx="1" fill="#FFCA28" />
  </svg>
);

function App() {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState("auth");
  const [selectedPage, setSelectedPage] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
  });

  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [codeforcesUsername, setCodeforcesUsername] = useState("");

  const [message, setMessage] = useState("");
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectingCodeforces, setConnectingCodeforces] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [leetcodeStats, setLeetcodeStats] = useState(null);
  const [codeforcesStats, setCodeforcesStats] = useState(null);
  const [codeforcesRatingDistribution, setCodeforcesRatingDistribution] = useState(null);
  const [codeforcesRatingView, setCodeforcesRatingView] = useState("exact");
  const [historyMetric, setHistoryMetric] = useState("solved");
  const [syncingCodeforces, setSyncingCodeforces] = useState(false);
  const [syncingAccounts, setSyncingAccounts] = useState(false);

  const showToast = (text) => setToastMessage(text);

  // Complete verification when a user opens the link from their email.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get("verifyToken");

    if (!verifyToken) return;

    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: verifyToken }),
        });
        const data = await response.json();

        setMessage(data.message || (response.ok ? "Email verified successfully." : "Unable to verify email."));
        setMode("login");
        setForm((current) => ({ ...current, password: "" }));
      } catch (error) {
        console.error("Email verification error:", error);
        setMessage("Unable to verify your email. Please try again.");
        setMode("login");
      } finally {
        params.delete("verifyToken");
        const query = params.toString();
        window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
      }
    };

    verifyEmail();
  }, []);

  // Load Google Identity Services and render its sign-in button.
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || view !== "auth") return undefined;

    let cancelled = false;
    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id) return;
      const container = document.getElementById("google-signin-button");
      if (!container) return;

      container.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          setMessage("");
          setLoading(true);
          try {
            const apiResponse = await fetch(`${API_URL}/api/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: response.credential }),
            });
            const data = await apiResponse.json();
            if (!apiResponse.ok) throw new Error(data.message || "Google sign-in failed");
            localStorage.setItem("token", data.token);
            await fetchDashboard();
          } catch (error) {
            setMessage(error.message || "Google sign-in failed. Please try again.");
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "continue_with",
        width: 320,
      });
    };

    let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;
      document.head.appendChild(script);
    } else if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      script.addEventListener("load", renderGoogleButton, { once: true });
    }

    return () => { cancelled = true; };
  }, [view, mode]);

  const resendVerification = async () => {
    if (!form.email.trim()) {
      setMessage("Enter your email address first, then request another verification email.");
      return;
    }

    setResendingVerification(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to resend verification email");
      setMessage(data.message || "If your account needs verification, a new email will be sent.");
    } catch (error) {
      setMessage(error.message || "Unable to resend verification email.");
    } finally {
      setResendingVerification(false);
    }
  };

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeoutId = window.setTimeout(() => setToastMessage(""), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // --------------------------------------------------
  // FETCH DASHBOARD
  // --------------------------------------------------

  const fetchDashboard = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setView("auth");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        localStorage.removeItem("token");
        setDashboard(null);
        setLeetcodeStats(null);
        setView("auth");
        return;
      }

      setDashboard(data);

      const leetcodeAccount = data.platforms?.find(
        (platform) => platform.platform === "LEETCODE"
      );

      if (leetcodeAccount) {
        setLeetcodeUsername(leetcodeAccount.username);

        setLeetcodeStats({
          username: leetcodeAccount.username,
          solved:
            (leetcodeAccount.easyCount ?? 0) +
            (leetcodeAccount.mediumCount ?? 0) +
            (leetcodeAccount.hardCount ?? 0),
          submissions: data.dailyStats?.[0]?.submissionCount ?? 0,
          easy: leetcodeAccount.easyCount ?? 0,
          medium: leetcodeAccount.mediumCount ?? 0,
          hard: leetcodeAccount.hardCount ?? 0,
        });
      } else {
        setLeetcodeUsername("");
        setLeetcodeStats(null);
      }

      const codeforcesAccount = data.platforms?.find(
        (platform) => platform.platform === "CODEFORCES"
      );
      const latestCodeforcesStat = data.dailyStats?.find(
        (stat) => stat.platform === "CODEFORCES"
      );
      if (codeforcesAccount) {
        setCodeforcesUsername(codeforcesAccount.username);
        setCodeforcesStats({
          solved: latestCodeforcesStat?.solvedCount ?? codeforcesAccount.solvedCount ?? 0,
          submissions: latestCodeforcesStat?.submissionCount ?? codeforcesAccount.submissionCount ?? 0,
          accepted: latestCodeforcesStat?.acceptedCount ?? codeforcesAccount.acceptedCount ?? 0,
        });
      } else {
        setCodeforcesUsername("");
        setCodeforcesStats(null);
      }

      setView("dashboard");
    } catch (error) {
      console.error("Dashboard error:", error);
      setMessage("Unable to load dashboard.");
    }
  };

  // --------------------------------------------------
  // CONNECT LEETCODE
  // --------------------------------------------------

  const connectLeetCode = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      logout();
      return;
    }

    if (!leetcodeUsername.trim()) {
      setMessage("Please enter your LeetCode username.");
      return;
    }

    setConnecting(true);
    setMessage("");

    try {
      // Step 1: Connect the account
      const response = await fetch(`${API_URL}/api/platform/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform: "LEETCODE",
          username: leetcodeUsername.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to connect LeetCode account"
        );
      }

      // Step 2: Refresh dashboard so the new account appears
      await fetchDashboard();

      // Step 3: Automatically sync the newly connected account
      await syncLeetCode(leetcodeUsername.trim());

      setMessage("LeetCode account connected successfully!");
    } catch (error) {
      console.error("Connect LeetCode error:", error);
      setMessage(error.message);
    } finally {
      setConnecting(false);
    }
  };

  // --------------------------------------------------
  // CONNECT CODEFORCES
  // --------------------------------------------------

  const connectCodeforces = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      logout();
      return;
    }

    const username = codeforcesUsername.trim();
    if (!username) {
      setMessage("Please enter your Codeforces handle.");
      return;
    }

    setConnectingCodeforces(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/platform/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ platform: "CODEFORCES", username }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to connect Codeforces account");
      }

      setCodeforcesUsername("");
      await fetchDashboard();
      setMessage("Codeforces account connected successfully!");
    } catch (error) {
      console.error("Connect Codeforces error:", error);
      setMessage(error.message || "Unable to connect Codeforces account.");
    } finally {
      setConnectingCodeforces(false);
    }
  };

  // --------------------------------------------------
  // SYNC LEETCODE
  // --------------------------------------------------

  const syncLeetCode = async (usernameOverride = null, showSuccessToast = true) => {
    const token = localStorage.getItem("token");

    if (!token) {
      logout();
      return;
    }

    const username =
      usernameOverride ||
      dashboard?.platforms?.find(
        (platform) => platform.platform === "LEETCODE"
      )?.username;

    if (!username) {
      setMessage("No LeetCode account connected.");
      return;
    }

    setSyncing(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/platform/leetcode/${username}/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to sync LeetCode");
      }

      setLeetcodeStats(data.stats);

      // Refresh dashboard to get the newly saved data
      await fetchDashboard();

      if (showSuccessToast) showToast("LeetCode synced successfully!");
      return true;
    } catch (error) {
      console.error("LeetCode sync error:", error);
      setMessage(error.message);
      return false;
    } finally {
      setSyncing(false);
    }
  };

  // --------------------------------------------------
  // SYNC CODEFORCES
  // --------------------------------------------------

  const syncCodeforces = async (usernameOverride = null, showSuccessToast = true) => {
    const token = localStorage.getItem("token");
    if (!token) { logout(); return; }

    const username = usernameOverride || dashboard?.platforms?.find(
      (platform) => platform.platform === "CODEFORCES"
    )?.username;
    if (!username) { setMessage("No Codeforces account connected."); return; }

    setSyncingCodeforces(true);
    setMessage("");
    try {
      const response = await fetch(
        `${API_URL}/api/platform/codeforces/${encodeURIComponent(username)}/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to sync Codeforces");
      if (data.stats) setCodeforcesStats(data.stats);
      if (data.ratingDistribution) setCodeforcesRatingDistribution(data.ratingDistribution);
      await fetchDashboard();
      if (showSuccessToast) showToast("Codeforces synced successfully!");
      return true;
    } catch (error) {
      console.error("Codeforces sync error:", error);
      setMessage(error.message || "Unable to sync Codeforces.");
      return false;
    } finally {
      setSyncingCodeforces(false);
    }
  };

  // Sync every connected platform. Keep calls sequential to avoid API bursts.
  const syncAccounts = async () => {
    const accounts = dashboard?.platforms ?? [];
    if (!accounts.length) { setMessage("Connect a platform before syncing."); return; }
    setSyncingAccounts(true);
    setMessage("");
    try {
      let allSucceeded = true;
      if (accounts.some((account) => account.platform === "LEETCODE")) {
        allSucceeded = (await syncLeetCode(null, false)) && allSucceeded;
      }
      if (accounts.some((account) => account.platform === "CODEFORCES")) {
        allSucceeded = (await syncCodeforces(null, false)) && allSucceeded;
      }
      await fetchDashboard();
      if (allSucceeded) showToast("All connected accounts synced successfully!");
      else showToast("One or more accounts could not be synced.");
    } catch (error) {
      setMessage(error.message || "Unable to sync all accounts.");
    } finally {
      setSyncingAccounts(false);
    }
  };

  // --------------------------------------------------
  // LOAD DASHBOARD ON PAGE LOAD
  // --------------------------------------------------

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchDashboard();
    }
  }, []);


  // Hide the dashboard header while scrolling down; reveal it while scrolling up.
  useEffect(() => {
    if (view !== "dashboard") {
      setShowHeader(true);
      return undefined;
    }

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY < 80) {
        setShowHeader(true);
      } else if (delta > 4) {
        setShowHeader(false);
      } else if (delta < -4) {
        setShowHeader(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [view]);

  // --------------------------------------------------
  // LOGIN / REGISTER
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login"
          ? `${API_URL}/api/auth/login`
          : `${API_URL}/api/auth/register`;

      const body =
        mode === "login"
          ? {
              email: form.email,
              password: form.password,
            }
          : {
              username: form.username,
              email: form.email,
              password: form.password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setEmailVerificationRequired(true);
          setMessage(data.message || "Please verify your email before signing in.");
          return;
        }
        throw new Error(data.message || "Something went wrong");
      }

      setEmailVerificationRequired(false);
      if (mode === "login") {
        localStorage.setItem("token", data.token);
        await fetchDashboard();
      } else {
        setMessage(data.message || "Account created. Please verify your email before signing in.");
        setEmailVerificationRequired(false);
        setMode("login");

        setForm({
          email: form.email,
          username: "",
          password: "",
        });
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const logout = () => {
    localStorage.removeItem("token");

    setDashboard(null);
    setLeetcodeStats(null);
    setLeetcodeUsername("");

    setView("auth");
    setSelectedPage("overview");
    setMenuOpen(false);
    setMessage("");
  };

  // ==================================================
  // DASHBOARD
  // ==================================================

  if (view === "dashboard" && dashboard) {
    const user = dashboard.user;
    const platforms = dashboard.platforms;
    const dailyStats = dashboard.dailyStats;

    // Use the latest snapshot for each connected platform account, then combine them.
    // dailyStats is ordered newest-first by the dashboard API.
    const latestStatsByAccount = new Map();
    for (const stat of dailyStats) {
      if (!latestStatsByAccount.has(stat.platformAccountId)) {
        latestStatsByAccount.set(stat.platformAccountId, stat);
      }
    }

    const latestAccountStats = [...latestStatsByAccount.values()];
    const totalSolved = latestAccountStats.reduce(
      (sum, stat) => sum + Number(stat.solvedCount ?? 0), 0
    );
    const totalSubmissions = latestAccountStats.reduce(
      (sum, stat) => sum + Number(stat.submissionCount ?? 0), 0
    );
    const snapshotsByAccount = new Map();
    for (const stat of [...dailyStats].sort((a, b) => new Date(a.date) - new Date(b.date))) {
      if (!snapshotsByAccount.has(stat.platformAccountId)) snapshotsByAccount.set(stat.platformAccountId, []);
      snapshotsByAccount.get(stat.platformAccountId).push(stat);
    }
    const activeDateKeys = new Set();
    for (const snapshots of snapshotsByAccount.values()) {
      let previous = null;
      for (const stat of snapshots) {
        const changed = !previous ||
          Number(stat.solvedCount ?? 0) > Number(previous.solvedCount ?? 0) ||
          Number(stat.submissionCount ?? 0) > Number(previous.submissionCount ?? 0) ||
          Number(stat.acceptedCount ?? 0) > Number(previous.acceptedCount ?? 0);
        if (changed && (Number(stat.submissionCount ?? 0) > 0 || Number(stat.acceptedCount ?? 0) > 0 || Number(stat.solvedCount ?? 0) > 0)) {
          activeDateKeys.add(new Date(stat.date).toLocaleDateString("en-CA"));
        }
        previous = stat;
      }
    }
    const activeDays = activeDateKeys.size;

    const leetcodeAccount = platforms.find(
      (platform) => platform.platform === "LEETCODE"
    );

    // ------------------------------------------------
    // CHART DATA
    // ------------------------------------------------

    // Merge each platform's cumulative daily snapshots onto one shared date axis.
    const platformByAccountId = new Map(
      platforms.map((platform) => [platform.id, platform.platform])
    );
    const snapshotsByDate = new Map();
    for (const stat of [...dailyStats].sort((a, b) => new Date(a.date) - new Date(b.date))) {
      const platform = platformByAccountId.get(stat.platformAccountId);
      if (platform !== "LEETCODE" && platform !== "CODEFORCES") continue;
      const dateKey = new Date(stat.date).toISOString().slice(0, 10);
      if (!snapshotsByDate.has(dateKey)) snapshotsByDate.set(dateKey, {});
      snapshotsByDate.get(dateKey)[platform] = stat;
    }

    let latestLeetCode = { solved: 0, accepted: 0, submissions: 0 };
    let latestCodeforces = { solved: 0, accepted: 0, submissions: 0 };
    const chartData = [...snapshotsByDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dateKey, snapshots]) => {
      if (snapshots.LEETCODE) {
        latestLeetCode = {
          solved: Number(snapshots.LEETCODE.solvedCount ?? 0),
          accepted: Number(snapshots.LEETCODE.acceptedCount ?? 0),
          submissions: Number(snapshots.LEETCODE.submissionCount ?? 0),
        };
      }
      if (snapshots.CODEFORCES) {
        latestCodeforces = {
          solved: Number(snapshots.CODEFORCES.solvedCount ?? 0),
          accepted: Number(snapshots.CODEFORCES.acceptedCount ?? 0),
          submissions: Number(snapshots.CODEFORCES.submissionCount ?? 0),
        };
      }
      return {
        date: new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        leetcode: latestLeetCode[historyMetric],
        codeforces: latestCodeforces[historyMetric],
      };
    });

    const difficultyData = leetcodeAccount ? [
      { name: "Easy", value: leetcodeAccount.easyCount ?? 0, color: DIFFICULTY_COLORS.easy },
      { name: "Medium", value: leetcodeAccount.mediumCount ?? 0, color: DIFFICULTY_COLORS.medium },
      { name: "Hard", value: leetcodeAccount.hardCount ?? 0, color: DIFFICULTY_COLORS.hard },
    ] : [];
    const difficultyTotal = difficultyData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="dashboard-page">
        {toastMessage && <div className="sync-toast" role="status" aria-live="polite">{toastMessage}</div>}
        {menuOpen && <button className="menu-backdrop" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />}
        <aside className={`navigation-drawer ${menuOpen ? "navigation-drawer-open" : ""}`} aria-hidden={!menuOpen}>
          <div className="drawer-brand"><CodeTrackLogo className="brand-mark" /><div><strong>CodeTrack</strong><span>Workspace menu</span></div></div>
          <div className="drawer-label">WORKSPACE</div>
          <button className={`drawer-link ${selectedPage === "overview" ? "drawer-link-active" : ""}`} onClick={() => { setSelectedPage("overview"); setMenuOpen(false); }}><span className="drawer-icon">⌂</span>Overview</button>
          <button className={`drawer-link ${selectedPage === "platforms" ? "drawer-link-active" : ""}`} onClick={() => { setSelectedPage("platforms"); setMenuOpen(false); }}><span className="drawer-icon">▦</span>Platforms<span className="drawer-count">{platforms.length}</span></button>
          <div className="drawer-divider" />
          <div className="drawer-label">ACCOUNT</div>
          <button className={`drawer-link ${selectedPage === "settings" ? "drawer-link-active" : ""}`} onClick={() => { setSelectedPage("settings"); setMenuOpen(false); }}><span className="drawer-icon">⚙</span>Profile &amp; Settings</button>
          <div className="drawer-bottom"><div className="drawer-user-avatar">{getInitials(user.username)}</div><div className="drawer-user-details"><strong>{user.username}</strong><span>{user.email || "CodeTrack account"}</span></div><button className="drawer-logout" onClick={logout} aria-label="Logout" title="Logout">↗</button></div>
        </aside>
        {/* HEADER */}

        <header className={`dashboard-header ${showHeader ? "" : "dashboard-header-hidden"}`}>
          <div className="header-left-group">
            <button className="menu-toggle" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu" title="Open menu"><span></span><span></span><span></span></button>
            <div className="header-brand">
            <CodeTrackLogo className="brand-mark" />
              <div><h1>CodeTrack</h1><p>Competitive programming analytics</p></div>
            </div>
          </div>
          <div className="header-actions">
            <span className="header-status"><span className="status-dot" /> Workspace</span>
            <span className="header-user">
              <span className="header-user-avatar">{getInitials(user.username)}</span>
              {user.username}
            </span>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </header>

        <main className="dashboard-content">
          {selectedPage === "overview" ? (
          <>
          {/* WELCOME */}

          <section className="welcome">
            <div className="welcome-identity">
              <div className="user-avatar">{getInitials(user.username)}</div>
              <div>
                <h2>Welcome back, <span>{user.username}</span></h2>
                <p>Your progress, all in one place.</p>
              </div>
            </div>
            <div className="welcome-chip">
              <span className="welcome-chip-icon"><span className="status-dot" /></span>
              <div><strong>{platforms.length > 0 ? "Platform connected" : "Ready to connect"}</strong>
              <span>{platforms.length > 0 ? "Your stats are available" : "Connect LeetCode to get started"}</span></div>
            </div>
          </section>

          {/* SUMMARY STATS */}

          <section className="stats-grid">
            <div className="stat-card stat-card-featured">
              <div className="stat-label"><span className="metric-icon metric-check"><IconCheck /></span>Problems solved</div>
              <strong>{totalSolved}</strong>
            </div>

            <div className="stat-card">
              <div className="stat-label"><span className="metric-icon metric-violet"><IconGrid /></span>Platforms</div>
              <strong>{platforms.length}</strong>
            </div>

            <div className="stat-card">
              <div className="stat-label"><span className="metric-icon metric-teal"><IconSend /></span>Submissions</div>
              <strong>{totalSubmissions}</strong>
            </div>

            <div className="stat-card">
              <div className="stat-label"><span className="metric-icon metric-amber"><IconCalendar /></span>Active days</div>
              <strong>{activeDays}</strong>
            </div>
          </section>

          {/* CONNECTED PLATFORMS */}

          <section className="section">
            <div className="section-head"><div><h2>Connected platforms</h2></div>
            <div className="section-head-actions">
              <span className="section-count">{platforms.length} connected</span>
              <button className="sync-btn" onClick={syncAccounts} disabled={syncingAccounts || syncing || syncingCodeforces}>
                {syncingAccounts || syncing || syncingCodeforces ? "Syncing accounts..." : "Sync Accounts"}
              </button>
            </div></div>

            {platforms.length > 0 ? (
              <div className="platform-grid">
                {platforms.map((platform) => (
                  <div className="platform-card" key={platform.id}>
                    <div className="platform-identity">
                      <div className={`platform-avatar platform-avatar-${platform.platform.toLowerCase()}`}>
                        {platform.platform === "LEETCODE" ? <LeetCodeIcon /> : platform.platform === "CODEFORCES" ? <CodeforcesIcon /> : platform.platform.slice(0, 2)}
                      </div>
                      <div>
                        <h3>{platform.platform === "LEETCODE" ? "LeetCode" : platform.platform === "CODEFORCES" ? "Codeforces" : platform.platform}</h3>
                        <p><a className="platform-profile-link" href={platform.platform === "LEETCODE" ? `https://leetcode.com/${encodeURIComponent(platform.username)}/` : platform.platform === "CODEFORCES" ? `https://codeforces.com/profile/${encodeURIComponent(platform.username)}` : "#"} target="_blank" rel="noreferrer">@{platform.username}</a></p>
                      </div>
                    </div>

                    <div className="rating">
                      <span>Rating</span>
                      <strong>{platform.rating ?? <span className="stat-dash">—</span>}</strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="connect-card">
                <h3>Connect LeetCode</h3>

                <p>
                  Connect your LeetCode account to start tracking your
                  competitive programming activity.
                </p>

                <form
                  className="connect-form"
                  onSubmit={connectLeetCode}
                >
                  <input
                    type="text"
                    placeholder="Enter LeetCode username"
                    value={leetcodeUsername}
                    onChange={(e) =>
                      setLeetcodeUsername(e.target.value)
                    }
                    required
                  />

                  <button
                    className="sync-btn"
                    type="submit"
                    disabled={connecting}
                  >
                    {connecting
                      ? "Connecting..."
                      : "Connect LeetCode"}
                  </button>
                </form>
              </div>
            )}
          </section>

          {/* LEETCODE PERFORMANCE */}

          {leetcodeAccount && (
            <section className="section">
              <div className="section-head">
                <div><h2>LeetCode performance</h2></div>

                <button className="sync-btn" onClick={() => syncLeetCode()} disabled={syncing || syncingAccounts || syncingCodeforces}>
                  {syncing ? "Syncing LeetCode..." : "Sync LeetCode"}
                </button>
              </div>

              {leetcodeStats ? (
                <div className="leetcode-stats">
                  <div className="leetcode-main-stat">
                    <span>Total solved</span>
                    <strong>{leetcodeStats.solved}</strong>
                    {leetcodeStats.easy + leetcodeStats.medium + leetcodeStats.hard > 0 && (
                      <div
                        className="mini-bar"
                        title={`${leetcodeStats.easy} Easy · ${leetcodeStats.medium} Medium · ${leetcodeStats.hard} Hard`}
                      >
                        <span style={{ width: `${(leetcodeStats.easy / (leetcodeStats.easy + leetcodeStats.medium + leetcodeStats.hard)) * 100}%`, background: DIFFICULTY_COLORS.easy }} />
                        <span style={{ width: `${(leetcodeStats.medium / (leetcodeStats.easy + leetcodeStats.medium + leetcodeStats.hard)) * 100}%`, background: DIFFICULTY_COLORS.medium }} />
                        <span style={{ width: `${(leetcodeStats.hard / (leetcodeStats.easy + leetcodeStats.medium + leetcodeStats.hard)) * 100}%`, background: DIFFICULTY_COLORS.hard }} />
                      </div>
                    )}
                  </div>

                  <div className="leetcode-stat">
                    <span>Easy</span>
                    <strong>{leetcodeStats.easy}</strong>
                  </div>

                  <div className="leetcode-stat">
                    <span>Medium</span>
                    <strong>{leetcodeStats.medium}</strong>
                  </div>

                  <div className="leetcode-stat">
                    <span>Hard</span>
                    <strong>{leetcodeStats.hard}</strong>
                  </div>

                  <div className="leetcode-stat">
                    <span>Submissions</span>
                    <strong>{leetcodeStats.submissions}</strong>
                  </div>
                </div>
              ) : (
                <div className="message dashboard-message">
                  Click "Sync LeetCode" to fetch your latest statistics.
                </div>
              )}

              {difficultyTotal > 0 && (
                <div className="difficulty-panel">
                  <div className="difficulty-summary">
                    <h3>Know your strengths</h3>
                    <p>Your solved problems by difficulty.</p>
                    <div className="difficulty-legend">
                      {difficultyData.map((item) => (
                        <div className="difficulty-legend-item" key={item.name}>
                          <span className="difficulty-dot" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span><strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="difficulty-chart">
                    <ResponsiveContainer width="100%" height={190}>
                      <PieChart>
                        <Pie data={difficultyData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={78} paddingAngle={4} stroke="none">
                          {difficultyData.map((item) => <Cell key={item.name} fill={item.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#111925", border: "1px solid #2A3A50", borderRadius: "12px", color: "#F0F5FF" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="difficulty-chart-center"><strong>{difficultyTotal}</strong><span>Solved</span></div>
                  </div>
                </div>
              )}
            </section>
          )}

          {platforms.some((platform) => platform.platform === "CODEFORCES") && (
            <section className="section">
              <div className="section-head">
                <div><h2>Codeforces performance</h2><p className="section-description">Your solved problems and submission activity.</p></div>
                <button className="sync-btn" onClick={() => syncCodeforces()} disabled={syncingCodeforces || syncingAccounts}>
                  {syncingCodeforces ? "Syncing..." : "Sync Codeforces"}
                </button>
              </div>
              <div className="leetcode-stats codeforces-stats">
                <div className="leetcode-main-stat"><span>Problems solved</span><strong>{codeforcesStats?.solved ?? 0}</strong></div>
                <div className="leetcode-stat"><span>Submissions</span><strong>{codeforcesStats?.submissions ?? 0}</strong></div>
                <div className="leetcode-stat"><span>Accepted submissions</span><strong>{codeforcesStats?.accepted ?? 0}</strong></div>
                <div className="leetcode-stat"><span>Current rating</span><strong>{platforms.find((platform) => platform.platform === "CODEFORCES")?.rating ?? "—"}</strong></div>
              </div>
              {!codeforcesStats && <p className="section-description">Click Sync Codeforces to fetch problem and submission statistics.</p>}

              {codeforcesRatingDistribution && (codeforcesRatingDistribution.exact?.length > 0 || codeforcesRatingDistribution.ranges?.length > 0) && (
                <div className="difficulty-panel codeforces-rating-panel">
                  <div className="difficulty-summary">
                    <h3>Know your strengths</h3>
                    <p>Your solved Codeforces problems by problem rating.</p>
                    <div className="rating-view-toggle" role="group" aria-label="Codeforces rating chart view">
                      <button type="button" className={codeforcesRatingView === "exact" ? "rating-view-active" : ""} onClick={() => setCodeforcesRatingView("exact")}>Exact rating</button>
                      <button type="button" className={codeforcesRatingView === "ranges" ? "rating-view-active" : ""} onClick={() => setCodeforcesRatingView("ranges")}>Rating ranges</button>
                    </div>
                    <div className="difficulty-legend codeforces-rating-legend">
                      {(codeforcesRatingView === "exact" ? codeforcesRatingDistribution.exact : codeforcesRatingDistribution.ranges).map((item) => (
                        <div className="difficulty-legend-item" key={item.name}>
                          <span className="difficulty-dot" style={{ backgroundColor: item.color }} />
                          <span>{codeforcesRatingView === "exact" ? `${item.name} rating` : item.name}</span><strong>{item.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="difficulty-chart">
                    <ResponsiveContainer width="100%" height={190}>
                      <PieChart>
                        <Pie data={codeforcesRatingView === "exact" ? codeforcesRatingDistribution.exact : codeforcesRatingDistribution.ranges} dataKey="value" nameKey="name" innerRadius={58} outerRadius={78} paddingAngle={2} stroke="none">
                          {(codeforcesRatingView === "exact" ? codeforcesRatingDistribution.exact : codeforcesRatingDistribution.ranges).map((item) => <Cell key={item.name} fill={item.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#111925", border: "1px solid #2A3A50", borderRadius: "12px", color: "#F0F5FF" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="difficulty-chart-center"><strong>{(codeforcesRatingView === "exact" ? codeforcesRatingDistribution.exact : codeforcesRatingDistribution.ranges).reduce((sum, item) => sum + item.value, 0)}</strong><span>Rated solved</span></div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ACTIVITY HISTORY */}

          <section className="section">
            <div className="section-head">
              <div>
                <h2>Activity history</h2>
                <p className="section-description">
                  Compare your LeetCode and Codeforces activity over time.
                </p>
              </div>
              <div className="history-metric-toggle" role="group" aria-label="Activity history metric">
                <button type="button" className={`history-metric-option history-metric-solved ${historyMetric === "solved" ? "history-metric-active" : ""}`} onClick={() => setHistoryMetric("solved")}>Problems Solved</button>
                <button type="button" className={`history-metric-option history-metric-accepted ${historyMetric === "accepted" ? "history-metric-active" : ""}`} onClick={() => setHistoryMetric("accepted")}>Accepted</button>
                <button type="button" className={`history-metric-option history-metric-submissions ${historyMetric === "submissions" ? "history-metric-active" : ""}`} onClick={() => setHistoryMetric("submissions")}>Submissions</button>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid stroke="#26364A" strokeDasharray="3 5" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: "#8495AC", fontSize: 12 }} axisLine={{ stroke: "#26364A" }} tickLine={false} tickMargin={12} />
                    <YAxis allowDecimals={false} tick={{ fill: "#8495AC", fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip contentStyle={{ backgroundColor: "#111925", border: "1px solid #2A3A50", borderRadius: "12px", color: "#F0F5FF", boxShadow: "0 12px 36px rgba(0,0,0,0.28)" }} labelStyle={{ color: "#A9B9CE", marginBottom: 6 }} />
                    <Legend verticalAlign="bottom" height={30} wrapperStyle={{ color: "#A9B9CE", fontSize: "12px", paddingTop: "4px" }} iconType="circle" iconSize={8} />
                    <Line type="monotone" dataKey="leetcode" name="LeetCode" stroke="#F2C94C" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0 }} dot={{ r: 3, strokeWidth: 0, fill: "#F2C94C" }} connectNulls />
                    <Line type="monotone" dataKey="codeforces" name="Codeforces" stroke="#5B9DFF" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0 }} dot={{ r: 3, strokeWidth: 0, fill: "#5B9DFF" }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="message dashboard-message">No activity history available yet.</div>
            )}
          </section>

          {/* MESSAGE */}

          {message && (
            <div className="message dashboard-message">
              {message}
            </div>
          )}

          {/* DAILY ACTIVITY */}

          <section className="section">
            <div className="section-head"><div><h2>Daily activity</h2></div>
            <span className="section-count">{dailyStats.length} records</span></div>

            {dailyStats.length > 0 ? (
              <div className="activity-list">
                {dailyStats.map((stat) => (
                  <div className="activity-card" key={stat.id}>
                    <div>
                      <strong>{stat.platform}</strong>

                      <p>
                        {new Date(stat.date).toLocaleDateString(
                          "en-IN"
                        )}
                      </p>
                    </div>

                    <div className="activity-numbers">
                      <div>
                        <span>{isTodayDate(stat.date) ? "Solved Today" : "Solved"}</span>

                        <strong>
                          {stat.dailySolved === null ||
                          stat.dailySolved === undefined ? (
                            <span className="stat-dash">—</span>
                          ) : (
                            stat.dailySolved
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>{isTodayDate(stat.date) ? "Submissions Today" : "Submissions"}</span>

                        <strong>
                          {stat.dailySubmissions === null ||
                          stat.dailySubmissions === undefined ? (
                            <span className="stat-dash">—</span>
                          ) : (
                            stat.dailySubmissions
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>{isTodayDate(stat.date) ? "Accepted Today" : "Accepted"}</span>

                        <strong>
                          {stat.dailyAccepted === null ||
                          stat.dailyAccepted === undefined ? (
                            <span className="stat-dash">—</span>
                          ) : (
                            stat.dailyAccepted
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="message dashboard-message">
                No daily activity available yet.
              </div>
            )}
          </section>
          </>
          ) : selectedPage === "platforms" ? (
            <>
              <section className="page-intro">
                <span className="page-eyebrow">YOUR CONNECTIONS</span>
                <h2>Platforms</h2>
                <p>Manage the coding platforms connected to your CodeTrack account.</p>
              </section>
              <section className="section">
                <div className="section-head"><div><h2>Connected platforms</h2></div><span className="section-count">{platforms.length} connected</span></div>
                {platforms.length > 0 && (
                  <div className="platform-grid">
                    {platforms.map((platform) => (
                      <div className="platform-card platform-page-card" key={platform.id}>
                        <div className="platform-identity">
                          <div className={`platform-avatar platform-avatar-${platform.platform.toLowerCase()}`}>
                            {platform.platform === "LEETCODE" ? <LeetCodeIcon /> : platform.platform === "CODEFORCES" ? <CodeforcesIcon /> : platform.platform.slice(0, 2)}
                          </div>
                          <div>
                            <h3>{platform.platform === "LEETCODE" ? "LeetCode" : platform.platform === "CODEFORCES" ? "Codeforces" : platform.platform}</h3>
                            <p><a className="platform-profile-link" href={platform.platform === "LEETCODE" ? `https://leetcode.com/${encodeURIComponent(platform.username)}/` : platform.platform === "CODEFORCES" ? `https://codeforces.com/profile/${encodeURIComponent(platform.username)}` : "#"} target="_blank" rel="noreferrer">@{platform.username}</a></p>
                            <span className="connection-status"><span className="status-dot" /> Connected</span>
                          </div>
                        </div>
                        <div className={`platform-metrics ${platform.platform === "CODEFORCES" ? "platform-metrics-codeforces" : "platform-metrics-leetcode"}`}>
                          <div className="platform-rating-row">
                            <div className="rating"><span>Rating</span><strong>{platform.rating ?? <span className="stat-dash">—</span>}</strong></div>
                            {platform.platform === "CODEFORCES" && (
                              <div className="rating"><span>Max rating</span><strong>{platform.maxRating ?? <span className="stat-dash">—</span>}</strong></div>
                            )}
                          </div>
                          {platform.platform === "CODEFORCES" && (
                            <div className="platform-rank-row">
                              <div className="platform-rank"><span>Current rank</span><strong>{platform.rank || "Unrated"}</strong></div>
                              <div className="platform-rank"><span>Highest rank</span><strong>{platform.maxRank || "—"}</strong></div>
                            </div>
                          )}
                        </div>
                        {platform.platform === "LEETCODE" && <button className="sync-btn platform-sync-btn" onClick={() => syncLeetCode()} disabled={syncing || syncingAccounts}>{syncing ? "Syncing..." : "Sync LeetCode"}</button>}
                        {platform.platform === "CODEFORCES" && <button className="sync-btn platform-sync-btn" onClick={() => syncCodeforces()} disabled={syncingCodeforces || syncingAccounts}>{syncingCodeforces ? "Syncing..." : "Sync Codeforces"}</button>}
                      </div>
                    ))}
                  </div>
                )}

                {!platforms.some((platform) => platform.platform === "LEETCODE") && (
                  <div className="connect-card platform-connect-card">
                    <h3>Connect LeetCode</h3>
                    <p>Connect your LeetCode account to track solved problems and daily coding activity.</p>
                    <form className="connect-form" onSubmit={connectLeetCode}>
                      <input type="text" placeholder="Enter LeetCode username" value={leetcodeUsername} onChange={(e) => setLeetcodeUsername(e.target.value)} required />
                      <button className="sync-btn" type="submit" disabled={connecting}>{connecting ? "Connecting..." : "Connect LeetCode"}</button>
                    </form>
                  </div>
                )}

                {!platforms.some((platform) => platform.platform === "CODEFORCES") && (
                  <div className="connect-card platform-connect-card">
                    <h3>Connect Codeforces</h3>
                    <p>Connect your Codeforces handle to display your current rating, maximum rating, and ranks.</p>
                    <form className="connect-form" onSubmit={connectCodeforces}>
                      <input type="text" placeholder="Enter Codeforces handle" value={codeforcesUsername} onChange={(e) => setCodeforcesUsername(e.target.value)} required />
                      <button className="sync-btn" type="submit" disabled={connectingCodeforces}>{connectingCodeforces ? "Connecting..." : "Connect Codeforces"}</button>
                    </form>
                  </div>
                )}

                <div className="upcoming-platforms">
                  <div><strong>More platforms are on the roadmap</strong><p>Additional integrations will appear here when they are supported.</p></div>
                  <div className="upcoming-tags"><span>CodeChef</span><span>AtCoder</span></div>
                </div>
              </section>
              {message && <div className="message dashboard-message page-message">{message}</div>}
            </>
          ) : (
            <>
              <section className="page-intro"><span className="page-eyebrow">YOUR ACCOUNT</span><h2>Profile &amp; Settings</h2><p>View your account details and manage your CodeTrack session.</p></section>
              <section className="section settings-section">
                <div className="section-head"><div><h2>Profile information</h2></div><span className="section-count">Account details</span></div>
                <div className="settings-card">
                  <div className="settings-profile"><div className="settings-avatar">{getInitials(user.username)}</div><div><h3>{user.username}</h3><p>Your CodeTrack profile</p></div></div>
                  <div className="settings-fields">
                    <div className="settings-field"><span>Username</span><strong>{user.username || "Not available"}</strong></div>
                    <div className="settings-field"><span>Email address</span><strong>{user.email || "Not available"}</strong></div>
                    <div className="settings-field"><span>Connected platforms</span><strong>{platforms.length}</strong></div>
                    <div className="settings-field"><span>Account status</span><strong className="settings-active"><span className="status-dot" /> Active</strong></div>
                  </div>
                </div>
              </section>
              <section className="section settings-section">
                <div className="section-head"><div><h2>Session</h2></div></div>
                <div className="settings-card settings-session"><div><h3>Sign out of CodeTrack</h3><p>You can sign back in anytime with your account credentials.</p></div><button className="logout-btn" onClick={logout}>Logout</button></div>
              </section>
            </>
          )}
        </main>
      </div>
    );
  }

  // ==================================================
  // LOGIN / REGISTER
  // ==================================================

  return (
    <div className="app auth-page">
      <div className="auth-glow auth-glow-one" aria-hidden="true" />
      <div className="auth-glow auth-glow-two" aria-hidden="true" />
      <main className="auth-card">
        <div className="auth-brand-lockup">
          <CodeTrackLogo className="auth-logo" />
          <div className="auth-wordmark">
            <span>CodeTrack</span>
            <span className="auth-brand-caption">COMPETITIVE PROGRAMMING ANALYTICS</span>
          </div>
        </div>

        <div className="auth-heading">
          <span className="auth-eyebrow">YOUR PROGRESS, IN FOCUS</span>
          <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p>{mode === "login" ? "Sign in to pick up where you left off." : "Start tracking your competitive programming journey."}</p>
        </div>

        <div className="tabs" role="tablist" aria-label="Authentication options">
          <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setMessage(""); }}>Login</button>
          <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setMessage(""); }}>Create account</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <div className="input-group">
              <label htmlFor="auth-username">Username</label>
              <input id="auth-username" type="text" name="username" placeholder="Choose a username" value={form.username} onChange={handleChange} autoComplete="username" required />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="auth-email">Email address</label>
            <input id="auth-email" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" required />
          </div>

          <div className="input-group">
            <label htmlFor="auth-password">Password</label>
            <div className="password-input-wrap">
              <input id="auth-password" type={showPassword ? "text" : "password"} name="password" placeholder="Enter your password" value={form.password} onChange={handleChange} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} />
              <button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button>
            </div>
          </div>

          {message && <div className="message auth-message" role="status">{message}</div>}

          {emailVerificationRequired && mode === "login" && (
            <button className="submit-btn" type="button" onClick={resendVerification} disabled={resendingVerification}>
              {resendingVerification ? "Sending verification email..." : "Resend verification email"}
            </button>
          )}

          <button className="submit-btn auth-submit" type="submit" disabled={loading}>
            <span>{loading ? (mode === "login" ? "Signing in..." : "Creating account...") : (mode === "login" ? "Sign in" : "Create account")}</span>
            {!loading && <span className="submit-arrow" aria-hidden="true">→</span>}
          </button>
        </form>

        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <div id="google-signin-button" />
        </div>

        <div className="auth-footer"><span className="status-dot" /> Your coding journey, all in one place</div>
      </main>
    </div>
  );
}

export default App;
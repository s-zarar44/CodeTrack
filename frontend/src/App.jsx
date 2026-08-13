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
} from "recharts";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [mode, setMode] = useState("login");
  const [view, setView] = useState("auth");

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
  });

  const [leetcodeUsername, setLeetcodeUsername] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [leetcodeStats, setLeetcodeStats] = useState(null);

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
  // SYNC LEETCODE
  // --------------------------------------------------

  const syncLeetCode = async (usernameOverride = null) => {
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

      setMessage("LeetCode synced successfully!");
    } catch (error) {
      console.error("LeetCode sync error:", error);
      setMessage(error.message);
    } finally {
      setSyncing(false);
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
        throw new Error(data.message || "Something went wrong");
      }

      if (mode === "login") {
        localStorage.setItem("token", data.token);
        await fetchDashboard();
      } else {
        setMessage("Account created successfully! You can now login.");

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
    setMessage("");
  };

  // ==================================================
  // DASHBOARD
  // ==================================================

  if (view === "dashboard" && dashboard) {
    const user = dashboard.user;
    const platforms = dashboard.platforms;
    const dailyStats = dashboard.dailyStats;

    const latestStats = dailyStats[0];

    const totalSolved = latestStats?.solvedCount ?? 0;
    const totalSubmissions = latestStats?.submissionCount ?? 0;

    const leetcodeAccount = platforms.find(
      (platform) => platform.platform === "LEETCODE"
    );

    // ------------------------------------------------
    // CHART DATA
    // ------------------------------------------------

    const chartData = [...dailyStats]
      .reverse()
      .map((stat) => ({
        date: new Date(stat.date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        solved: stat.solvedCount,
        submissions: stat.submissionCount,
        accepted: stat.acceptedCount,
      }));

    return (
      <div className="dashboard-page">
        {/* HEADER */}

        <header className="dashboard-header">
          <div className="header-brand">
            <h1>CodeTrack</h1>
            <p>Competitive Programming Analytics</p>
          </div>

          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </header>

        <main className="dashboard-content">
          {/* WELCOME */}

          <section className="welcome">
            <h2>Welcome, {user.username} 👋</h2>
            <p>Here's your coding activity at a glance.</p>
          </section>

          {/* SUMMARY STATS */}

          <section className="stats-grid">
            <div className="stat-card">
              <span>Platforms</span>
              <strong>{platforms.length}</strong>
            </div>

            <div className="stat-card">
              <span>Problems Solved</span>
              <strong>{totalSolved}</strong>
            </div>

            <div className="stat-card">
              <span>Submissions</span>
              <strong>{totalSubmissions}</strong>
            </div>

            <div className="stat-card">
              <span>Daily Records</span>
              <strong>{dailyStats.length}</strong>
            </div>
          </section>

          {/* CONNECTED PLATFORMS */}

          <section className="section">
            <h2>Connected Platforms</h2>

            {platforms.length > 0 ? (
              <div className="platform-grid">
                {platforms.map((platform) => (
                  <div className="platform-card" key={platform.id}>
                    <div>
                      <h3>{platform.platform}</h3>
                      <p>@{platform.username}</p>
                    </div>

                    <div className="rating">
                      <span>Rating</span>
                      <strong>{platform.rating ?? "—"}</strong>
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
              <div className="section-header">
                <h2>LeetCode Performance</h2>

                <button
                  className="sync-btn"
                  onClick={() => syncLeetCode()}
                  disabled={syncing}
                >
                  {syncing ? "Syncing..." : "Sync LeetCode"}
                </button>
              </div>

              {leetcodeStats ? (
                <div className="leetcode-stats">
                  <div className="leetcode-main-stat">
                    <span>Total Solved</span>
                    <strong>{leetcodeStats.solved}</strong>
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
            </section>
          )}

          {/* ACTIVITY HISTORY */}

          <section className="section">
            <div className="section-header">
              <div>
                <h2>Activity History</h2>

                <p className="section-description">
                  Your cumulative coding activity over time.
                </p>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 10,
                      right: 20,
                      left: 0,
                      bottom: 10,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="date" />

                    <YAxis allowDecimals={false} />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="solved"
                      name="Solved"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="submissions"
                      name="Submissions"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />

                    <Line
                      type="monotone"
                      dataKey="accepted"
                      name="Accepted"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="message dashboard-message">
                No activity history available yet.
              </div>
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
            <h2>Daily Activity</h2>

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
                        <span>Solved Today</span>

                        <strong>
                          {stat.dailySolved === null ||
                          stat.dailySolved === undefined
                            ? "—"
                            : stat.dailySolved}
                        </strong>
                      </div>

                      <div>
                        <span>Submissions Today</span>

                        <strong>
                          {stat.dailySubmissions === null ||
                          stat.dailySubmissions === undefined
                            ? "—"
                            : stat.dailySubmissions}
                        </strong>
                      </div>

                      <div>
                        <span>Accepted Today</span>

                        <strong>
                          {stat.dailyAccepted === null ||
                          stat.dailyAccepted === undefined
                            ? "—"
                            : stat.dailyAccepted}
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
        </main>
      </div>
    );
  }

  // ==================================================
  // LOGIN / REGISTER
  // ==================================================

  return (
    <div className="app">
      <div className="auth-card">
        <div className="brand">
          <h1>CodeTrack</h1>
          <p>Track. Analyze. Improve.</p>
        </div>

        <div className="tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            Login
          </button>

          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setMessage("");
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="input-group">
              <label>Username</label>

              <input
                type="text"
                name="username"
                placeholder="Enter username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label>Email</label>

            <input
              type="email"
              name="email"
              placeholder="Enter email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          {message && <div className="message">{message}</div>}

          <button
            className="submit-btn"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
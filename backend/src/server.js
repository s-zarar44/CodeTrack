require("dotenv").config();

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const platformRoutes = require("./routes/platform");
const dashboardRoutes = require("./routes/dashboard");
const authenticateToken = require("./middleware/auth");

const pool = require("./config/db");

const app = express();


app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "https://code-track-weld.vercel.app",
        ],
        credentials: true,
    })
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/platform", platformRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.status(200).json({
            success: true,
            message: "CodeTrack API is running",
            database: "connected",
            time: result.rows[0].now,
        });
    } catch (error) {
        console.error("Database error:", error.message);

        res.status(500).json({
            success: false,
            message: "Database connection failed",
        });
    }
});

app.get("/api/profile", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, "createdAt" FROM "User" WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Profile error:", error.message);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`CodeTrack server running on http://localhost:${PORT}`);
});
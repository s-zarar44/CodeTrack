const express = require("express");
const pool = require("../config/db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

router.get("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const userResult = await pool.query(
            `SELECT id, username, email, "createdAt"
             FROM "User"
             WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const accountsResult = await pool.query(
            `SELECT
                id,
                platform,
                username,
                rating,
                "maxRating",
                "easyCount",
                "mediumCount",
                "hardCount"
             FROM "PlatformAccount"
             WHERE "userId" = $1
             ORDER BY platform`,
            [userId]
        );

        const statsResult = await pool.query(
            `SELECT
                ds.id,
                ds.date,
                ds."solvedCount",
                ds."submissionCount",
                ds."acceptedCount",
                ds.streak,
                ds."platformAccountId",
                pa.platform,
                pa.username,

                LAG(ds."solvedCount") OVER (
                    PARTITION BY ds."platformAccountId"
                    ORDER BY ds.date
                ) AS "previousSolved",

                LAG(ds."submissionCount") OVER (
                    PARTITION BY ds."platformAccountId"
                    ORDER BY ds.date
                ) AS "previousSubmissions",

                LAG(ds."acceptedCount") OVER (
                    PARTITION BY ds."platformAccountId"
                    ORDER BY ds.date
                ) AS "previousAccepted"

             FROM "DailyStats" ds
             JOIN "PlatformAccount" pa
               ON pa.id = ds."platformAccountId"
             WHERE pa."userId" = $1
             ORDER BY ds.date DESC`,
            [userId]
        );

        const dailyStats = statsResult.rows.map((stat) => ({
            ...stat,

            dailySolved:
                stat.previousSolved === null
                    ? null
                    : stat.solvedCount - stat.previousSolved,

            dailySubmissions:
                stat.previousSubmissions === null
                    ? null
                    : stat.submissionCount - stat.previousSubmissions,

            dailyAccepted:
                stat.previousAccepted === null
                    ? null
                    : stat.acceptedCount - stat.previousAccepted,
        }));

        res.status(200).json({
            success: true,
            user: userResult.rows[0],
            platforms: accountsResult.rows,
            dailyStats,
        });
    } catch (error) {
        console.error("Dashboard error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

module.exports = router;
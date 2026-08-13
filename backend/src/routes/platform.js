const express = require("express");
const pool = require("../config/db");
const authenticateToken = require("../middleware/auth");
const { getLeetCodeStats } = require("../services/leetcode");

const router = express.Router();

/*
 * CONNECT PLATFORM ACCOUNT
 * Currently supports LeetCode for the MVP.
 */
router.post("/accounts", authenticateToken, async (req, res) => {
    try {
        const { platform, username } = req.body;

        if (!platform || !username) {
            return res.status(400).json({
                success: false,
                message: "Platform and username are required",
            });
        }

        const validPlatforms = [
            "LEETCODE",
            "CODEFORCES",
            "CODECHEF",
            "ATCODER",
        ];

        if (!validPlatforms.includes(platform)) {
            return res.status(400).json({
                success: false,
                message: "Invalid platform",
            });
        }

        const cleanUsername = username.trim();

        if (!cleanUsername) {
            return res.status(400).json({
                success: false,
                message: "Username cannot be empty",
            });
        }

        /*
         * Check whether this platform is already connected
         * to the current CodeTrack user.
         */
        const existingUserAccount = await pool.query(
            `SELECT id
             FROM "PlatformAccount"
             WHERE "userId" = $1
             AND platform = $2`,
            [req.user.userId, platform]
        );

        if (existingUserAccount.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: `${platform} account is already connected`,
            });
        }

        /*
         * For LeetCode:
         * Verify the username BEFORE inserting anything
         * into PlatformAccount.
         */
        let stats = null;

        if (platform === "LEETCODE") {
            try {
                stats = await getLeetCodeStats(cleanUsername);
            } catch (error) {
                console.error(
                    "LeetCode verification error:",
                    error.message
                );

                return res.status(400).json({
                    success: false,
                    message:
                        error.message ||
                        "Unable to verify LeetCode username",
                });
            }
        }

        /*
         * Create the platform account only after
         * successful LeetCode verification.
         */
        const result = await pool.query(
            `INSERT INTO "PlatformAccount"
             (
                id,
                platform,
                username,
                "easyCount",
                "mediumCount",
                "hardCount",
                "createdAt",
                "updatedAt",
                "userId"
             )
             VALUES (
                gen_random_uuid()::text,
                $1,
                $2,
                $3,
                $4,
                $5,
                NOW(),
                NOW(),
                $6
             )
             RETURNING *`,
            [
                platform,
                cleanUsername,
                stats?.easy || 0,
                stats?.medium || 0,
                stats?.hard || 0,
                req.user.userId,
            ]
        );

        const account = result.rows[0];

        /*
         * Save the initial daily snapshot for LeetCode.
         */
        if (platform === "LEETCODE" && stats) {
            await pool.query(
                `INSERT INTO "DailyStats"
                 (
                    id,
                    date,
                    "solvedCount",
                    "submissionCount",
                    "acceptedCount",
                    streak,
                    "platformAccountId"
                 )
                 VALUES (
                    gen_random_uuid()::text,
                    CURRENT_DATE,
                    $1,
                    $2,
                    $3,
                    0,
                    $4
                 )
                 ON CONFLICT ("platformAccountId", date)
                 DO UPDATE SET
                    "solvedCount" = EXCLUDED."solvedCount",
                    "submissionCount" = EXCLUDED."submissionCount",
                    "acceptedCount" = EXCLUDED."acceptedCount"`,
                [
                    stats.solved,
                    stats.submissions,
                    stats.solved,
                    account.id,
                ]
            );
        }

        return res.status(201).json({
            success: true,
            message: "Platform account connected",
            account,
            stats,
        });
    } catch (error) {
        console.error("Platform account error:", error);

        /*
         * PostgreSQL duplicate-key protection.
         */
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "This platform account is already connected",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});


/*
 * GET CONNECTED PLATFORM ACCOUNTS
 */
router.get("/accounts", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                platform,
                username,
                rating,
                "maxRating",
                "easyCount",
                "mediumCount",
                "hardCount",
                "updatedAt"
             FROM "PlatformAccount"
             WHERE "userId" = $1
             ORDER BY platform`,
            [req.user.userId]
        );

        return res.status(200).json({
            success: true,
            accounts: result.rows,
        });
    } catch (error) {
        console.error("Platform accounts error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});


/*
 * SYNC LEETCODE STATISTICS
 */
router.get(
    "/leetcode/:username/stats",
    authenticateToken,
    async (req, res) => {
        try {
            const username = req.params.username.trim();

            /*
             * Make sure this account belongs to the
             * currently authenticated CodeTrack user.
             */
            const accountResult = await pool.query(
                `SELECT id
                 FROM "PlatformAccount"
                 WHERE "userId" = $1
                 AND platform = 'LEETCODE'
                 AND username = $2`,
                [req.user.userId, username]
            );

            if (accountResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "LeetCode account is not connected",
                });
            }

            const platformAccountId = accountResult.rows[0].id;

            /*
             * Fetch latest statistics from LeetCode.
             */
            const stats = await getLeetCodeStats(username);

            /*
             * Update current LeetCode statistics.
             */
            await pool.query(
                `UPDATE "PlatformAccount"
                 SET
                    "easyCount" = $1,
                    "mediumCount" = $2,
                    "hardCount" = $3,
                    "updatedAt" = NOW()
                 WHERE id = $4`,
                [
                    stats.easy,
                    stats.medium,
                    stats.hard,
                    platformAccountId,
                ]
            );

            /*
             * Save today's cumulative snapshot.
             */
            await pool.query(
                `INSERT INTO "DailyStats"
                 (
                    id,
                    date,
                    "solvedCount",
                    "submissionCount",
                    "acceptedCount",
                    streak,
                    "platformAccountId"
                 )
                 VALUES (
                    gen_random_uuid()::text,
                    CURRENT_DATE,
                    $1,
                    $2,
                    $3,
                    0,
                    $4
                 )
                 ON CONFLICT ("platformAccountId", date)
                 DO UPDATE SET
                    "solvedCount" = EXCLUDED."solvedCount",
                    "submissionCount" = EXCLUDED."submissionCount",
                    "acceptedCount" = EXCLUDED."acceptedCount"`,
                [
                    stats.solved,
                    stats.submissions,
                    stats.solved,
                    platformAccountId,
                ]
            );

            return res.status(200).json({
                success: true,
                message: "LeetCode synced successfully",
                stats,
                saved: true,
            });
        } catch (error) {
            console.error(
                "LeetCode stats error:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message: error.message || "Unable to sync LeetCode",
            });
        }
    }
);


module.exports = router;
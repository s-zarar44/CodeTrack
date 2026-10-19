const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");
const { OAuth2Client } = require("google-auth-library");
const pool = require("../config/db");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const FRONTEND_URL =
    process.env.FRONTEND_URL || "http://localhost:5173";

const EMAIL_FROM =
    process.env.EMAIL_FROM || "CodeTrack <onboarding@resend.dev>";

function createToken(user) {
    return jwt.sign(
        {
            userId: user.id,
            username: user.username,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
}

function createVerificationToken() {
    const token = crypto.randomBytes(32).toString("hex");

    return {
        token,
        tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    };
}

async function sendVerificationEmail(email, token) {
    const verificationUrl =
        `${FRONTEND_URL}/?verifyToken=${encodeURIComponent(token)}`;

    const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: "Verify your CodeTrack email",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Welcome to CodeTrack!</h2>
                <p>Please verify your email address to activate your account.</p>
                <p>
                    <a href="${verificationUrl}"
                       style="display:inline-block;padding:12px 20px;
                              background:#2563eb;color:white;
                              text-decoration:none;border-radius:6px;">
                        Verify Email
                    </a>
                </p>
                <p>This link expires in 30 minutes.</p>
                <p>If you did not create this account, you can ignore this email.</p>
            </div>
        `,
        text: `Verify your CodeTrack email using this link: ${verificationUrl}`,
    });

    if (error) {
        throw new Error(error.message || "Unable to send verification email");
    }
}

// Register with email and password
router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !username.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Username, email and password are required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim();

        const existingUser = await pool.query(
            'SELECT id FROM "User" WHERE email = $1 OR username = $2',
            [normalizedEmail, normalizedUsername]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Username or email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const { token, tokenHash } = createVerificationToken();

        const result = await pool.query(
            `INSERT INTO "User"
                (id, username, email, password, "createdAt", "updatedAt",
                 "emailVerified", "emailVerificationTokenHash",
                 "emailVerificationExpiresAt")
             VALUES
                (gen_random_uuid()::text, $1, $2, $3, NOW(), NOW(),
                 FALSE, $4, NOW() + INTERVAL '30 minutes')
             RETURNING id, username, email, "createdAt"`,
            [normalizedUsername, normalizedEmail, hashedPassword, tokenHash]
        );

        try {
            await sendVerificationEmail(normalizedEmail, token);
        } catch (emailError) {
            console.error("Verification email error:", emailError.message);

            return res.status(502).json({
                success: false,
                code: "EMAIL_SEND_FAILED",
                message:
                    "Your account was created, but the verification email could not be sent. Please request another verification email.",
            });
        }

        return res.status(201).json({
            success: true,
            message: "Registration successful. Please verify your email before signing in.",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// Verify an email using the link sent by CodeTrack
router.post("/verify-email", async (req, res) => {
    try {
        const { token } = req.body;

        if (typeof token !== "string" || !token) {
            return res.status(400).json({
                success: false,
                message: "Verification token is required",
            });
        }

        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const result = await pool.query(
            `UPDATE "User"
             SET "emailVerified" = TRUE,
                 "emailVerificationTokenHash" = NULL,
                 "emailVerificationExpiresAt" = NULL,
                 "updatedAt" = NOW()
             WHERE "emailVerificationTokenHash" = $1
               AND "emailVerificationExpiresAt" > NOW()
               AND "emailVerified" = FALSE
             RETURNING id`,
            [tokenHash]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "This verification link is invalid or has expired. Please request a new one.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now sign in.",
        });
    } catch (error) {
        console.error("Email verification error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// Resend the verification email
router.post("/resend-verification", async (req, res) => {
    try {
        const { email } = req.body;

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const result = await pool.query(
            `SELECT id, email, "emailVerified"
             FROM "User"
             WHERE email = $1`,
            [normalizedEmail]
        );

        // Use a generic response to avoid revealing whether an account exists.
        const genericResponse = {
            success: true,
            message:
                "If an unverified account exists for that email, a verification link will be sent.",
        };

        if (
            result.rows.length === 0 ||
            result.rows[0].emailVerified
        ) {
            return res.status(200).json(genericResponse);
        }

        const { token, tokenHash } = createVerificationToken();

        await pool.query(
            `UPDATE "User"
             SET "emailVerificationTokenHash" = $1,
                 "emailVerificationExpiresAt" = NOW() + INTERVAL '30 minutes',
                 "updatedAt" = NOW()
             WHERE id = $2`,
            [tokenHash, result.rows[0].id]
        );

        await sendVerificationEmail(normalizedEmail, token);

        return res.status(200).json(genericResponse);
    } catch (error) {
        console.error("Resend verification error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to resend the verification email right now",
        });
    }
});

// Sign in with email and password
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const result = await pool.query(
            `SELECT id, username, email, password, "emailVerified"
             FROM "User"
             WHERE email = $1`,
            [email.trim().toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                success: false,
                code: "EMAIL_NOT_VERIFIED",
                message: "Please verify your email before signing in.",
            });
        }

        const token = createToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
});

// Sign in or register with Google Identity Services
router.post("/google", async (req, res) => {
    try {
        const { credential } = req.body;

        if (typeof credential !== "string" || !credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required",
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({
                success: false,
                message: "Google sign-in is not configured on the server",
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.sub || !payload.email || !payload.email_verified) {
            return res.status(401).json({
                success: false,
                message: "Google account email could not be verified",
            });
        }

        const googleId = payload.sub;
        const email = payload.email.trim().toLowerCase();

        let result = await pool.query(
            `SELECT id, username, email, "googleId"
             FROM "User"
             WHERE "googleId" = $1 OR email = $2
             LIMIT 1`,
            [googleId, email]
        );

        let user;

        if (result.rows.length > 0) {
            user = result.rows[0];

            if (user.googleId && user.googleId !== googleId) {
                return res.status(409).json({
                    success: false,
                    message: "This email is already linked to another Google account",
                });
            }

            const updateResult = await pool.query(
                `UPDATE "User"
                 SET "googleId" = $1,
                     "emailVerified" = TRUE,
                     "emailVerificationTokenHash" = NULL,
                     "emailVerificationExpiresAt" = NULL,
                     "updatedAt" = NOW()
                 WHERE id = $2
                 RETURNING id, username, email`,
                [googleId, user.id]
            );

            user = updateResult.rows[0];
        } else {
            const baseUsername =
                (payload.email.split("@")[0] || "user")
                    .replace(/[^a-zA-Z0-9_]/g, "")
                    .slice(0, 40) || "user";

            let username = baseUsername;
            let suffix = 1;

            while (true) {
                const usernameCheck = await pool.query(
                    'SELECT id FROM "User" WHERE username = $1',
                    [username]
                );

                if (usernameCheck.rows.length === 0) break;

                username = `${baseUsername}${suffix++}`;
            }

            // The existing schema requires a password even for Google accounts.
            const randomPasswordHash = await bcrypt.hash(
                crypto.randomBytes(32).toString("hex"),
                10
            );

            const insertResult = await pool.query(
                `INSERT INTO "User"
                    (id, username, email, password, "createdAt", "updatedAt",
                     "emailVerified", "googleId")
                 VALUES
                    (gen_random_uuid()::text, $1, $2, $3, NOW(), NOW(),
                     TRUE, $4)
                 RETURNING id, username, email`,
                [username, email, randomPasswordHash, googleId]
            );

            user = insertResult.rows[0];
        }

        const token = createToken(user);

        return res.status(200).json({
            success: true,
            message: "Google sign-in successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Google sign-in error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Google sign-in failed. Please try again.",
        });
    }
});

// DELETE ENTIRE CODETRACK ACCOUNT
router.delete("/account", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await pool.query(
            `DELETE FROM "User"
             WHERE id = $1
             RETURNING id`,
            [userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });
    } catch (error) {
        console.error("Delete account error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Unable to delete account",
        });
    }
});

module.exports = router;
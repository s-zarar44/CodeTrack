INSERT INTO "DailyStats"
(id, date, "solvedCount", "submissionCount", "acceptedCount", streak, "platformAccountId")
VALUES (
    gen_random_uuid()::text,
    '2026-08-12',
    84,
    120,
    84,
    0,
    '64d7253c-8dd5-4651-9d2d-17b4f6188c9c'
);

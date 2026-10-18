
const CODEFORCES_API = "https://codeforces.com/api";

const delay = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

async function fetchCodeforces(endpoint, params) {
    const query = new URLSearchParams(params);

    let response;

    try {
        response = await fetch(
            `${CODEFORCES_API}/${endpoint}?${query.toString()}`,
            {
                headers: {
                    "User-Agent": "CodeTrack/1.0",
                    Accept: "application/json",
                },
                signal: AbortSignal.timeout(15000),
            }
        );
    } catch (error) {
        throw new Error(
            error.name === "TimeoutError"
                ? "Codeforces API request timed out. Please try again."
                : "Unable to reach the Codeforces API."
        );
    }

    if (!response.ok) {
        throw new Error(
            `Codeforces API returned HTTP ${response.status}. Please try again later.`
        );
    }

    const data = await response.json();

    if (data.status !== "OK") {
        throw new Error(
            data.comment || "Codeforces API request failed."
        );
    }

    return data.result;
}

async function getCodeforcesProfile(handle) {
    const cleanHandle = String(handle || "").trim();

    if (!cleanHandle) {
        throw new Error("Codeforces handle is required.");
    }

    const users = await fetchCodeforces("user.info", {
        handles: cleanHandle,
    });

    if (!users.length) {
        throw new Error("Codeforces handle was not found.");
    }

    const user = users[0];

    return {
        handle: user.handle,
        rating: Number.isInteger(user.rating)
            ? user.rating
            : null,
        maxRating: Number.isInteger(user.maxRating)
            ? user.maxRating
            : null,
        rank: user.rank || null,
        maxRank: user.maxRank || null,
    };
}

async function getCodeforcesSyncData(handle) {
    const cleanHandle = String(handle || "").trim();

    if (!cleanHandle) {
        throw new Error("Codeforces handle is required.");
    }

    // Fetch the current profile and rating.
    const profile = await getCodeforcesProfile(cleanHandle);

    // Respect Codeforces API rate limits between requests.
    await delay(2100);

    // Fetch the user's available submission history.
    const submissions = await fetchCodeforces("user.status", {
        handle: profile.handle,
    });

    // Process submissions chronologically.
    submissions.sort(
        (a, b) =>
            a.creationTimeSeconds - b.creationTimeSeconds
    );

    const solvedProblems = new Set();
    const solvedRatedProblems = new Map();
    const daily = new Map();

    let totalSubmissions = 0;
    let acceptedSubmissions = 0;

    for (const submission of submissions) {
        const day = new Date(
            submission.creationTimeSeconds * 1000
        )
            .toISOString()
            .slice(0, 10);

        totalSubmissions++;

        if (submission.verdict === "OK") {
            acceptedSubmissions++;

            const problem = submission.problem || {};

            const problemKey =
                problem.contestId != null && problem.index
                    ? `${problem.contestId}-${problem.index}`
                    : `${problem.problemsetName || "other"}-${problem.name || submission.id}`;

            solvedProblems.add(problemKey);
            if (Number.isInteger(problem.rating)) {
                solvedRatedProblems.set(problemKey, problem.rating);
            }
        }

        // Update the cumulative totals for this date.
        daily.set(day, {
            date: day,
            solvedCount: solvedProblems.size,
            submissionCount: totalSubmissions,
            acceptedCount: acceptedSubmissions,
        });
    }

    // Include today even if there were no submissions today.
    const today = new Date().toISOString().slice(0, 10);

    if (!daily.has(today)) {
        daily.set(today, {
            date: today,
            solvedCount: solvedProblems.size,
            submissionCount: totalSubmissions,
            acceptedCount: acceptedSubmissions,
        });
    }

    const exactCounts = new Map();
    const rangeCounts = new Map();
    for (const rating of solvedRatedProblems.values()) {
        exactCounts.set(rating, (exactCounts.get(rating) || 0) + 1);
        const lower = Math.floor(rating / 200) * 200;
        const upper = lower + 199;
        const label = `${lower}-${upper}`;
        rangeCounts.set(label, (rangeCounts.get(label) || 0) + 1);
    }

    const colors = ["#60A5FA", "#34D399", "#FBBF24", "#F87171", "#A78BFA", "#2DD4BF", "#FB923C", "#E879F9", "#93C5FD", "#4ADE80"];
    const ratingDistribution = {
        exact: Array.from(exactCounts.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([rating, value], index) => ({ name: String(rating), value, color: colors[index % colors.length] })),
        ranges: Array.from(rangeCounts.entries())
            .sort((a, b) => Number(a[0].split("-")[0]) - Number(b[0].split("-")[0]))
            .map(([name, value], index) => ({ name, value, color: colors[index % colors.length] })),
    };

    return {
        profile,
        stats: {
            solved: solvedProblems.size,
            submissions: totalSubmissions,
            accepted: acceptedSubmissions,
        },
        ratingDistribution,
        dailySnapshots: Array.from(daily.values()).sort((a, b) => a.date.localeCompare(b.date)),
    };
}

module.exports = {
    getCodeforcesProfile,
    getCodeforcesSyncData,
};

const https = require("https");

function makeLeetCodeRequest(query, variables) {
    const body = JSON.stringify({
        query,
        variables,
    });

    return new Promise((resolve, reject) => {
        const request = https.request(
            "https://leetcode.com/graphql",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(body),
                    "User-Agent": "CodeTrack/1.0",
                },
            },
            (response) => {
                let data = "";

                response.on("data", (chunk) => {
                    data += chunk;
                });

                response.on("end", () => {
                    try {
                        const result = JSON.parse(data);

                        if (result.errors) {
                            console.error(
                                "LeetCode GraphQL errors:",
                                result.errors
                            );

                            return reject(
                                new Error(
                                    "LeetCode API returned an error"
                                )
                            );
                        }

                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        );

        request.on("error", reject);

        request.write(body);
        request.end();
    });
}

async function getLeetCodeStats(username) {
    const query = `
        query userPublicProfile($username: String!) {
            matchedUser(username: $username) {
                username

                submitStats: submitStatsGlobal {
                    acSubmissionNum {
                        difficulty
                        count
                        submissions
                    }
                }
            }
        }
    `;

    const result = await makeLeetCodeRequest(query, {
        username,
    });

    if (!result.data?.matchedUser) {
        throw new Error("LeetCode user not found");
    }

    const matchedUser = result.data.matchedUser;

    const stats = matchedUser.submitStats.acSubmissionNum;

    const all = stats.find(
        (item) => item.difficulty === "All"
    );

    const easy = stats.find(
        (item) => item.difficulty === "Easy"
    );

    const medium = stats.find(
        (item) => item.difficulty === "Medium"
    );

    const hard = stats.find(
        (item) => item.difficulty === "Hard"
    );

    return {
        username: matchedUser.username,
        solved: all?.count || 0,
        submissions: all?.submissions || 0,
        easy: easy?.count || 0,
        medium: medium?.count || 0,
        hard: hard?.count || 0,
    };
}

async function getLeetCodeContestStats(username) {
    const query = `
        query userContestRankingInfo($username: String!) {
            userContestRanking(username: $username) {
                attendedContestsCount
                rating
                globalRanking
                totalParticipants
                topPercentage
                badge {
                    name
                }
            }

            userContestRankingHistory(username: $username) {
                attended
                trendDirection
                problemsSolved
                totalProblems
                finishTimeInSeconds
                rating
                ranking

                contest {
                    title
                    startTime
                }
            }
        }
    `;

    const result = await makeLeetCodeRequest(query, {
        username,
    });

    const ranking = result.data?.userContestRanking;

    const history =
        result.data?.userContestRankingHistory || [];

    // Some users may not have participated in a contest yet.
    if (!ranking) {
        return {
            attendedContests: 0,
            rating: null,
            globalRanking: null,
            totalParticipants: null,
            topPercentage: null,
            badge: null,
            history: [],
        };
    }

    return {
        attendedContests: ranking.attendedContestsCount || 0,

        rating:
            ranking.rating !== null &&
            ranking.rating !== undefined
                ? Math.round(ranking.rating)
                : null,

        globalRanking:
            ranking.globalRanking !== null &&
            ranking.globalRanking !== undefined
                ? ranking.globalRanking
                : null,

        totalParticipants:
            ranking.totalParticipants !== null &&
            ranking.totalParticipants !== undefined
                ? ranking.totalParticipants
                : null,

        topPercentage:
            ranking.topPercentage !== null &&
            ranking.topPercentage !== undefined
                ? ranking.topPercentage
                : null,

        badge: ranking.badge?.name || null,

        history: history
            .filter((contest) => contest.attended)
            .map((contest) => ({
                contest: contest.contest?.title || "Unknown Contest",
                date: contest.contest?.startTime
                    ? new Date(
                          contest.contest.startTime * 1000
                      ).toISOString()
                    : null,
                rating:
                    contest.rating !== null &&
                    contest.rating !== undefined
                        ? Math.round(contest.rating)
                        : null,
                ranking:
                    contest.ranking || null,
                problemsSolved:
                    contest.problemsSolved || 0,
                totalProblems:
                    contest.totalProblems || 0,
                trendDirection:
                    contest.trendDirection || "NONE",
            })),
    };
}

module.exports = {
    getLeetCodeStats,
    getLeetCodeContestStats,
};
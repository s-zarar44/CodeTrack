const { getLeetCodeContestStats } = require("./src/services/leetcode");

getLeetCodeContestStats("testuser")
    .then((result) => {
        console.dir(result, { depth: null });
    })
    .catch((error) => {
        console.error("Contest test failed:", error.message);
    });

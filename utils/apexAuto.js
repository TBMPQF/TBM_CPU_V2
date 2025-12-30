const axios = require("axios");
const ApexStats = require("../models/apexStats");
const config = require("../config");

const INACTIVITY_LIMIT_MIN = 120 //En minutes

function shouldResetDaily(lastReset) {
  const now = new Date();
  if (!lastReset) return true;

  const last = new Date(lastReset);
  const today2h = new Date(now);
  today2h.setHours(2, 0, 0, 0);

  return now >= today2h && last < today2h;
}

function shouldResetWeekly(lastReset) {
  const now = new Date();
  if (!lastReset) return true;

  const last = new Date(lastReset);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(2, 0, 0, 0);

  return now >= monday && last < monday;
}

async function updateApexStatsAutomatically() {
  const users = await ApexStats.find({});
  if (!users.length) return;

  let someoneActive = false;

  for (const user of users) {
    try {
      if (user.lastActivityAt) {
        const diffMin = (Date.now() - user.lastActivityAt.getTime()) / 60000;
        if (diffMin > INACTIVITY_LIMIT_MIN) continue;
      }

      const url = `https://api.mozambiquehe.re/bridge?auth=${config.apex_api}&player=${encodeURIComponent(user.gameUsername)}&platform=${user.platform}`;
      const { data } = await axios.get(url, { timeout: 12000 });

      const rankScore = data?.global?.rank?.rankScore;
      if (typeof rankScore !== "number") continue;

      if (shouldResetDaily(user.dailyResetAt)) {
        user.dailyRpGained = 0;
        user.dailyResetAt = new Date();
      }

      if (shouldResetWeekly(user.weeklyResetAt)) {
        user.weeklyRpGained = 0;
        user.weeklyResetAt = new Date();
      }
      if (user.lastRankScore !== null) {
        const diff = rankScore - user.lastRankScore;

        if (Math.abs(diff) < 5000 && diff !== 0) {
          user.dailyRpGained += diff;
          user.weeklyRpGained += diff;
          user.lastActivityAt = new Date();
          someoneActive = true;
        }
      }

      user.lastRankScore = rankScore;
      await user.save();

    } catch (e) {
      console.error(`[APEX AUTO] ${user.username}:`, e.message);
    }
  }
}

module.exports = { updateApexStatsAutomatically };

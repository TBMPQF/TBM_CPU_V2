const cron = require("node-cron");
const ApexStats = require("../models/apexStats");

cron.schedule("0 4 * * *", async () => {
  await ApexStats.updateMany(
    {},
    {
      $set: {
        dailyRpGained: 0,
        dailyResetAt: new Date(),
      },
    }
  );
});

cron.schedule("0 4 * * 1", async () => {
  await ApexStats.updateMany(
    {},
    {
      $set: {
        weeklyRpGained: 0,
        weeklyResetAt: new Date(),
      },
    }
  );
});

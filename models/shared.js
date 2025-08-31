const User = require("../models/experience");
const voiceUsers = new Map();
const levelUp = require('../models/levelUp');
const unmuteRequests = new Map();

let xpDistributionInterval;
function initializeXpDistributionInterval(bot) {
  if (!xpDistributionInterval) {
    // 7 minutes = 420000 ms (garde si ça te va)
    xpDistributionInterval = setInterval(() => updateVoiceTimeForAllUsers(bot), 420000);
  }
}
function countHumans(channel) {
  if (!channel) return 0;
  return channel.members.filter(m => !m.user.bot).size;
}
async function updateVoiceTimeForAllUsers(bot) {
  for (const [userId, userVoiceData] of voiceUsers.entries()) {
    await updateVoiceTimeForUser(userId, bot);

    const guild = bot.guilds.cache.get(userVoiceData.serverId);
    const member = guild?.members.cache.get(userId);
    const channel = member?.voice?.channel;
    if (!channel) continue;

    // ignore AFK
    if (guild?.afkChannelId && guild.afkChannelId === channel.id) continue;

    // pas d'XP si seul humain
    const humans = countHumans(channel);
    if (humans <= 1) continue;

    // base 5..12
    let xpToAdd = Math.floor(Math.random() * (12 - 5 + 1)) + 5;

    // bonus cam/stream
    const hasCam = Boolean(member.voice?.selfVideo);
    const hasStream = Boolean(member.voice?.streaming);

    let mult = 1;
    if (hasCam && hasStream) mult = 1.6;     // +60% si cam + stream
    else if (hasCam || hasStream) mult = 1.3; // +30% si cam OU stream

    xpToAdd = Math.round(xpToAdd * mult);

    await addExperience(member, userVoiceData.serverId, xpToAdd);
  }
}
async function updateVoiceTimeForUser(userId /*, bot */) {
  const userVoiceData = voiceUsers.get(userId);
  if (!userVoiceData) return;

  const now = Date.now();
  const duration = now - userVoiceData.joinTimestamp;

  await updateUserVoiceTime(userId, userVoiceData.serverId, Math.round(duration / 1000));

  if (duration > 0) {
    userVoiceData.joinTimestamp = now;
  } else {
    voiceUsers.delete(userId);
  }
}
async function updateUserVoiceTime(userId, serverId, durationInSeconds) {
  try {
    const user = await User.findOne({ userID: userId, serverID: serverId });
    if (user) {
      user.voiceTime = (Number(user.voiceTime) || 0) + durationInSeconds;
      await user.save();
    }
  } catch (error) {
    console.error('[VOICE STATE] Erreur lors de la mise à jour du temps vocal :', error);
  }
}
async function addExperience(member, serverId, xpToAdd) {
  if (!member) return;
  try {
    const user = await User.findOne({ userID: member.id, serverID: serverId });
    if (!user) {
      console.error(`[ADD XP VOCAL] Utilisateur non trouvé: ${member.id} / ${serverId}`);
      return;
    }

    user.xp        = (Number(user.xp) || 0) + xpToAdd;
    user.careerXP  = (Number(user.careerXP) || 0) + xpToAdd;
    await user.save();

    await levelUp({ guild: member.guild, member, author: member.user }, user, user.xp);
  } catch (error) {
    console.error('[ADD XP VOCAL] Erreur lors de l\'ajout de l\'expérience:', error);
  }
}


module.exports = {
  voiceUsers,
  initializeXpDistributionInterval,
  updateUserVoiceTime,
  updateVoiceTimeForUser,
};

const User = require("../models/experience");
const voiceUsers = new Map();
let xpDistributionInterval;
const levelUp = require('../models/levelUp');

function initializeXpDistributionInterval(bot) {
  if (!xpDistributionInterval) {
    xpDistributionInterval = setInterval(() => updateVoiceTimeForAllUsers(bot), 420000);
  }
}

async function updateVoiceTimeForAllUsers(bot) {
  for (const [userId, userVoiceData] of voiceUsers.entries()) {
    await updateVoiceTimeForUser(userId, bot);

    const guild = bot.guilds.cache.get(userVoiceData.serverId);
    const member = guild.members.cache.get(userId);
    const channel = member?.voice.channel;

    if (channel && channel.members.size > 1) {
      const xpToAdd = Math.floor(Math.random() * (12 - 5 + 1)) + 5;
      await addExperience(member, userVoiceData.serverId, xpToAdd);
    }
  }
}

async function updateVoiceTimeForUser(userId, bot) {
  const userVoiceData = voiceUsers.get(userId);
  if (userVoiceData) {
    const now = Date.now();
    const duration = now - userVoiceData.joinTimestamp;
    await updateUserVoiceTime(userId, userVoiceData.serverId, Math.round(duration / 1000));

    if (duration > 0) {
      userVoiceData.joinTimestamp = now;
    } else {
      voiceUsers.delete(userId);
    }
  }
}
async function updateUserVoiceTime(userId, serverId, durationInSeconds) {
  try {
    const user = await User.findOne({ userID: userId, serverID: serverId });

    if (user) {
      user.voiceTime += durationInSeconds;
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

    if (user) {
      user.xp += xpToAdd;
      await user.save();
      await levelUp(member, user, user.xp);

    } else {
      console.error(`Utilisateur non trouvé: ${userId} dans le serveur: ${serverId}`);
    }
  } catch (error) {
    console.error('[ADD XP] Erreur lors de l\'ajout de l\'expérience:', error);
  }
}

module.exports = {
    logRequestMessageIds: {},
    welcomeRequestMessageIds: {},
    reglementRequestMessageIds: {},
    RolereglementRequestMessageIds : {},
    RoleWelcomeRequestMessageIds : {},
    implicationRequestMessageIds : {},
    dailyRequestMessageIds : {},
    suggestionsRequestMessageIds : {},
    roleChannelRequestMessageIds : {},
    ticketRequestMessageIds : {},
    RoleAdminRequestMessageIds : {},
    RoleMenuRequestMessageIds : {},
    voiceUsers,
    initializeXpDistributionInterval,
    updateUserVoiceTime,
    updateVoiceTimeForUser,
  };
const User = require("../models/experience");
const voiceUsers = new Map();
const levelUp = require('../models/levelUp');
let xpDistributionInterval;

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, bot) {
    try {
      handleVoiceStateUpdate(oldState, newState);

      if (!xpDistributionInterval) {
        xpDistributionInterval = setInterval(() => distributeXP(bot), 420000);
      }
    } catch (error) {
      console.error('[XP VOCAL] Erreur lors de la mise à jour de l\'état vocal :', error);
    }
  }
};

async function handleVoiceStateUpdate(oldState, newState) {
  if (newState.member.user.bot) {
    return;
  }

  let userVoiceData = voiceUsers.get(newState.id) || initializeUserVoiceData(newState);

  if (!oldState.channelId && newState.channelId) {
    userVoiceData.joinTimestamp = Date.now();
  } else if (oldState.channelId && !newState.channelId) {
    updateDuration(newState.id, userVoiceData);
    voiceUsers.delete(newState.id);
    return;
  }

  voiceUsers.set(newState.id, userVoiceData);
}

function updateDuration(userId, userVoiceData) {
  const duration = Date.now() - userVoiceData.joinTimestamp;
  userVoiceData.totalDuration += duration;
  userVoiceData.joinTimestamp = Date.now(); // Reset join timestamp
}

function initializeUserVoiceData(newState) {
  return {
    joinTimestamp: Date.now(),
    username: newState.member.user.tag,
    serverId: newState.guild.id,
    totalDuration: 0 // Total time in vocal
  };
}

async function distributeXP(bot) {
  for (const [userId, userVoiceData] of voiceUsers.entries()) {
    const member = await getMemberFromId(userId, userVoiceData.serverId, bot);
    if (!member || !member.voice.channel || member.voice.channel.members.size < 2) continue;

    const xpToAdd = Math.floor(Math.random() * (12 - 10 + 1) + 5); // Random XP between 5 and 12
    await updateUserXP(member, userVoiceData, xpToAdd);
  }
}

async function updateUserXP(member, userVoiceData, xpToAdd) {
  try {
      if (!member || !member.id) throw new Error('[XP VOCAL] Membre ou membre.id est indéfini.');

      let user = await User.findOne({ userID: member.id, serverID: member.guild.id });
      
      if (!user) {
        user = new User({
          userID: member.id,
          username: member.user.tag,
          serverID: member.guild.id,
          serverName: member.guild.name,
        });
      }

      const duration = Date.now() - userVoiceData.joinTimestamp;
      user.voiceTime = (user.voiceTime || 0) + duration;
      user.xp = (user.xp || 0) + xpToAdd;

      await user.save();
      await levelUp(member, user, user.xp);
  } catch (error) {
      console.error('[XP VOCAL] Erreur lors de la mise à jour de l’XP utilisateur :', error);
  }
}

async function getMemberFromId(userId, serverId, bot) {
  const guild = await bot.guilds.fetch(serverId);
  if (!guild) return null;
  return guild.members.fetch(userId);
}
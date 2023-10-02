const User = require("../models/experience");
const voiceUsers = new Map();
const levelUp = require('../models/levelUp');
let xpDistributionInterval; 

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, bot) {
    try {
      handleVoiceStateUpdate(oldState, newState, bot);

      if (xpDistributionInterval) {
        clearInterval(xpDistributionInterval);
      }

      xpDistributionInterval = setInterval(() => distributeXP(bot), 420000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'état vocal:', error);
    }
  }
};

async function handleVoiceStateUpdate(oldState, newState, bot) {
  if (newState.member.user.bot) {
    return;
  }
  const userVoiceData = voiceUsers.get(newState.id) || initializeUserVoiceData(newState);

  if (!oldState.channelId && newState.channelId) {
  } else if (oldState.channelId && !newState.channelId) {
    voiceUsers.delete(oldState.id);
    return;
  }

  const isAlone = newState.channel && newState.channel.members && newState.channel.members.size === 1;

  if (isAlone) {
    userVoiceData.lastAloneTimestamp = userVoiceData.lastAloneTimestamp || Date.now();
  } else if (userVoiceData.lastAloneTimestamp) {
    userVoiceData.aloneDuration += Date.now() - userVoiceData.lastAloneTimestamp;
    delete userVoiceData.lastAloneTimestamp;
  }
}

function initializeUserVoiceData(newState) {
  const userVoiceData = {
    joinTimestamp: Date.now(),
    username: newState.member.user.tag,
    serverId: newState.guild.id,
    aloneDuration: 0,
  };
  voiceUsers.set(newState.id, userVoiceData);
  return userVoiceData;
}

async function updateUserXP(member, userVoiceData, xpToAdd) {
  try {
      if (!member || !member.id) throw new Error('Membre ou membre.id est indéfini');

      let user = await User.findOne({ userID: member.id, serverID: member.guild.id });
      
      if (!user) {
        console.log(`Creating new user for ${member.id} in guild ${member.guild.id}`);
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
      console.error('Erreur lors de la mise à jour de l’XP utilisateur:', error);
  }
}

async function distributeXP(bot) {
  for (const [userId, userVoiceData] of voiceUsers.entries()) {
    try {
      const member = await getMemberFromId(userId, userVoiceData.serverId, bot);
      if (!member || !member.voice.channel || member.voice.channel.members.size < 2) continue;
      
      const xpToAdd = Math.floor(Math.random() * (20 - 10 + 1) + 10);
      await updateUserXP(member, userVoiceData, xpToAdd);
      console.log(`[VOICE XP] ${userVoiceData.username} a gagné ${xpToAdd} XP pour sa présence en vocal.`);
      
    } catch (error) {
      console.error(`Erreur lors de la distribution de XP à l'utilisateur ${userId}:`, error);
    }
  }
}

async function getMemberFromId(userId, serverId, bot) {
  const guild = await bot.guilds.fetch(serverId);
  if (!guild) return null;
  return guild.members.fetch(userId);
}
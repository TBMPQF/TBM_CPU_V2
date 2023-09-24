const User = require("../models/experience");

const voiceUsers = new Map();

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, bot) {

    // Lorsqu'un utilisateur rejoint un salon vocal
    if (!oldState.channelId && newState.channelId) {
      console.log(`[VOICE XP] ${newState.member.user.tag} has joined a voice channel.`);
      voiceUsers.set(newState.id, {
        joinTimestamp: Date.now(),
        username: newState.member.user.tag,
        serverId: newState.guild.id,
      });
    }

    // Mise à jour du temps seul si l'utilisateur est seul dans le salon vocal
    if (newState.channelId && newState.channel.members.size === 1) {
      const userVoiceData = voiceUsers.get(newState.id);
      if (userVoiceData) {
        userVoiceData.lastAloneTimestamp = Date.now();
      }
    }

    // Lorsque l'utilisateur n'est plus seul
    if (newState.channelId && newState.channel.members.size > 1) {
      const userVoiceData = voiceUsers.get(newState.id);
      if (userVoiceData && userVoiceData.lastAloneTimestamp) {
        userVoiceData.aloneDuration = (userVoiceData.aloneDuration || 0) + (Date.now() - userVoiceData.lastAloneTimestamp);
        delete userVoiceData.lastAloneTimestamp;
      }
    }

    // Lorsqu'un utilisateur quitte un salon vocal
    if (oldState.channelId && !newState.channelId) {
      console.log(`[VOICE XP] ${oldState.member.user.tag} has left a voice channel.`);
      const userVoiceData = voiceUsers.get(oldState.id);
      if (!userVoiceData) return;

      const duration = Date.now() - userVoiceData.joinTimestamp;
      const aloneDuration = userVoiceData.aloneDuration || 0;

      const user = await User.findOne({ userID: oldState.id, serverID: oldState.guild.id });
      if (!user) return;

      user.voiceTime = (user.voiceTime || 0) + duration;
      await user.save();

      voiceUsers.delete(oldState.id);
    }

  }
};

// Exécutez une fonction toutes les 7 minutes pour attribuer de l'XP
setInterval(async () => {
  for (let [userId, userVoiceData] of voiceUsers.entries()) {
    const duration = Date.now() - userVoiceData.joinTimestamp;
    const aloneDuration = userVoiceData.aloneDuration || 0;

    const currentHour = new Date().getHours();

    if (duration / 420000 >= 1 && aloneDuration / duration < 0.3 && currentHour >= 9) {
      const user = await User.findOne({ userID: userId, serverID: userVoiceData.serverId });

      if (!user) {
        voiceUsers.delete(userId);
        continue;
      }

      const xpToAdd = Math.floor(Math.random() * (25 - 15 + 1) + 15);
      user.xp += xpToAdd;
      user.voiceTime = (user.voiceTime || 0) + duration;

      await user.save();
      console.log(`[VOICE XP] ${userVoiceData.username} earned ${xpToAdd} XP for being in voice.`);
    }
  }
}, 420000);
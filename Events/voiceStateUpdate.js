const { voiceUsers, updateVoiceTimeForUser, initializeXpDistributionInterval } = require('../models/shared');
const InVocal = require("../models/inVocal");
const moment = require('moment-timezone');

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, bot) {
    try {
      handleVoiceStateUpdate(oldState, newState, bot);
      initializeXpDistributionInterval(bot);
    } catch (error) {
      console.error('[VOCAL XP] Erreur lors de la mise à jour de l\'état vocal :', error);
    }
  }
};

async function handleVoiceStateUpdate(oldState, newState) {
  if (newState.member.user.bot) return;

  if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
    await updateInVocalEntry(newState);
  } else if (!oldState.channelId && newState.channelId) {
    voiceUsers.set(newState.member.id, { joinTimestamp: Date.now(), serverId: newState.guild.id });
    await createInVocalEntry(newState);
  } else if (oldState.channelId && !newState.channelId) {
    await updateVoiceTimeForUser(oldState.member.id);
    await deleteInVocalEntry(oldState);
    voiceUsers.delete(oldState.member.id);
  }
}

async function updateInVocalEntry(newState) {
  try {
    const inVocal = await InVocal.findOne({ discordId: newState.member.id, serverId: newState.guild.id });
    if (inVocal) {
      inVocal.vocalName = newState.channel.name;
      await inVocal.save();
    } else {
      await createInVocalEntry(newState);
    }
  } catch (error) {
    console.error('[VOCAL XP] Erreur lors de la mise à jour de l\'entrée InVocal:', error);
  }
}
const joinTimestamp = moment().tz("Europe/Paris").toDate();

async function createInVocalEntry(newState) {
  const newInVocal = new InVocal({
    discordId: newState.member.id,
    serverId: newState.guild.id,
    username: newState.member.user.tag,
    vocalName: newState.channel.name,
    joinTimestamp: joinTimestamp
  });

  try {
    await newInVocal.save();
  } catch (error) {
    console.error('[VOCAL XP] Erreur lors de l\'enregistrement de l\'utilisateur en vocal:', error);
  }
}

async function deleteInVocalEntry(oldState) {
  try {
    await InVocal.deleteOne({ discordId: oldState.member.id, serverId: oldState.guild.id });
  } catch (error) {
    console.error('[VOCAL XP] Erreur lors de la suppression de l\'entrée InVocal:', error);
  }
}

const { ChannelType } = require("discord.js");
const moment = require("moment-timezone");
const InVocal = require("../models/inVocal");

const {
  voiceUsers,
  updateVoiceTimeForUser,
} = require("../models/shared");

const MIN_ACTIVE_HUMANS = 2;

function isAfkChannel(guild, channelId) {
  return guild?.afkChannelId && guild.afkChannelId === channelId;
}

function isEligibleChannel(guild, channel) {
  if (!channel) return false;
  if (isAfkChannel(guild, channel.id)) return false;

  return (
    channel.type === ChannelType.GuildVoice ||
    channel.type === ChannelType.GuildStageVoice
  );
}

function isHumanAfk(voiceState) {
  if (!voiceState) return true;
  return (
    voiceState.selfMute ||
    voiceState.selfDeaf ||
    voiceState.serverMute ||
    voiceState.serverDeaf
  );
}

function countActiveHumans(channel) {
  if (!channel) return 0;

  return channel.members.filter(member => {
    if (member.user.bot) return false;
    const vs = member.voice;
    return vs && !isHumanAfk(vs);
  }).size;
}

async function upsertInVocal(member, channel) {
  await InVocal.updateOne(
    { discordId: member.id, serverId: member.guild.id },
    {
      $set: {
        username: member.user.tag,
        vocalName: channel?.name || "Unknown",
      },
      $setOnInsert: {
        joinTimestamp: moment().tz("Europe/Paris").toDate(),
      },
    },
    { upsert: true }
  );
}

async function deleteInVocal(member) {
  await InVocal.deleteOne({
    discordId: member.id,
    serverId: member.guild.id,
  });
}

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    try {
      const member = newState.member || oldState.member;
      if (!member || member.user?.bot) return;

      const guild = newState.guild ?? oldState.guild;
      if (!guild) return;

      const oldChan = oldState.channel;
      const newChan = newState.channel;

      const wasEligible = isEligibleChannel(guild, oldChan);
      const isNowEligible = isEligibleChannel(guild, newChan);

      if (
        oldState.channelId &&
        newState.channelId &&
        oldState.channelId !== newState.channelId
      ) {
        if (wasEligible) {
          const activeHumans = countActiveHumans(oldChan);
          if (activeHumans >= MIN_ACTIVE_HUMANS) {
            await updateVoiceTimeForUser(member.id).catch(() => {});
          }
          await deleteInVocal(member).catch(() => {});
          voiceUsers.delete(member.id);
        }

        if (
          isNowEligible &&
          !isHumanAfk(newState) &&
          countActiveHumans(newChan) >= MIN_ACTIVE_HUMANS
        ) {
          voiceUsers.set(member.id, {
            joinTimestamp: Date.now(),
            serverId: guild.id,
          });
          await upsertInVocal(member, newChan).catch(() => {});
        }
        return;
      }

      if (!oldState.channelId && newState.channelId) {
        if (
          isNowEligible &&
          !isHumanAfk(newState) &&
          countActiveHumans(newChan) >= MIN_ACTIVE_HUMANS
        ) {
          voiceUsers.set(member.id, {
            joinTimestamp: Date.now(),
            serverId: guild.id,
          });
          await upsertInVocal(member, newChan).catch(() => {});
        }
        return;
      }

      if (oldState.channelId && !newState.channelId) {
        if (wasEligible) {
          const activeHumans = countActiveHumans(oldChan);
          if (activeHumans >= MIN_ACTIVE_HUMANS) {
            await updateVoiceTimeForUser(member.id).catch(() => {});
          }
          await deleteInVocal(member).catch(() => {});
          voiceUsers.delete(member.id);
        }
        return;
      }

      if (
        oldState.channelId &&
        newState.channelId &&
        oldState.channelId === newState.channelId &&
        isNowEligible
      ) {
        const channel = newChan;
        if (!channel) return;

        const activeHumans = countActiveHumans(channel);

        if (!isHumanAfk(oldState) && isHumanAfk(newState)) {
          await updateVoiceTimeForUser(member.id).catch(() => {});
          await deleteInVocal(member).catch(() => {});
          voiceUsers.delete(member.id);
          return;
        }

        if (
          isHumanAfk(oldState) &&
          !isHumanAfk(newState) &&
          activeHumans >= MIN_ACTIVE_HUMANS
        ) {
          voiceUsers.set(member.id, {
            joinTimestamp: Date.now(),
            serverId: guild.id,
          });
          await upsertInVocal(member, channel).catch(() => {});
        }
      }

      if (
        isNowEligible &&
        oldState.channelId &&
        newState.channelId &&
        oldState.channelId === newState.channelId &&
        oldChan &&
        newChan &&
        newChan.name !== oldChan.name
      ) {
        await upsertInVocal(member, newChan).catch(() => {});
      }
    } catch (err) {
      console.error("[VOCAL XP] Erreur voiceStateUpdate:", err);
    }
  },
};
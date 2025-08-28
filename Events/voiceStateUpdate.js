const { ChannelType } = require("discord.js");
const moment = require("moment-timezone");
const InVocal = require("../models/inVocal");

const {
  voiceUsers,
  updateVoiceTimeForUser,
} = require("../models/shared");

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
function countHumans(channel) {
  if (!channel) return 0;
  return channel.members.filter(m => !m.user.bot).size;
}
function isAloneHuman(channel) {
  return countHumans(channel) <= 1;
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
  await InVocal.deleteOne({ discordId: member.id, serverId: member.guild.id });
}

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    try {
      if (newState?.member?.user?.bot || oldState?.member?.user?.bot) return;

      const guild = newState.guild || oldState.guild;
      const oldChan = oldState.channel;
      const newChan = newState.channel;

      const wasEligible = isEligibleChannel(guild, oldChan);
      const isNowEligible = isEligibleChannel(guild, newChan);

      if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        if (wasEligible) {
          await updateVoiceTimeForUser(oldState.member.id).catch(() => {});
          await deleteInVocal(oldState.member).catch(() => {});
          voiceUsers.delete(oldState.member.id);
        }
        if (isNowEligible) {
          voiceUsers.set(newState.member.id, { joinTimestamp: Date.now(), serverId: newState.guild.id });
          await upsertInVocal(newState.member, newChan).catch(() => {});
        }
        return;
      }

      if (!oldState.channelId && newState.channelId) {
        if (isNowEligible) {
          voiceUsers.set(newState.member.id, { joinTimestamp: Date.now(), serverId: newState.guild.id });
          await upsertInVocal(newState.member, newChan).catch(() => {});
        }
        return;
      }

      if (oldState.channelId && !newState.channelId) {
        if (wasEligible) {
          await updateVoiceTimeForUser(oldState.member.id).catch(() => {});
          await deleteInVocal(oldState.member).catch(() => {});
          voiceUsers.delete(oldState.member.id);
        }
        return;
      }

      if (isNowEligible && newChan && oldChan && newChan.id === oldChan.id && newChan.name !== oldChan.name) {
        await upsertInVocal(newState.member, newChan).catch(() => {});
      }
    } catch (err) {
      console.error("[VOCAL XP] Erreur voiceStateUpdate:", err);
    }
  },
};

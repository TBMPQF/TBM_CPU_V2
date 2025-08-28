const { EmbedBuilder, ChannelType } = require("discord.js");
const ServerConfig = require("../models/serverConfig");
const User = require("../models/experience");
const messagesRandom = require("../models/messageRandom");

function safeRequire(path) {
  try { return require(path); }
  catch { return null; }
}
async function silent(promise) {
  try { return await promise; } catch { return null; }
}
function now() { return new Date(); }

const InVocal            = safeRequire("../models/inVocal");
const SearchMateMessage  = safeRequire("../models/SearchMateMessage");
const Suggestion         = safeRequire("../models/suggestion");
const Ticket             = safeRequire("../models/ticket");
const OpenVocal          = safeRequire("../models/openVocal");
const Warning            = safeRequire("../models/warns");
const ApexStats          = safeRequire("../models/ApexStats");
const TwitchStreamers    = safeRequire("../models/TwitchStreamers");

async function cleanupInVocal(member) {
  if (!InVocal) return;
  await silent(InVocal.deleteOne({ discordId: member.id, serverId: member.guild.id }));
}
async function cleanupSearchMate(member, bot) {
  if (!SearchMateMessage) return;
  const docs = await silent(SearchMateMessage.find({ userId: member.id, guildId: member.guild.id })) || [];
  for (const doc of docs) {
    const ch = bot.channels.cache.get(doc.channelId);
    if (ch) {
      const msg = await silent(ch.messages.fetch(doc.messageId));
      if (msg) await silent(msg.delete());
    }
  }
  await silent(SearchMateMessage.deleteMany({ userId: member.id, guildId: member.guild.id }));
}
async function cleanupSuggestions(member) {
  if (!Suggestion) return;
  const filters = [
    { userId: member.id, guildId: member.guild.id },
    { authorId: member.id, guildId: member.guild.id },
    { userId: member.id, serverID: member.guild.id },
    { authorId: member.id, serverID: member.guild.id },
  ];
  for (const f of filters) await silent(Suggestion.deleteMany(f));
}
async function cleanupTickets(member, bot) {
  if (!Ticket) return;
  
  const candidates =
    (await silent(Ticket.find({ openerId: member.id, guildId: member.guild.id }))) ||
    (await silent(Ticket.find({ userId: member.id, guildId: member.guild.id }))) ||
    (await silent(Ticket.find({ openerId: member.id, serverID: member.guild.id }))) ||
    (await silent(Ticket.find({ userId: member.id, serverID: member.guild.id }))) ||
    [];

  for (const t of candidates) {
    const ids = [t.channelId, t.voiceChannelId].filter(Boolean);
    for (const cid of ids) {
      const ch = bot.channels.cache.get(cid);
      if (ch) await silent(ch.delete("Suppression automatique: membre quitté le serveur."));
    }
  }
  await silent(Ticket.deleteMany({ openerId: member.id, guildId: member.guild.id }));
  await silent(Ticket.deleteMany({ userId: member.id,   guildId: member.guild.id }));
  await silent(Ticket.deleteMany({ openerId: member.id, serverID: member.guild.id }));
  await silent(Ticket.deleteMany({ userId: member.id,   serverID: member.guild.id }));
}
async function cleanupOpenVocals(member, bot) {
  if (!OpenVocal) return;
  const docs =
    (await silent(OpenVocal.find({ ownerId: member.id, serverId: member.guild.id }))) ||
    (await silent(OpenVocal.find({ ownerId: member.id, guildId:  member.guild.id }))) ||
    [];

  for (const d of docs) {
    if (d.channelId) {
      const ch = bot.channels.cache.get(d.channelId);
      if (ch && ch.type === ChannelType.GuildVoice) {
        await silent(ch.delete("Suppression auto (owner quitté)."));
      }
    }
  }
  await silent(OpenVocal.deleteMany({ ownerId: member.id, serverId: member.guild.id }));
  await silent(OpenVocal.deleteMany({ ownerId: member.id, guildId:  member.guild.id }));
}
async function cleanupWarns(member) {
  if (!Warning) return;
  await silent(Warning.deleteMany({ userId: member.id, guildId: member.guild.id }));
}
async function cleanupApexStats(member) {
  if (!ApexStats) return;
  await silent(ApexStats.deleteMany({ discordId: member.id }));
}
async function cleanupTwitchLink(member) {
  if (!TwitchStreamers) return;
  await silent(TwitchStreamers.deleteMany({ discordUserID: member.id, serverID: member.guild.id }));
}

module.exports = {
  name: "guildMemberRemove",
  async execute(member, bot) {
    const serverConfig = await ServerConfig.findOne({ serverID: member.guild.id });
    if (!serverConfig) return;

    let userDoc = null;
    try {
      userDoc = await User.findOneAndDelete({
        serverID: member.guild.id,
        userID: member.user.id,
      });
    } catch {}

    await Promise.allSettled([
      cleanupInVocal(member),
      cleanupSearchMate(member, bot),
      cleanupSuggestions(member),
      cleanupTickets(member, bot),
      cleanupOpenVocals(member, bot),
      cleanupWarns(member),
      cleanupApexStats(member),
      cleanupTwitchLink(member),
    ]);

    if (!serverConfig.logChannelID) return;

    let timeOnServer = "`PAS DÉFINI`";
    if (userDoc?.joinedAt) {
      const diff = now() - userDoc.joinedAt;
      const d = Math.floor(diff / (24 * 60 * 60 * 1000));
      const h = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const s = Math.floor((diff % (60 * 1000)) / 1000);

      const parts = [];
      if (d > 0) parts.push(`${d} jour${d > 1 ? "s" : ""}`);
      if (h > 0) parts.push(`${h} heure${h > 1 ? "s" : ""}`);
      if (m > 0) parts.push(`${m} minute${m > 1 ? "s" : ""}`);
      parts.push(`${s} seconde${s > 1 ? "s" : ""}`);
      timeOnServer = parts.join(", ").replace(/,([^,]*)$/, " et$1");
    }

    const departureMessage = messagesRandom.departures[
      Math.floor(Math.random() * messagesRandom.departures.length)
    ]
      .replace("<USER_NAME>", member.user.username)
      .replace("<TIME>", timeOnServer);

    const embed = new EmbedBuilder()
      .setAuthor({
        name: member.user.username,
        iconURL: member.user.displayAvatarURL({ dynamic: true })
      })
      .setTitle("𝐋egende 𝐏erdue丨🥀")
      .setDescription(departureMessage)
      .setColor("Red")
      .setTimestamp()
      .setFooter({ text: "Adieu." });

    const logChannel = bot.channels.cache.get(serverConfig.logChannelID);
    if (logChannel) await silent(logChannel.send({ embeds: [embed] }));
  },
};

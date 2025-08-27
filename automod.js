const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Warning = require("./models/warns");
const ServerConfig = require("./models/serverConfig");
const User = require("./models/experience");
const { unmuteRequests } = require("./models/shared");

const VIP_ROLE_IDS = ["717122082663694506"]
const LONG_FORBIDDEN = [
  "pede","pédé","gouine","tapette","tafiole",
  "connard","conard","connasse","enfoire","batard","salope","pute",
  "encule","enculer","enculé","encules",
  "nazis","neonazi","hitler","raciste","antisemite","nazi",
  "bougnoule","negro","youpin","youpine","blackface",
  "violeur","pedophile",
  "tamere","trouducul","tarlouze","sodomie"
];
const SHORT_TOKENS = [
  "pd",
  "fdp",
  "ntm",
  "nqtm",
  "tg",
  "vtf",
  "vtff"
];
const GLUED_TERMS = new Set([
  "filsdepute","filsdeputain",
  "tamere", "niquetamere", "tagueule",
  "salepute","salebatard","saleencule","salepd",
  "groscon"
]);

function esc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function hardNormalize(input) {
  let s = String(input || "").toLowerCase();

  s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

  s = s.replace(/[\u200b-\u200d\u2060\ufeff]/g, "");

  s = s
    .replace(/[@4]/g, "a")
    .replace(/[0]/g, "o")
    .replace(/[1l|]/g, "i")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/7/g, "t");

  s = s
    .replace(/[рρᵖⓅ🅿]/g, "p")
    .replace(/[ԁɗḍḋ]/g, "d");

  s = s.replace(/([a-z])\1{2,}/g, "$1$1");

  return s;
}
function containsForbiddenContent(text) {
  if (!text) return false;

  const norm = hardNormalize(text);
  const noSpace = norm.replace(/\s+/g, "");

  const B = "(?:^|[^a-z0-9])";
  const E = "(?:$|[^a-z0-9])";

  // 1) courts (pd, fdp, ntm) avec tolérance aux séparateurs
  for (const token of SHORT_TOKENS) {
    const chars = token.split("");
    // autorise jusqu'à 3 séparateurs non alphanum entre chaque caractère
    const mid = "[^a-z0-9]{0,3}";
    const pattern = `${B}${esc(chars[0])}+${chars.slice(1).map(c => `${mid}${esc(c)}+`).join("")}${E}`;
    const re = new RegExp(pattern, "i");
    if (re.test(norm)) return true;
  }

  // 2) collés (version sans espaces)
  for (const t of GLUED_TERMS) {
    if (noSpace.includes(t)) return true;
  }

  // 3) mots “longs” avec frontières
  for (const term of LONG_FORBIDDEN) {
    const re = new RegExp(`${B}${esc(term)}${E}`, "i");
    if (re.test(norm)) return true;
  }

  return false;
}
const WARNING_MESSAGES = {
  first: ":anger:丨**𝐀ttention à ton langage mon petit.** 🤏\n**𝐍ombre d'avertissement(s) : `{warnings}`**.",
  second: "\n\n:warning:丨𝐏rends garde ! 𝐏lus qu'__une erreur__ et tu es **muté** pour 3 jours.",
  muted:  "丨𝐁ien joué, tu as été mis en sourdine pour **`3`** jours en raison de tes **`3`** avertissements pour __langage inapproprié__.",
  log:    "丨𝐕ient d'être muté après `3` avertissements pour langage inapproprié."
};
async function createMutedRole(guild) {
  let muteRole = guild.roles.cache.find(r => r.name === "丨𝐌uted");
  if (!muteRole) {
    try {
      muteRole = await guild.roles.create({
        name: "丨𝐌uted",
        color: "#69e2ff",
        permissions: [],
        hoist: true
      });
    } catch (e) {
      console.error("[MUTE] Impossible de créer le rôle Muted:", e?.message);
      return null;
    }
  }

  try {
    const me = guild.members.me;
    if (me?.roles?.highest) {
      const targetPos = Math.max(1, me.roles.highest.position - 1);
      if (muteRole.position !== targetPos) {
        await muteRole.setPosition(targetPos).catch(() => {});
      }
    }
  } catch (e) {
  }

  for (const channel of guild.channels.cache.values()) {
    try {
      await channel.permissionOverwrites.edit(muteRole.id, {
        SendMessages: false,
        Connect: false,
        CreatePrivateThreads: false,
        CreatePublicThreads: false,
        UseEmbeddedActivities: false
      }).catch(() => {});
    } catch {}
  }

  return muteRole;
}
async function handleWarning(user, guild) {
  let warning = await Warning.findOne({ userId: user.id, guildId: guild.id });
  if (!warning) {
    warning = new Warning({
      userId: user.id,
      guildId: guild.id,
      userName: user.username,
      guildName: guild.name,
      warnings: 1
    });
  } else {
    warning.warnings += 1;
  }
  await warning.save();
  return warning;
}
async function muteMember(member, warning) {
  const muteRole = await createMutedRole(member.guild);
  if (muteRole) {
    await member.roles.add(muteRole).catch(err => {
      console.error("[MUTE] Impossible d’ajouter le rôle Muted:", err?.message);
    });
  }

  await User.findOneAndUpdate(
    { userID: member.id, serverID: member.guild.id },
    { $inc: { recidive: 1 } },
    { new: true, upsert: true }
  );

  const muteEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  warning.muteEnd = muteEnd;
  await warning.save();

  setTimeout(async () => {
    try {
      const updated = await Warning.findOne({ userId: member.id, guildId: member.guild.id });
      if (updated && updated.muteEnd <= new Date()) {
        if (muteRole) {
          await member.roles.remove(muteRole).catch(() => {});
          const stillUsed = member.guild.members.cache.some(m => m.roles.cache.has(muteRole.id));
          if (!stillUsed) await muteRole.delete().catch(() => {});
        }
        await Warning.deleteOne({ userId: member.id, guildId: member.guild.id });
      }
    } catch (err) {
      console.error("[MUTE] Erreur fin de mute:", err);
    }
  }, 3 * 24 * 60 * 60 * 1000);
}
async function sendWarningMessage(channel, member, warning) {
  let description = WARNING_MESSAGES.first.replace("{warnings}", warning.warnings);
  description = warning.warnings === 1
    ? description.replace("avertissement(s)", "avertissement")
    : description.replace("avertissement(s)", "avertissements");

  if (warning.warnings === 2) description += WARNING_MESSAGES.second;

  const embed = new EmbedBuilder()
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
    .setDescription(description)
    .setColor("Red");

  if (channel) await channel.send({ embeds: [embed] }).catch(() => {});
}
async function sendLogMessage(guild, member, description) {
  try {
    const serverConfig = await ServerConfig.findOne({ serverID: guild.id });
    if (!serverConfig?.logChannelID) return;

    const logChannel = guild.channels.cache.get(serverConfig.logChannelID);
    if (!logChannel) return;

    const user = await User.findOne({ userID: member.id, serverID: guild.id });
    const recidiveCount = user?.recidive || 0;

    const logEmbed = new EmbedBuilder()
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
      .setDescription(description)
      .setColor("Red")
      .setTimestamp()
      .setFooter({ text: `𝐍ombre de récidives : ${recidiveCount}` });

    const unmuteButton = new ButtonBuilder()
      .setCustomId("UNMUTE")
      .setLabel("𝐃emande d'unmute. 📣")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(unmuteButton);
    const message = await logChannel.send({ embeds: [logEmbed], components: [row] }).catch(() => null);
    if (message) unmuteRequests.set(message.id, member.id);
  } catch (e) {
    console.error("[LOG] Erreur d’envoi dans le channel de logs:", e?.message);
  }
}
async function filterMessage(message) {
  try {
    // DM ou pas de guild → ignore
    if (!message.guild) return false;

    // Bot / pas de contenu texte → ignore
    if (message.author.bot || !message.content) return false;

    // Récup membre de façon robuste
    let member = message.member;
    if (!member) {
      try { member = await message.guild.members.fetch(message.author.id); }
      catch { return false; }
    }

    // VIP whitelists → ignore
    if (member.roles.cache.some(r => VIP_ROLE_IDS.includes(r.id))) return false;

    // Pas de contenu interdit → ignore
    if (!containsForbiddenContent(message.content)) return false;

    // On supprime le message (si possible)
    await message.delete().catch(() => {});

    // Warn + feedback
    const warning = await handleWarning(message.author, message.guild);
    await sendWarningMessage(message.channel, member, warning);

    // 3e avertissement → mute + log + message public
    if (warning.warnings >= 3) {
      await muteMember(member, warning);
      await sendLogMessage(message.guild, member, WARNING_MESSAGES.log);

      const userEmbed = new EmbedBuilder()
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
        .setDescription(WARNING_MESSAGES.muted)
        .setColor("Red")
        .setTimestamp();

      await message.channel.send({ embeds: [userEmbed] }).catch(() => {});
    }

    return true;
  } catch (error) {
    console.error("[AUTOMOD] Erreur lors du filtrage du message:", error);
    return false;
  }
}

module.exports = {
  filterMessage,
  handleWarning,
  sendWarningMessage,
  muteMember,
  sendLogMessage,
  WARNING_MESSAGES,
  containsForbiddenContent
};
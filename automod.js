const { EmbedBuilder } = require("discord.js");
const Warning = require("./models/warnings");

// Expression régulière pour les mots interdits
const forbiddenWords = new RegExp(
  `\\b(${[
    "fdp",
    "fils de pute",
    "connard",
    "conard",
    "salope",
    "encule",
    "nazi",
    "enculé",
    "nique ta mere",
    "nique ta mère",
    "suce ma bite",
    "ta mere",
  ].join("|")})\\b`,
  "i"
);

const MUTED_ROLE_ID = "839824802038677524";
const ROLE_TO_REMOVE_ID = "811662602530717738";
const LOG_CHANNEL_ID = "1136953262818459718";

const WARNING_MESSAGES = {
  first: ":anger:丨{author}丨**𝐀ttention à ton language puceau.** :anger:\n**𝐍ombre d'avertissement(s) : `{warnings}`**",
  second: "\n\n:warning:丨𝐀ttention ! 𝐏lus qu'__une erreur__ et tu es __muté__ pour 3 jours.",
  muted: "丨**𝐁ien joué** {author}, tu as été mis en sourdine pour **`3`** jours en raison de **`3`** avertissements pour __langage inapproprié__.",
  log: "丨{author} a été muté pour __3 jours__ après **`3`** avertissements pour **`langage inapproprié`**."
};

async function handleWarning(user, guild) {
  let warning = await Warning.findOne({ userId: user.id, guildId: guild.id });
  if (!warning) {
    warning = new Warning({
      userId: user.id,
      guildId: guild.id,
      userName: user.username,
      guildName: guild.name,
      warnings: 1,
    });
  } else {
    warning.warnings += 1;
  }
  await warning.save();
  return warning;
}

async function muteMember(member, warning) {
  const muteRole = member.guild.roles.cache.get(MUTED_ROLE_ID);
  const roleToRemove = member.guild.roles.cache.get(ROLE_TO_REMOVE_ID);

  if (muteRole) member.roles.add(muteRole).catch(console.error);
  if (roleToRemove) member.roles.remove(roleToRemove).catch(console.error);

  const muteEnd = new Date();
  muteEnd.setDate(muteEnd.getDate() + 3);
  warning.muteEnd = muteEnd;
  await warning.save();
}

async function sendWarningMessage(channel, member, warning) {
  let description = WARNING_MESSAGES.first.replace("{author}", member.toString()).replace("{warnings}", warning.warnings);
  if (warning.warnings === 2) description += WARNING_MESSAGES.second;

  const embed = new EmbedBuilder().setDescription(description).setColor("Red");
  channel.send({ embeds: [embed] });
}

async function filterMessage(message) {
  if (message.author.bot || !message.content || !forbiddenWords.test(message.content)) return;
  message.delete();

  const warning = await handleWarning(message.author, message.guild);
  sendWarningMessage(message.channel, message.member, warning);

  if (warning.warnings >= 3) {
    muteMember(message.member, warning);

    const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
    const logEmbed = new EmbedBuilder()
      .setDescription(WARNING_MESSAGES.log.replace("{author}", message.author.tag))
      .setColor("Red")
      .setTimestamp();

    logChannel.send({ embeds: [logEmbed] });

    const userEmbed = new EmbedBuilder()
      .setDescription(WARNING_MESSAGES.muted.replace("{author}", message.author.tag))
      .setColor("Red")
      .setTimestamp();

    message.channel.send({ embeds: [userEmbed] });
  }
}

module.exports = { filterMessage };
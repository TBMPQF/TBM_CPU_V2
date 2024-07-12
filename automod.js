const { EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Warning = require("./models/warns");
const ServerConfig = require("./models/serverConfig");
const User = require('./models/experience');

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

const WARNING_MESSAGES = {
  first: ":anger:丨**𝐀ttention à ton langage mon petit.** 🤏\n**𝐍ombre d'avertissement(s) : `{warnings}`**.",
  second: "\n\n:warning:丨𝐏rends garde ! 𝐏lus qu'__une erreur__ et tu es **muté** pour 3 jours.",
  muted: "丨𝐁ien joué, tu as été mis en sourdine pour **`3`** jours en raison de tes **`3`** avertissements pour __langage inapproprié__.",
  log: "丨𝐕ient d'être muté après \`3\` avertissements pour langage inapproprié."
};

async function createMutedRole(guild) {
  let muteRole = guild.roles.cache.find(role => role.name === "丨𝐌uted");
  if (!muteRole) {
    muteRole = await guild.roles.create({
      name: "丨𝐌uted",
      color: "#69e2ff",
      permissions: [],
      hoist: true
    });
  }
  
  const botHighestRole = guild.roles.cache.find(role => role.managed);
  await muteRole.setPosition(botHighestRole.position - 1).catch(console.error);

  guild.channels.cache.forEach(async (channel) => {
    let permissionOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: muteRole.id,
        deny: [
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.AddReactions,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.Speak,
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.CreatePrivateThreads,
          PermissionsBitField.Flags.CreatePublicThreads,
          PermissionsBitField.Flags.UseEmbeddedActivities,
        ],
      },
    ];

    try {
      await channel.permissionOverwrites.edit(muteRole.id, { SendMessages: false , Connect: false, CreatePrivateThreads: false, CreatePublicThreads: false, UseEmbeddedActivities: false });
    } catch (error) {
      console.error(`[PERMISSION] Erreur lors de la configuration des permissions pour le canal ${channel.name} du serveur ${guild.name}:`, error);
    }
  });

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
      warnings: 1,
    });
  } else {
    warning.warnings += 1;
  }
  await warning.save();
  return warning;S
}

async function muteMember(member, warning) {
  const muteRole = await createMutedRole(member.guild);
  if (muteRole) {
    await member.roles.add(muteRole).catch(console.error);
  }

  await User.findOneAndUpdate(
    { userID: member.id, serverID: member.guild.id },
    { $inc: { recidive: 1 } },
    { new: true, upsert: true }
  ).catch(console.error);

  const muteEnd = new Date();
  muteEnd.setDate(muteEnd.getDate() + 3);
  warning.muteEnd = muteEnd;
  await warning.save();

  setTimeout(async () => {
    const updatedWarning = await Warning.findOne({ userId: member.id, guildId: member.guild.id });
    if (updatedWarning && updatedWarning.muteEnd <= new Date()) {
      await member.roles.remove(muteRole).catch(console.error);
      const roleStillInUse = member.guild.members.cache.some(m => m.roles.cache.has(muteRole.id));
      if (!roleStillInUse) {
        await muteRole.delete().catch(console.error);
      }
      await Warning.deleteOne({ userId: member.id, guildId: member.guild.id });
    }
  }, 3 * 24 * 60 * 60 * 1000);
}

async function sendWarningMessage(channel, member, warning) {
  let description = WARNING_MESSAGES.first.replace("{warnings}", warning.warnings);
  description = description.replace("{author}", member.toString());
  if (warning.warnings === 1) {
    description = description.replace("avertissement(s)", "avertissement");
  } else {
    description = description.replace("avertissement(s)", "avertissements");
  }
  if (warning.warnings === 2) description += WARNING_MESSAGES.second;

  const embed = new EmbedBuilder()
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
    .setDescription(description)
    .setColor("Red");

  if (channel) {
    await channel.send({ embeds: [embed] }).catch(console.error);
  }
}

async function sendLogMessage(guild, member, description) {
  const serverConfig = await ServerConfig.findOne({ serverID: guild.id });
  if (!serverConfig || !serverConfig.logChannelID) {
    return;
  }

  const logChannel = guild.channels.cache.get(serverConfig.logChannelID);
  if (logChannel) {
    const user = await User.findOne({ userID: member.id, serverID: guild.id });
    const recidiveCount = user ? user.recidive : 0;

    const logEmbed = new EmbedBuilder()
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
      .setDescription(description)
      .setColor("Red")
      .setTimestamp()
      .setFooter({ text: `𝐍ombre de récidives : ${recidiveCount}` });

    const unmuteButton = new ButtonBuilder()
      .setCustomId(`UNMUTE_${member.id}`)
      .setLabel("𝐃emande d'unmute. 📣")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(unmuteButton);

    await logChannel.send({ embeds: [logEmbed], components: [row] }).catch(console.error);
  }
}

async function filterMessage(message) {
  if (message.author.bot || !message.content || !forbiddenWords.test(message.content)) return;
  await message.delete().catch(console.error);

  const warning = await handleWarning(message.author, message.guild);
  await sendWarningMessage(message.channel, message.member, warning);

  if (warning.warnings >= 3) {
    await muteMember(message.member, warning);
    const logDescription = WARNING_MESSAGES.log.replace("{author}", message.author.tag);
    await sendLogMessage(message.guild, message.member, logDescription);

    const userEmbed = new EmbedBuilder()
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setDescription(WARNING_MESSAGES.muted.replace("{author}", message.author.tag))
      .setColor("Red")
      .setTimestamp();

    await message.channel.send({ embeds: [userEmbed] }).catch(console.error);
  }
}

module.exports = { filterMessage };
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

const mutedRoleId = "839824802038677524";
const roleIdToRemove = "811662602530717738";

setInterval(async () => {
  const now = new Date();
  const warnings = await Warning.find({ muteEnd: { $lte: now } });

  for (const warning of warnings) {
    const guild = client.guilds.cache.get(warning.guildId);
    const member = guild ? guild.members.cache.get(warning.userId) : null;

    if (member) {
      const muteRole = guild.roles.cache.get(mutedRoleId);
      const roleToRemove = guild.roles.cache.get(roleIdToRemove);

      if (muteRole) {
        member.roles.remove(muteRole).catch(console.error);
      }
      if (roleToRemove) {
        member.roles.add(roleToRemove).catch(console.error);
      }

      warning.warnings = 0;
      warning.muteEnd = null;
      await warning.save();
    }
  }
}, 60 * 1000);

async function handleWarning(user, guild) {
  let warning = await Warning.findOne({
    userId: user.id,
    guildId: guild.id,
  });

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

async function filterMessage(message) {
  if (message.author.bot || !message.content) return;

  const messageContent = message.content;

  if (forbiddenWords.test(messageContent)) {
    message.delete();

    const warning = await handleWarning(message.author, message.guild);

    let description = `:anger:丨${message.author}丨**𝐀ttention à ton langage puceau.** :anger:\n**𝐍ombre d'avertissement(s) : \`${warning.warnings}\`**`;
    if (warning.warnings === 2) {
      description +=
        "\n\n:warning:丨𝐀ttention ! 𝐏lus qu'__une erreur__ et tu es __muté__ pour 3 jours.";
    }

    const embed = new EmbedBuilder()
      .setDescription(description)
      .setColor("Red");

    message.channel.send({ embeds: [embed] });

    if (warning.warnings >= 3) {
      const muteRole = message.guild.roles.cache.get(mutedRoleId);
      const roleToRemove = message.guild.roles.cache.get(roleIdToRemove);

      if (muteRole) {
        message.member.roles.add(muteRole).catch(console.error);
        const muteEnd = new Date();
        muteEnd.setDate(muteEnd.getDate() + 3);
        warning.muteEnd = muteEnd;
        await warning.save();
      }

      if (roleToRemove) {
        message.member.roles.remove(roleToRemove).catch(console.error);
      }

      const logEmbed = new EmbedBuilder()
        .setDescription(
          `丨${message.author} a été muté pour __3 jours__ après **\`3\`** avertissements pour **\`langage inapproprié\`**.`
        )
        .setColor("Red")
        .setTimestamp();

      const logChannel = message.guild.channels.cache.get(
        "1136953262818459718"
      );
      logChannel.send({ embeds: [logEmbed] });

      const userEmbed = new EmbedBuilder()
        .setDescription(
          `丨**𝐁ien joué** ${message.author}, tu as été mis en sourdine pour **\`3\`** jours en raison de **\`3\`** avertissements pour __langage inapproprié__.`
        )
        .setColor("Red")
        .setTimestamp();

      message.channel.send({ embeds: [userEmbed] });
    }
  }
}

module.exports = { filterMessage };

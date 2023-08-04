const { Message, EmbedBuilder } = require("discord.js");
const Warning = require("./models/warnings");

// Liste de mots interdits
const forbiddenWords = [
  "ntm",
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
];

/**
 *
 * @param {Message} message
 */
async function filterMessage(message) {
  if (message.author.bot || !message.content) return;

  const messageContent = message.content.toLowerCase();

  for (let word of forbiddenWords) {
    if (messageContent.includes(word)) {
      message.delete();

      let warning = await Warning.findOne({
        userId: message.author.id,
        guildId: message.guild.id,
      });
      if (!warning) {
        warning = new Warning({
          userId: message.author.id,
          guildId: message.guild.id,
          userName: message.author.username,
          guildName: message.guild.name,
          warnings: 1,
        });
      } else {
        warning.warnings += 1;
      }

      await warning.save();

      let description = `:anger:丨${message.author}丨**𝐀ttention à ton langage puceau.** :anger:\n**𝐍ombre d'avertissement(s) : \`${warning.warnings}\`**`;
      if (warning.warnings === 2) {
        description +=
          "\n\n:warning:丨𝐀ttention ! 𝐏lus qu'__une erreur__ et tu es __exclu__ du serveur.";
      }

      const embed = new EmbedBuilder()
        .setDescription(description)
        .setColor("Red")

      message.channel.send({ embeds: [embed] });

      if (warning.warnings >= 3) {
        message.member.kick("3 avertissements pour langage inapproprié");

        const logEmbed = new EmbedBuilder()
          .setDescription(
            `丨${message.author} a été expulsé après \`3\` avertissements pour langage inapproprié.`
          )
          .setColor("Red")
          .setTimestamp()

        const logChannel = message.guild.channels.cache.get(
          "1136953262818459718"
        );
        logChannel.send({ embeds: [logEmbed] });

        warning.warnings = 0;
        await warning.save();
      }

      break;
    }
  }
}

module.exports = { filterMessage };

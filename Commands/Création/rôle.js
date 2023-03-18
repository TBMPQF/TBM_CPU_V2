const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  name: "rôle",
  description: "丨𝐄nvoi l'embed des 𝐑ôles.",
  dm: false,
  category: "Création",

  async execute(bot, message, args) {
    const RoleEmbed = new Discord.EmbedBuilder()
      .setColor("#b3c7ff")
      .setTitle(`丨𝐂hoisis tes rôles 🎭`)
      .setDescription(
        `𝐓u peux à présent sélectionner tes rôles pour avoir accès aux salons dédiés et ainsi communiquer avec la communauté de ton jeu préféré !\n 𝐀 tout moment si ton envie de changer de jeu te vient, tu peux modifier tes rôles préalablement sélectionnés.`
      )
      .setFooter({
        text: `Cordialement, l'équipe ${message.guild.name}`,
        iconURL: message.guild.iconURL(),
      });

    const SelectMenu = new Discord.ActionRowBuilder().addComponents(
      new Discord.SelectMenuBuilder()
        .setCustomId("CHOIX")
        .setPlaceholder("Choisis tes rôles.")
        .addOptions(
          {
            label: "丨𝐀pex 𝐋egends",
            emoji: "811709208726077440",
            value: "APEX",
          },
          {
            label: "丨𝐍ew 𝐖orld",
            emoji: "1038566586077950013",
            value: "NEWORLD",
          },
          {
            label: "丨𝐑ocket 𝐋eague",
            emoji: "813798557026877460",
            value: "ROCKET",
          },
          {
            label: "丨𝐒ons 𝐎f the 𝐅orest",
            emoji: "1078754107470393417",
            value: "FOREST",
          },
          {
            label: "丨𝐂all of 𝐃uty",
            emoji: "1038568804650844240",
            value: "CALLOF",
          },
          {
            label: "丨𝐌inecraft",
            emoji: "813799505077076008",
            value: "MINECRAFT",
          }
        )
    );
    message.reply({
      embeds: [RoleEmbed],
      components: [SelectMenu],
    });
  },
};

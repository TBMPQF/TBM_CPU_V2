const Discord = require("discord.js");

module.exports = {
  name: "setconfig",
  description: "丨Configuration du Bot.",
  dm: false,
  permission: 8,

  async execute(interaction) {
    const guild = interaction.guild;

    const configEMBED = new Discord.EmbedBuilder()
      .setColor("#b3c7ff")
      .setTitle("`丨𝐂onfiguration TBM_CPU V2丨`")
      .setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
      .setDescription(`𝐂'est ici que tu peux configurer le bot. Tu peux ainsi modifié les messages, les channels de certaines fonctionnalitées, et bien plus !`);

    const SelectMenu = new Discord.ActionRowBuilder().addComponents(
      new Discord.StringSelectMenuBuilder()
        .setCustomId("setConfigCustomID")
        .setPlaceholder("𝐐ue veux-tu configurer ?")
        .addOptions(
          {
            label: "丨𝐋og",
            emoji: "📝",
            value: "LOG",
          },
          {
            label: "丨𝐑èglement",
            emoji: "📜",
            value: "REGLEMENT",
          },
          {
            label: "丨𝐖elcome",
            emoji: "👋",
            value: "WELCOME",
          },
          {
            label: "丨𝐈mplications",
            emoji: "🏆",
            value: "IMPLICATION",
          },
          {
            label: "丨𝐒uggestions",
            emoji: "💡",
            value: "SUGGESTION",
          },
          {
            label: "丨𝐃aily",
            emoji: "💵",
            value: "DAILY",
          },
          {
            label: "丨𝐑ôles",
            emoji: "🎭",
            value: "ROLES",
          },
          {
            label: "丨𝐓icket",
            emoji: "🎫",
            value: "TICKET",
          }
        )
    );
    try {
      await interaction.reply({
        embeds: [configEMBED],
        components: [SelectMenu],
      });
    } catch (err) {
      console.error(err);
    }
  },
};
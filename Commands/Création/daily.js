const {
  ActionRowBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  name: "daily",
  description: "丨𝐄nvoi l'embed du daily.",
  dm: false,
  category: "Création",

  async execute(bot, message, args) {
    const TicketEmbed = new Discord.EmbedBuilder()
      .setColor("Orange")
      .setTitle(`――――――∈ 𝐆ain d'𝐗𝐏 journalier ! ∋――――――`)
      .setDescription(
        `\n𝐂'est ici que tu peux récupérer ton \`𝐃aily\`. 𝐈l sera disponible à nouveau après \`23H\`. 𝐍e l'oublie pas, lui en tout cas ne t'oublieras pas haha.`
      )
      .setThumbnail(message.guild.iconURL())
      .setFooter({
        text: `𝐂ordialement, l'équipe ${message.guild.name}`,
        iconURL: message.guild.iconURL(),
      });

    const tb = new Discord.ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("DAILYXP")
        .setLabel("💸丨𝐑écupérer l'𝐗𝐏丨💸")
        .setStyle(ButtonStyle.Success)
    );
    message.reply({ embeds: [TicketEmbed], components: [tb] });
  },
};

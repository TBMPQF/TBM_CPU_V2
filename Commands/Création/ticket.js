const {
  ActionRowBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const Discord = require("discord.js");

module.exports = {
  name: "ticket",
  description: "丨𝐄nvoi l'embed du système de ticket.",
  dm: false,
  category: "🔨 Création",

  async execute(bot, message, args) {
    const TicketEmbed = new Discord.EmbedBuilder()
      .setColor("#b3c7ff")
      .setTitle(`―――――― :inbox_tray: 𝐎uvrir un 𝐓icket :inbox_tray: ――――――`)
      .setDescription(
        `\n**𝐌erci de respecter les règles concernant les \`𝐓ickets\` !**\n\n\`1.\` 𝐍e pas créer de ticket sans raison.\n\n\`2.\` 𝐍e pas mentionner le staff sauf si vous n'avez pas eu de réponse durant 24h.\n\n\`3.\` 𝐍e pas créer de ticket pour insulter le staff ou une autre personne.`
      )
      .setThumbnail(message.guild.iconURL())
      .setFooter({
        text: `𝐂ordialement, l'équipe ${message.guild.name}`,
        iconURL: message.guild.iconURL(),
      });

    const tb = new Discord.ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("CREATE_CHANNEL")
        .setLabel("🎫丨𝐂réer un 𝐓icket丨🎫")
        .setStyle(ButtonStyle.Primary)
    );
    message.reply({ embeds: [TicketEmbed], components: [tb] });
  },
};

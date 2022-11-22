const { Discord, EmbedBuilder } = require("discord.js");
const Levels = require("discord-xp");

module.exports = {
  name: "level",
  description: "丨Affiche ton niveau d'expérience.",
  permission: "Aucune",
  category: "🆙 Levels",
  dm: false,

  async execute(bot, interaction) {
    const users = await Levels.fetch(interaction.user.id, interaction.guild.id);
    const xpRequired = Levels.xpFor(users.level + 1);

    const levelEmbed = new EmbedBuilder()
      .setColor("Red")
      .setTitle(`\`${interaction.user.username}\``)
      .setDescription(
        `\n\n𝐓u as : \*\*${users.xp} / ${xpRequired}\*\* XP\n𝐓u es niveau : \*\*${users.level}\*\*`
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({
        text: `𝐓u as envoyé : ${users.message} messages.`,
      });

    return interaction.reply({ embeds: [levelEmbed] });
  },
};

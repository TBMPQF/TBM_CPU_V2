const { EmbedBuilder } = require("discord.js");
const Levels = require("discord-xp");

module.exports = {
  name: "level",
  description: "丨Affiche ton niveau d'expérience.",
  dm: false,

  async execute(bot, interaction) {
    const user = interaction.user;
    const users = await Levels.fetch(user.id, interaction.guild.id);
    const xpRequired = Levels.xpFor(users.level + 1);
    const currentXP = users.xp;

    const level = await Levels.fetch(user.id, interaction.guild.id, true);
    const percentage = Math.round((level.xp / xpRequired) * 100);

    const progressBar = getProgressBar(percentage);

    const levelEmbed = new EmbedBuilder()
      .setColor("Random")
      .setTitle(`\`${interaction.user.username}\``)
      .setDescription(
        `\n\n𝐓u as : \*\*${currentXP} / ${xpRequired}\*\* XP\n𝐓u es niveau : \*\*${users.level}\*\*\n𝐏rogression : ${progressBar} ${percentage}%`
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({
        text: `𝐓u as envoyé : ${users.message} messages.`,
      });

    return interaction.reply({ embeds: [levelEmbed] });
  },
};

// Helper function to generate progress bar
function getProgressBar(percentage) {
  const bar = "▰";
  const emptyBar = "▱";
  const progressChars = Math.round(percentage / 10);
  const emptyChars = 10 - progressChars;
  return `${bar.repeat(progressChars)}${emptyBar.repeat(emptyChars)}`;
}

const { EmbedBuilder } = require("discord.js");
const User = require("../../models/experience");

module.exports = {
  name: "rank",
  description: "丨Affiche ton niveau d'expérience.",
  dm: false,
  permission: "Aucune",
  async execute(interaction) {
    const target = interaction.user;
    const user = await User.findOne({ userID: target.id });

    if (!user) {
      return interaction.reply({
        content:
          "Tu veux que j'affiche quoi ? Il faut envoyé des messages avant !",
        ephemeral: true,
      });
    }

    const allUsers = await User.find().sort({ xp: -1 });
    const position = allUsers.findIndex((u) => u.userID === target.id) + 1;
    const positionEmoji = getPositionEmoji(position);

    const nextLevel = user.level + 1;
    const xpRequiredForNextLevel = Math.pow(nextLevel / 0.1, 2);
    const currentLevelXP = user.xp - Math.pow(user.level / 0.1, 2);
    const xpRequiredForCurrentLevel =
      xpRequiredForNextLevel - Math.pow(user.level / 0.1, 2);
    const progressBar = createProgressBar(
      currentLevelXP,
      xpRequiredForCurrentLevel,
      10
    );
    const percentage = (
      (currentLevelXP / xpRequiredForCurrentLevel) *
      100
    ).toFixed(0);

    const embed = new EmbedBuilder()
      .setColor("Random")
      .setTitle(`\`${target.username}\`丨${position}${positionEmoji}`)
      .setDescription(
        `\n\n𝐓u as : \*\*${user.xp.toLocaleString()} / ${xpRequiredForNextLevel.toLocaleString()}\*\* XP.\n𝐓u es niveau : \*\*${user.level.toString()}\*\*.\n𝐓u as envoyé : \*\*${
          user.messageCount
        }\*\* messages.\n\n𝐏rogression : ${progressBar} \*\*${percentage}\*\*%`
      )
      .setThumbnail(target.displayAvatarURL({ dynamic: true }));

    await interaction.reply({ embeds: [embed] });
  },
};

function createProgressBar(value, maxValue, barLength) {
  const percentage = value / maxValue;
  const progress = Math.round(percentage * barLength);

  const progressChars = "▰".repeat(progress);
  const emptyChars = "▱".repeat(barLength - progress);

  return `${progressChars}${emptyChars}`;
}

function getPositionEmoji(position) {
  if (position === 1) {
    return "er 🥇";
  } else if (position === 2) {
    return "ème 🥈";
  } else if (position === 3) {
    return "ème 🥉";
  } else {
    return `#${position}`;
  }
}

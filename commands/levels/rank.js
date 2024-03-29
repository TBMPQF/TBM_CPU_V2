const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
} = require("discord.js");
const User = require("../../models/experience");

module.exports = {
  name: "rank",
  description: "丨Affiche ton niveau d'expérience.",
  dm: false,
  permission: "Aucune",
  async execute(interaction) {
    const guild = interaction.guild;
    const target = interaction.user;
    const user = await User.findOne({ userID: target.id, serverID: guild.id });

    if (!user) {
      return interaction.reply({
        content:
          "Tu veux que j'affiche quoi ? Il faut envoyé des messages avant !",
        ephemeral: true,
      });
    }

    const allUsers = await User.find({ serverID: guild.id }).sort({
      prestige: -1,
      xp: -1,
    });
    const position = allUsers.findIndex((u) => u.userID === target.id) + 1;
    const positionEmoji = getPositionEmoji(position);

    const nextLevel = user.level + 1;
    const xpRequiredForNextLevel = Math.pow(nextLevel / 0.1, 2);
    const currentLevelXP = Math.max(0, user.xp - Math.pow(user.level / 0.1, 2));
    const xpRequiredForCurrentLevel = Math.max(
      0,
      xpRequiredForNextLevel - Math.pow(user.level / 0.1, 2)
    );

    const progressBar = createProgressBar(
      Math.round(currentLevelXP),
      Math.round(xpRequiredForCurrentLevel),
      10
    );
    const percentage = (
      (currentLevelXP / xpRequiredForCurrentLevel) *
      100
    ).toFixed(0);

    const rowLadder = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("LADDER_BUTTON")
        .setEmoji("🏋🏼‍♂️")
        .setLabel("Classement")
        .setStyle(ButtonStyle.Primary)
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("VOCAL_TIME_BUTTON")
        .setEmoji("🎤")
        .setLabel("Vocal Time")
        .setStyle(ButtonStyle.Primary)
    )
    .addComponents(
      new ButtonBuilder()
        .setCustomId("FALCONIX_BUTTON")
        .setEmoji("1186719745106513971")
        .setStyle(ButtonStyle.Secondary)
    );
    const embed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setColor("Random")
      .setTitle(`丨${position}${positionEmoji}`)
      .setDescription(
        `\n\n𝐓u as : \*\*${user.xp.toLocaleString()} / ${xpRequiredForNextLevel.toLocaleString()}\*\* XP.\n𝐓u es niveau : \*\*${user.level.toString()}\*\*.\n𝐓u es prestige : \*\*${
          user.prestige
        }\*\*.\n\n𝐓u as envoyé : \*\*${
          user.messageCount
        }\*\* messages.\n\n𝐏rogression : ${progressBar} \*\*${percentage}\*\*%`
      )
      

    const reply = await interaction.reply({
      embeds: [embed],
      components: [rowLadder],
      fetchReply: true,
    });

    setTimeout(() => {
      interaction.channel.messages
        .fetch(reply.id)
        .then((message) => message.delete())
        .catch(console.error);
    }, 15000);
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
    return `ème`;
  }
}

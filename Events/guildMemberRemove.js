const { EmbedBuilder } = require("discord.js");
const User = require("../models/experience");

module.exports = {
  name: "guildMemberRemove",
  async execute(member, bot) {
    let user;
    try {
      user = await User.findOneAndDelete({ serverID: interaction.guild.id,
        userID: interaction.user.id });
    } catch (error) {}

    let timeOnServer = "Inconnu";
    if (user && user.joinedAt) {
      const now = new Date();
      const timeDiff = now - user.joinedAt;
      const daysOnServer = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
      const hoursOnServer = Math.floor(
        (timeDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
      );
      const minutesOnServer = Math.floor(
        (timeDiff % (60 * 60 * 1000)) / (60 * 1000)
      );
      const secondsOnServer = Math.floor((timeDiff % (60 * 1000)) / 1000);

      timeOnServer = "";
      if (daysOnServer > 0) {
        timeOnServer += `${daysOnServer} jours, `;
      }
      if (hoursOnServer > 0) {
        timeOnServer += `${hoursOnServer} heures, `;
      }
      if (minutesOnServer > 0) {
        timeOnServer += `${minutesOnServer} minutes et `;
      }
      timeOnServer += `${secondsOnServer} secondes`;
    }

    const RemoveMember = new EmbedBuilder()
      .setTitle(
        `\`${member.user.username}\` nous a quitté ! :sob:\nIl a résisté pendant ${timeOnServer}.`
      )
      .setColor("Red")
      .setTimestamp()
      .setFooter({
        text: `丨`,
        iconURL: `${member.user.displayAvatarURL({
          dynamic: true,
          size: 512,
        })}`,
      });

    bot.channels.cache
      .get("838440585341566996")
      .send({ embeds: [RemoveMember] });
  },
};

const { EmbedBuilder } = require("discord.js");
const User = require("../models/experience");
const ServerConfig = require("../models/serverConfig");
const messagesRandom = require("../models/messageRandom");

module.exports = {
  name: "guildMemberRemove",
  async execute(member, bot) {
    const serverConfig = await ServerConfig.findOne({
      serverID: member.guild.id,
    });
    if (!serverConfig) {
      return;
    }

    let user;
    try {
      user = await User.findOneAndDelete({
        serverID: member.guild.id,
        userID: member.user.id,
      });
    } catch (error) {}

    if (!serverConfig.logChannelID) {
      return;
    }

    let timeOnServer = "\`PAS DÉFINI\`";
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
          timeOnServer += `${daysOnServer} jour${daysOnServer > 1 ? 's' : ''}, `;
      }
      if (hoursOnServer > 0) {
          timeOnServer += `${hoursOnServer} heure${hoursOnServer > 1 ? 's' : ''}, `;
      }
      if (minutesOnServer > 0) {
          timeOnServer += `${minutesOnServer} minute${minutesOnServer > 1 ? 's' : ''} et `;
      }
      timeOnServer += `${secondsOnServer} seconde${secondsOnServer > 1 ? 's' : ''}`;
  }

  const departureMessage = messagesRandom.departures[
    Math.floor(Math.random() * messagesRandom.departures.length)
  ]
    .replace("<USER_NAME>", member.user.username)
    .replace("<TIME>", timeOnServer);
    
    const RemoveMember = new EmbedBuilder()
      .setAuthor({
        name: member.user.username,
        iconURL: member.user.displayAvatarURL({ dynamic: true })
      })
      .setTitle(`𝐋egende 𝐏erdue丨🥀`)
      .setDescription(departureMessage)
      .setColor("Red")
      .setTimestamp()
      .setFooter({
        text: `Adieu.`,
      });
    
    const logChannel = bot.channels.cache.get(serverConfig.logChannelID);
    if (logChannel) {
      logChannel.send({ embeds: [RemoveMember] });
    }
  },
};

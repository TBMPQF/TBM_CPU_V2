const {
  ActionRowBuilder,
  ButtonStyle,
  EmbedBuilder,
  ButtonBuilder,
} = require("discord.js");
const User = require("../models/experience");
const levelUp = require("../models/levelUp");
const ServerConfig = require("../models/serverConfig");
const { filterMessage } = require('../automod');

module.exports = {
  name: "messageCreate",
  async execute(message, bot) {
    if (message.author.bot) return;
    await filterMessage(message);

    // Expérience pour chaque message
    const now = new Date();

    const userData = {
      userID: message.author.id,
      username: message.author.username,
      serverID: message.guild.id,
      serverName: message.guild.name,
      lastMessageDate: now,
    };

    const member = message.guild.members.cache.get(message.author.id);
    const rolesToCheck = {
      "✨丨𝐄lite 𝐒ecrète": 1.05,
      "🧪丨Twitch Sub T1": 1.1,
      "🧪丨Twitch Sub T2": 1.2,
      "🧪丨Twitch Sub T3": 1.3,
    };

    let rolePercentage = 1;
    let weekendPercentage = 1;

    for (const role of Array.from(member.roles.cache.values())) {
      if (rolesToCheck[role.name]) {
        rolePercentage *= rolesToCheck[role.name];
      }
    }

    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) {
      weekendPercentage = 1.1;
    }

    let user = await User.findOne({
      userID: message.author.id,
      serverID: message.guild.id,
    });

    if (!user) {
      user = new User(userData);
      
      let initialXP = Math.floor(Math.random() * 50) + 1;
      initialXP *= rolePercentage;
      initialXP *= weekendPercentage;
      initialXP = Math.round(initialXP);
      user.xp = initialXP;
      
      await levelUp(message, user, user.xp);
    } else {
      if (message.guild.name !== user.serverName) {
        user.serverName = message.guild.name;
      }
    }

    const lastMessageDate = user.lastMessageDate || now;
    const timeDifference = (now.getTime() - lastMessageDate.getTime()) / 1000;

    user.messageCount = (user.messageCount || 0) + 1;

    if (timeDifference >= 10) {
      let randomXP = Math.floor(Math.random() * 50) + 1;
      randomXP *= rolePercentage;
      randomXP *= weekendPercentage;

      randomXP = Math.round(randomXP);
      user.xp = (user.xp || 0) + randomXP;

      await levelUp(message, user, user.xp);
    } else {
      user.lastMessageDate = now;
      await user.save();
    }

    user.lastMessageDate = now;

    await user.save();

    //Gestion des suggestions
    const serverConfig = await ServerConfig.findOne({
      serverID: message.guild.id,
    });
    if (!serverConfig || !serverConfig.suggestionsChannelID) {
      return;
    }

    if (message.channel.id !== serverConfig.suggestionsChannelID) {
      return;
    }

    let suggEmbed = new EmbedBuilder()
      .setColor("DarkVividPink")
      .setTitle("丨𝐒uggestion")
      .setDescription(`${message.content}`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .addFields([
        {
          name: "𝐏roposé par :",
          value: message.author ? message.author.toString() : "Auteur inconnu",
          inline: true,
        },
        { name: "𝐏our", value: "0", inline: true },
        { name: "𝐂ontre", value: "0", inline: true },
      ]);

    const buttonY = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("ACCEPTSUGG")
          .setEmoji("✔️")
          .setStyle(ButtonStyle.Success)
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("NOPSUGG")
          .setEmoji("✖️")
          .setStyle(ButtonStyle.Danger)
      )
      .addComponents(
        new ButtonBuilder()
          .setCustomId("SUPPSUGG")
          .setEmoji("♻")
          .setStyle(ButtonStyle.Secondary)
      );

    bot.channels.cache
      .get(serverConfig.suggestionsChannelID)
      .send({ embeds: [suggEmbed], components: [buttonY] })
      .then((msg) => {
        msg.startThread({ name: `𝐒uggestion de ${message.author.username}` });
      });

    await message.delete();
  },
};
